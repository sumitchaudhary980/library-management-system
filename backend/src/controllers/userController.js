const cloudinary = require("../config/cloudinary");
const streamifier = require("streamifier");
const db = require("../config/db");

//Home
exports.getHomeData = (req, res) => {
  const userId = req.session.user.id;

  try {

    const user = db.prepare(`
      SELECT first_name
      FROM users
      WHERE id = ?
    `).get(userId);


    const borrowedBooks = db.prepare(`
      SELECT COUNT(*) AS total
      FROM borrowed_books
      WHERE
        user_id = ?
        AND returned = 0
    `).get(userId).total;


    const returnedBooks = db.prepare(`
      SELECT COUNT(*) AS total
      FROM borrowed_books
      WHERE
        user_id = ?
        AND returned = 1
    `).get(userId).total;


    const dueBooks = db.prepare(`
      SELECT COUNT(*) AS total
      FROM borrowed_books
      WHERE
        user_id = ?
        AND returned = 0
        AND DATE(due_date) <= DATE('now', '+3 day')
    `).get(userId).total;


    const fineAmount = db.prepare(`
      SELECT COALESCE(SUM(fine_amount), 0) AS total
      FROM borrowed_books
      WHERE
        user_id = ?
        AND fine_paid = 0
    `).get(userId).total;


    res.json({
      firstName: user.first_name,
      borrowedBooks,
      returnedBooks,
      dueBooks,
      fineAmount
    });


  } catch (err) {

    console.log(err);

    res.status(500).json({
      message: "Failed to load dashboard"
    });

  }
};
//Books
exports.getBooks = (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = 10;

  const title = req.query.title || "";
  const author = req.query.author || "";
  const genre = req.query.genre || "";

  const offset = (page - 1) * limit;

  try {
    const total = db.prepare(`
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
    ).total;

    const books = db.prepare(`
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

exports.getBook = (req, res) => {
  const id = req.params.id;

  try {
    const book = db.prepare(`
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
    `).get(id);

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

exports.getProfile = (req, res) => {
  try {
    const user = db.prepare(`
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


//borrow book
exports.borrowBook = (req, res) => {
  const userId = req.session.user.id;
  const bookId = parseInt(req.params.id);

  try {
    const book = db
      .prepare(
        `
        SELECT id, stock_quantity
        FROM books
        WHERE id = ?
      `
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

    const borrowed = db
      .prepare(
        `
        SELECT id
        FROM borrowed_books
        WHERE
          user_id = ?
          AND book_id = ?
          AND returned = 0
      `
      )
      .get(userId, bookId);

    if (borrowed) {
      return res.status(400).json({
        message: "You have already borrowed this book.",
      });
    }

    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 7);

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
      `
      ).run(userId, bookId, dueDate.toISOString());

      db.prepare(
        `
        UPDATE books
        SET stock_quantity = stock_quantity - 1
        WHERE id = ?
      `
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
exports.getBorrowedBooks = (req, res) => {
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

    const totalParams = [
      userId,
      `%${title}%`
    ];

    if (borrowedFrom) {
      totalParams.push(borrowedFrom);
    }

    if (borrowedTo) {
      totalParams.push(borrowedTo);
    }

    const total = db
      .prepare(totalQuery)
      .get(...totalParams)
      .total;

    // FETCH BOOKS

    const booksQuery = `
      SELECT
        borrowed_books.id AS borrowed_id,
        borrowed_books.borrowed_at,
        borrowed_books.due_date,
        borrowed_books.renewed,

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

    const booksParams = [
      userId,
      `%${title}%`
    ];

    if (borrowedFrom) {
      booksParams.push(borrowedFrom);
    }

    if (borrowedTo) {
      booksParams.push(borrowedTo);
    }

    booksParams.push(limit);
    booksParams.push(offset);

    const books = db
      .prepare(booksQuery)
      .all(...booksParams);

    const today = new Date();

    const formattedBooks = books.map(book => {

      const dueDate = new Date(book.due_date);

      const remainingDays = Math.ceil(
        (dueDate - today) / (1000 * 60 * 60 * 24)
      );

      return {
        ...book,
        remaining_days: remainingDays
      };

    });

    res.json({
      books: formattedBooks,
      total,
      page,
      totalPages: Math.ceil(total / limit)
    });

  } catch (err) {

    console.log(err);

    res.status(500).json({
      message: "Server error"
    });

  }
};

//renew borrowed book
exports.renewBook = (req, res) => {
  const userId = req.session.user.id;
  const borrowedId = parseInt(req.params.id);

  try {
    const borrowed = db.prepare(`
      SELECT *
      FROM borrowed_books
      WHERE
        id = ?
        AND user_id = ?
        AND returned = 0
    `).get(borrowedId, userId);

    if (!borrowed) {
      return res.status(404).json({
        message: "Borrowed book not found."
      });
    }

    if (borrowed.renewed) {
      return res.status(400).json({
        message: "This book has already been renewed."
      });
    }

    const dueDate = new Date(borrowed.due_date);
    dueDate.setDate(dueDate.getDate() + 7);

    db.prepare(`
      UPDATE borrowed_books
      SET
        due_date = ?,
        renewed = 1
      WHERE id = ?
    `).run(
      dueDate.toISOString(),
      borrowedId
    );

    res.json({
      message: "Book renewed successfully."
    });

  } catch (err) {
    console.log(err);

    res.status(500).json({
      message: "Failed to renew book."
    });
  }
};

//return borrowed book
exports.returnBook = (req, res) => {
  const userId = req.session.user.id;
  const borrowedId = parseInt(req.params.id);

  try {

    const borrowed = db.prepare(`
      SELECT *
      FROM borrowed_books
      WHERE
        id = ?
        AND user_id = ?
        AND returned = 0
    `).get(
      borrowedId,
      userId
    );

    if (!borrowed) {
      return res.status(404).json({
        message: "Borrowed book not found."
      });
    }

    // Calculate fine (Rs. 10/day after due date)
    const today = new Date();
    const dueDate = new Date(borrowed.due_date);

    let overdueDays = Math.ceil(
      (today - dueDate) / (1000 * 60 * 60 * 24)
    );

    if (overdueDays < 0) {
      overdueDays = 0;
    }

    const fineAmount = overdueDays * 10;

    const transaction = db.transaction(() => {

      db.prepare(`
  UPDATE borrowed_books
  SET
    returned = 1,
    returned_at = CURRENT_TIMESTAMP,
    fine_amount = ?,
    fine_paid = 0
  WHERE id = ?
`).run(
        fineAmount,
        borrowedId
      );

      db.prepare(`
        UPDATE books
        SET stock_quantity = stock_quantity + 1
        WHERE id = ?
      `).run(borrowed.book_id);

    });

    transaction();

    res.json({
      message: "Book returned successfully.",
      fine: fineAmount
    });

  } catch (err) {

    console.log(err);

    res.status(500).json({
      message: "Failed to return book."
    });

  }
};

// get borrow history
exports.getBorrowHistory = (req, res) => {
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

  const params = [
    userId,
    `%${title}%`
  ];

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

    const total = db.prepare(`
      SELECT COUNT(*) AS total
      FROM borrowed_books

      INNER JOIN books
        ON borrowed_books.book_id = books.id

      INNER JOIN authors
        ON books.author_id = authors.id

      INNER JOIN genres
        ON books.genre_id = genres.id

      WHERE ${whereClause}
    `).get(...params).total;

    const books = db.prepare(`
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
    `).all(
      ...params,
      limit,
      offset
    );

    res.json({
      books,
      total,
      page,
      totalPages: Math.ceil(total / limit)
    });

  } catch (err) {

    console.error(err);

    res.status(500).json({
      message: "Failed to load borrow history"
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

    const user = db.prepare(`SELECT * FROM users WHERE id=?`).get(userId);

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

    db.prepare(`
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