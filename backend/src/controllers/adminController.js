const db = require("../config/db");

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