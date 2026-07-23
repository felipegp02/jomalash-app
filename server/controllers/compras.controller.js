const prisma = require('../lib/prisma');

const compraConRelaciones = {
  insumo: { select: { nombre: true, tipo: true, tipo_medida: true, unidad_compra: true } },
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

  // Las herramientas se compran y se cuentan en unidades enteras, sin
  // conversion (RF nuevo del modulo de insumos: "solo suma unidades enteras
  // al stock, sin conversion").
  if (insumo.tipo === 'herramienta' && !Number.isInteger(cantidadNum)) {
    return res.status(400).json({ error: 'Las herramientas se compran en unidades enteras' });
  }

  const costoNum = Number(costo_total);
  if (!Number.isFinite(costoNum) || costoNum <= 0) {
    return res.status(400).json({ error: 'El costo total debe ser un numero positivo' });
  }

  // "cantidad" queda registrada en unidad_compra (ej. 1 paquete), pero el
  // stock de un consumible se lleva en su unidad de uso (ej. ml), asi que
  // lo que se suma al stock_actual es cantidad x contenido_por_compra, no
  // la cantidad comprada tal cual. Las herramientas no tienen conversion.
  const incrementoStock =
    insumo.tipo === 'herramienta' ? cantidadNum : cantidadNum * Number(insumo.contenido_por_compra);

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
      data: { stock_actual: { increment: incrementoStock } },
    });

    return nuevaCompra;
  });

  res.status(201).json({ compra, incrementoStock });
}

module.exports = { listar, crear };
