const express = require('express');
const { login, logout, recuperar, restablecer, me } = require('../controllers/auth.controller');
const { authenticate } = require('../middleware/auth.middleware');
const asyncHandler = require('../middleware/asyncHandler');

const router = express.Router();

router.post('/login', asyncHandler(login));
router.post('/logout', asyncHandler(logout));
router.post('/recuperar', asyncHandler(recuperar));
router.post('/restablecer', asyncHandler(restablecer));
router.get('/me', authenticate, asyncHandler(me));

module.exports = router;
