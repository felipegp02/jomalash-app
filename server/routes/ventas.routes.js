const express = require('express');
const { listar, actualizar } = require('../controllers/ventas.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');
const asyncHandler = require('../middleware/asyncHandler');

const router = express.Router();

router.get('/', authenticate, asyncHandler(listar));
router.put('/:id', authenticate, authorize('admin'), asyncHandler(actualizar));

module.exports = router;
