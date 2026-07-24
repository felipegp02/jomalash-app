const express = require('express');
const { listar, crear } = require('../controllers/compras.controller');
const { authenticate, requierePermiso } = require('../middleware/auth.middleware');
const asyncHandler = require('../middleware/asyncHandler');

const router = express.Router();

router.get('/', authenticate, requierePermiso('ve_insumos'), asyncHandler(listar));
router.post('/', authenticate, requierePermiso('ve_insumos'), asyncHandler(crear));

module.exports = router;
