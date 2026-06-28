const express = require("express");
const path = require("path");
const { requireAdmin, requireReader } = require("../middleware/authMiddleware");

const router = express.Router();
const frontendPath = path.join(__dirname, "../../../frontend");

router.get("/", (req, res) => {
  res.sendFile(path.join(frontendPath, "index.html"));
});

// Admin login — public but skip if already logged in
router.get("/admin/login", (req, res) => {
  if (req.session.user?.role === "admin") return res.redirect("/dashboard");
  res.sendFile(path.join(frontendPath, "admin/login.html"));
});

// User login — public but skip if already logged in
router.get("/login", (req, res) => {
  if (req.session.user?.role === "reader")
    return res.redirect("/user/dashboard");
  res.sendFile(path.join(frontendPath, "user/login.html"));
});

// Dashboards — protected, live at root level URLs
router.get("/dashboard", requireAdmin, (req, res) => {
  res.sendFile(path.join(frontendPath, "admin/dashboard.html"));
});

router.get("/user/dashboard", requireReader, (req, res) => {
  res.sendFile(path.join(frontendPath, "user/dashboard.html"));
});

module.exports = router;
