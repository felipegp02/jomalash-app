const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../lib/prisma');
const { generarTokenRecuperacion, hashearToken } = require('../utils/tokens');
const { enviarCorreoRecuperacion } = require('../utils/mailer');

const RESET_TOKEN_EXPIRES_MIN = Number(process.env.RESET_TOKEN_EXPIRES_MIN || 30);

const CAMPOS_PERMISOS = [
  've_insumos',
  've_nomina',
  've_caja',
  've_dashboard_completo',
  'gestiona_catalogo',
  'gestiona_empleadas',
];

const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
  maxAge: 8 * 60 * 60 * 1000, // 8 horas, alineado con JWT_EXPIRES_IN por defecto
};

function firmarToken(usuario) {
  return jwt.sign(
    { sub: usuario.id, rol: usuario.rol, sede_id: usuario.sede_id },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '8h' },
  );
}

function usuarioSeguro(usuario) {
  const seguro = {
    id: usuario.id,
    nombre: usuario.nombre,
    rol: usuario.rol,
    sede_id: usuario.sede_id,
    sede: usuario.sede?.nombre,
    debe_cambiar_password: usuario.debe_cambiar_password,
  };
  for (const campo of CAMPOS_PERMISOS) {
    seguro[campo] = usuario[campo];
  }
  return seguro;
}

// POST /auth/login (RF-01)
async function login(req, res) {
  const { email, password } = req.body || {};

  if (!email || !password) {
    return res.status(400).json({ error: 'Correo y contraseña son requeridos' });
  }

  const usuario = await prisma.usuario.findUnique({
    where: { email_recuperacion: email },
    include: { sede: true },
  });

  // Mensaje genérico: no revelar si el correo existe o si fallo la contraseña.
  if (!usuario || !usuario.activo) {
    return res.status(401).json({ error: 'Credenciales inválidas' });
  }

  const passwordValido = await bcrypt.compare(password, usuario.password_hash);
  if (!passwordValido) {
    return res.status(401).json({ error: 'Credenciales inválidas' });
  }

  const token = firmarToken(usuario);
  res.cookie('token', token, cookieOptions);
  res.json({ usuario: usuarioSeguro(usuario) });
}

// POST /auth/logout
async function logout(req, res) {
  res.clearCookie('token', { ...cookieOptions, maxAge: undefined });
  res.status(204).send();
}

// POST /auth/recuperar (RF-02)
async function recuperar(req, res) {
  const { email } = req.body || {};

  if (!email) {
    return res.status(400).json({ error: 'El correo es requerido' });
  }

  const usuario = await prisma.usuario.findUnique({
    where: { email_recuperacion: email },
  });

  // Misma respuesta exista o no el usuario, para no filtrar que correos están registrados.
  const respuestaGenerica = {
    mensaje: 'Si el correo está registrado, se envió un enlace de recuperación.',
  };

  if (!usuario || !usuario.activo) {
    return res.json(respuestaGenerica);
  }

  const { tokenCrudo, tokenHash } = generarTokenRecuperacion();
  const expiraEn = new Date(Date.now() + RESET_TOKEN_EXPIRES_MIN * 60 * 1000);

  await prisma.$transaction([
    // Invalida cualquier enlace de recuperación previo sin usar (RNF-04: un solo uso).
    prisma.passwordResetToken.updateMany({
      where: { usuario_id: usuario.id, usado: false },
      data: { usado: true },
    }),
    prisma.passwordResetToken.create({
      data: {
        usuario_id: usuario.id,
        token_hash: tokenHash,
        expira_en: expiraEn,
      },
    }),
  ]);

  await enviarCorreoRecuperacion(usuario.email_recuperacion, tokenCrudo);

  res.json(respuestaGenerica);
}

// POST /auth/restablecer (RF-02 / RNF-04)
async function restablecer(req, res) {
  const { token, password } = req.body || {};

  if (!token || !password) {
    return res.status(400).json({ error: 'Token y nueva contraseña son requeridos' });
  }

  if (password.length < 8) {
    return res.status(400).json({ error: 'La contraseña debe tener al menos 8 caracteres' });
  }

  const tokenHash = hashearToken(token);
  const registro = await prisma.passwordResetToken.findFirst({
    where: { token_hash: tokenHash, usado: false, expira_en: { gt: new Date() } },
  });

  if (!registro) {
    return res.status(400).json({ error: 'El enlace es inválido o ya expiró' });
  }

  const passwordHash = await bcrypt.hash(password, 10);

  await prisma.$transaction([
    prisma.usuario.update({
      where: { id: registro.usuario_id },
      data: { password_hash: passwordHash, debe_cambiar_password: false },
    }),
    prisma.passwordResetToken.update({
      where: { id: registro.id },
      data: { usado: true },
    }),
  ]);

  res.json({ mensaje: 'Contraseña actualizada correctamente' });
}

// GET /auth/me - util para que el frontend recupere la sesión activa al cargar
async function me(req, res) {
  const usuario = await prisma.usuario.findUnique({
    where: { id: req.user.id },
    include: { sede: true },
  });

  if (!usuario || !usuario.activo) {
    return res.status(401).json({ error: 'Sesión inválida' });
  }

  res.json({ usuario: usuarioSeguro(usuario) });
}

// PUT /auth/password - "Mi cuenta": cualquier usuario logueado puede cambiar
// su propia contraseña, con la contraseña actual como confirmación.
async function cambiarPassword(req, res) {
  const { passwordActual, passwordNueva } = req.body || {};

  if (!passwordActual || !passwordNueva) {
    return res.status(400).json({ error: 'La contraseña actual y la nueva son requeridas' });
  }
  if (passwordNueva.length < 8) {
    return res.status(400).json({ error: 'La nueva contraseña debe tener al menos 8 caracteres' });
  }

  const usuario = await prisma.usuario.findUnique({ where: { id: req.user.id } });
  const passwordValido = await bcrypt.compare(passwordActual, usuario.password_hash);
  if (!passwordValido) {
    return res.status(401).json({ error: 'La contraseña actual no es correcta' });
  }

  const passwordHash = await bcrypt.hash(passwordNueva, 10);
  await prisma.usuario.update({
    where: { id: usuario.id },
    data: { password_hash: passwordHash, debe_cambiar_password: false },
  });

  res.json({ mensaje: 'Contraseña actualizada correctamente' });
}

module.exports = { login, logout, recuperar, restablecer, me, cambiarPassword };
