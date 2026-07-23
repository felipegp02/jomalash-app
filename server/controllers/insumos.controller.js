const prisma = require('../lib/prisma');

function conAlerta(insumo) {
  return {
    ...insumo,
    stock_actual: Number(insumo.stock_actual),
    stock_minimo: Number(insumo.stock_minimo),
    alerta: Number(insumo.stock_actual) < Number(insumo.stock_minimo),
  };
}

// GET /insumos (RF-16: alerta cuando el stock cae debajo del minimo)
async function listar(req, res) {
  const insumos = await prisma.insumo.findMany({ orderBy: { nombre: 'asc' } });
  res.json({ insumos: insumos.map(conAlerta) });
}

// POST /insumos
async function crear(req, res) {
  const { nombre, unidad, stock_minimo, stock_actual } = req.body || {};

  if (!nombre || !unidad) {
    return res.status(400).json({ error: 'Nombre y unidad son requeridos' });
  }

  const minimo = Number(stock_minimo);
  if (!Number.isFinite(minimo) || minimo < 0) {
    return res.status(400).json({ error: 'El stock minimo debe ser un numero valido' });
  }

  const inicial = stock_actual === undefined || stock_actual === null || stock_actual === '' ? 0 : Number(stock_actual);
  if (!Number.isFinite(inicial) || inicial < 0) {
    return res.status(400).json({ error: 'El stock inicial debe ser un numero valido' });
  }

  const insumo = await prisma.insumo.create({
    data: { nombre, unidad, stock_minimo: minimo, stock_actual: inicial },
  });

  res.status(201).json({ insumo: conAlerta(insumo) });
}

// PUT /insumos/:id (nombre, unidad y stock minimo; el stock_actual solo se
// mueve por compras o por el descuento automatico de recetas al vender)
async function actualizar(req, res) {
  const id = Number(req.params.id);
  const { nombre, unidad, stock_minimo } = req.body || {};

  const existente = await prisma.insumo.findUnique({ where: { id } });
  if (!existente) {
    return res.status(404).json({ error: 'Insumo no encontrado' });
  }

  const data = {};
  if (nombre !== undefined) data.nombre = nombre;
  if (unidad !== undefined) data.unidad = unidad;
  if (stock_minimo !== undefined) {
    const minimo = Number(stock_minimo);
    if (!Number.isFinite(minimo) || minimo < 0) {
      return res.status(400).json({ error: 'El stock minimo debe ser un numero valido' });
    }
    data.stock_minimo = minimo;
  }

  const insumo = await prisma.insumo.update({ where: { id }, data });
  res.json({ insumo: conAlerta(insumo) });
}

module.exports = { listar, crear, actualizar };
