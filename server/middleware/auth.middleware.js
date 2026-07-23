const jwt = require('jsonwebtoken');

// RF-01: mantiene la sesion activa via cookie httpOnly (Stack Tecnologico: JWT + cookie httpOnly).
function authenticate(req, res, next) {
  const token = req.cookies?.token;

  if (!token) {
    return res.status(401).json({ error: 'No autenticado' });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = {
      id: payload.sub,
      rol: payload.rol,
      sede_id: payload.sede_id,
    };
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Sesion invalida o expirada' });
  }
}

// RF-03: restringe vistas y acciones segun el rol (ej. authorize('admin')).
function authorize(...rolesPermitidos) {
  return (req, res, next) => {
    if (!req.user || !rolesPermitidos.includes(req.user.rol)) {
      return res.status(403).json({ error: 'No tienes permisos para esta accion' });
    }
    next();
  };
}

module.exports = { authenticate, authorize };
