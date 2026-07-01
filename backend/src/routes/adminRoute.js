const express = require("express");
const { requireAdmin } = require("../middleware/authMiddleware");
const deviceGate = require("../middleware/deviceGate");
const adminController = require("../controllers/adminController");

const router = express.Router();

// AUTHORS
router.get("/authors", deviceGate, requireAdmin, adminController.getAuthors);
router.post("/authors", deviceGate, requireAdmin, adminController.createAuthor);
router.get("/authors/:id", deviceGate, requireAdmin, adminController.getAuthor);
router.put("/authors/:id", deviceGate, requireAdmin, adminController.updateAuthor);
router.delete("/authors/:id", deviceGate, requireAdmin, adminController.deleteAuthor);

// GENRES 
router.get("/genres", deviceGate, requireAdmin, adminController.getGenres);
router.post("/genres", deviceGate, requireAdmin, adminController.createGenre);
router.get("/genres/:id", deviceGate, requireAdmin, adminController.getGenre);
router.put("/genres/:id", deviceGate, requireAdmin, adminController.updateGenre);
router.delete("/genres/:id", deviceGate, requireAdmin, adminController.deleteGenre);

module.exports = router;