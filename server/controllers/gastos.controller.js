const prisma = require('../lib/prisma');

const CATEGORIAS = ['arriendo', 'servicios', 'varios'];

const gastoConRelaciones = {
  sede: { select: { nombre: true } },
  registradoPor: { select: { nombre: true } },
};

// GET /gastos?sede_id=&desde=&hasta= (ve_caja) - sede_id vacio = consolidado
// de ambas sedes, mismo criterio que Historial de ventas.
async function listar(req, res) {
  const { sede_id, desde, hasta } = req.query;
  const where = {};

  if (sede_id) where.sede_id = Number(sede_id);
  if (desde || hasta) {
    where.fecha = {};
    if (desde) where.fecha.gte = new Date(desde);
    if (hasta) where.fecha.lt = new Date(hasta);
  }

  const gastos = await prisma.gasto.findMany({
    where,
    orderBy: { fecha: 'desc' },
    include: gastoConRelaciones,
  });

  res.json({ gastos });
}

// POST /gastos (ve_caja)
async function crear(req, res) {
  const { categoria, monto, nota, sede_id } = req.body || {};

  if (!categoria || !CATEGORIAS.includes(categoria)) {
    return res.status(400).json({ error: 'La categoría debe ser arriendo, servicios o varios' });
  }
  if (!sede_id) {
    return res.status(400).json({ error: 'La sede es requerida' });
  }

  const sede = await prisma.sede.findUnique({ where: { id: Number(sede_id) } });
  if (!sede) {
    return res.status(400).json({ error: 'Sede inválida' });
  }

  const montoNum = Number(monto);
  if (!Number.isFinite(montoNum) || montoNum <= 0) {
    return res.status(400).json({ error: 'El monto debe ser un número positivo' });
  }

  const gasto = await prisma.gasto.create({
    data: {
      categoria,
      monto: montoNum,
      nota: nota || null,
      sede_id: sede.id,
      registrado_por: req.user.id,
    },
    include: gastoConRelaciones,
  });

  res.status(201).json({ gasto });
}

module.exports = { listar, crear };
