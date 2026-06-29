const db = require("../config/db");

const createAuthorTable = () => {
  db.exec(`
    CREATE TABLE IF NOT EXISTS authors (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      biography TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  db.exec(`
    CREATE TRIGGER IF NOT EXISTS update_authors_updated_at
    AFTER UPDATE ON authors
    FOR EACH ROW
    BEGIN
      UPDATE authors
      SET updated_at = CURRENT_TIMESTAMP
      WHERE id = OLD.id;
    END;
  `);

  // console.log("Authors table created or already exists.");
};

module.exports = { createAuthorTable };