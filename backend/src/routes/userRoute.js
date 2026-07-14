const express = require('express');
const { requireReader, requireAdmin } = require('../middleware/authMiddleware');
const userController = require("../controllers/userController");
const upload = require("../middleware/uploadMiddleware");
const router = express.Router();

// All user pages protected by requireReader
router.get("/home", requireReader, userController.getHomeData);


//Book Route
router.get("/books", requireReader, userController.getBooks);
router.get("/books/:id", requireReader, userController.getBook);
router.post("/books/:id/borrow", requireReader, userController.borrowBook);

//Borrowed Books Route
router.get("/borrowed-books", requireReader, userController.getBorrowedBooks);
router.put("/borrowed-books/:id/renew",requireReader,userController.renewBook);
router.put("/borrowed-books/:id/return", requireAdmin,userController.returnBook);

//borrow History Route
router.get("/borrow-history", requireReader, userController.getBorrowHistory);

//fine Route
router.get("/fines",requireReader,userController.getFines);

router.put("/fines/:id/pay", requireReader,userController.payFine);
//PROFILE ROUTE
router.get("/profile", requireReader, userController.getProfile);
router.put("/profile", requireReader, upload.single("profileImage"), userController.updateProfile);
module.exports = router;

module.exports = router;