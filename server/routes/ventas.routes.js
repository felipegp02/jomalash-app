const express = require('express');
const { listar, crear, actualizar } = require('../controllers/ventas.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');

const router = express.Router();

router.get('/', authenticate, listar);
router.post('/', authenticate, crear);
router.put('/:id', authenticate, authorize('admin'), actualizar);

module.exports = router;
