const cloudinary = require("../config/cloudinary");
const streamifier = require("streamifier");
const db = require("../config/db");
const bcrypt = require("bcrypt");
const transporter = require("../config/mail");
const crypto = require("crypto");
const axios = require("axios");

//Home
exports.getHomeData = async (req, res) => {
  const userId = req.session.user.id;

  try {
    const user = await db
      .prepare(
        `
      SELECT first_name
      FROM users
      WHERE id = ?
    `,
      )
      .get(userId);

    const borrowedBooks = (
      await db
        .prepare(
          `
      SELECT COUNT(*) AS total
      FROM borrowed_books
      WHERE
        user_id = ?
        AND returned = 0
    `,
        )
        .get(userId)
    ).total;

    const returnedBooks = (
      await db
        .prepare(
          `
      SELECT COUNT(*) AS total
      FROM borrowed_books
      WHERE
        user_id = ?
        AND returned = 1
    `,
        )
        .get(userId)
    ).total;

    const dueBooks = (
      await db
        .prepare(
          `
      SELECT COUNT(*) AS total
      FROM borrowed_books
      WHERE
        user_id = ?
        AND returned = 0
        AND DATE(due_date) <= DATE('now', '+3 day')
    `,
        )
        .get(userId)
    ).total;

    const fineAmount = (
      await db
        .prepare(
          `
      SELECT COALESCE(SUM(fine_amount), 0) AS total
      FROM borrowed_books
      WHERE
        user_id = ?
        AND fine_paid = 0
    `,
        )
        .get(userId)
    ).total;

    res.json({
      firstName: user.first_name,
      borrowedBooks,
      returnedBooks,
      dueBooks,
      fineAmount,
    });
  } catch (err) {
    console.log(err);

    res.status(500).json({
      message: "Failed to load dashboard",
    });
  }
};
//Books
exports.getBooks = async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = 10;

  const title = req.query.title || "";
  const author = req.query.author || "";
  const genre = req.query.genre || "";

  const offset = (page - 1) * limit;

  try {
    const total = (
      await db
        .prepare(
          `
      SELECT COUNT(*) AS total
      FROM books
      INNER JOIN authors
      ON books.author_id = authors.id
      INNER JOIN genres
      ON books.genre_id = genres.id
      WHERE
        books.title LIKE ?
        AND authors.name LIKE ?
        AND genres.name LIKE ?
    `,
        )
        .get(`%${title}%`, `%${author}%`, `%${genre}%`)
    ).total;

    const books = await db
      .prepare(
        `
      SELECT
        books.id,
        books.title,
        books.cover_image,
        books.stock_quantity,
        authors.name AS author,
        genres.name AS genre
      FROM books
      INNER JOIN authors
      ON books.author_id = authors.id
      INNER JOIN genres
      ON books.genre_id = genres.id
      WHERE
        books.title LIKE ?
        AND authors.name LIKE ?
        AND genres.name LIKE ?
      ORDER BY books.id DESC
      LIMIT ?
      OFFSET ?
    `,
      )
      .all(`%${title}%`, `%${author}%`, `%${genre}%`, limit, offset);

    res.json({
      books,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (err) {
    console.log(err);

    res.status(500).json({
      message: "Server error",
    });
  }
};

exports.getBook = async (req, res) => {
  const id = req.params.id;

  try {
    const book = await db
      .prepare(
        `
      SELECT
        books.*,
        authors.name AS author_name,
        genres.name AS genre_name
      FROM books
      JOIN authors
      ON books.author_id = authors.id
      JOIN genres
      ON books.genre_id = genres.id
      WHERE books.id = ?
    `,
      )
      .get(id);

    if (!book) {
      return res.status(404).json({
        message: "Book not found",
      });
    }

    res.json(book);
  } catch (err) {
    console.log(err);

    res.status(500).json({
      message: "Server error",
    });
  }
};
exports.getProfile = async (req, res) => {
  try {
    const user = await db
      .prepare(
        `
      SELECT
        id,
        first_name,
        last_name,
        gender,
        email,
        phone,
        address,
        profile_image,
        profile_image_public_id,
        role,
        created_at
      FROM users
      WHERE id = ?
    `,
      )
      .get(req.session.user.id);

    if (!user) {
      return res.status(404).json({
        message: "Profile not found",
      });
    }

    res.json({
      user,
    });
  } catch (err) {
    console.log(err);

    res.status(500).json({
      message: "Failed to load profile",
    });
  }
};

//borrow book
exports.borrowBook = async (req, res) => {
  const userId = req.session.user.id;
  const bookId = parseInt(req.params.id);

  try {
    const book = await db
      .prepare(
        `
        SELECT id, stock_quantity
        FROM books
        WHERE id = ?
      `,
      )
      .get(bookId);

    if (!book) {
      return res.status(404).json({
        message: "Book not found",
      });
    }

    if (book.stock_quantity <= 0) {
      return res.status(400).json({
        message: "Book is currently unavailable.",
      });
    }

    const borrowed = await db
      .prepare(
        `
        SELECT id
        FROM borrowed_books
        WHERE
          user_id = ?
          AND book_id = ?
          AND returned = 0
      `,
      )
      .get(userId, bookId);

    if (borrowed) {
      return res.status(400).json({
        message: "You have already borrowed this book.",
      });
    }

    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 7);

    // NOTE: db.transaction() — see flagged issue at the end of this file.
    const transaction = db.transaction(() => {
      db.prepare(
        `
        INSERT INTO borrowed_books (
         user_id,
         book_id,
         due_date,
         renewed,
         returned,
         fine_amount
      )
VALUES (?, ?, ?, 0, 0, 0)
      `,
      ).run(userId, bookId, dueDate.toISOString());

      db.prepare(
        `
        UPDATE books
        SET stock_quantity = stock_quantity - 1
        WHERE id = ?
      `,
      ).run(bookId);
    });

    transaction();

    res.json({
      message: "Book borrowed successfully.",
    });
  } catch (err) {
    console.log(err);

    res.status(500).json({
      message: "Failed to borrow book.",
    });
  }
};

//get borrowed books
exports.getBorrowedBooks = async (req, res) => {
  const userId = req.session.user.id;

  const page = parseInt(req.query.page) || 1;
  const limit = 10;

  const title = req.query.title || "";

  const borrowedFrom = req.query.borrowed_from || "";
  const borrowedTo = req.query.borrowed_to || "";

  const sort = req.query.sort || "due_asc";

  const offset = (page - 1) * limit;

  try {
    let dateFilter = "";

    if (borrowedFrom) {
      dateFilter += `
        AND DATE(borrowed_books.borrowed_at) >= DATE(?)
      `;
    }

    if (borrowedTo) {
      dateFilter += `
        AND DATE(borrowed_books.borrowed_at) <= DATE(?)
      `;
    }

    let orderBy = `
      CASE
        WHEN DATE(borrowed_books.due_date) < DATE('now') THEN 0
        ELSE 1
      END,
      DATE(borrowed_books.due_date) ASC
    `;

    switch (sort) {
      case "due_desc":
        orderBy = `
          DATE(borrowed_books.due_date) DESC
        `;
        break;

      case "borrowed_desc":
        orderBy = `
          borrowed_books.borrowed_at DESC
        `;
        break;

      case "borrowed_asc":
        orderBy = `
          borrowed_books.borrowed_at ASC
        `;
        break;

      default:
        orderBy = `
          CASE
            WHEN DATE(borrowed_books.due_date) < DATE('now') THEN 0
            ELSE 1
          END,
          DATE(borrowed_books.due_date) ASC
        `;
    }

    // TOTAL COUNT

    const totalQuery = `
      SELECT COUNT(*) AS total
      FROM borrowed_books

      INNER JOIN books
        ON borrowed_books.book_id = books.id

      WHERE
        borrowed_books.user_id = ?
        AND borrowed_books.returned = 0
        AND books.title LIKE ?
        ${dateFilter}
    `;

    const totalParams = [userId, `%${title}%`];

    if (borrowedFrom) {
      totalParams.push(borrowedFrom);
    }

    if (borrowedTo) {
      totalParams.push(borrowedTo);
    }

    const total = (await db.prepare(totalQuery).get(...totalParams)).total;

    // FETCH BOOKS

    const booksQuery = `
  SELECT
    borrowed_books.id AS borrowed_id,
    borrowed_books.borrowed_at,
    borrowed_books.due_date,
    borrowed_books.renewed,
    borrowed_books.fine_amount,
    borrowed_books.fine_paid,

    books.id,
    books.title,
    books.cover_image,

    authors.name AS author,
    genres.name AS genre

  FROM borrowed_books

  INNER JOIN books
    ON borrowed_books.book_id = books.id

  INNER JOIN authors
    ON books.author_id = authors.id

  INNER JOIN genres
    ON books.genre_id = genres.id

  WHERE
    borrowed_books.user_id = ?
    AND borrowed_books.returned = 0
    AND books.title LIKE ?
    ${dateFilter}

  ORDER BY ${orderBy}

  LIMIT ?
  OFFSET ?
`;

    const booksParams = [userId, `%${title}%`];

    if (borrowedFrom) {
      booksParams.push(borrowedFrom);
    }

    if (borrowedTo) {
      booksParams.push(borrowedTo);
    }

    booksParams.push(limit);
    booksParams.push(offset);

    const books = await db.prepare(booksQuery).all(...booksParams);

    const today = new Date();

    const formattedBooks = books.map((book) => {
      const dueDate = new Date(book.due_date);

      const remainingDays = Math.ceil(
        (dueDate - today) / (1000 * 60 * 60 * 24),
      );

      return {
        ...book,
        remaining_days: remainingDays,
      };
    });

    res.json({
      books: formattedBooks,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (err) {
    console.log(err);

    res.status(500).json({
      message: "Server error",
    });
  }
};

//renew borrowed book
exports.renewBook = async (req, res) => {
  const userId = req.session.user.id;
  const borrowedId = parseInt(req.params.id);

  try {
    const borrowed = await db
      .prepare(
        `
      SELECT *
      FROM borrowed_books
      WHERE
        id = ?
        AND user_id = ?
        AND returned = 0
    `,
      )
      .get(borrowedId, userId);

    if (!borrowed) {
      return res.status(404).json({
        message: "Borrowed book not found.",
      });
    }

    if (borrowed.fine_amount > 0 && borrowed.fine_paid === 0) {
      return res.status(400).json({
        message: "Please clear the fine before renewing this book.",
      });
    }

    if (borrowed.renewed) {
      return res.status(400).json({
        message: "This book has already been renewed.",
      });
    }

    const dueDate = new Date(borrowed.due_date);
    dueDate.setDate(dueDate.getDate() + 7);

    await db.prepare(
      `
      UPDATE borrowed_books
      SET
        due_date = ?,
        renewed = 1
      WHERE id = ?
    `,
    ).run(dueDate.toISOString(), borrowedId);

    res.json({
      message: "Book renewed successfully.",
    });
  } catch (err) {
    console.log(err);

    res.status(500).json({
      message: "Failed to renew book.",
    });
  }
};

//return borrowed book

// get borrow history
exports.getBorrowHistory = async (req, res) => {
  const userId = req.session.user.id;

  const page = parseInt(req.query.page) || 1;
  const limit = 10;
  const offset = (page - 1) * limit;

  const title = req.query.title || "";
  const borrowedFrom = req.query.borrowed_from || "";
  const borrowedTo = req.query.borrowed_to || "";
  const returnedFrom = req.query.returned_from || "";
  const returnedTo = req.query.returned_to || "";
  const sortBy = req.query.sort || "returned_desc";

  let whereClause = `
    borrowed_books.user_id = ?
    AND borrowed_books.returned = 1
    AND books.title LIKE ?
  `;

  const params = [userId, `%${title}%`];

  if (borrowedFrom) {
    whereClause += ` AND DATE(borrowed_books.borrowed_at) >= DATE(?)`;
    params.push(borrowedFrom);
  }

  if (borrowedTo) {
    whereClause += ` AND DATE(borrowed_books.borrowed_at) <= DATE(?)`;
    params.push(borrowedTo);
  }

  if (returnedFrom) {
    whereClause += ` AND DATE(borrowed_books.returned_at) >= DATE(?)`;
    params.push(returnedFrom);
  }

  if (returnedTo) {
    whereClause += ` AND DATE(borrowed_books.returned_at) <= DATE(?)`;
    params.push(returnedTo);
  }

  let orderBy = "borrowed_books.returned_at DESC";

  switch (sortBy) {
    case "returned_asc":
      orderBy = "borrowed_books.returned_at ASC";
      break;

    case "borrowed_desc":
      orderBy = "borrowed_books.borrowed_at DESC";
      break;

    case "borrowed_asc":
      orderBy = "borrowed_books.borrowed_at ASC";
      break;

    default:
      orderBy = "borrowed_books.returned_at DESC";
  }

  try {
    const total = (
      await db
        .prepare(
          `
      SELECT COUNT(*) AS total
      FROM borrowed_books

      INNER JOIN books
        ON borrowed_books.book_id = books.id

      INNER JOIN authors
        ON books.author_id = authors.id

      INNER JOIN genres
        ON books.genre_id = genres.id

      WHERE ${whereClause}
    `,
        )
        .get(...params)
    ).total;

    const books = await db
      .prepare(
        `
      SELECT

        borrowed_books.id AS borrowed_id,
        borrowed_books.borrowed_at,
        borrowed_books.due_date,
        borrowed_books.returned_at,
        borrowed_books.fine_amount,

        books.title,
        books.cover_image,

        authors.name AS author,
        genres.name AS genre

      FROM borrowed_books

      INNER JOIN books
        ON borrowed_books.book_id = books.id

      INNER JOIN authors
        ON books.author_id = authors.id

      INNER JOIN genres
        ON books.genre_id = genres.id

      WHERE ${whereClause}

      ORDER BY ${orderBy}

      LIMIT ?
      OFFSET ?
    `,
      )
      .all(...params, limit, offset);

    res.json({
      books,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (err) {
    console.error(err);

    res.status(500).json({
      message: "Failed to load borrow history",
    });
  }
};

//get fines
exports.getFines = async (req, res) => {
  const userId = req.session.user.id;

  const page = parseInt(req.query.page) || 1;
  const limit = 10;
  const offset = (page - 1) * limit;

  const title = req.query.title || "";
  const status = req.query.status || "";
  const returnedFrom = req.query.returned_from || "";
  const returnedTo = req.query.returned_to || "";
  const sort = req.query.sort || "latest";

  try {
    let where = `
      bb.user_id = ?
      AND bb.fine_amount > 0
    `;

    const params = [userId];

    if (title) {
      where += ` AND b.title LIKE ?`;
      params.push(`%${title}%`);
    }

    if (status === "paid") {
      where += ` AND bb.fine_paid = 1`;
    }

    if (status === "unpaid") {
      where += ` AND bb.fine_paid = 0`;
    }

    if (returnedFrom) {
      where += ` AND DATE(bb.returned_at) >= DATE(?)`;
      params.push(returnedFrom);
    }

    if (returnedTo) {
      where += ` AND DATE(bb.returned_at) <= DATE(?)`;
      params.push(returnedTo);
    }

    let orderBy = "bb.updated_at DESC";

    switch (sort) {
      case "oldest":
        orderBy = "bb.updated_at ASC";
        break;

      case "highest":
        orderBy = "bb.fine_amount DESC";
        break;

      case "lowest":
        orderBy = "bb.fine_amount ASC";
        break;
    }

    const total = (
      await db
        .prepare(
          `
      SELECT COUNT(*) AS total
      FROM borrowed_books bb
      JOIN books b ON bb.book_id = b.id
      WHERE ${where}
    `,
        )
        .get(...params)
    ).total;

    const fines = await db
      .prepare(
        `
      SELECT
    bb.id,
    bb.due_date,
    bb.returned_at,
    bb.fine_amount,
    bb.fine_paid,
    bb.fine_paid_at,

    b.title,
    b.cover_image

      FROM borrowed_books bb
      JOIN books b
      ON bb.book_id = b.id

      WHERE ${where}

      ORDER BY ${orderBy}

      LIMIT ?
      OFFSET ?
    `,
      )
      .all(...params, limit, offset);

    res.json({
      fines,
      total,
      totalPages: Math.ceil(total / limit),
    });
  } catch (err) {
    console.log(err);

    res.status(500).json({
      message: "Failed to load fines.",
    });
  }
};

exports.payFine = async (req, res) => {
  try {
    const borrowedId = parseInt(req.params.id);
    const userId = req.session.user.id;

    const appUrl = process.env.APP_URL;
    const productCode = process.env.ESEWA_PRODUCT_CODE;

    const fine = await db
      .prepare(
        `
SELECT
    bb.*,
    b.title,
    b.cover_image,
    u.first_name,
    u.last_name,
    u.email
FROM borrowed_books bb

INNER JOIN books b
ON bb.book_id = b.id

INNER JOIN users u
ON bb.user_id = u.id

WHERE
    bb.id = ?
    AND bb.user_id = ?
`,
      )
      .get(borrowedId, userId);

    if (!fine) {
      return res.status(404).json({
        message: "Fine not found.",
      });
    }

    if (fine.fine_paid) {
      return res.status(400).json({
        message: "Fine already paid.",
      });
    }

    if (Number(fine.fine_amount) <= 0) {
      return res.status(400).json({
        message: "No fine to pay.",
      });
    }

    const transactionId = crypto.randomUUID();
    const amount = Number(fine.fine_amount).toFixed(2);

    // NOTE: db.transaction() — see flagged issue at the end of this file.
    await db.prepare(
  `
  INSERT INTO fine_payments(
      borrowed_book_id,
      amount,
      payment_method,
      payment_status,
      transaction_id
  )
  VALUES(?,?,?,?,?)
  `
).run(
  borrowedId,
  amount,
  "esewa",
  "pending",
  transactionId
);


await db.prepare(
  `
  UPDATE fine_payments
  SET payment_status = 'failed'
  WHERE borrowed_book_id = ?
    AND transaction_id != ?
    AND payment_status = 'pending'
  `
).run(
  borrowedId,
  transactionId
);
    const message = `total_amount=${amount},transaction_uuid=${transactionId},product_code=${productCode}`;

    const signature = crypto
      .createHmac("sha256", process.env.ESEWA_SECRET_KEY)
      .update(message)
      .digest("base64");

    res.json({
      gatewayUrl: process.env.ESEWA_URL,
      params: {
        amount: amount,
        tax_amount: "0",
        total_amount: amount,
        transaction_uuid: transactionId,
        product_code: productCode,
        product_service_charge: "0",
        product_delivery_charge: "0",
        success_url: `${appUrl}/api/user/fines/esewa/success`,
        failure_url: `${appUrl}/api/user/fines/esewa/failure`,
        signed_field_names: "total_amount,transaction_uuid,product_code",
        signature: signature,
      },
    });
  } catch (err) {
    console.log(err);

    res.status(500).json({
      message: "Failed to initiate payment.",
    });
  }
};

// ESEWA SUCCESS CALLBACK
exports.esewaSuccess = async (req, res) => {
  try {
    const encodedData = req.query.data;

    if (!encodedData) {
      return res.redirect(`${process.env.APP_URL}/fines?payment=failed`);
    }

    // Decode the base64 payload eSewa sends back
    let decoded;
    try {
      decoded = JSON.parse(
        Buffer.from(encodedData, "base64").toString("utf-8"),
      );
    } catch (e) {
      console.log("Invalid eSewa payload:", e);
      return res.redirect(`${process.env.APP_URL}/fines?payment=failed`);
    }

    const { transaction_uuid, total_amount, status } = decoded;

    if (!transaction_uuid) {
      return res.redirect(`${process.env.APP_URL}/fines?payment=failed`);
    }

    // Look up the pending payment tied to this transaction
    const payment = await db
      .prepare(
        `
            SELECT *
            FROM fine_payments
            WHERE transaction_id = ?
            AND payment_status = 'pending'
        `,
      )
      .get(transaction_uuid);

    if (!payment) {
      // Either already processed, or forged transaction_uuid
      return res.redirect(`${process.env.APP_URL}/fines?payment=failed`);
    }

    // CRITICAL: verify with eSewa's server-to-server status check API
    // Never trust the redirect/query params alone
    const statusRes = await axios.get(process.env.ESEWA_STATUS_CHECK_URL, {
      params: {
        product_code: process.env.ESEWA_PRODUCT_CODE,
        total_amount: payment.amount,
        transaction_uuid: payment.transaction_id,
      },
    });

    const verifiedStatus = statusRes.data.status;

    if (verifiedStatus !== "COMPLETE") {
      await db.prepare(
        `
                UPDATE fine_payments
                SET payment_status = 'failed'
                WHERE transaction_id = ?
            `,
      ).run(transaction_uuid);

      return res.redirect(`${process.env.APP_URL}/fines?payment=failed`);
    }

    // Confirm the amount eSewa verified matches what we expect
    // (defense against any tampering / mismatched transactions)
    if (Number(statusRes.data.total_amount) !== Number(payment.amount)) {
      console.log("Amount mismatch on transaction:", transaction_uuid);

      await db.prepare(
        `
                UPDATE fine_payments
                SET payment_status = 'failed'
                WHERE transaction_id = ?
            `,
      ).run(transaction_uuid);

      return res.redirect(`${process.env.APP_URL}/fines?payment=failed`);
    }

    // Everything checks out — mark as paid, atomically
    // NOTE: db.transaction() — see flagged issue at the end of this file.
     const currentPayment = await db
  .prepare(
    `
    SELECT *
    FROM fine_payments
    WHERE transaction_id = ?
    `
  )
  .get(transaction_uuid);


if (!currentPayment) {
  throw new Error("Payment not found.");
}


if (currentPayment.payment_status === "paid") {
  return res.redirect(`${process.env.APP_URL}/fines?payment=success`);
}


if (currentPayment.payment_status !== "pending") {
  throw new Error("Invalid payment state.");
}


await db.prepare(
  `
  UPDATE fine_payments
  SET payment_status = 'paid'
  WHERE transaction_id = ?
  `
).run(transaction_uuid);



await db.prepare(
  `
  UPDATE borrowed_books
  SET
      fine_paid = 1,
      fine_paid_at = CURRENT_TIMESTAMP,
      returned = 1,
      returned_at = CURRENT_TIMESTAMP
  WHERE id = ?
    AND fine_paid = 0
  `
).run(currentPayment.borrowed_book_id);
    const paymentInfo = await db
      .prepare(
        `
SELECT
    fp.transaction_id,
    fp.payment_method,
    fp.amount,

    bb.borrowed_at,
    bb.due_date,
    bb.fine_paid_at,

    b.title,
    b.cover_image,

    u.first_name,
    u.last_name,
    u.email

FROM fine_payments fp

INNER JOIN borrowed_books bb
ON fp.borrowed_book_id = bb.id

INNER JOIN books b
ON bb.book_id = b.id

INNER JOIN users u
ON bb.user_id = u.id

WHERE fp.transaction_id = ?
`,
      )
      .get(transaction_uuid);

      const paidOn = paymentInfo.fine_paid_at
  ? paymentInfo.fine_paid_at.replace("T", " ")
  : "-";
    await transporter.sendMail({
      to: paymentInfo.email,
      cc: process.env.ADMIN_EMAIL || undefined,
      subject: "Fine Payment Receipt - Kaiser Library",
      html: `
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
</head>

<body style="margin:0;padding:40px 0;background:#f4f6f9;font-family:Arial,Helvetica,sans-serif;">

<table width="100%" cellpadding="0" cellspacing="0">
<tr>
<td align="center">

<table width="650" cellpadding="0" cellspacing="0"
style="
background:#ffffff;
border-radius:14px;
overflow:hidden;
box-shadow:0 8px 30px rgba(0,0,0,.08);
">

<!-- HEADER -->
<tr>
<td
align="center"
style="
padding:40px;
background:linear-gradient(135deg,#123458,#1e5a92);
color:#fff;
">

<h1 style="margin:0;font-size:30px;">
📚 Kaiser Library
</h1>

<p style="margin-top:12px;font-size:17px;">
Fine Payment Successful
</p>

</td>
</tr>

<!-- CONTENT -->
<tr>
<td style="padding:40px;">

<h2
style="
margin-top:0;
color:#123458;
">
Hello ${paymentInfo.first_name},
</h2>

<p
style="
font-size:15px;
line-height:1.8;
color:#555;
">
Your fine payment has been received successfully.
Below is your payment receipt.
</p>

<!-- BOOK IMAGE -->
<div style="text-align:center;margin:35px 0;">

<img
src="${paymentInfo.cover_image}"
style="
width:170px;
border-radius:12px;
box-shadow:0 6px 20px rgba(0,0,0,.15);
">

</div>

<!-- BOOK TITLE -->
<h2
style="
text-align:center;
color:#123458;
margin-bottom:35px;
">
${paymentInfo.title}
</h2>

<!-- DETAILS TABLE -->
<table
width="100%"
cellpadding="15"
cellspacing="0"
style="
border-collapse:collapse;
border:1px solid #e5e7eb;
border-radius:10px;
overflow:hidden;
">

<tr style="background:#f8fafc;">
<td width="40%"><strong>Payment Status</strong></td>
<td style="color:#28a745;font-weight:bold;">
PAID
</td>
</tr>

<tr>
<td><strong>Fine Amount</strong></td>
<td>
Rs. ${Number(paymentInfo.amount).toLocaleString()}
</td>
</tr>

<tr style="background:#f8fafc;">
<td><strong>Paid On</strong></td>
<td>
${paidOn}
</td>
</tr>

<tr>
<td><strong>Transaction ID</strong></td>
<td style="word-break:break-word;">
${paymentInfo.transaction_id}
</td>
</tr>

<tr style="background:#f8fafc;">
<td><strong>Borrow Date</strong></td>
<td>
${new Date(paymentInfo.borrowed_at).toLocaleDateString()}
</td>
</tr>

<tr>
<td><strong>Due Date</strong></td>
<td>
${new Date(paymentInfo.due_date).toLocaleDateString()}
</td>
</tr>



</table>

<!-- SUCCESS BOX -->
<div
style="
margin-top:35px;
padding:20px;
background:#ecfdf3;
border-left:5px solid #22c55e;
border-radius:8px;
">

<h3
style="
margin:0 0 10px;
color:#15803d;
">
✔ Payment Completed
</h3>

<p
style="
margin:0;
line-height:1.8;
color:#444;
">
Your payment has been verified successfully.

The librarian can now process the return of your book.

Thank you for using Kaiser Library.
</p>

</div>

<!-- BUTTON -->
<div
style="
text-align:center;
margin:40px 0 20px;
">


<a href="${process.env.APP_URL}/fines"
style="
display:inline-block;
padding:15px 35px;
background:#123458;
color:#fff;
text-decoration:none;
font-weight:bold;
border-radius:8px;
">
View My Fines
</a>

</div>

<hr
style="
margin:35px 0;
border:none;
border-top:1px solid #eee;
">

<p
style="
font-size:14px;
line-height:1.8;
color:#666;
">
If you did not make this payment, please contact the library administrator immediately.
</p>

<p
style="
margin-top:30px;
color:#555;
">
Regards,<br>
<strong>Kaiser Library Team</strong>
</p>

</td>
</tr>

<!-- FOOTER -->
<tr>
<td
align="center"
style="
background:#f8fafc;
padding:18px;
font-size:13px;
color:#888;
">
© ${new Date().getFullYear()} Kaiser Library. All Rights Reserved.
</td>
</tr>

</table>

</td>
</tr>
</table>

</body>
</html>
`,
    });

    return res.redirect(`${process.env.APP_URL}/fines?payment=success`);
  } catch (err) {
    console.log(err);
    return res.redirect(`${process.env.APP_URL}/fines?payment=error`);
  }
};

// ESEWA FAILURE CALLBACK
exports.esewaFailure = async (req, res) => {
  try {
    const transactionId = req.query.transaction_uuid;

    if (transactionId) {
      // NOTE: db.transaction() — see flagged issue at the end of this file.
      const failPayment = db.transaction(() => {
        const payment = db
          .prepare(
            `
            SELECT *
            FROM fine_payments
            WHERE transaction_id = ?
        `,
          )
          .get(transactionId);

        if (!payment) {
          return;
        }

        if (payment.payment_status !== "pending") {
          return;
        }

        db.prepare(
          `
            UPDATE fine_payments
            SET payment_status = 'failed'
            WHERE transaction_id = ?
        `,
        ).run(transactionId);
      });

      failPayment();
    }

    return res.redirect(`${process.env.APP_URL}/fines?payment=failed`);
  } catch (err) {
    console.log(err);
    return res.redirect(`${process.env.APP_URL}/fines?payment=error`);
  }
};

//update profile
exports.updateProfile = async (req, res) => {
  try {
    const userId = req.session.user.id;

    const { first_name, last_name, gender, phone, address } = req.body;

    let errors = {};

    if (!first_name?.trim()) errors.first_name = "First name is required";
    if (!last_name?.trim()) errors.last_name = "Last name is required";
    if (!gender) errors.gender = "Gender is required";

    if (!phone) {
      errors.phone = "Phone is required";
    } else if (!/^\d{10}$/.test(phone)) {
      errors.phone = "Phone must be exactly 10 digits";
    }

    if (!address?.trim()) errors.address = "Address is required";

    if (Object.keys(errors).length) {
      return res.status(400).json({
        message: "Validation failed",
        errors,
      });
    }

    const user = await db.prepare(`SELECT * FROM users WHERE id=?`).get(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    let profileImage = user.profile_image;
    let profilePublicId = user.profile_image_public_id;

    // IMAGE UPLOAD (supports HEIC via Cloudinary auto conversion)
    if (req.file) {
      const uploadResult = await new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            folder: "kaiser-library/profile",
            resource_type: "image",
          },
          (err, result) => {
            if (err) return reject(err);
            resolve(result);
          },
        );

        streamifier.createReadStream(req.file.buffer).pipe(uploadStream);
      });

      // DELETE OLD IMAGE
      if (user.profile_image_public_id) {
        await cloudinary.uploader.destroy(user.profile_image_public_id);
      }

      profileImage = uploadResult.secure_url;
      profilePublicId = uploadResult.public_id;
    }

    await db.prepare(
      `
      UPDATE users SET
        first_name=?,
        last_name=?,
        gender=?,
        phone=?,
        address=?,
        profile_image=?,
        profile_image_public_id=?
      WHERE id=?
    `,
    ).run(
      first_name.trim(),
      last_name.trim(),
      gender,
      phone,
      address.trim(),
      profileImage,
      profilePublicId,
      userId,
    );

    res.json({ message: "Profile updated successfully" });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Failed to update profile" });
  }
};

exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, password, confirmPassword } = req.body;

    if (!currentPassword || !password || !confirmPassword) {
      return res.status(400).json({
        message: "All password fields are required",
      });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({
        message: "Passwords do not match",
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        message: "Password must be at least 8 characters",
      });
    }

    const user = await db
      .prepare(
        `
      SELECT *
      FROM users
      WHERE id = ?
    `,
      )
      .get(req.session.user.id);

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    const currentPasswordMatch = await bcrypt.compare(
      currentPassword,
      user.password,
    );

    if (!currentPasswordMatch) {
      return res.status(400).json({
        message: "Current password is incorrect",
      });
    }

    const samePassword = await bcrypt.compare(password, user.password);

    if (samePassword) {
      return res.status(400).json({
        message: "New password cannot be the same as current password",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await db.prepare(
      `
      UPDATE users
      SET
        password = ?,
        must_change_password = 0,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `,
    ).run(hashedPassword, user.id);

    const changedAt = new Date().toLocaleString("en-US", {
      dateStyle: "long",
      timeStyle: "short",
    });

    await transporter.sendMail({
      to: user.email,

      subject: "Your Kaiser Library Password Has Been Changed",

      html: `

<!DOCTYPE html>
<html>

<body style="
margin:0;
padding:40px 0;
background:#f4f6f9;
font-family:Arial,Helvetica,sans-serif;
">


<table width="100%">

<tr>

<td align="center">


<table width="620"

style="
background:#ffffff;
border-radius:14px;
overflow:hidden;
box-shadow:0 8px 30px rgba(0,0,0,.08);
">


<tr>

<td align="center"

style="
background:#123458;
color:white;
padding:40px;
">

<h1 style="margin:0;">
📚 Kaiser Library
</h1>

<p style="margin-top:12px;">
Password Changed Successfully
</p>

</td>

</tr>



<tr>

<td style="padding:40px;">


<h2 style="color:#123458;">

Hello ${user.first_name},

</h2>



<p style="
color:#555;
line-height:1.8;
">

Your Kaiser Library account password was successfully changed.

</p>




<div style="
background:#e8f7ee;
border-left:5px solid #198754;
padding:18px;
border-radius:8px;
margin:25px 0;
">


<strong style="color:#146c43;">
✓ Security Confirmation
</strong>


<p style="
margin-top:10px;
color:#555;
line-height:1.7;
">

Your password has been updated successfully. Your account is now protected with your new password.

</p>


</div>




<!-- Change Details -->

<div style="
background:#f8fafc;
border:1px solid #e5e7eb;
padding:18px;
border-radius:8px;
margin:25px 0;
">


<strong style="color:#123458;">
🔐 Password Change Details
</strong>


<table width="100%" style="margin-top:15px;color:#555;">

<tr>

<td style="padding:6px 0;">
<strong>Changed On:</strong>
</td>

<td style="padding:6px 0;text-align:right;">
${changedAt}
</td>

</tr>


<tr>

<td style="padding:6px 0;">
<strong>Account:</strong>
</td>

<td style="padding:6px 0;text-align:right;">
${user.email}
</td>

</tr>


</table>


</div>





<div style="
background:#fff8e7;
border-left:5px solid #d4a017;
padding:18px;
border-radius:8px;
margin:25px 0;
">


<strong style="color:#8a6500;">
⚠ Security Notice
</strong>


<p style="
margin-top:10px;
color:#555;
line-height:1.7;
">

If you did not make this change, please contact the Kaiser Library administrator immediately to secure your account.

</p>


</div>





<hr style="
margin:35px 0;
border:none;
border-top:1px solid #eeeeee;
">


<p style="color:#555;">

Regards,<br>

<strong>
Kaiser Library Team
</strong>

</p>


</td>

</tr>




<tr>

<td align="center"

style="
background:#f8fafc;
padding:18px;
color:#888;
">

© ${new Date().getFullYear()} Kaiser Library. All Rights Reserved.

</td>

</tr>



</table>


</td>

</tr>

</table>


</body>

</html>

`,
    });

    return res.json({
      message: "Password changed successfully",
    });
  } catch (error) {
    console.error("Change password error:", error);

    return res.status(500).json({
      message: "Server error",
    });
  }
};