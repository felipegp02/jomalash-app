const express = require('express');
const { listar, crear, actualizar } = require('../controllers/usuarios.controller');
const { authenticate, requierePermiso, requiereAlgunPermiso } = require('../middleware/auth.middleware');
const asyncHandler = require('../middleware/asyncHandler');

const router = express.Router();

// GET es de solo lectura y sirve dos casos legitimos: gestionar empleadas
// (Ajustes) y poblar el filtro por empleada del Dashboard completo.
router.get('/', authenticate, requiereAlgunPermiso('gestiona_empleadas', 've_dashboard_completo'), asyncHandler(listar));
router.post('/', authenticate, requierePermiso('gestiona_empleadas'), asyncHandler(crear));
router.put('/:id', authenticate, requierePermiso('gestiona_empleadas'), asyncHandler(actualizar));

module.exports = router;
