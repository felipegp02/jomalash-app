const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../lib/prisma');
const { generarTokenRecuperacion, hashearToken } = require('../utils/tokens');
const { enviarCorreoRecuperacion } = require('../utils/mailer');

const RESET_TOKEN_EXPIRES_MIN = Number(process.env.RESET_TOKEN_EXPIRES_MIN || 30);

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
  return {
    id: usuario.id,
    nombre: usuario.nombre,
    rol: usuario.rol,
    sede_id: usuario.sede_id,
    sede: usuario.sede?.nombre,
  };
}

// POST /auth/login (RF-01)
async function login(req, res) {
  const { email, password } = req.body || {};

  if (!email || !password) {
    return res.status(400).json({ error: 'Correo y contrasena son requeridos' });
  }

  const usuario = await prisma.usuario.findUnique({
    where: { email_recuperacion: email },
    include: { sede: true },
  });

  // Mensaje generico: no revelar si el correo existe o si fallo la contrasena.
  if (!usuario || !usuario.activo) {
    return res.status(401).json({ error: 'Credenciales invalidas' });
  }

  const passwordValido = await bcrypt.compare(password, usuario.password_hash);
  if (!passwordValido) {
    return res.status(401).json({ error: 'Credenciales invalidas' });
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

  // Misma respuesta exista o no el usuario, para no filtrar que correos estan registrados.
  const respuestaGenerica = {
    mensaje: 'Si el correo esta registrado, se envio un enlace de recuperacion.',
  };

  if (!usuario || !usuario.activo) {
    return res.json(respuestaGenerica);
  }

  const { tokenCrudo, tokenHash } = generarTokenRecuperacion();
  const expiraEn = new Date(Date.now() + RESET_TOKEN_EXPIRES_MIN * 60 * 1000);

  await prisma.$transaction([
    // Invalida cualquier enlace de recuperacion previo sin usar (RNF-04: un solo uso).
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
    return res.status(400).json({ error: 'Token y nueva contrasena son requeridos' });
  }

  if (password.length < 8) {
    return res.status(400).json({ error: 'La contrasena debe tener al menos 8 caracteres' });
  }

  const tokenHash = hashearToken(token);
  const registro = await prisma.passwordResetToken.findFirst({
    where: { token_hash: tokenHash, usado: false, expira_en: { gt: new Date() } },
  });

  if (!registro) {
    return res.status(400).json({ error: 'El enlace es invalido o ya expiro' });
  }

  const passwordHash = await bcrypt.hash(password, 10);

  await prisma.$transaction([
    prisma.usuario.update({
      where: { id: registro.usuario_id },
      data: { password_hash: passwordHash },
    }),
    prisma.passwordResetToken.update({
      where: { id: registro.id },
      data: { usado: true },
    }),
  ]);

  res.json({ mensaje: 'Contrasena actualizada correctamente' });
}

// GET /auth/me - util para que el frontend recupere la sesion activa al cargar
async function me(req, res) {
  const usuario = await prisma.usuario.findUnique({
    where: { id: req.user.id },
    include: { sede: true },
  });

  if (!usuario || !usuario.activo) {
    return res.status(401).json({ error: 'Sesion invalida' });
  }

  res.json({ usuario: usuarioSeguro(usuario) });
}

module.exports = { login, logout, recuperar, restablecer, me };
