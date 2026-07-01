const express = require("express");
const path = require("path");
const { requireAdmin } = require("../middleware/authMiddleware");
const adminController = require("../controllers/adminController");

const router = express.Router();

const frontendPath = path.join(__dirname, "../../../frontend");

router.get("/authors", requireAdmin, adminController.getAuthors);
router.post("/authors", requireAdmin, adminController.createAuthor);
router.get("/authors/:id", requireAdmin, adminController.getAuthor);

router.put("/authors/:id", requireAdmin, adminController.updateAuthor);
router.delete("/authors/:id", requireAdmin, adminController.deleteAuthor);

module.exports = router;
