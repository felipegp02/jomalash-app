const express = require('express');
const { listar, crear, actualizar } = require('../controllers/insumos.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');
const asyncHandler = require('../middleware/asyncHandler');

const router = express.Router();

router.get('/', authenticate, authorize('admin'), asyncHandler(listar));
router.post('/', authenticate, authorize('admin'), asyncHandler(crear));
router.put('/:id', authenticate, authorize('admin'), asyncHandler(actualizar));

module.exports = router;
