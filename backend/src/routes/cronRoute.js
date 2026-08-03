const express = require("express");
const router = express.Router();

const { requireAdmin } = require("../middleware/authMiddleware");
const { updateFines } = require("../jobs/fineCron");

router.get("/run-fines", requireAdmin, async (req, res) => {
  try {
    await updateFines();

    return res.json({
      message: "Fine cron executed successfully",
    });

  } catch (error) {
    console.error("Fine cron error:", error);

    return res.status(500).json({
      message: "Failed to execute fine cron",
    });
  }
});

module.exports = router;