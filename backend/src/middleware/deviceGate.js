const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
const db = require("../config/db");

const pendingPagePath = path.join(__dirname, "../../../frontend/errors/device-pending.html");

const renderPending = (res, deviceId) => {
    const html = fs.readFileSync(pendingPagePath, "utf-8")
        .replace("{{DEVICE_ID}}", deviceId);
    res.status(403).send(html);
};

const deviceGate = (req, res, next) => {
    let deviceId = req.cookies.device_id;

    if (!deviceId) {
        deviceId = crypto.randomUUID();

        res.cookie("device_id", deviceId, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",
            maxAge: 1000 * 60 * 60 * 24 * 365
        });

        db.prepare(
            `INSERT INTO approved_devices (device_id, approved) VALUES (?, 0)`
        ).run(deviceId);

        return renderPending(res, deviceId);
    }

    const device = db
        .prepare(`SELECT approved FROM approved_devices WHERE device_id = ?`)
        .get(deviceId);

    if (!device) {
        db.prepare(
            `INSERT OR IGNORE INTO approved_devices (device_id, approved) VALUES (?, 0)`
        ).run(deviceId);
        return renderPending(res, deviceId);
    }

    if (!device.approved) {
        return renderPending(res, deviceId);
    }

    next();
};

module.exports = deviceGate;