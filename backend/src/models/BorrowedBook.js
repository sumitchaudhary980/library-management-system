const db = require("../config/db");

const createBorrowedBookTable = () => {
  db.exec(`
    CREATE TABLE IF NOT EXISTS borrowed_books (
      id INTEGER PRIMARY KEY AUTOINCREMENT,

      user_id INTEGER NOT NULL,
      book_id INTEGER NOT NULL,

      borrowed_at DATETIME DEFAULT CURRENT_TIMESTAMP,

      due_date DATETIME NOT NULL,

      renewed INTEGER DEFAULT 0,

      returned INTEGER DEFAULT 0,

      returned_at DATETIME,

      fine_amount REAL DEFAULT 0,
      fine_paid INTEGER DEFAULT 0,
      fine_paid_at DATETIME,

      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,

      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE CASCADE
    );
  `);
  const columns = db.prepare("PRAGMA table_info(borrowed_books)").all();

  if (!columns.some(column => column.name === "fine_paid_amount")) {
    db.exec(`
    ALTER TABLE borrowed_books
    ADD COLUMN fine_paid_amount REAL NOT NULL DEFAULT 0;
  `);
  }

  // Fine paid amount column
  if (!columns.some((column) => column.name === "fine_paid_amount")) {
    db.exec(`
    ALTER TABLE borrowed_books
    ADD COLUMN fine_paid_amount REAL NOT NULL DEFAULT 0;
  `);
  }

  db.exec(`
    CREATE TRIGGER IF NOT EXISTS update_borrowed_books_updated_at
    AFTER UPDATE ON borrowed_books
    FOR EACH ROW
    BEGIN
      UPDATE borrowed_books
      SET updated_at = CURRENT_TIMESTAMP
      WHERE id = OLD.id;
    END;
  `);
};

module.exports = {
  createBorrowedBookTable,
};