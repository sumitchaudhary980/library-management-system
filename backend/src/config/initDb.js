const { createAuthorTable } = require("../models/Author");
const { createUserTable } = require("../models/User");


createUserTable();
createAuthorTable();

console.log("Database initialized");
