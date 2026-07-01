const Database = require("better-sqlite3");
const path = require("path");

const dbPath = path.join(
    __dirname,
    "../database/kaiserlibrary.sqlite"
);

const db = new Database(dbPath);

console.log("SQLite connected");

module.exports = db;