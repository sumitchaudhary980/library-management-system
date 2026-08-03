require("dotenv").config();

if (process.env.NODE_ENV === "production") {
  const { connect } = require("@tursodatabase/serverless");

  const db = connect({
    url: process.env.TURSO_DATABASE_URL,
    authToken: process.env.TURSO_AUTH_TOKEN,
  });

  console.log("Connected to Turso");

  module.exports = db;
} else {
  const Database = require("better-sqlite3");
  const path = require("path");
  const fs = require("fs");

  const dbDir = path.join(__dirname, "..", "database");

  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }

  const dbPath = path.join(dbDir, "kaiserlibrary.sqlite");

  const db = new Database(dbPath);

  console.log("Connected to SQLite:", dbPath);

  module.exports = db;
}