const express = require('express');
const { listar } = require('../controllers/servicios.controller');
const { authenticate } = require('../middleware/auth.middleware');
const asyncHandler = require('../middleware/asyncHandler');

const router = express.Router();

router.get('/', authenticate, asyncHandler(listar));

module.exports = router;
