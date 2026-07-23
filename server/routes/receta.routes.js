const express = require('express');
const { obtener, actualizar } = require('../controllers/receta.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');
const asyncHandler = require('../middleware/asyncHandler');

const router = express.Router();

router.get('/:servicio_id', authenticate, authorize('admin'), asyncHandler(obtener));
router.put('/:servicio_id', authenticate, authorize('admin'), asyncHandler(actualizar));

module.exports = router;
