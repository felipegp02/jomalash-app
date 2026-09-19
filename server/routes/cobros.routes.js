const express = require('express');
const { crear, anular } = require('../controllers/cobros.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');
const asyncHandler = require('../middleware/asyncHandler');

const router = express.Router();

router.post('/', authenticate, asyncHandler(crear));
router.put('/:id/anular', authenticate, authorize('admin'), asyncHandler(anular));

module.exports = router;
