const { createAuthorTable } = require("../models/Author");
const { createBookTable } = require("../models/Book");
const { createBorrowedBookTable } = require("../models/BorrowedBook");
const { createApprovedDeviceTable } = require("../models/Device");
const { createFinePaymentTable } = require("../models/FinePayment");
const { createGenreTable } = require("../models/Genre");
const { createUserTable } = require("../models/User");
const { createAdminSeeder } = require("../seeders/adminSeeder");
const { createAuthorSeeder } = require("../seeders/authorSeeder");
const { createBookSeeder } = require("../seeders/bookSeeder");
const { createGenreSeeder } = require("../seeders/genreSeeder");
const { createUserSeeder } = require("../seeders/userSeeder");

// createApprovedDeviceTable();



createUserTable();
createAuthorTable();
createGenreTable();
createBookTable();
createBorrowedBookTable();
createFinePaymentTable();

createAdminSeeder();
createUserSeeder();
createAuthorSeeder();
createGenreSeeder();
createBookSeeder();

console.log("Database initialized");
