require("dotenv").config();

if (process.env.NODE_ENV === "production") {
  const { createClient } = require("@libsql/client");

  const turso = createClient({
    url: process.env.TURSO_DATABASE_URL,
    authToken: process.env.TURSO_AUTH_TOKEN,
  });

  const db = {
    // better-sqlite3 compatible exec()
    async exec(sql) {
      return await turso.execute(sql);
    },


    // better-sqlite3 compatible prepare()
    prepare(sql) {
      return {
        async get(...params) {
          const result = await turso.execute({
            sql,
            args: params,
          });

          return result.rows[0] || undefined;
        },


        async all(...params) {
          const result = await turso.execute({
            sql,
            args: params,
          });

          return result.rows;
        },


        async run(...params) {
          const result = await turso.execute({
            sql,
            args: params,
          });

          return {
            changes: result.rowsAffected,
            lastInsertRowid: result.lastInsertRowid,
          };
        },
      };
    },


    // better-sqlite3 compatible transaction()
    transaction(callback) {
      return async (...args) => {

        await turso.execute("BEGIN");

        try {

          const result = await callback(...args);

          await turso.execute("COMMIT");

          return result;

        } catch (error) {

          await turso.execute("ROLLBACK");

          throw error;

        }
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
    fs.mkdirSync(dbDir, {
      recursive: true,
    });
  }


  const dbPath = path.join(
    dbDir,
    "kaiserlibrary.sqlite"
  );


  const db = new Database(dbPath);


  console.log("Connected to SQLite:", dbPath);


  module.exports = db;
}