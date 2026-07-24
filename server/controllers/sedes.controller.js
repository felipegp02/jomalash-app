const prisma = require('../lib/prisma');

// GET /sedes - usado para el selector de sede (topbar) y la vista consolidada (RF-24)
async function listar(req, res) {
  const sedes = await prisma.sede.findMany({
    orderBy: { nombre: 'asc' },
    select: { id: true, nombre: true },
  });

  res.json({ sedes });
}

// POST /sedes (Admin)
async function crear(req, res) {
  const { nombre } = req.body || {};
  const nombreLimpio = (nombre || '').trim();

  if (!nombreLimpio) {
    return res.status(400).json({ error: 'El nombre es requerido' });
  }

  const existente = await prisma.sede.findFirst({ where: { nombre: nombreLimpio } });
  if (existente) {
    return res.status(400).json({ error: 'Ya existe una sede con ese nombre' });
  }

  const sede = await prisma.sede.create({ data: { nombre: nombreLimpio } });
  res.status(201).json({ sede });
}

// PUT /sedes/:id (Admin)
async function actualizar(req, res) {
  const id = Number(req.params.id);
  const { nombre } = req.body || {};
  const nombreLimpio = (nombre || '').trim();

  const existente = await prisma.sede.findUnique({ where: { id } });
  if (!existente) {
    return res.status(404).json({ error: 'Sede no encontrada' });
  }
  if (!nombreLimpio) {
    return res.status(400).json({ error: 'El nombre es requerido' });
  }

  const duplicada = await prisma.sede.findFirst({ where: { nombre: nombreLimpio, NOT: { id } } });
  if (duplicada) {
    return res.status(400).json({ error: 'Ya existe una sede con ese nombre' });
  }

  const sede = await prisma.sede.update({ where: { id }, data: { nombre: nombreLimpio } });
  res.json({ sede });
}

module.exports = { listar, crear, actualizar };
