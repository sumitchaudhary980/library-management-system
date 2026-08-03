const cron = require("node-cron");
const db = require("../config/db");

const updateFines = async () => {
  console.log("Running fine update:", new Date());

  try {
    await db.exec(`
  UPDATE borrowed_books
  SET fine_amount =
    CAST(
      julianday(DATE('now')) - julianday(DATE(due_date))
      AS INTEGER
    ) * 10
  WHERE
    returned = 0
    AND DATE(due_date) < DATE('now');
`);

    console.log("Fine calculation completed.");

  } catch (err) {
    console.error("Fine update failed:", err);
    throw err;
  }
};


const startFineCron = () => {
  console.log("Fine cron initialized");

  cron.schedule("0 * * * * ", async () => {
    await updateFines();
  });
};


module.exports = {
  startFineCron,
  updateFines,
};