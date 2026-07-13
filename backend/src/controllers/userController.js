const cloudinary = require("../config/cloudinary");
const streamifier = require("streamifier");
const db = require("../config/db");

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
  const author = req.query.author || "";
  const genre = req.query.genre || "";

  const offset = (page - 1) * limit;

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
      WHERE
        borrowed_books.user_id = ?
        AND borrowed_books.returned = 0
        AND books.title LIKE ?
        AND authors.name LIKE ?
        AND genres.name LIKE ?
    `).get(
      userId,
      `%${title}%`,
      `%${author}%`,
      `%${genre}%`
    ).total;

    const books = db.prepare(`
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
        AND authors.name LIKE ?
        AND genres.name LIKE ?

      ORDER BY borrowed_books.borrowed_at DESC

      LIMIT ?
      OFFSET ?
    `).all(
      userId,
      `%${title}%`,
      `%${author}%`,
      `%${genre}%`,
      limit,
      offset
    );

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