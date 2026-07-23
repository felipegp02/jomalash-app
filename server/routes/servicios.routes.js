const express = require('express');
const { listar } = require('../controllers/servicios.controller');
const { authenticate } = require('../middleware/auth.middleware');

const router = express.Router();

router.get('/', authenticate, listar);

module.exports = router;
