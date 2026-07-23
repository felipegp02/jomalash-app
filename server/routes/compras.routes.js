const express = require('express');
const { listar, crear } = require('../controllers/compras.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');
const asyncHandler = require('../middleware/asyncHandler');

const router = express.Router();

router.get('/', authenticate, authorize('admin'), asyncHandler(listar));
router.post('/', authenticate, authorize('admin'), asyncHandler(crear));

module.exports = router;
