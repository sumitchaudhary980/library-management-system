const db = require("../config/db");

const createApprovedDeviceTable = () => {
    db.exec(`
        CREATE TABLE IF NOT EXISTS approved_devices (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            device_id TEXT UNIQUE NOT NULL,
            label TEXT,
            approved INTEGER DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `);

    db.exec(`
        CREATE TRIGGER IF NOT EXISTS update_approved_devices_updated_at
        AFTER UPDATE ON approved_devices
        FOR EACH ROW
        BEGIN
            UPDATE approved_devices
            SET updated_at = CURRENT_TIMESTAMP
            WHERE id = OLD.id;
        END;
    `);
};

module.exports = {
    createApprovedDeviceTable
};