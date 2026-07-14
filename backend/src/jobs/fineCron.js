const cron = require("node-cron");
const db = require("../config/db");

const startFineCron = () => {
 console.log("Fine cron initialized");
  // Runs every hour
  cron.schedule("0 * * * *", () => {
    console.log("Running daily fine update:", new Date());


    try {

      db.prepare(`
        UPDATE borrowed_books
        SET fine_amount =
          CAST(
            julianday(DATE('now')) - julianday(DATE(due_date))
            AS INTEGER
          ) * 10
        WHERE
          returned = 0
          AND fine_paid = 0
          AND DATE(due_date) < DATE('now');
      `).run();

      console.log("Daily fine calculation completed.");

    } catch (err) {

      console.error("Fine cron failed:", err);

    }

  });

};

module.exports = startFineCron;