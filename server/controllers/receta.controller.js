const prisma = require('../lib/prisma');

const insumoSelect = { nombre: true, tipo_medida: true, tipo: true };

// GET /receta/:servicio_id
async function obtener(req, res) {
  const servicioId = Number(req.params.servicio_id);

  const servicio = await prisma.servicio.findUnique({ where: { id: servicioId } });
  if (!servicio) {
    return res.status(404).json({ error: 'Servicio no encontrado' });
  }

  const receta = await prisma.receta.findMany({
    where: { servicio_id: servicioId },
    include: { insumo: { select: insumoSelect } },
    orderBy: { id: 'asc' },
  });

  res.json({ servicio: { id: servicio.id, nombre: servicio.nombre }, receta });
}

// PUT /receta/:servicio_id (RF-14: reemplaza la receta completa del servicio)
async function actualizar(req, res) {
  const servicioId = Number(req.params.servicio_id);
  const { lineas } = req.body || {};

  const servicio = await prisma.servicio.findUnique({ where: { id: servicioId } });
  if (!servicio) {
    return res.status(404).json({ error: 'Servicio no encontrado' });
  }

  if (!Array.isArray(lineas)) {
    return res.status(400).json({ error: 'Las lineas de receta deben ser una lista' });
  }

  const insumoIds = lineas.map((l) => Number(l.insumo_id));
  if (new Set(insumoIds).size !== insumoIds.length) {
    return res.status(400).json({ error: 'No puedes repetir el mismo insumo en la receta' });
  }

  for (const linea of lineas) {
    const cantidad = Number(linea.cantidad_usada);
    if (!linea.insumo_id || !Number.isFinite(cantidad) || cantidad <= 0) {
      return res.status(400).json({ error: 'Cada linea necesita un insumo y una cantidad positiva' });
    }
  }

  if (insumoIds.length) {
    const insumosUsados = await prisma.insumo.findMany({ where: { id: { in: insumoIds } } });
    if (insumosUsados.length !== insumoIds.length) {
      return res.status(400).json({ error: 'Alguno de los insumos no existe' });
    }
    // Las recetas solo pueden usar consumibles: una herramienta no se
    // descuenta al vender, no tiene sentido ponerla en una receta.
    const conHerramienta = insumosUsados.some((i) => i.tipo === 'herramienta');
    if (conHerramienta) {
      return res.status(400).json({ error: 'Las recetas solo pueden usar insumos consumibles, no herramientas' });
    }
  }

  const receta = await prisma.$transaction(async (tx) => {
    await tx.receta.deleteMany({ where: { servicio_id: servicioId } });

    if (lineas.length) {
      await tx.receta.createMany({
        data: lineas.map((l) => ({
          servicio_id: servicioId,
          insumo_id: Number(l.insumo_id),
          cantidad_usada: Number(l.cantidad_usada),
        })),
      });
    }

    return tx.receta.findMany({
      where: { servicio_id: servicioId },
      include: { insumo: { select: insumoSelect } },
      orderBy: { id: 'asc' },
    });
  });

  res.json({ servicio: { id: servicio.id, nombre: servicio.nombre }, receta });
}

module.exports = { obtener, actualizar };
