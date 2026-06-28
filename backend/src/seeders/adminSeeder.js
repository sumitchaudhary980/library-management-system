const db = require("../config/db");
const bcrypt = require("bcrypt");

const createAdmin = async () => {
  const admin = db
    .prepare("SELECT * FROM users WHERE email = ?")
    .get("jaiswalsumit1010@gmail.com");

  if (!admin) {
    const hashedPassword = await bcrypt.hash("Herald@12345", 10);

    db.prepare(
      `
      INSERT INTO users
      (
        first_name,
        last_name,
        email,
        phone,
        password,
        role,
        address
      )
      VALUES (?,?,?,?,?,?,?)
    `,
    ).run(
      "Sumit",
      "Chaudhary",
      "jaiswalsumit1010@gmail.com",
      "9704181697",
      hashedPassword,
      "admin",
      "Library",
    );

    console.log("Admin created");
  } else {
    console.log("Admin already exists");
  }
};

module.exports = createAdmin;
