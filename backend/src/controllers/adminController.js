const db = require("../config/db");

exports.getAuthors = (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = 10;
  const offset = (page - 1) * limit;

  try {
    const total = db
      .prepare("SELECT COUNT(*) AS total FROM authors")
      .get().total;

    const authors = db
      .prepare(
        `
        SELECT *
        FROM authors
        ORDER BY id DESC
        LIMIT ? OFFSET ?
      `,
      )
      .all(limit, offset);

    res.json({
      authors,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (err) {
    console.log(err);

    res.status(500).json({
      message: err.message,
    });
  }
};
