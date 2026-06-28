const express = require('express');
const path = require('path');
const { requireAdmin } = require('../middleware/authMiddleware');

const router = express.Router();

const frontendPath = path.join(__dirname, '../../../frontend');

// All admin pages protected by requireAdmin
// router.get('/dashboard', requireAdmin, (req, res) => {
//   res.sendFile(path.join(frontendPath, 'admin/dashboard.html'));
// });

module.exports = router;