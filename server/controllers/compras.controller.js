const prisma = require('../lib/prisma');

const compraConRelaciones = {
  insumo: { select: { nombre: true, unidad: true } },
  sede: { select: { nombre: true } },
};

// GET /compras
async function listar(req, res) {
  const { insumo_id, sede_id } = req.query;
  const where = {};
  if (insumo_id) where.insumo_id = Number(insumo_id);
  if (sede_id) where.sede_id = Number(sede_id);

  const compras = await prisma.compra.findMany({
    where,
    orderBy: { fecha: 'desc' },
    include: compraConRelaciones,
  });

  res.json({ compras });
}

// POST /compras (RF-15: suma la cantidad comprada al stock disponible)
async function crear(req, res) {
  const { insumo_id, cantidad, costo_total, sede_id } = req.body || {};

  if (!insumo_id || !sede_id) {
    return res.status(400).json({ error: 'El insumo y la sede son requeridos' });
  }

  const insumo = await prisma.insumo.findUnique({ where: { id: Number(insumo_id) } });
  if (!insumo) {
    return res.status(400).json({ error: 'Insumo invalido' });
  }

  const sede = await prisma.sede.findUnique({ where: { id: Number(sede_id) } });
  if (!sede) {
    return res.status(400).json({ error: 'Sede invalida' });
  }

  const cantidadNum = Number(cantidad);
  if (!Number.isFinite(cantidadNum) || cantidadNum <= 0) {
    return res.status(400).json({ error: 'La cantidad debe ser un numero positivo' });
  }

  const costoNum = Number(costo_total);
  if (!Number.isFinite(costoNum) || costoNum <= 0) {
    return res.status(400).json({ error: 'El costo total debe ser un numero positivo' });
  }

  const compra = await prisma.$transaction(async (tx) => {
    const nuevaCompra = await tx.compra.create({
      data: {
        insumo_id: insumo.id,
        sede_id: sede.id,
        cantidad: cantidadNum,
        costo_total: costoNum,
        fecha: new Date(),
      },
      include: compraConRelaciones,
    });

    await tx.insumo.update({
      where: { id: insumo.id },
      data: { stock_actual: { increment: cantidadNum } },
    });

    return nuevaCompra;
  });

  res.status(201).json({ compra });
}

module.exports = { listar, crear };
