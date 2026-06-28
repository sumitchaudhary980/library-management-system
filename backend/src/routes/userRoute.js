const express = require('express');
const path = require('path');
const { requireReader } = require('../middleware/authMiddleware');

const router = express.Router();

const frontendPath = path.join(__dirname, '../../../frontend');

// All user pages protected by requireReader
// router.get('/dashboard', requireReader, (req, res) => {
//   res.sendFile(path.join(frontendPath, 'user/dashboard.html'));
// });

module.exports = router;