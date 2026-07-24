const jwt = require('jsonwebtoken');
const prisma = require('../lib/prisma');

const CAMPOS_PERMISOS = [
  've_insumos',
  've_nomina',
  've_caja',
  've_dashboard_completo',
  'gestiona_catalogo',
  'gestiona_empleadas',
];

// RF-01: mantiene la sesion activa via cookie httpOnly (Stack Tecnologico: JWT + cookie httpOnly).
// El JWT solo identifica al usuario (sub/rol/sede_id); rol y sede casi nunca
// cambian en caliente, pero los permisos finos si (un admin puede activarlos
// o desactivarlos en cualquier momento desde Ajustes), asi que se leen frescos
// de la base de datos en cada request en vez de confiar en lo firmado en el
// token. Tambien permite cortar la sesion al instante si el usuario fue dado
// de baja (activo=false), sin esperar a que el token expire.
async function authenticate(req, res, next) {
  const token = req.cookies?.token;

  if (!token) {
    return res.status(401).json({ error: 'No autenticado' });
  }

  let payload;
  try {
    payload = jwt.verify(token, process.env.JWT_SECRET);
  } catch (err) {
    return res.status(401).json({ error: 'Sesion invalida o expirada' });
  }

  try {
    const usuario = await prisma.usuario.findUnique({ where: { id: payload.sub } });
    if (!usuario || !usuario.activo) {
      return res.status(401).json({ error: 'Sesion invalida o expirada' });
    }

    req.user = { id: usuario.id, rol: usuario.rol, sede_id: usuario.sede_id };
    for (const campo of CAMPOS_PERMISOS) {
      req.user[campo] = usuario[campo];
    }
    next();
  } catch (err) {
    next(err);
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

// Permisos finos: requierePermiso('ve_insumos') exige que el usuario tenga
// ese permiso en true (independiente de su rol). Con varios argumentos exige
// todos (AND). El rol admin no tiene un atajo especial aqui a proposito: sus
// permisos nacen todos en true (ver seed.js / backfill), asi que se comporta
// igual que antes sin necesidad de una excepcion de codigo.
function requierePermiso(...permisos) {
  return (req, res, next) => {
    if (!req.user || !permisos.every((permiso) => req.user[permiso])) {
      return res.status(403).json({ error: 'No tienes permisos para esta accion' });
    }
    next();
  };
}

// Variante "OR": exige al menos uno de los permisos listados, para rutas de
// solo lectura que sirven a mas de un caso de uso legitimo (ej. GET /usuarios
// lo necesitan tanto quien gestiona empleadas como quien ve el dashboard
// completo, para poblar el filtro por empleada).
function requiereAlgunPermiso(...permisos) {
  return (req, res, next) => {
    if (!req.user || !permisos.some((permiso) => req.user[permiso])) {
      return res.status(403).json({ error: 'No tienes permisos para esta accion' });
    }
    next();
  };
}

module.exports = { authenticate, authorize, requierePermiso, requiereAlgunPermiso };
