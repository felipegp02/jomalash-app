const express = require('express');
const { listar } = require('../controllers/usuarios.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');
const asyncHandler = require('../middleware/asyncHandler');

const router = express.Router();

router.get('/', authenticate, authorize('admin'), asyncHandler(listar));

module.exports = router;
