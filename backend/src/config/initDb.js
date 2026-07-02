const { createAuthorTable } = require("../models/Author");
const { createBookTable } = require("../models/Book");
const { createApprovedDeviceTable } = require("../models/Device");
const { createGenreTable } = require("../models/Genre");
const { createUserTable } = require("../models/User");
const { createAdminSeeder } = require("../seeders/adminSeeder");
const { createAuthorSeeder } = require("../seeders/authorSeeder");
const { createBookSeeder } = require("../seeders/bookSeeder");
const { createGenreSeeder } = require("../seeders/genreSeeder");

// createApprovedDeviceTable();



// createUserTable();
// createAuthorTable();
// createGenreTable();
// createBookTable();

// createAdminSeeder();
// createAuthorSeeder();
// createGenreSeeder();
// createBookSeeder();

console.log("Database initialized");
