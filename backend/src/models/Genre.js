const db = require("../config/db");

const createGenreTable = () => {
  db.exec(`
    CREATE TABLE IF NOT EXISTS genres (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  db.exec(`
    CREATE TRIGGER IF NOT EXISTS update_genres_updated_at
    AFTER UPDATE ON genres
    FOR EACH ROW
    BEGIN
      UPDATE genres
      SET updated_at = CURRENT_TIMESTAMP
      WHERE id = OLD.id;
    END;
  `);
};

module.exports = {
  createGenreTable
};