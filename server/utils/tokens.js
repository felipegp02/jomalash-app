const crypto = require('crypto');

// El token crudo va en el enlace que recibe el usuario por correo.
// Solo se persiste su hash (sha256), así una fuga de la base de datos
// no permite reconstruir enlaces de recuperación válidos.
function generarTokenRecuperacion() {
  const tokenCrudo = crypto.randomBytes(32).toString('hex');
  const tokenHash = crypto.createHash('sha256').update(tokenCrudo).digest('hex');
  return { tokenCrudo, tokenHash };
}

function hashearToken(tokenCrudo) {
  return crypto.createHash('sha256').update(tokenCrudo).digest('hex');
}

module.exports = { generarTokenRecuperacion, hashearToken };
