const express = require("express");
const { requireAdmin } = require("../middleware/authMiddleware");
const adminController = require("../controllers/adminController");

const router = express.Router();

// AUTHORS
router.get("/authors", requireAdmin, adminController.getAuthors);
router.post("/authors", requireAdmin, adminController.createAuthor);
router.get("/authors/:id", requireAdmin, adminController.getAuthor);
router.put("/authors/:id", requireAdmin, adminController.updateAuthor);
router.delete("/authors/:id", requireAdmin, adminController.deleteAuthor);

// GENRES 
router.get("/genres", requireAdmin, adminController.getGenres);
router.post("/genres", requireAdmin, adminController.createGenre);
router.get("/genres/:id", requireAdmin, adminController.getGenre);
router.put("/genres/:id", requireAdmin, adminController.updateGenre);
router.delete("/genres/:id", requireAdmin, adminController.deleteGenre);

module.exports = router;