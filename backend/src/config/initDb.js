const { createAuthorTable } = require("../models/Author");
const { createUserTable } = require("../models/User");
const { createAdminSeeder } = require("../seeders/adminSeeder");
const { createAuthorSeeder } = require("../seeders/authorSeeder");


createUserTable();
createAuthorTable();


createAdminSeeder();
createAuthorSeeder();

console.log("Database initialized");
