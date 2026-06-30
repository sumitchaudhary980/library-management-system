const { createAuthorTable } = require("../models/Author");
const { createApprovedDeviceTable } = require("../models/Device");
const { createUserTable } = require("../models/User");
const { createAdminSeeder } = require("../seeders/adminSeeder");
const { createAuthorSeeder } = require("../seeders/authorSeeder");


// createUserTable();
// createAuthorTable();
// createApprovedDeviceTable();

// createAdminSeeder();
// createAuthorSeeder();

console.log("Database initialized");
