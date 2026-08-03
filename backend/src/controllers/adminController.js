const cloudinary = require("../config/cloudinary");
const streamifier = require("streamifier");
const db = require("../config/db");
const transporter = require("../config/mail");
const bcrypt = require("bcrypt");
const crypto = require("crypto");
const axios = require("axios");

exports.getDashboardData = async (req, res) => {
  try {
    const totalAuthors = (
      await db.prepare(`SELECT COUNT(*) AS total FROM authors`).get()
    ).total;

    const totalGenres = (
      await db.prepare(`SELECT COUNT(*) AS total FROM genres`).get()
    ).total;

    const totalBooks = (
      await db.prepare(`SELECT COUNT(*) AS total FROM books`).get()
    ).total;

    const totalReaders = (
      await db.prepare(`
        SELECT COUNT(*) AS total 
        FROM users 
        WHERE role = 'reader'
      `).get()
    ).total;

    res.json({
      totalAuthors,
      totalGenres,
      totalBooks,
      totalReaders
    });

  } catch (err) {
    console.log(err);

    res.status(500).json({
      message: "Failed to load dashboard data"
    });
  }
};

exports.getAllAuthors = async (req, res) => {
  try {
    const authors = await db
      .prepare(`
        SELECT id, name
        FROM authors
        ORDER BY name ASC
      `)
      .all();

    res.json(authors);
  } catch (err) {
    console.log(err);
    res.status(500).json({
      message: "Failed to load authors",
    });
  }
};

