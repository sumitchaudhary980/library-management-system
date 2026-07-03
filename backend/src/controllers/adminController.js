const cloudinary = require("../config/cloudinary");
const streamifier = require("streamifier");
const db = require("../config/db");

exports.getDashboardData = (req, res) => {
  try {
    const totalAuthors = db.prepare(`SELECT COUNT(*) AS total FROM authors`).get().total;
    const totalGenres = db.prepare(`SELECT COUNT(*) AS total FROM genres`).get().total;
    const totalBooks = db.prepare(`SELECT COUNT(*) AS total FROM books`).get().total;

    res.json({
      totalAuthors,
      totalGenres,
      totalBooks
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({
      message: "Failed to load dashboard data"
    });
  }
};

exports.getAllAuthors = (req, res) => {
  try {
    const authors = db
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

exports.getAuthors = (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = 10;
  const search = req.query.search || "";
  const offset = (page - 1) * limit;

  try {
    const total = db
      .prepare(`SELECT COUNT(*) AS total FROM authors WHERE name LIKE ?`)
      .get(`%${search}%`).total;

    const authors = db
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

exports.createAuthor = (req, res) => {
  const { name, biography } = req.body;

  if (!name || !name.trim()) {
    return res.status(400).json({ message: "Author name is required" });
  }

  try {
    const result = db
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

exports.getAuthor = (req, res) => {
  const id = req.params.id;

  try {
    const author = db.prepare(`SELECT * FROM authors WHERE id = ?`).get(id);

    if (!author) {
      return res.status(404).json({ message: "Author not found" });
    }

    res.json(author);
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.updateAuthor = (req, res) => {
  const id = req.params.id;
  let { name, biography } = req.body;

  if (!name || !name.trim()) {
    return res.status(400).json({ message: "Author name is required" });
  }

  try {
    const result = db
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

exports.deleteAuthor = (req, res) => {
  const id = req.params.id;

  try {
    const result = db.prepare(`DELETE FROM authors WHERE id = ?`).run(id);

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
exports.getAllGenres = (req, res) => {
  try {
    const genres = db
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
exports.getGenres = (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = 10;
  const search = req.query.search || "";
  const offset = (page - 1) * limit;

  try {
    const total = db
      .prepare(`SELECT COUNT(*) AS total FROM genres WHERE name LIKE ?`)
      .get(`%${search}%`).total;

    const genres = db
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
exports.createGenre = (req, res) => {
  const { name } = req.body;

  if (!name || !name.trim()) {
    return res.status(400).json({ message: "Genre name is required" });
  }

  try {
    const result = db
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
exports.getGenre = (req, res) => {
  const id = req.params.id;

  try {
    const genre = db
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
exports.updateGenre = (req, res) => {
  const id = req.params.id;
  const { name } = req.body;

  if (!name || !name.trim()) {
    return res.status(400).json({ message: "Genre name is required" });
  }

  try {
    const result = db
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
exports.deleteGenre = (req, res) => {
  const id = req.params.id;

  try {
    const result = db
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
    const author = db
      .prepare(`SELECT id FROM authors WHERE id = ?`)
      .get(authorId);

    if (!author) {
      return res.status(400).json({
        errors: {
          authorId: "Author is required",
        },
      });
    }

    const genre = db
      .prepare(`SELECT id FROM genres WHERE id = ?`)
      .get(genreId);

    if (!genre) {
      return res.status(400).json({
        errors: {
          genreId: "Genre is required",
        },
      });
    }

    const duplicate = db
      .prepare(
        `
        SELECT id FROM books
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

    const result = db
      .prepare(
        `
        INSERT INTO books (
          title,
          author_id,
          genre_id,
          stock_quantity,
          cover_image,
          cover_public_id
        ) VALUES (?, ?, ?, ?, ?, ?)
      `
      )
      .run(
        title.trim(),
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

    const existingBook = db.prepare(`
      SELECT *
      FROM books
      WHERE id = ?
    `).get(id);

    if (!existingBook) {
      return res.status(404).json({
        message: "Book not found",
      });
    }

    const author = db.prepare(`
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

    const genre = db.prepare(`
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

    const duplicate = db.prepare(`
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

    db.prepare(`
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
    const book = db
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

    db.prepare(`DELETE FROM books WHERE id = ?`).run(id);

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

// profile
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