const express = require('express');
const path = require('path');
const { requireAdmin } = require('../middleware/authMiddleware');

const router = express.Router();

const frontendPath = path.join(__dirname, '../../../frontend');



module.exports = router;