const express = require("express");
const path = require("path");

const router = express.Router();

const frontendPath = path.join(__dirname, "../../../frontend");

router.get("/", (req, res) => {
    res.sendFile(path.join(frontendPath, "index.html"));
});

router.get("/login", (req, res) => {
    res.sendFile(
        path.join(frontendPath, "user/login.html")
    );
});

router.get("/admin/login", (req, res) => {
    res.sendFile(
        path.join(frontendPath, "admin/login.html")
    );
});

router.get("/dashboard", (req, res) => {
    res.sendFile(
        path.join(frontendPath, "admin/dashboard.html")
    );
});

module.exports = router;