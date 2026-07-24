const express = require('express');
const { exportar } = require('../controllers/reportes.controller');
const { authenticate, requierePermiso } = require('../middleware/auth.middleware');
const asyncHandler = require('../middleware/asyncHandler');

const router = express.Router();

router.get('/exportar', authenticate, requierePermiso('ve_caja'), asyncHandler(exportar));

module.exports = router;
