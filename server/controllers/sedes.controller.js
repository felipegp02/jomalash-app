const prisma = require('../lib/prisma');

// GET /sedes - usado para el selector de sede (topbar) y la vista consolidada (RF-24)
async function listar(req, res) {
  const sedes = await prisma.sede.findMany({
    orderBy: { nombre: 'asc' },
    select: { id: true, nombre: true },
  });

  res.json({ sedes });
}

module.exports = { listar };
