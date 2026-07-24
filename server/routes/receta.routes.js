const express = require('express');
const { obtener, actualizar } = require('../controllers/receta.controller');
const { authenticate, requierePermiso } = require('../middleware/auth.middleware');
const asyncHandler = require('../middleware/asyncHandler');

const router = express.Router();

router.get('/:servicio_id', authenticate, requierePermiso('ve_insumos'), asyncHandler(obtener));
router.put('/:servicio_id', authenticate, requierePermiso('ve_insumos'), asyncHandler(actualizar));

module.exports = router;
