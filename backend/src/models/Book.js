const db = require("../config/db");

const createBookTable = async () => {
  await db.exec(`
    CREATE TABLE IF NOT EXISTS books (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      author_id INTEGER NOT NULL,
      genre_id INTEGER NOT NULL,
      description TEXT,
      stock_quantity INTEGER NOT NULL DEFAULT 0,
      cover_image TEXT,
      cover_public_id TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (author_id) REFERENCES authors(id) ON DELETE CASCADE,
      FOREIGN KEY (genre_id) REFERENCES genres(id) ON DELETE CASCADE
    );
  `);

  // Add description column if it doesn't exist
  const columns = await db.prepare(`PRAGMA table_info(books)`).all();
  const hasDescription = columns.some(
    (column) => column.name === "description"
  );

  if (!hasDescription) {
    await db.exec(`
      ALTER TABLE books
      ADD COLUMN IF NOT EXISTS description TEXT;
    `);

    console.log("Added 'description' column to books table.");
  }

  await db.exec(`
    CREATE TRIGGER IF NOT EXISTS update_books_updated_at
    AFTER UPDATE ON books
    FOR EACH ROW
    BEGIN
      UPDATE books
      SET updated_at = CURRENT_TIMESTAMP
      WHERE id = OLD.id;
    END;
  `);
};

module.exports = {
  createBookTable,
};