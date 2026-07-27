const prisma = require('../lib/prisma');
const { costoPromedioInsumos, costoInsumosDeVentas } = require('../utils/costos');

// Colombia no tiene horario de verano: el offset UTC-5 es constante todo el ano.
const OFFSET_BOGOTA_MS = 5 * 60 * 60 * 1000;

// Traduce una fecha a su "dia civil" en Bogota, tanto para la columna DATE de
// CIERRES_CAJA (que Prisma lee/escribe como medianoche UTC, sin zona horaria)
// como para el rango de instantes reales (UTC) que filtra VENTAS.fecha. El
// servidor puede correr en otra zona horaria (ej. UTC en el hosting), por eso
// nunca se usa Date.setHours() con la hora local del proceso.
function rangoDiaBogota(fecha) {
  let year;
  let month;
  let day;

  if (fecha) {
    // Llega como "YYYY-MM-DD": es la fecha civil pedida, se usa tal cual.
    [year, month, day] = String(fecha).slice(0, 10).split('-').map(Number);
  } else {
    const partes = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'America/Bogota',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).formatToParts(new Date());
    year = Number(partes.find((p) => p.type === 'year').value);
    month = Number(partes.find((p) => p.type === 'month').value);
    day = Number(partes.find((p) => p.type === 'day').value);
  }

  const fechaColumna = new Date(Date.UTC(year, month - 1, day));
  const inicio = new Date(fechaColumna.getTime() + OFFSET_BOGOTA_MS);
  const fin = new Date(inicio.getTime() + 24 * 60 * 60 * 1000);

  return { fechaColumna, inicio, fin };
}

// RF-22: snapshot fijo del dia, calculado con el mismo criterio de
// "ganancia neta" que usa el Dashboard (venta bruta - comisiones - costo de
// insumos consumidos), para que los números del cierre y del dashboard cuadren.
async function calcularSnapshot(sedeId, fecha) {
  const { fechaColumna, inicio, fin } = rangoDiaBogota(fecha);

  const ventas = await prisma.venta.findMany({
    where: { sede_id: sedeId, anulada: false, fecha: { gte: inicio, lt: fin } },
  });

  const totalServicios = ventas.length;
  const totalVenta = ventas.reduce((suma, v) => suma + v.precio_total, 0);
  const comisionTotal = ventas.reduce((suma, v) => suma + v.comision, 0);

  const costoPromedio = await costoPromedioInsumos();
  const costoInsumos = await costoInsumosDeVentas(ventas, costoPromedio);

  const totalNeto = totalVenta - comisionTotal - costoInsumos;

  return { fecha: fechaColumna, totalServicios, totalVenta, comisionTotal, costoInsumos, totalNeto };
}

// GET /cierres-caja/preview?sede_id=&fecha= (Admin)
// Calcula el snapshot sin guardarlo, para que el admin lo revise antes de confirmar.
async function preview(req, res) {
  const { sede_id, fecha } = req.query;
  if (!sede_id) return res.status(400).json({ error: 'La sede es requerida' });

  const sede = await prisma.sede.findUnique({ where: { id: Number(sede_id) } });
  if (!sede) return res.status(400).json({ error: 'Sede inválida' });

  const snapshot = await calcularSnapshot(sede.id, fecha);

  const yaExiste = await prisma.cierreCaja.findFirst({
    where: { sede_id: sede.id, fecha: snapshot.fecha },
  });

  res.json({ ...snapshot, yaCerrado: Boolean(yaExiste) });
}

// POST /cierres-caja (Admin)
async function crear(req, res) {
  const { sede_id, fecha } = req.body || {};
  if (!sede_id) return res.status(400).json({ error: 'La sede es requerida' });

  const sede = await prisma.sede.findUnique({ where: { id: Number(sede_id) } });
  if (!sede) return res.status(400).json({ error: 'Sede inválida' });

  const snapshot = await calcularSnapshot(sede.id, fecha);

  const yaExiste = await prisma.cierreCaja.findFirst({
    where: { sede_id: sede.id, fecha: snapshot.fecha },
  });
  if (yaExiste) {
    return res.status(400).json({ error: 'Ya existe un cierre de caja para esa sede y fecha' });
  }

  let cierre;
  try {
    cierre = await prisma.cierreCaja.create({
      data: {
        sede_id: sede.id,
        fecha: snapshot.fecha,
        total_servicios: snapshot.totalServicios,
        total_venta: snapshot.totalVenta,
        total_neto: snapshot.totalNeto,
        cerrado_por: req.user.id,
      },
      include: {
        sede: { select: { nombre: true } },
        cerradoPor: { select: { nombre: true } },
      },
    });
  } catch (err) {
    // Red de seguridad ante una condición de carrera (dos cierres a la vez
    // para la misma sede y fecha): la unica fuente de verdad es la
    // restricción unique de la base de datos, no el pre-chequeo de arriba.
    if (err.code === 'P2002') {
      return res.status(400).json({ error: 'Ya existe un cierre de caja para esa sede y fecha' });
    }
    throw err;
  }

  res.status(201).json({ cierre });
}

// GET /cierres-caja?sede_id=&desde=&hasta= (Admin)
async function listar(req, res) {
  const { sede_id, desde, hasta } = req.query;
  const where = {};
  if (sede_id) where.sede_id = Number(sede_id);
  if (desde || hasta) {
    where.fecha = {};
    if (desde) where.fecha.gte = new Date(desde);
    if (hasta) where.fecha.lte = new Date(hasta);
  }

  const cierres = await prisma.cierreCaja.findMany({
    where,
    include: {
      sede: { select: { nombre: true } },
      cerradoPor: { select: { nombre: true } },
    },
    orderBy: { fecha: 'desc' },
  });

  res.json({ cierres });
}

module.exports = { preview, crear, listar };
