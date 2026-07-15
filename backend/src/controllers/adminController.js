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


// get fine users
exports.getFineUsers = (req, res) => {

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



    const users = db.prepare(`

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
                    WHEN bb.fine_paid = 0
                    AND bb.fine_amount > 0
                    THEN bb.id
                    END
                ) AS unpaid_books,


                COALESCE(
                    SUM(
                        CASE
                        WHEN bb.fine_paid = 0
                        AND bb.fine_amount > 0
                        THEN bb.fine_amount
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

// get readers
exports.getReaders = (req, res) => {
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

    const total = db
      .prepare(
        `
        SELECT COUNT(*) AS total
        FROM users
        ${where}
      `
      )
      .get(...params).total;

    const readers = db
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
//get borrow history
exports.getBorrowHistory = (req, res) => {
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

        const user = db.prepare(`
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
        const totalBorrowedBooks = db.prepare(`
            SELECT COUNT(*) AS total
            FROM borrowed_books
            WHERE user_id = ?
        `).get(userId).total;

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
        const total = db.prepare(`
            SELECT COUNT(*) AS total
            FROM borrowed_books bb
            INNER JOIN books b
                ON bb.book_id = b.id
            LEFT JOIN authors a
                ON b.author_id = a.id
            ${where}
        `).get(...params).total;

        // Fetch paginated records
        const books = db.prepare(`
            SELECT
                bb.id,

                b.title,
                b.cover_image,

                a.name AS author,

                bb.borrowed_at,
                bb.due_date,

                COALESCE(bb.fine_amount,0) AS fine_amount,
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
exports.returnBook = (req, res) => {

  const borrowedId = parseInt(req.params.id);


  try {

    const borrowed = db.prepare(`
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