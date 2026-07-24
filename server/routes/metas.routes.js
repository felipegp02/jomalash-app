const express = require('express');
const { listar, definir } = require('../controllers/metas.controller');
const { authenticate, requierePermiso } = require('../middleware/auth.middleware');
const asyncHandler = require('../middleware/asyncHandler');

const router = express.Router();

router.get('/', authenticate, requierePermiso('ve_caja'), asyncHandler(listar));
router.put('/', authenticate, requierePermiso('ve_caja'), asyncHandler(definir));

module.exports = router;
