// const db = require("../config/db");

// const createUserTable = () => {
//   db.exec(`
//         CREATE TABLE IF NOT EXISTS users (
//             id INTEGER PRIMARY KEY AUTOINCREMENT,
//             name TEXT NOT NULL,
//             email TEXT UNIQUE NOT NULL,
//             phone TEXT UNIQUE,
//             password TEXT NOT NULL,
//             role TEXT DEFAULT 'reader',
//             address TEXT,
//             profile_image TEXT,
//             created_at DATETIME DEFAULT CURRENT_TIMESTAMP
//         )
//     `);
// };

// createUserTable();

// module.exports = db;
