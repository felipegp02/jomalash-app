const express = require('express');
const { resumen, crear, historial } = require('../controllers/nomina.controller');
const { authenticate, requierePermiso } = require('../middleware/auth.middleware');
const asyncHandler = require('../middleware/asyncHandler');

const router = express.Router();

router.get('/resumen', authenticate, requierePermiso('ve_nomina'), asyncHandler(resumen));
router.post('/', authenticate, requierePermiso('ve_nomina'), asyncHandler(crear));
router.get('/:usuarioId/historial', authenticate, requierePermiso('ve_nomina'), asyncHandler(historial));

module.exports = router;
