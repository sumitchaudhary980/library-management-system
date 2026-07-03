const express = require("express");
const { requireAdmin } = require("../middleware/authMiddleware");
const deviceGate = require("../middleware/deviceGate");
const adminController = require("../controllers/adminController");
const upload = require("../middleware/uploadMiddleware");

const router = express.Router();

// DASHBOARD
router.get("/dashboard", deviceGate, requireAdmin, adminController.getDashboardData);

// AUTHORS
router.get("/authors", deviceGate, requireAdmin, adminController.getAuthors);
router.get("/authors/all", deviceGate, requireAdmin, adminController.getAllAuthors);

router.post("/authors", deviceGate, requireAdmin, adminController.createAuthor);
router.get("/authors/:id", deviceGate, requireAdmin, adminController.getAuthor);
router.put("/authors/:id", deviceGate, requireAdmin, adminController.updateAuthor);
router.delete("/authors/:id", deviceGate, requireAdmin, adminController.deleteAuthor);

// GENRES 
router.get("/genres", deviceGate, requireAdmin, adminController.getGenres);
router.get("/genres/all", deviceGate, requireAdmin, adminController.getAllGenres);
router.post("/genres", deviceGate, requireAdmin, adminController.createGenre);
router.get("/genres/:id", deviceGate, requireAdmin, adminController.getGenre);
router.put("/genres/:id", deviceGate, requireAdmin, adminController.updateGenre);
router.delete("/genres/:id", deviceGate, requireAdmin, adminController.deleteGenre);


// BOOKS
router.get("/books", deviceGate, requireAdmin, adminController.getBooks);
router.post("/books", deviceGate, requireAdmin, upload.single("cover"), adminController.createBook);
router.get("/books/:id", deviceGate, requireAdmin, adminController.getBook);
router.put("/books/:id", deviceGate, requireAdmin, upload.single("cover"), adminController.updateBook);
router.delete("/books/:id", deviceGate, requireAdmin, adminController.deleteBook);
module.exports = router;