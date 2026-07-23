const prisma = require('../lib/prisma');

// GET /usuarios (Admin) - usado para poblar el selector de empleada en Registrar
async function listar(req, res) {
  const { sede_id, rol } = req.query;
  const where = { activo: true };

  if (sede_id) where.sede_id = Number(sede_id);
  if (rol) where.rol = rol;

  const usuarios = await prisma.usuario.findMany({
    where,
    orderBy: { nombre: 'asc' },
    select: { id: true, nombre: true, rol: true, sede_id: true, activo: true },
  });

  res.json({ usuarios });
}

module.exports = { listar };
