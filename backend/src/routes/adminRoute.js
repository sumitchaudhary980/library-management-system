const express = require("express");
const path = require("path");
const { requireAdmin } = require("../middleware/authMiddleware");
const adminController = require("../controllers/adminController");

const router = express.Router();

const frontendPath = path.join(__dirname, "../../../frontend");

router.get("/authors", requireAdmin, adminController.getAuthors);

router.delete("/authors/:id", requireAdmin, adminController.deleteAuthor);

module.exports = router;
