const express = require("express");
const { login, logout, getSession } = require("../controllers/authController");
const { requireAdmin } = require("../middleware/authMiddleware");
const router = express.Router();

// routes
router.post(
    "/admin/login",
    (req, res, next) => {
        req.loginRole = "admin";
        next();
    },
    login
);

router.post(
    "/login",
    (req, res, next) => {
        req.loginRole = "reader";
        next();
    },
    login
);
router.post("/logout", logout);
router.get("/me", getSession);


module.exports = router;
