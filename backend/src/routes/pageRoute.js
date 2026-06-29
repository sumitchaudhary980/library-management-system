const express = require("express");
const path = require("path");
const { requireAdmin, requireReader } = require("../middleware/authMiddleware");

const router = express.Router();
const frontendPath = path.join(__dirname, "../../../frontend");

router.get("/", (req, res) => {
  res.sendFile(path.join(frontendPath, "index.html"));
});


// User login — public but skip if already logged in
router.get("/login", (req, res) => {
  if (req.session.user?.role === "reader")
    return res.redirect("/user/dashboard");
  res.sendFile(path.join(frontendPath, "user/login.html"));
});

//User Pages — protected, live at root level URLs
router.get('/home', requireReader, (req, res) => {
  res.sendFile(path.join(frontendPath, 'user/home.html'));
});



// Admin Routes

router.get("/admin/login", (req, res) => {
  if (req.session.user?.role === "admin") return res.redirect("/dashboard");
  res.sendFile(path.join(frontendPath, "admin/login.html"));
});

// Dashboards — protected, live at root level URLs
router.get("/dashboard", requireAdmin, (req, res) => {
  res.sendFile(path.join(frontendPath, "admin/dashboard.html"));
});

router.get('/authors', requireAdmin, (req, res) => {
  res.sendFile(path.join(frontendPath, 'admin/author.html'));
});


module.exports = router;
