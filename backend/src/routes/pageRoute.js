const express = require("express");
const path = require("path");
const { requireAdmin, requireReader } = require("../middleware/authMiddleware");
// const deviceGate = require("../middleware/deviceGate");
const router = express.Router();
const frontendPath = path.join(__dirname, "../../../frontend");

router.get("/", (req, res) => {
  res.sendFile(path.join(frontendPath, "index.html"));
});

//user routes
router.get('/borrowed-books', requireReader, (req, res) => {
  res.sendFile(path.join(frontendPath, 'user/borrowed-books.html'));
});

router.get('/borrow-history', requireReader, (req, res) => {
  res.sendFile(path.join(frontendPath, 'user/borrow-history.html'));
});

router.get('/fines', (req, res) => {
  if (!req.session.user) {
    return res.redirect("/");
  }

  if (req.session.user.role === "admin") {
    return res.sendFile(
      path.join(frontendPath, "admin/fine.html")
    );
  }

  if (req.session.user.role === "reader") {
    return res.sendFile(
      path.join(frontendPath, "user/fine.html")
    );
  }
});

//fine detail
router.get("/borrow-history/:userId", requireAdmin, (req, res) => {
  res.sendFile(
    path.join(frontendPath, "admin/borrow-history.html")
  );
}
);

//Profile
router.get("/profile", (req, res) => {
  if (!req.session.user) {
    return res.redirect("/");
  }

  if (req.session.user.role === "admin") {
    return res.sendFile(
      path.join(frontendPath, "admin/profile.html")
    );
  }

  if (req.session.user.role === "reader") {
    return res.sendFile(
      path.join(frontendPath, "user/profile.html")
    );
  }

  return res.sendStatus(403);
});

router.get("/edit-profile", (req, res) => {
  if (!req.session.user) {
    return res.redirect("/");
  }

  if (req.session.user.role === "admin") {
    return res.sendFile(
      path.join(frontendPath, "admin/edit-profile.html")
    );
  }

  if (req.session.user.role === "reader") {
    return res.sendFile(
      path.join(frontendPath, "user/edit-profile.html")
    );
  }

  return res.sendStatus(403);
});
//User Routes

// User login — public but skip if already logged in
router.get("/login", (req, res) => {
  if (req.session.user?.role === "reader")
    return res.redirect("/home");
  res.sendFile(path.join(frontendPath, "user/login.html"));
});

//User Pages — protected, live at root level URLs
router.get("/home", requireReader, (req, res) => {
  res.sendFile(path.join(frontendPath, "user/home.html"));
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

router.get("/authors", requireAdmin, (req, res) => {
  res.sendFile(path.join(frontendPath, "admin/author.html"));
});

router.get('/add-author', requireAdmin, (req, res) => {
  res.sendFile(path.join(frontendPath, 'admin/add-author.html'));
});

router.get("/authors/edit/:id", requireAdmin, (req, res) => {
  res.sendFile(path.join(frontendPath, "admin/edit-author.html"));
});

// Genres page
router.get("/genres", requireAdmin, (req, res) => {
  res.sendFile(path.join(frontendPath, "admin/genre.html"));
});

// Add genre page
router.get("/add-genre", requireAdmin, (req, res) => {
  res.sendFile(path.join(frontendPath, "admin/add-genre.html"));
});

router.get("/genres/edit/:id", requireAdmin, (req, res) => {
  res.sendFile(path.join(frontendPath, "admin/edit-genre.html"));
});

//books 
router.get("/books", (req, res) => {
  if (!req.session.user) {
    return res.redirect("/");
  }

  if (req.session.user.role === "admin") {
    return res.sendFile(
      path.join(frontendPath, "admin/book.html")
    );
  }

  if (req.session.user.role === "reader") {
    return res.sendFile(
      path.join(frontendPath, "user/book.html")
    );
  }

  return res.sendStatus(403);
});


router.get("/books/:id", (req, res) => {
  if (!req.session.user) {
    return res.redirect("/");
  }
  if (req.session.user.role === "admin") {
    return res.sendFile(
      path.join(frontendPath, "admin/view-book.html")
    );
  }

  if (req.session.user.role === "reader") {
    return res.sendFile(
      path.join(frontendPath, "user/view-book.html")
    );
  }

  return res.sendStatus(403);

});

router.get("/add-book", requireAdmin, (req, res) => {
  res.sendFile(path.join(frontendPath, "admin/add-book.html"));
});

router.get("/books/edit/:id", requireAdmin, (req, res) => {
  res.sendFile(path.join(frontendPath, "admin/edit-book.html"));
});


module.exports = router;
