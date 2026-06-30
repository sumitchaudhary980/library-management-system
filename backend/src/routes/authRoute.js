const express = require("express");
const { login, logout, getSession } = require("../controllers/authController");
const { requireAdmin } = require("../middleware/authMiddleware");
const router = express.Router();

router.post("/login", login);
router.post("/logout", logout);
router.get("/me", getSession); // check active session from any page


module.exports = router;
