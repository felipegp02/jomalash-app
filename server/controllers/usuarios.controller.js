const bcrypt = require('bcryptjs');
const prisma = require('../lib/prisma');

const CAMPOS_PERMISOS = [
  've_insumos',
  've_nomina',
  've_caja',
  've_dashboard_completo',
  'gestiona_catalogo',
  'gestiona_empleadas',
];

function toNumber(valor) {
  if (valor === null || valor === undefined) return 0;
  return typeof valor === 'object' && typeof valor.toNumber === 'function'
    ? valor.toNumber()
    : Number(valor);
}

function usuarioSeguro(usuario) {
  const seguro = {
    id: usuario.id,
    nombre: usuario.nombre,
    rol: usuario.rol,
    sede_id: usuario.sede_id,
    activo: usuario.activo,
    email_recuperacion: usuario.email_recuperacion,
    porcentaje_comision: toNumber(usuario.porcentaje_comision),
  };
  for (const campo of CAMPOS_PERMISOS) {
    seguro[campo] = usuario[campo];
  }
  return seguro;
}

// Toma solo los permisos presentes en el body y los normaliza a boolean, para
// poder usarlo tanto en crear (permisos ausentes = quedan en su default de
// columna) como en actualizar (permisos ausentes = no se tocan).
function permisosDelBody(body) {
  const data = {};
  for (const campo of CAMPOS_PERMISOS) {
    if (body[campo] !== undefined) data[campo] = Boolean(body[campo]);
  }
  return data;
}

// GET /usuarios (Admin) - selector de empleada en Registrar, y pantalla de
// gestión de empleadas (con ?incluirInactivos=true para ver también las
// dadas de baja).
async function listar(req, res) {
  const { sede_id, rol, incluirInactivos } = req.query;
  const where = {};

  if (incluirInactivos !== 'true') where.activo = true;
  if (sede_id) where.sede_id = Number(sede_id);
  if (rol) where.rol = rol;

  const usuarios = await prisma.usuario.findMany({
    where,
    orderBy: { nombre: 'asc' },
  });

  res.json({ usuarios: usuarios.map(usuarioSeguro) });
}

// POST /usuarios (RF-13: alta de empleada, define su % de comisión).
// Siempre crea rol "empleada": esta pantalla es de gestión de empleadas,
// no de administradores.
async function crear(req, res) {
  const { nombre, email_recuperacion, password, sede_id, porcentaje_comision } = req.body || {};

  if (!nombre || !email_recuperacion || !password || !sede_id) {
    return res.status(400).json({ error: 'Nombre, correo, contraseña y sede son requeridos' });
  }
  if (password.length < 8) {
    return res.status(400).json({ error: 'La contraseña debe tener al menos 8 caracteres' });
  }

  const comisionNum = porcentaje_comision === undefined || porcentaje_comision === '' ? 0 : Number(porcentaje_comision);
  if (!Number.isFinite(comisionNum) || comisionNum < 0 || comisionNum > 1) {
    return res.status(400).json({ error: 'El porcentaje de comisión debe estar entre 0 y 1' });
  }

  const sede = await prisma.sede.findUnique({ where: { id: Number(sede_id) } });
  if (!sede) {
    return res.status(400).json({ error: 'Sede inválida' });
  }

  const existente = await prisma.usuario.findUnique({ where: { email_recuperacion } });
  if (existente) {
    return res.status(400).json({ error: 'Ya existe un usuario con ese correo' });
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const usuario = await prisma.usuario.create({
    data: {
      nombre,
      email_recuperacion,
      password_hash: passwordHash,
      sede_id: sede.id,
      porcentaje_comision: comisionNum,
      rol: 'empleada',
      activo: true,
      ...permisosDelBody(req.body || {}),
    },
  });

  res.status(201).json({ usuario: usuarioSeguro(usuario) });
}

// PUT /usuarios/:id (RF-13: editar datos, % de comisión, o dar de baja).
// Limitado a empleadas: esta pantalla no administra otras cuentas admin.
async function actualizar(req, res) {
  const id = Number(req.params.id);
  const { nombre, sede_id, porcentaje_comision, activo, email_recuperacion } = req.body || {};

  const existente = await prisma.usuario.findUnique({ where: { id } });
  if (!existente) {
    return res.status(404).json({ error: 'Usuario no encontrado' });
  }
  if (existente.rol !== 'empleada') {
    return res.status(400).json({ error: 'Esta pantalla solo administra empleadas' });
  }

  const data = {};
  if (nombre !== undefined) data.nombre = nombre;
  if (activo !== undefined) data.activo = Boolean(activo);

  if (sede_id !== undefined) {
    const sede = await prisma.sede.findUnique({ where: { id: Number(sede_id) } });
    if (!sede) {
      return res.status(400).json({ error: 'Sede inválida' });
    }
    data.sede_id = sede.id;
  }

  if (email_recuperacion !== undefined && email_recuperacion !== existente.email_recuperacion) {
    const enUso = await prisma.usuario.findUnique({ where: { email_recuperacion } });
    if (enUso) {
      return res.status(400).json({ error: 'Ese correo ya está en uso por otro usuario' });
    }
    data.email_recuperacion = email_recuperacion;
  }

  if (porcentaje_comision !== undefined) {
    const comisionNum = Number(porcentaje_comision);
    if (!Number.isFinite(comisionNum) || comisionNum < 0 || comisionNum > 1) {
      return res.status(400).json({ error: 'El porcentaje de comisión debe estar entre 0 y 1' });
    }
    data.porcentaje_comision = comisionNum;
  }

  Object.assign(data, permisosDelBody(req.body || {}));

  const usuario = await prisma.usuario.update({ where: { id }, data });
  res.json({ usuario: usuarioSeguro(usuario) });
}

module.exports = { listar, crear, actualizar };