exports.getAuthors = async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = 10;
  const search = req.query.search || "";
  const offset = (page - 1) * limit;

  try {
    const total = (
      await db
        .prepare(`SELECT COUNT(*) AS total FROM authors WHERE name LIKE ?`)
        .get(`%${search}%`)
    ).total;

    const authors = await db
      .prepare(`
        SELECT * FROM authors
        WHERE name LIKE ?
        ORDER BY id DESC
        LIMIT ? OFFSET ?
      `)
      .all(`%${search}%`, limit, offset);

    res.json({
      authors,
      total,
      page,
      totalPages: Math.ceil(total / limit)
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.createAuthor = async (req, res) => {
  const { name, biography } = req.body;

  if (!name || !name.trim()) {
    return res.status(400).json({ message: "Author name is required" });
  }

  try {
    const result = await db
      .prepare(`INSERT INTO authors (name, biography) VALUES (?, ?)`)
      .run(name.trim(), biography?.trim() || null);

    res.status(201).json({
      message: "Author added successfully",
      id: result.lastInsertRowid
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Failed to add author" });
  }
};

exports.getAuthor = async (req, res) => {
  const id = req.params.id;

  try {
    const author = await db.prepare(`SELECT * FROM authors WHERE id = ?`).get(id);

    if (!author) {
      return res.status(404).json({ message: "Author not found" });
    }

    res.json(author);
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.updateAuthor = async (req, res) => {
  const id = req.params.id;
  let { name, biography } = req.body;

  if (!name || !name.trim()) {
    return res.status(400).json({ message: "Author name is required" });
  }

  try {
    const result = await db
      .prepare(`UPDATE authors SET name = ?, biography = ? WHERE id = ?`)
      .run(name.trim(), biography?.trim() || null, id);

    if (result.changes === 0) {
      return res.status(404).json({ message: "Author not found" });
    }

    res.json({ message: "Author updated successfully" });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Failed to update author" });
  }
};

exports.deleteAuthor = async (req, res) => {
  const id = req.params.id;

  try {
    const result = await db.prepare(`DELETE FROM authors WHERE id = ?`).run(id);

    if (result.changes === 0) {
      return res.status(404).json({ message: "Author not found" });
    }

    res.json({ message: "Author deleted successfully" });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Failed to delete author" });
  }
};


// Genre
exports.getAllGenres = async (req, res) => {
  try {
    const genres = await db
      .prepare(`
        SELECT id, name
        FROM genres
        ORDER BY name ASC
      `)
      .all();

    res.json(genres);
  } catch (err) {
    console.log(err);
    res.status(500).json({
      message: "Failed to load genres",
    });
  }
};

// GET GENRES 
exports.getGenres = async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = 10;
  const search = req.query.search || "";
  const offset = (page - 1) * limit;

  try {
    const total = (
      await db
        .prepare(`SELECT COUNT(*) AS total FROM genres WHERE name LIKE ?`)
        .get(`%${search}%`)
    ).total;

    const genres = await db
      .prepare(`
        SELECT * FROM genres
        WHERE name LIKE ?
        ORDER BY id DESC
        LIMIT ? OFFSET ?
      `)
      .all(`%${search}%`, limit, offset);

    res.json({
      genres,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Server error" });
  }
};

// CREATE
exports.createGenre = async (req, res) => {
  const { name } = req.body;

  if (!name || !name.trim()) {
    return res.status(400).json({ message: "Genre name is required" });
  }

  try {
    const result = await db
      .prepare(`INSERT INTO genres (name) VALUES (?)`)
      .run(name.trim());

    res.status(201).json({
      message: "Genre added successfully",
      id: result.lastInsertRowid,
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Failed to add genre" });
  }
};

// GET ONE
exports.getGenre = async (req, res) => {
  const id = req.params.id;

  try {
    const genre = await db
      .prepare(`SELECT * FROM genres WHERE id = ?`)
      .get(id);

    if (!genre) {
      return res.status(404).json({ message: "Genre not found" });
    }

    res.json(genre);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

// UPDATE
exports.updateGenre = async (req, res) => {
  const id = req.params.id;
  const { name } = req.body;

  if (!name || !name.trim()) {
    return res.status(400).json({ message: "Genre name is required" });
  }

  try {
    const result = await db
      .prepare(`UPDATE genres SET name = ? WHERE id = ?`)
      .run(name.trim(), id);

    if (result.changes === 0) {
      return res.status(404).json({ message: "Genre not found" });
    }

    res.json({ message: "Genre updated successfully" });
  } catch (err) {
    res.status(500).json({ message: "Failed to update genre" });
  }
};

// DELETE
exports.deleteGenre = async (req, res) => {
  const id = req.params.id;

  try {
    const result = await db
      .prepare(`DELETE FROM genres WHERE id = ?`)
      .run(id);

    if (result.changes === 0) {
      return res.status(404).json({ message: "Genre not found" });
    }

    res.json({ message: "Genre deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: "Failed to delete genre" });
  }
};


//BOOKS

//get books
exports.getBooks = async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = 10;

  const title = req.query.title || "";
  const author = req.query.author || "";
  const genre = req.query.genre || "";

  const offset = (page - 1) * limit;

  try {
    const total = (
      await db.prepare(`
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
    `).get(
        `%${title}%`,
        `%${author}%`,
        `%${genre}%`
      )
    ).total;

    const books = await db.prepare(`
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
    `).all(
      `%${title}%`,
      `%${author}%`,
      `%${genre}%`,
      limit,
      offset
    );

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

// create books
exports.createBook = async (req, res) => {
  const { title, authorId, genreId, stock } = req.body;

  let errors = {};

  if (!title || !title.trim()) {
    errors.title = "Book title is required";
  }

  if (!authorId) {
    errors.authorId = "Author is required";
  }

  if (!genreId) {
    errors.genreId = "Genre is required";
  }

  if (stock === "") {
    errors.stock = "Stock quantity is required";
  } else if (Number(stock) < 0 || Number.isNaN(Number(stock))) {
    errors.stock = "Stock cannot be negative";
  }

  if (!req.file) {
    errors.cover = "Cover image is required";
  }

  if (Object.keys(errors).length > 0) {
    return res.status(400).json({ errors });
  }

  const stockQuantity = parseInt(stock);

  try {
    // Check author and get author name
    const author = await db
      .prepare(
        `
        SELECT id, name
        FROM authors
        WHERE id = ?
      `
      )
      .get(authorId);

    if (!author) {
      return res.status(400).json({
        errors: {
          authorId: "Author is required",
        },
      });
    }

    // Check genre
    const genre = await db
      .prepare(
        `
        SELECT id
        FROM genres
        WHERE id = ?
      `
      )
      .get(genreId);

    if (!genre) {
      return res.status(400).json({
        errors: {
          genreId: "Genre is required",
        },
      });
    }

    // Check duplicate
    const duplicate = await db
      .prepare(
        `
        SELECT id
        FROM books
        WHERE LOWER(title) = LOWER(?)
        AND author_id = ?
      `
      )
      .get(title.trim(), authorId);

    if (duplicate) {
      return res.status(400).json({
        errors: {
          title: "Book already exists for this author",
        },
      });
    }

    // Fetch description from Google Books API
    let description = "";

    try {
      const response = await axios.get(
        `https://www.googleapis.com/books/v1/volumes?q=intitle:${encodeURIComponent(
          title.trim()
        )}+inauthor:${encodeURIComponent(
          author.name
        )}&key=${process.env.GOOGLE_BOOKS_API_KEY}`
      );

      if (
        response.data.items &&
        response.data.items.length > 0 &&
        response.data.items[0].volumeInfo.description
      ) {
        description = response.data.items[0].volumeInfo.description;
      }
    } catch (error) {
      console.log("Google Books API Error:", error.message);
    }

    // Upload cover image
    const uploadResult = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: "kaiser-library/books",
          resource_type: "image",
        },
        (error, result) => {
          if (error) return reject(error);
          resolve(result);
        }
      );

      streamifier.createReadStream(req.file.buffer).pipe(uploadStream);
    });

    // Insert book
    const result = await db
      .prepare(
        `
        INSERT INTO books (
          title,
          description,
          author_id,
          genre_id,
          stock_quantity,
          cover_image,
          cover_public_id
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
      `
      )
      .run(
        title.trim(),
        description,
        authorId,
        genreId,
        stockQuantity,
        uploadResult.secure_url,
        uploadResult.public_id
      );

    return res.status(201).json({
      message: "Book added successfully",
      id: result.lastInsertRowid,
    });
  } catch (err) {
    console.log(err);

    return res.status(500).json({
      message: "Failed to add book",
    });
  }
};

//get book
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

//update book
exports.updateBook = async (req, res) => {

  const id = req.params.id;

  const {
    title,
    authorId,
    genreId,
    stock,
  } = req.body;

  let errors = {};

  if (!title || !title.trim()) {
    errors.title = "Book title is required";
  }

  if (!authorId) {
    errors.authorId = "Author is required";
  }

  if (!genreId) {
    errors.genreId = "Genre is required";
  }

  if (stock === "") {
    errors.stock = "Stock quantity is required";
  } else if (
    Number(stock) < 0 ||
    Number.isNaN(Number(stock))
  ) {
    errors.stock = "Stock cannot be negative";
  }

  if (Object.keys(errors).length) {
    return res.status(400).json({
      errors,
    });
  }

  try {

    const existingBook = await db.prepare(`
      SELECT *
      FROM books
      WHERE id = ?
    `).get(id);

    if (!existingBook) {
      return res.status(404).json({
        message: "Book not found",
      });
    }

    const author = await db.prepare(`
      SELECT id
      FROM authors
      WHERE id = ?
    `).get(authorId);

    if (!author) {
      return res.status(400).json({
        errors: {
          authorId: "Author is required",
        },
      });
    }

    const genre = await db.prepare(`
      SELECT id
      FROM genres
      WHERE id = ?
    `).get(genreId);

    if (!genre) {
      return res.status(400).json({
        errors: {
          genreId: "Genre is required",
        },
      });
    }

    const duplicate = await db.prepare(`
      SELECT id
      FROM books
      WHERE LOWER(title)=LOWER(?)
      AND author_id=?
      AND id<>?
    `).get(
      title.trim(),
      authorId,
      id
    );

    if (duplicate) {
      return res.status(400).json({
        errors: {
          title:
            "Book already exists for this author",
        },
      });
    }

    let coverImage = existingBook.cover_image;
    let coverPublicId = existingBook.cover_public_id;

    if (req.file) {

      const uploadResult =
        await new Promise((resolve, reject) => {

          const uploadStream =
            cloudinary.uploader.upload_stream(
              {
                folder: "kaiser-library/books",
              },
              (err, result) => {

                if (err) return reject(err);

                resolve(result);

              }
            );

          streamifier
            .createReadStream(req.file.buffer)
            .pipe(uploadStream);

        });

      if (existingBook.cover_public_id) {
        await cloudinary.uploader.destroy(
          existingBook.cover_public_id
        );
      }

      coverImage = uploadResult.secure_url;
      coverPublicId = uploadResult.public_id;

    }

    await db.prepare(`
      UPDATE books
      SET
      title=?,
      author_id=?,
      genre_id=?,
      stock_quantity=?,
      cover_image=?,
      cover_public_id=?
      WHERE id=?
    `).run(
      title.trim(),
      authorId,
      genreId,
      Number(stock),
      coverImage,
      coverPublicId,
      id
    );

    res.json({
      message: "Book updated successfully",
    });

  } catch (err) {

    console.log(err);

    res.status(500).json({
      message: "Failed to update book",
    });

  }

};

// delete book
exports.deleteBook = async (req, res) => {
  const id = req.params.id;

  try {
    const book = await db
      .prepare(`SELECT cover_public_id FROM books WHERE id = ?`)
      .get(id);

    if (!book) {
      return res.status(404).json({
        message: "Book not found",
      });
    }

    if (book.cover_public_id) {
      await cloudinary.uploader.destroy(book.cover_public_id);
    }

    await db.prepare(`DELETE FROM books WHERE id = ?`).run(id);

    return res.json({
      message: "Book deleted successfully",
    });
  } catch (err) {
    console.log(err);

    return res.status(500).json({
      message: "Failed to delete book",
    });
  }
};


// get fine users
exports.getFineUsers = async (req, res) => {

  const page = parseInt(req.query.page) || 1;
  const limit = 10;
  const offset = (page - 1) * limit;

  const search = req.query.search || "";
  const sort = req.query.sort || "highest";
  const status = req.query.status || "";

  try {

    let where = `
            u.role = 'reader'
        `;

    const params = [];


    if (search) {

      where += `
            AND (
                u.first_name LIKE ?
                OR u.last_name LIKE ?
                OR u.email LIKE ?
            )
            `;

      params.push(
        `%${search}%`,
        `%${search}%`,
        `%${search}%`
      );

    }



    let having = "";

    if (status === "unpaid") {

      having = `
            HAVING outstanding_fine > 0
            `;

    }


    if (status === "paid") {

      having = `
            HAVING outstanding_fine = 0
            `;

    }



    let orderBy = "outstanding_fine DESC";


    if (sort === "lowest") {

      orderBy = "outstanding_fine ASC";

    }


    if (sort === "name") {

      orderBy = "u.first_name ASC";

    }



    const users = await db.prepare(`

            SELECT

                u.id,
                u.first_name,
                u.last_name,
                u.email,
                u.profile_image,


                COUNT(
                    CASE
                    WHEN bb.returned = 0
                    THEN bb.id
                    END
                ) AS borrowed_books,
                 COUNT(
    CASE
        WHEN bb.fine_amount > 0
        THEN bb.id
    END
) AS fined_books,


              COUNT(
    CASE
    WHEN (bb.fine_amount - bb.fine_paid_amount) > 0
    THEN bb.id
    END
) AS unpaid_books,


                COALESCE(
    SUM(
        CASE
        WHEN (bb.fine_amount - bb.fine_paid_amount) > 0
        THEN (bb.fine_amount - bb.fine_paid_amount)
        ELSE 0
        END
    ),
    0
) AS outstanding_fine



            FROM users u


            LEFT JOIN borrowed_books bb

            ON u.id = bb.user_id



            WHERE ${where}


            GROUP BY u.id


            ${having}


            ORDER BY ${orderBy}


            LIMIT ?
            OFFSET ?


        `).all(
      ...params,
      limit,
      offset
    );



    const total = users.length;



    res.json({

      users,

      total,

      totalPages: Math.ceil(total / limit)

    });



  } catch (err) {

    console.log(err);

    res.status(500).json({

      message: "Failed to load fines"

    });

  }

};

//pay fines
exports.payFine = async (req, res) => {

  const borrowedId = parseInt(req.params.id);

  try {

    const fine = await db.prepare(`
      SELECT *
      FROM borrowed_books
      WHERE id = ?
    `).get(borrowedId);

    if (!fine) {
      return res.status(404).json({
        message: "Fine not found."
      });
    }

    const remainingFine = fine.fine_amount - fine.fine_paid_amount;

    if (remainingFine <= 0) {
      return res.status(400).json({
        message: "Fine already fully paid."
      });
    }

    // NOTE: db.transaction() is a better-sqlite3-specific synchronous API.
    // See the flagged warning below this file — this needs verifying/rewriting
    // for @tursodatabase/serverless before this will work in production.
    const transaction = db.transaction(() => {

      db.prepare(`
        UPDATE borrowed_books
SET
  fine_paid_amount = fine_paid_amount + ?,
  fine_paid = CASE
    WHEN fine_paid_amount + ? >= fine_amount THEN 1
    ELSE 0
  END,
  fine_paid_at = CURRENT_TIMESTAMP
WHERE id = ?
      `).run(
        remainingFine,
        remainingFine,
        borrowedId
      );

      db.prepare(`
        INSERT INTO fine_payments (
          borrowed_book_id,
          amount,
          payment_method,
          payment_status,
          received_by,
          paid_at
        )
        VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      `).run(
        borrowedId,
        remainingFine,
        "cash",
        "paid",
        req.session.user.id //admin user id
      );

    });

    transaction();

    const paymentInfo = await db.prepare(`
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

WHERE fp.borrowed_book_id = ?
ORDER BY fp.id DESC
LIMIT 1
`).get(borrowedId);

    const borrowedOn = paymentInfo.borrowed_at;
    const dueOn = paymentInfo.due_date;
    const collectedOn = paymentInfo.fine_paid_at;

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
Cash Fine Collection Receipt
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
Your library fine has been collected successfully by a librarian.

Below is your receipt for the cash payment.
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
<td><strong>Cash Collected On</strong></td><td>
${paidOn}
</td>
</tr>

<tr style="background:#f8fafc;">
<td><strong>Payment Method</strong></td>
<td>CASH</td>
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
✔ Cash Payment Received
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


    res.json({
      message: "Fine collected successfully."
    });

  } catch (err) {

    console.log(err);

    res.status(500).json({
      message: "Failed to collect fine."
    });

  }

};

// get readers
exports.getReaders = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 10;
    const offset = (page - 1) * limit;

    const {
      first_name = "",
      last_name = "",
      email = "",
      phone = "",
      gender = "",
      sort = "newest",
    } = req.query;

    let where = `WHERE role = 'reader'`;
    const params = [];

    if (first_name.trim()) {
      where += ` AND first_name LIKE ?`;
      params.push(`%${first_name.trim()}%`);
    }

    if (last_name.trim()) {
      where += ` AND last_name LIKE ?`;
      params.push(`%${last_name.trim()}%`);
    }

    if (email.trim()) {
      where += ` AND email LIKE ?`;
      params.push(`%${email.trim()}%`);
    }

    if (phone.trim()) {
      where += ` AND phone LIKE ?`;
      params.push(`%${phone.trim()}%`);
    }

    if (gender.trim()) {
      where += ` AND gender = ?`;
      params.push(gender);
    }

    let orderBy = `ORDER BY created_at DESC`;

    switch (sort) {
      case "oldest":
        orderBy = `ORDER BY created_at ASC`;
        break;

      case "az":
        orderBy = `ORDER BY first_name ASC, last_name ASC`;
        break;

      case "za":
        orderBy = `ORDER BY first_name DESC, last_name DESC`;
        break;

      default:
        orderBy = `ORDER BY created_at DESC`;
    }

    const total = (
      await db
        .prepare(
          `
        SELECT COUNT(*) AS total
        FROM users
        ${where}
      `
        )
        .get(...params)
    ).total;

    const readers = await db
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
      status,
      created_at
    FROM users
    ${where}
    ${orderBy}
    LIMIT ?
    OFFSET ?
  `
      )
      .all(...params, limit, offset);

    res.json({
      readers,
      total,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (err) {
    console.log("Get readers error:", err);

    res.status(500).json({
      message: "Failed to load readers",
    });
  }
};

//toggle reader status
exports.toggleReaderStatus = async (req, res) => {
  try {
    const { id } = req.params;

    const reader = await db.prepare(`
      SELECT id, first_name, last_name, status
      FROM users
      WHERE id = ?
      AND role = 'reader'
    `).get(id);

    if (!reader) {
      return res.status(404).json({
        message: "Reader not found",
      });
    }

    const newStatus =
      reader.status === "active" ? "inactive" : "active";

    await db.prepare(`
      UPDATE users
      SET status = ?
      WHERE id = ?
    `).run(newStatus, id);

    res.json({
      message: `Reader ${newStatus === "active" ? "activated" : "deactivated"
        } successfully`,
    });

  } catch (err) {
    console.log(err);

    res.status(500).json({
      message: "Failed to update reader status",
    });
  }
};
//get borrow history
exports.getBorrowHistory = async (req, res) => {
  const userId = parseInt(req.params.userId);

  const page = parseInt(req.query.page) || 1;
  const limit = 10;
  const offset = (page - 1) * limit;

  const {
    title = "",
    borrowed_from = "",
    borrowed_to = "",
    returned_from = "",
    returned_to = "",
    sort = "borrowed_desc"
  } = req.query;

  try {

    const user = await db.prepare(`
            SELECT
                id,
                first_name,
                last_name,
                email,
                phone,
                profile_image
            FROM users
            WHERE id = ?
        `).get(userId);

    if (!user) {
      return res.status(404).json({
        message: "User not found"
      });
    }

    // Total books borrowed by the user (never changes with filters)
    const totalBorrowedBooks = (
      await db.prepare(`
            SELECT COUNT(*) AS total
            FROM borrowed_books
            WHERE user_id = ?
        `).get(userId)
    ).total;

    let where = `WHERE bb.user_id = ?`;
    const params = [userId];

    // Search by title
    if (title) {
      where += ` AND b.title LIKE ?`;
      params.push(`%${title}%`);
    }

    // Borrowed date filters
    if (borrowed_from) {
      where += ` AND DATE(bb.borrowed_at) >= DATE(?)`;
      params.push(borrowed_from);
    }

    if (borrowed_to) {
      where += ` AND DATE(bb.borrowed_at) <= DATE(?)`;
      params.push(borrowed_to);
    }

    // Returned date filters
    if (returned_from) {
      where += ` AND bb.returned = 1 AND DATE(bb.returned_at) >= DATE(?)`;
      params.push(returned_from);
    }

    if (returned_to) {
      where += ` AND bb.returned = 1 AND DATE(bb.returned_at) <= DATE(?)`;
      params.push(returned_to);
    }

    let orderBy = "";

    switch (sort) {

      case "returned_desc":
        orderBy = `
                    CASE
                        WHEN bb.returned = 1 THEN 0
                        ELSE 1
                    END,
                    bb.returned_at DESC
                `;
        break;

      case "returned_asc":
        orderBy = `
                    CASE
                        WHEN bb.returned = 1 THEN 0
                        ELSE 1
                    END,
                    bb.returned_at ASC
                `;
        break;

      case "borrowed_asc":
        orderBy = `bb.borrowed_at ASC`;
        break;

      case "borrowed_desc":
      default:
        orderBy = `bb.borrowed_at DESC`;
        break;
    }

    // Total records after filters (for pagination)
    const total = (
      await db.prepare(`
            SELECT COUNT(*) AS total
            FROM borrowed_books bb
            INNER JOIN books b
                ON bb.book_id = b.id
            LEFT JOIN authors a
                ON b.author_id = a.id
            ${where}
        `).get(...params)
    ).total;

    // Fetch paginated records
    const books = await db.prepare(`
            SELECT
                bb.id,

                b.title,
                b.cover_image,

                a.name AS author,

                bb.borrowed_at,
                bb.due_date,

                COALESCE(bb.fine_amount,0) AS fine_amount,
COALESCE(bb.fine_paid_amount,0) AS fine_paid_amount,
COALESCE(bb.fine_paid,0) AS fine_paid,
bb.fine_paid_at,

                COALESCE(bb.returned,0) AS returned,
                bb.returned_at

            FROM borrowed_books bb

            INNER JOIN books b
                ON bb.book_id = b.id

            LEFT JOIN authors a
                ON b.author_id = a.id

            ${where}

            ORDER BY ${orderBy}

            LIMIT ?
            OFFSET ?
        `).all(...params, limit, offset);

    res.json({
      user,
      books,
      totalBorrowedBooks,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: page
    });

  } catch (err) {

    console.log("Borrow history error:", err);

    res.status(500).json({
      message: "Failed to load borrow history"
    });

  }
};

//return book
exports.returnBook = async (req, res) => {

  const borrowedId = parseInt(req.params.id);


  try {

    const borrowed = await db.prepare(`
            SELECT *
            FROM borrowed_books
            WHERE id = ?
            AND returned = 0
        `).get(borrowedId);



    if (!borrowed) {

      return res.status(404).json({
        message: "Borrowed book not found."
      });

    }



    if (
      borrowed.fine_amount > 0 &&
      borrowed.fine_paid === 0
    ) {

      return res.status(400).json({
        message: "Please clear the fine before returning this book."
      });

    }



    // NOTE: db.transaction() is a better-sqlite3-specific synchronous API.
    // See the flagged warning below this file.
    const transaction = db.transaction(() => {


      db.prepare(`
                UPDATE borrowed_books
                SET
                    returned = 1,
                    returned_at = CURRENT_TIMESTAMP
                WHERE id = ?
            `).run(borrowedId);



      db.prepare(`
                UPDATE books
                SET stock_quantity = stock_quantity + 1
                WHERE id = ?
            `).run(borrowed.book_id);


    });



    transaction();

    res.json({
      message: "Book returned successfully."
    });



  } catch (err) {


    console.log(err);


    res.status(500).json({
      message: "Failed to return book."
    });


  }

};

// profile
exports.getProfile = async (req, res) => {
  try {
    const user = await db.prepare(`
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
    `).get(req.session.user.id);

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


//add reader
exports.createReader = async (req, res) => {
  try {
    const {
      first_name,
      last_name,
      gender,
      email,
      phone,
      address,
    } = req.body;

    const errors = {};

    if (!first_name?.trim())
      errors.first_name = "First name is required";

    if (!last_name?.trim())
      errors.last_name = "Last name is required";

    if (!["male", "female", "other"].includes(gender))
      errors.gender = "Invalid gender";

    if (!email?.trim()) {
      errors.email = "Email is required";
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

      if (!emailRegex.test(email.trim())) {
        errors.email = "Invalid email address";
      }
    }

    if (phone && !/^[0-9+\-\s()]{7,20}$/.test(phone.trim())) {
      errors.phone = "Invalid phone number";
    }

    if (Object.keys(errors).length) {
      return res.status(400).json({ errors });
    }

    const existing = await db
      .prepare(
        `
        SELECT id
        FROM users
        WHERE email = ?
           OR phone = ?
      `
      )
      .get(email.trim(), phone || null);

    if (existing) {
      return res.status(400).json({
        message: "Email or phone already exists",
      });
    }

    // Generate temporary password
    const temporaryPassword = crypto.randomBytes(4).toString("hex");

    const hashedPassword = await bcrypt.hash(
      temporaryPassword,
      10
    );

    await db.prepare(
      `
      INSERT INTO users (
        first_name,
        last_name,
        gender,
        email,
        phone,
        password,
        role,
        status,
       must_change_password,
        address
      )
      VALUES (
        ?, ?, ?, ?, ?, ?,
        'reader',
        'active',
        1,
        ?
      )
    `
    ).run(
      first_name.trim(),
      last_name.trim(),
      gender,
      email.trim(),
      phone?.trim() || null,
      hashedPassword,
      address?.trim() || null
    );
    const APP_URL = process.env.APP_URL;

    await transporter.sendMail({
      to: email.trim(),
      subject: "Welcome to Kaiser Library - Your Reader Account",
      html: `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
</head>

<body style="margin:0;padding:40px 0;background:#f4f6f9;font-family:Arial,Helvetica,sans-serif;">

  <table width="100%" cellpadding="0" cellspacing="0" border="0">
    <tr>
      <td align="center">

        <table
          width="620"
          cellpadding="0"
          cellspacing="0"
          border="0"
          style="
            background:#ffffff;
            border-radius:14px;
            overflow:hidden;
            box-shadow:0 8px 30px rgba(0,0,0,.08);
          "
        >

          <!-- Header -->
          <tr>
            <td
              align="center"
              style="
                background:linear-gradient(135deg,#123458,#1e5a92);
                color:#ffffff;
                padding:40px;
              "
            >
              <h1 style="margin:0;font-size:30px;">
                📚 Kaiser Library
              </h1>

              <p style="margin-top:12px;font-size:16px;">
                Welcome! Your Reader Account is Ready
              </p>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding:40px;">

              <h2
                style="
                  margin-top:0;
                  color:#123458;
                "
              >
                Hello ${first_name},
              </h2>

              <p
                style="
                  color:#555;
                  font-size:15px;
                  line-height:1.8;
                "
              >
                Your reader account has been successfully created by the
                <strong>Kaiser Library Administrator</strong>.
              </p>

              <table
                width="100%"
                cellpadding="18"
                cellspacing="0"
                border="0"
                style="
                  background:#f8fafc;
                  border:1px solid #e5e7eb;
                  border-radius:10px;
                  margin:30px 0;
                "
              >

                <tr>
                  <td>

                    <p style="margin:0 0 18px;">
                      <strong>Email Address</strong><br>
                      ${email}
                    </p>

                    <p style="margin:0 0 10px;">
                      <strong>Temporary Password</strong>
                    </p>

                    <div
                      style="
                        background:#123458;
                        color:#ffffff;
                        font-size:24px;
                        font-weight:bold;
                        letter-spacing:5px;
                        text-align:center;
                        padding:16px;
                        border-radius:8px;
                      "
                    >
                      ${temporaryPassword}
                    </div>

                  </td>
                </tr>

              </table>

              <div
                style="
                  background:#fff8e7;
                  border-left:5px solid #d4a017;
                  padding:18px;
                  border-radius:8px;
                  margin-bottom:30px;
                "
              >

                <strong style="color:#8a6500;">
                  ⚠ Security Notice
                </strong>

                <p
                  style="
                    margin-top:10px;
                    color:#555;
                    line-height:1.7;
                  "
                >
                  For security reasons, you must change your temporary password
                  the first time you sign in to your account.
                </p>

              </div>

              <div
                style="
                  text-align:center;
                  margin:35px 0;
                "
              >

                
                  href="${APP_URL}/login"
                  style="
                    background:#123458;
                    color:#ffffff;
                    text-decoration:none;
                    padding:15px 35px;
                    border-radius:8px;
                    font-weight:bold;
                    font-size:16px;
                    display:inline-block;
                  "
                >
                  Login to Kaiser Library
                </a>

              </div>

              <p
                style="
                  color:#555;
                  line-height:1.8;
                "
              >
                If the button above doesn't work, copy and paste the following
                link into your browser:
              </p>

              <p style="word-break:break-word;">
                
                  href="${APP_URL}/login"
                  style="
                    color:#123458;
                    text-decoration:none;
                    font-weight:600;
                  "
                >
                  ${APP_URL}/login
                </a>
              </p>

              <hr
                style="
                  margin:35px 0;
                  border:none;
                  border-top:1px solid #eeeeee;
                "
              >

              <p
                style="
                  color:#777;
                  font-size:14px;
                  line-height:1.7;
                "
              >
                If you did not expect this email, please ignore it or contact
                the library administrator.
              </p>

              <p
                style="
                  margin-top:30px;
                  color:#555;
                "
              >
                Regards,<br>
                <strong>Kaiser Library Team</strong>
              </p>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td
              align="center"
              style="
                background:#f8fafc;
                padding:18px;
                color:#888;
                font-size:13px;
              "
            >
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
    res.status(201).json({
      message:
        "Reader created successfully. Temporary password has been emailed.",
    });
  } catch (err) {
    console.error("Create reader error:", err);

    res.status(500).json({
      message: "Failed to create reader",
    });
  }
};
exports.getReader = async (req, res) => {
  try {
    const { id } = req.params;

    const reader = await db.prepare(`
      SELECT
        id,
        first_name,
        last_name,
        gender,
        email,
        phone,
        address
      FROM users
      WHERE id = ?
        AND role = 'reader'
    `).get(id);

    if (!reader) {
      return res.status(404).json({
        message: "Reader not found",
      });
    }

    res.json({
      reader,
    });

  } catch (err) {
    console.error("Get reader error:", err);

    res.status(500).json({
      message: "Failed to load reader",
    });
  }
};

exports.updateReader = async (req, res) => {
  try {
    const { id } = req.params;

    const {
      first_name,
      last_name,
      gender,
      email,
      phone,
      address,
    } = req.body;

    const errors = {};

    if (!first_name?.trim())
      errors.first_name = "First name is required";

    if (!last_name?.trim())
      errors.last_name = "Last name is required";

    if (!["male", "female", "other"].includes(gender))
      errors.gender = "Invalid gender";

    if (!email?.trim()) {
      errors.email = "Email is required";
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

      if (!emailRegex.test(email.trim())) {
        errors.email = "Invalid email address";
      }
    }

    if (phone && !/^[0-9+\-\s()]{7,20}$/.test(phone.trim())) {
      errors.phone = "Invalid phone number";
    }

    if (Object.keys(errors).length) {
      return res.status(400).json({ errors });
    }

    const reader = await db
      .prepare(
        `
        SELECT id
        FROM users
        WHERE id = ?
          AND role = 'reader'
      `
      )
      .get(id);

    if (!reader) {
      return res.status(404).json({
        message: "Reader not found",
      });
    }

    const existing = await db
      .prepare(
        `
        SELECT id
        FROM users
        WHERE (email = ? OR phone = ?)
          AND id != ?
      `
      )
      .get(
        email.trim(),
        phone?.trim() || null,
        id
      );

    if (existing) {
      return res.status(400).json({
        message: "Email or phone already exists",
      });
    }

    await db.prepare(
      `
      UPDATE users
      SET
        first_name = ?,
        last_name = ?,
        gender = ?,
        email = ?,
        phone = ?,
        address = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
      `
    ).run(
      first_name.trim(),
      last_name.trim(),
      gender,
      email.trim(),
      phone?.trim() || null,
      address?.trim() || null,
      id
    );

    res.json({
      message: "Reader updated successfully",
    });
  } catch (err) {
    console.error("Update reader error:", err);

    res.status(500).json({
      message: "Failed to update reader",
    });
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
        errors
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
            resource_type: "image"
          },
          (err, result) => {
            if (err) return reject(err);
            resolve(result);
          }
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

    await db.prepare(`
      UPDATE users SET
        first_name=?,
        last_name=?,
        gender=?,
        phone=?,
        address=?,
        profile_image=?,
        profile_image_public_id=?
      WHERE id=?
    `).run(
      first_name.trim(),
      last_name.trim(),
      gender,
      phone,
      address.trim(),
      profileImage,
      profilePublicId,
      userId
    );

    res.json({ message: "Profile updated successfully" });

  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Failed to update profile" });
  }
};

exports.changePassword = async (req, res) => {
  try {

    const {
      currentPassword,
      password,
      confirmPassword
    } = req.body;


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



    const user = await db.prepare(`
      SELECT *
      FROM users
      WHERE id = ?
    `).get(req.session.user.id);



    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }



    const currentPasswordMatch =
      await bcrypt.compare(
        currentPassword,
        user.password
      );


    if (!currentPasswordMatch) {
      return res.status(400).json({
        message: "Current password is incorrect",
      });
    }



    const samePassword =
      await bcrypt.compare(
        password,
        user.password
      );


    if (samePassword) {
      return res.status(400).json({
        message:
          "New password cannot be the same as current password",
      });
    }



    const hashedPassword =
      await bcrypt.hash(password, 10);



    await db.prepare(`
      UPDATE users
      SET
        password = ?,
        must_change_password = 0,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(
      hashedPassword,
      user.id
    );



    const changedAt =
      new Date().toLocaleString(
        "en-US",
        {
          dateStyle: "long",
          timeStyle: "short",
        }
      );

    await transporter.sendMail({

      to: user.email,

      subject:
        "Your Kaiser Library Password Has Been Changed",

      html:`

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

`

    });

    return res.json({
      message:
        "Password changed successfully",
    });


  } catch (error) {

    console.error(
      "Change password error:",
      error
    );


    return res.status(500).json({
      message:
        "Server error",
    });

  }
};