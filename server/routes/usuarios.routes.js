const express = require('express');
const { listar } = require('../controllers/usuarios.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');

const router = express.Router();

router.get('/', authenticate, authorize('admin'), listar);

module.exports = router;
