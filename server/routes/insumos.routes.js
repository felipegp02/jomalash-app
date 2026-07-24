const express = require('express');
const { listar, crear, actualizar, ajustarInventario } = require('../controllers/insumos.controller');
const { authenticate, requierePermiso } = require('../middleware/auth.middleware');
const asyncHandler = require('../middleware/asyncHandler');

const router = express.Router();

router.get('/', authenticate, requierePermiso('ve_insumos'), asyncHandler(listar));
router.post('/', authenticate, requierePermiso('ve_insumos'), asyncHandler(crear));
router.put('/:id', authenticate, requierePermiso('ve_insumos'), asyncHandler(actualizar));
router.put('/:id/inventario', authenticate, requierePermiso('ve_insumos'), asyncHandler(ajustarInventario));

module.exports = router;
