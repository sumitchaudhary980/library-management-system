const express = require("express");
const path = require("path");
const { requireAdmin, requireReader } = require("../middleware/authMiddleware");
const deviceGate = require("../middleware/deviceGate");
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
router.get("/home", requireReader, (req, res) => {
  res.sendFile(path.join(frontendPath, "user/home.html"));
});






// Admin Routes

router.get("/admin/login", deviceGate, (req, res) => {
  if (req.session.user?.role === "admin") return res.redirect("/dashboard");
  res.sendFile(path.join(frontendPath, "admin/login.html"));
});

// Dashboards — protected, live at root level URLs
router.get("/dashboard", deviceGate,requireAdmin, (req, res) => {
  res.sendFile(path.join(frontendPath, "admin/dashboard.html"));
});

router.get("/authors", deviceGate,requireAdmin, (req, res) => {
  res.sendFile(path.join(frontendPath, "admin/author.html"));
});

router.get('/add-author', deviceGate, requireAdmin, (req, res) => {
  res.sendFile(path.join(frontendPath, 'admin/add-author.html'));
});

router.get("/authors/edit/:id", deviceGate, requireAdmin, (req, res) => {
  res.sendFile(path.join(frontendPath, "admin/edit-author.html"));
});

// Genres page
router.get("/genres", deviceGate, requireAdmin, (req, res) => {
  res.sendFile(path.join(frontendPath, "admin/genre.html"));
});

// Add genre page
router.get("/add-genre", deviceGate, requireAdmin, (req, res) => {
  res.sendFile(path.join(frontendPath, "admin/add-genre.html"));
});

router.get("/genres/edit/:id", deviceGate, requireAdmin, (req, res) => {
  res.sendFile(path.join(frontendPath, "admin/edit-genre.html"));
});

//books 

router.get("/books", deviceGate, requireAdmin, (req, res) => {
  res.sendFile(path.join(frontendPath, "admin/book.html"));
});

router.get("/books/:id", deviceGate, requireAdmin, (req, res) => {
  res.sendFile(path.join(frontendPath, "admin/view-book.html"));
});

router.get("/add-book", deviceGate, requireAdmin, (req, res) => {
  res.sendFile(path.join(frontendPath, "admin/add-book.html"));
});

router.get("/books/edit/:id", deviceGate, requireAdmin, (req, res) => {
  res.sendFile(path.join(frontendPath, "admin/edit-book.html"));
});

router.get("/profile", deviceGate, requireAdmin, (req, res) => {
  res.sendFile(path.join(frontendPath, "admin/profile.html"));
});

router.get('/edit-profile', deviceGate, requireAdmin, (req, res) => {
  res.sendFile(path.join(frontendPath, 'admin/edit-profile.html'));
});

module.exports = router;
