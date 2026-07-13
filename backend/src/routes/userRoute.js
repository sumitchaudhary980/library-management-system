const express = require('express');
const { requireReader } = require('../middleware/authMiddleware');
const userController = require("../controllers/userController");
const upload = require("../middleware/uploadMiddleware");
const router = express.Router();

// All user pages protected by requireReader


//Book Route
router.get("/books", requireReader, userController.getBooks);
router.get("/books/:id", requireReader, userController.getBook);

//PROFILE ROUTE
router.get("/profile", requireReader, userController.getProfile);
router.put("/profile", requireReader, upload.single("profileImage"), userController.updateProfile);
module.exports = router;

module.exports = router;