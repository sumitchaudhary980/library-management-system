const express = require("express");
const { login, logout, getSession } = require("../controllers/authController");
const { requireAdmin } = require("../middleware/authMiddleware");
const authController = require("../controllers/authController");
const router = express.Router();
// routes
router.post("/admin/login", (req, res, next) => { req.loginRole = "admin"; next(); }, login);

router.post("/login", (req, res, next) => { req.loginRole = "reader"; next(); }, login);

router.post("/change-password", authController.changePassword);

router.post("/forgot-password", authController.forgotPassword);

// router.get( "/verify-reset-token",authController.verifyResetToken);
router.post(
    "/reset-password",
    authController.resetPassword
);

router.post("/logout", logout);
router.get("/me", getSession);


module.exports = router;
