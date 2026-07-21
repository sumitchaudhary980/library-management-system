const db = require("../config/db");

const createUserTable = () => {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      first_name TEXT NOT NULL,
      last_name TEXT NOT NULL,
      gender TEXT CHECK(gender IN ('male', 'female', 'other')) NOT NULL,
      email TEXT UNIQUE NOT NULL,
      phone TEXT UNIQUE,
      password TEXT NOT NULL,
      role TEXT DEFAULT 'reader',
      status TEXT NOT NULL DEFAULT 'active'
        CHECK(status IN ('active', 'inactive')),
      address TEXT,
      profile_image TEXT,
      profile_image_public_id TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Add status column to existing databases (runs only once)
  const columns = db.prepare(`PRAGMA table_info(users)`).all();

  const hasStatus = columns.some((column) => column.name === "status");

  if (!hasStatus) {
    db.exec(`
      ALTER TABLE users
      ADD COLUMN status TEXT NOT NULL DEFAULT 'active';
    `);
  }
  // Add must_change_password column to existing databases
  const hasMustChangePassword = columns.some(
    (column) => column.name === "must_change_password"
  );

  if (!hasMustChangePassword) {
    db.exec(`
    ALTER TABLE users
    ADD COLUMN must_change_password INTEGER NOT NULL DEFAULT 1;
  `);
  }

  db.exec(`
    CREATE TRIGGER IF NOT EXISTS update_users_updated_at
    AFTER UPDATE ON users
    FOR EACH ROW
    BEGIN
      UPDATE users
      SET updated_at = CURRENT_TIMESTAMP
      WHERE id = OLD.id;
    END;
  `);
};

module.exports = {
  createUserTable,
};