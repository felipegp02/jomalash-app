const express = require('express');
const { listar, crear, actualizar, ajustarInventario } = require('../controllers/insumos.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');
const asyncHandler = require('../middleware/asyncHandler');

const router = express.Router();

router.get('/', authenticate, authorize('admin'), asyncHandler(listar));
router.post('/', authenticate, authorize('admin'), asyncHandler(crear));
router.put('/:id', authenticate, authorize('admin'), asyncHandler(actualizar));
router.put('/:id/inventario', authenticate, authorize('admin'), asyncHandler(ajustarInventario));

module.exports = router;
