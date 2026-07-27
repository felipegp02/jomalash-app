const prisma = require('../lib/prisma');

// GET /metas?sede_id=&anio= (Admin)
async function listar(req, res) {
  const { sede_id, anio } = req.query;
  const where = {};
  if (sede_id) where.sede_id = Number(sede_id);
  if (anio) where.anio = Number(anio);

  const metas = await prisma.meta.findMany({
    where,
    include: { sede: { select: { nombre: true } } },
    orderBy: [{ anio: 'desc' }, { mes: 'desc' }],
  });

  res.json({ metas });
}

// PUT /metas (Admin) - define la meta del mes si no existe, o la actualiza si ya existe
async function definir(req, res) {
  const { sede_id, mes, anio, meta_venta } = req.body || {};
  if (!sede_id || !mes || !anio || !meta_venta) {
    return res.status(400).json({ error: 'Sede, mes, anio y meta de venta son requeridos' });
  }

  const mesNum = Number(mes);
  const anioNum = Number(anio);
  const metaNum = Number(meta_venta);

  if (!Number.isInteger(mesNum) || mesNum < 1 || mesNum > 12) {
    return res.status(400).json({ error: 'El mes debe estar entre 1 y 12' });
  }
  if (!Number.isFinite(metaNum) || metaNum <= 0) {
    return res.status(400).json({ error: 'La meta de venta debe ser un número positivo' });
  }

  const sede = await prisma.sede.findUnique({ where: { id: Number(sede_id) } });
  if (!sede) return res.status(400).json({ error: 'Sede inválida' });

  const meta = await prisma.meta.upsert({
    where: { sede_id_mes_anio: { sede_id: sede.id, mes: mesNum, anio: anioNum } },
    update: { meta_venta: metaNum },
    create: { sede_id: sede.id, mes: mesNum, anio: anioNum, meta_venta: metaNum },
    include: { sede: { select: { nombre: true } } },
  });

  res.json({ meta });
}

module.exports = { listar, definir };
