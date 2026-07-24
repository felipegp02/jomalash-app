const express = require('express');
const { listar, crear, actualizar, historialPrecios } = require('../controllers/servicios.controller');
const { authenticate, requierePermiso } = require('../middleware/auth.middleware');
const asyncHandler = require('../middleware/asyncHandler');

const router = express.Router();

router.get('/', authenticate, asyncHandler(listar));
router.get('/:id/historial', authenticate, requierePermiso('gestiona_catalogo'), asyncHandler(historialPrecios));
router.post('/', authenticate, requierePermiso('gestiona_catalogo'), asyncHandler(crear));
router.put('/:id', authenticate, requierePermiso('gestiona_catalogo'), asyncHandler(actualizar));

module.exports = router;
