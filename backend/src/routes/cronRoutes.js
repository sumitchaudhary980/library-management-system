const express = require("express");
const router = express.Router();

const { requireAdmin } = require("../middleware/authMiddleware");
const runFineCron = require("../jobs/fineCron");

router.get("/run-fines", requireAdmin, async (req, res) => {
  try {
    await runFineCron();

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