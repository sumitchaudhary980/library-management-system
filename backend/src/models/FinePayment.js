const db = require("../config/db");

const createFinePaymentTable = () => {

  db.exec(`
    CREATE TABLE IF NOT EXISTS fine_payments (

      id INTEGER PRIMARY KEY AUTOINCREMENT,

      borrowed_book_id INTEGER NOT NULL,

      amount REAL NOT NULL,

      payment_method TEXT NOT NULL
        CHECK(payment_method IN ('cash', 'esewa')),

      payment_status TEXT NOT NULL
        DEFAULT 'pending'
        CHECK(payment_status IN ('pending', 'paid', 'failed')),

      transaction_id TEXT,

      remarks TEXT,

      paid_at DATETIME,

      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,

      FOREIGN KEY (borrowed_book_id)
        REFERENCES borrowed_books(id)
        ON DELETE CASCADE

    );
  `);

  // Automatically update older databases
  try {
    db.exec(`
      ALTER TABLE fine_payments
      ADD COLUMN product_code TEXT;
    `);
  } catch (_) {}

  try {
    db.exec(`
      ALTER TABLE fine_payments
      ADD COLUMN signature TEXT;
    `);
  } catch (_) {}

  try {
    db.exec(`
      ALTER TABLE fine_payments
      ADD COLUMN received_by INTEGER
      REFERENCES users(id)
      ON DELETE SET NULL;
    `);
  } catch (_) {}

  db.exec(`
    CREATE TRIGGER IF NOT EXISTS update_fine_payments_updated_at
    AFTER UPDATE ON fine_payments
    FOR EACH ROW
    BEGIN
      UPDATE fine_payments
      SET updated_at = CURRENT_TIMESTAMP
      WHERE id = OLD.id;
    END;
  `);

};

module.exports = {
  createFinePaymentTable,
};