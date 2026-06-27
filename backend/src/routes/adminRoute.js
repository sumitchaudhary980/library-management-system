const express = require("express");

const router = express.Router();

router.get("/dashboard", (req, res) => {
    res.json({
        message: "Admin route working"
    });
});

module.exports = router;