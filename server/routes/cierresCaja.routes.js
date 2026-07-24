const express = require('express');
const { preview, crear, listar } = require('../controllers/cierresCaja.controller');
const { authenticate, requierePermiso } = require('../middleware/auth.middleware');
const asyncHandler = require('../middleware/asyncHandler');

const router = express.Router();

router.get('/', authenticate, requierePermiso('ve_caja'), asyncHandler(listar));
router.get('/preview', authenticate, requierePermiso('ve_caja'), asyncHandler(preview));
router.post('/', authenticate, requierePermiso('ve_caja'), asyncHandler(crear));

module.exports = router;
