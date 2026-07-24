const express = require('express');
const {
  resumen,
  tiempo,
  categorias,
  serviciosRanking,
  empleadasRanking,
  tendencia,
} = require('../controllers/dashboard.controller');
const { authenticate, requierePermiso } = require('../middleware/auth.middleware');
const asyncHandler = require('../middleware/asyncHandler');

const router = express.Router();

router.get('/resumen', authenticate, asyncHandler(resumen));
router.get('/tiempo', authenticate, asyncHandler(tiempo));
router.get('/categorias', authenticate, asyncHandler(categorias));
router.get('/servicios', authenticate, asyncHandler(serviciosRanking));
router.get('/empleadas', authenticate, requierePermiso('ve_dashboard_completo'), asyncHandler(empleadasRanking));
router.get('/tendencia', authenticate, asyncHandler(tendencia));

module.exports = router;
