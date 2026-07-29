const express = require('express');
const { login, logout, recuperar, restablecer, me, cambiarPassword } = require('../controllers/auth.controller');
const { authenticate } = require('../middleware/auth.middleware');
const asyncHandler = require('../middleware/asyncHandler');
const loginLimiter = require('../middleware/loginLimiter');

const router = express.Router();

router.post('/login', loginLimiter, asyncHandler(login));
router.post('/logout', asyncHandler(logout));
router.post('/recuperar', asyncHandler(recuperar));
router.post('/restablecer', asyncHandler(restablecer));
router.get('/me', authenticate, asyncHandler(me));
router.put('/password', authenticate, asyncHandler(cambiarPassword));

module.exports = router;
