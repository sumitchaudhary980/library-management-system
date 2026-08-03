const db = require("../config/db");

const createUserTable = async () => {
  await db.exec(`
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
      must_change_password INTEGER NOT NULL DEFAULT 1,
      reset_token TEXT,
      reset_token_expires DATETIME,
      address TEXT,
      profile_image TEXT,
      profile_image_public_id TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  const result = await db.execute("PRAGMA table_info(users)");
  const columns = result.rows;
  // Status column
  if (!columns.some((column) => column.name === "status")) {
    await db.exec(`
      ALTER TABLE users
      ADD COLUMN status TEXT NOT NULL DEFAULT 'active';
    `);
  }

  // Must change password column
  if (!columns.some((column) => column.name === "must_change_password")) {
    await db.exec(`
      ALTER TABLE users
      ADD COLUMN must_change_password INTEGER NOT NULL DEFAULT 1;
    `);
  }

  // Reset token column
  if (!columns.some((column) => column.name === "reset_token")) {
    await db.exec(`
      ALTER TABLE users
      ADD COLUMN reset_token TEXT;
    `);
  }

  // Reset token expiry column
  if (!columns.some((column) => column.name === "reset_token_expires")) {
    await db.exec(`
      ALTER TABLE users
      ADD COLUMN reset_token_expires DATETIME;
    `);
  }

  await db.exec(`
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