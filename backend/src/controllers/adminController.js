const cloudinary = require("../config/cloudinary");
const streamifier = require("streamifier");
const db = require("../config/db");


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

  if (!title || !title.trim()) {
    return res.status(400).json({
      message: "Book title is required",
    });
  }

  if (!authorId) {
    return res.status(400).json({
      message: "Author is required",
    });
  }

  if (!genreId) {
    return res.status(400).json({
      message: "Genre is required",
    });
  }

  if (stock === undefined || stock === "") {
    return res.status(400).json({
      message: "Stock quantity is required",
    });
  }

  const stockQuantity = parseInt(stock);

  if (Number.isNaN(stockQuantity) || stockQuantity < 0) {
    return res.status(400).json({
      message: "Stock quantity must be 0 or greater",
    });
  }

  if (!req.file) {
    return res.status(400).json({
      message: "Cover image is required",
    });
  }

  try {
    const author = db
      .prepare(`SELECT id FROM authors WHERE id = ?`)
      .get(authorId);

    if (!author) {
      return res.status(404).json({
        message: "Selected author does not exist",
      });
    }

    const genre = db
      .prepare(`SELECT id FROM genres WHERE id = ?`)
      .get(genreId);

    if (!genre) {
      return res.status(404).json({
        message: "Selected genre does not exist",
      });
    }

    const duplicate = db
      .prepare(`
        SELECT id
        FROM books
        WHERE LOWER(title) = LOWER(?)
        AND author_id = ?
      `)
      .get(title.trim(), authorId);

    if (duplicate) {
      return res.status(400).json({
        message: "Book already exists for this author",
      });
    }

    const uploadResult = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: "kaiser-library/books",
          resource_type: "image",
        },
        (error, result) => {
          if (error) {
            return reject(error);
          }

          resolve(result);
        }
      );

      streamifier
        .createReadStream(req.file.buffer)
        .pipe(uploadStream);
    });

    const result = db
      .prepare(`
        INSERT INTO books
        (
          title,
          author_id,
          genre_id,
          stock_quantity,
          cover_image,
          cover_public_id
        )
        VALUES (?, ?, ?, ?, ?, ?)
      `)
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