const express = require("express");
const { requireAdmin } = require("../middleware/authMiddleware");
// const deviceGate = require("../middleware/deviceGate");
const adminController = require("../controllers/adminController");
const upload = require("../middleware/uploadMiddleware");

const router = express.Router();

// DASHBOARD
router.get("/dashboard", requireAdmin, adminController.getDashboardData);

// AUTHORS
router.get("/authors", requireAdmin, adminController.getAuthors);
router.get("/authors/all", requireAdmin, adminController.getAllAuthors);

router.post("/authors", requireAdmin, adminController.createAuthor);
router.get("/authors/:id", requireAdmin, adminController.getAuthor);
router.put("/authors/:id", requireAdmin, adminController.updateAuthor);
router.delete("/authors/:id", requireAdmin, adminController.deleteAuthor);

// GENRES 
router.get("/genres", requireAdmin, adminController.getGenres);
router.get("/genres/all", requireAdmin, adminController.getAllGenres);
router.post("/genres", requireAdmin, adminController.createGenre);
router.get("/genres/:id", requireAdmin, adminController.getGenre);
router.put("/genres/:id", requireAdmin, adminController.updateGenre);
router.delete("/genres/:id", requireAdmin, adminController.deleteGenre);


// BOOKS
router.get("/books", requireAdmin, adminController.getBooks);
router.post("/books", requireAdmin, upload.single("cover"), adminController.createBook);
router.get("/books/:id", requireAdmin, adminController.getBook);
router.put("/books/:id", requireAdmin, upload.single("cover"), adminController.updateBook);
router.delete("/books/:id", requireAdmin, adminController.deleteBook);


// FINES
router.get("/fines", requireAdmin, adminController.getFineUsers);
router.get("/borrow-history/:userId",requireAdmin,adminController.getBorrowHistory);
router.put( "/fines/:id/pay", requireAdmin, adminController.payFine);
router.put("/return-book/:id", requireAdmin,adminController.returnBook);

// READERS
router.get("/readers", requireAdmin, adminController.getReaders);
router.get("/readers/:id", requireAdmin, adminController.getReader);
router.put("/readers/:id/status",requireAdmin, adminController.toggleReaderStatus);
router.post("/readers", requireAdmin, adminController.createReader);
router.put("/readers/:id", requireAdmin, adminController.updateReader);
// PROFILE
router.get("/profile", requireAdmin, adminController.getProfile);
router.put("/profile", requireAdmin, upload.single("profileImage"), adminController.updateProfile);

router.post("/change-password", requireAdmin, adminController.changePassword);


module.exports = router;