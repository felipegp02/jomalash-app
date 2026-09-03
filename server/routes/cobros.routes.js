const express = require('express');
const { crear } = require('../controllers/cobros.controller');
const { authenticate } = require('../middleware/auth.middleware');
const asyncHandler = require('../middleware/asyncHandler');

const router = express.Router();

router.post('/', authenticate, asyncHandler(crear));

module.exports = router;
