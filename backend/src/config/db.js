const Database = require("better-sqlite3");
const path = require("path");
const fs = require("fs");

const dbDir = path.join(__dirname, "..", "database");

// Create the database directory if it doesn't exist
if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
}

const dbPath = path.join(dbDir, "kaiserlibrary.sqlite");

const db = new Database(dbPath);

console.log("SQLite connected at:", dbPath);

module.exports = db;