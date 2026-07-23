const express = require('express');
const { login, logout, recuperar, restablecer, me } = require('../controllers/auth.controller');
const { authenticate } = require('../middleware/auth.middleware');

const router = express.Router();

router.post('/login', login);
router.post('/logout', logout);
router.post('/recuperar', recuperar);
router.post('/restablecer', restablecer);
router.get('/me', authenticate, me);

module.exports = router;
