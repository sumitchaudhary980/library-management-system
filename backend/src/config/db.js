require("dotenv").config();

if (process.env.NODE_ENV === "production") {
  const { connect } = require("@tursodatabase/serverless");

  const turso = connect({
    url: process.env.TURSO_DATABASE_URL,
    authToken: process.env.TURSO_AUTH_TOKEN,
  });

  const db = {
    prepare(sql) {
      return {
        async get(...params) {
          const result = await turso.execute({
            sql,
            args: params,
          });

          return result.rows[0];
        },

        async all(...params) {
          const result = await turso.execute({
            sql,
            args: params,
          });

          return result.rows;
        },

        async run(...params) {
          return await turso.execute({
            sql,
            args: params,
          });
        },
      };
    },
  };

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