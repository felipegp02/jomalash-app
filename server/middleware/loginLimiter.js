const rateLimit = require('express-rate-limit');

// Frena fuerza bruta/credential stuffing contra /auth/login sin afectar el
// flujo normal: solo cuenta intentos fallidos (skipSuccessfulRequests), asi
// que un login correcto nunca gasta cupo de la ventana.
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 8,
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  message: { error: 'Demasiados intentos. Probá de nuevo en unos minutos.' },
});

module.exports = loginLimiter;
