const prisma = require('../lib/prisma');
const { diaCivilBogota, rangoMesBogota } = require('../utils/bogota');

const TIPOS_PAGO = ['vale', 'liquidacion'];
const METODOS_PAGO = ['efectivo', 'transferencia'];

// GET /nomina/resumen?mes=&anio=&sede_id= (Admin)
// Una tarjeta por empleada: días trabajados, comisión ganada (de VENTAS),
// vales y liquidaciones entregados en el mes, y saldo pendiente = ganado -
// vales - liquidaciones. Vales/liquidaciones se cuentan por su fecha de
// pago (no por el periodo que una liquidación diga cubrir): la tarjeta del
// mes muestra lo realmente entregado ese mes.
async function resumen(req, res) {
  const mes = Number(req.query.mes);
  const anio = Number(req.query.anio);
  if (!mes || !anio || mes < 1 || mes > 12) {
    return res.status(400).json({ error: 'Mes y anio son requeridos' });
  }

  const { inicio, fin } = rangoMesBogota(mes, anio);

  const where = { rol: 'empleada' };
  if (req.query.sede_id) where.sede_id = Number(req.query.sede_id);

  const empleadas = await prisma.usuario.findMany({
    where,
    select: { id: true, nombre: true, sede_id: true, sede: { select: { nombre: true } } },
    orderBy: { nombre: 'asc' },
  });

  const idsEmpleadas = empleadas.map((e) => e.id);

  const ventas = idsEmpleadas.length
    ? await prisma.venta.findMany({
        where: { usuario_id: { in: idsEmpleadas }, anulada: false, fecha: { gte: inicio, lt: fin } },
        select: { usuario_id: true, fecha: true, comision: true },
      })
    : [];

  const pagos = idsEmpleadas.length
    ? await prisma.pagoNomina.findMany({
        where: { usuario_id: { in: idsEmpleadas }, fecha: { gte: inicio, lt: fin } },
        select: { usuario_id: true, tipo: true, monto: true },
      })
    : [];

  const resultado = empleadas.map((emp) => {
    const ventasEmp = ventas.filter((v) => v.usuario_id === emp.id);
    const diasTrabajados = new Set(ventasEmp.map((v) => diaCivilBogota(v.fecha))).size;
    const comisionGanada = ventasEmp.reduce((suma, v) => suma + v.comision, 0);

    const pagosEmp = pagos.filter((p) => p.usuario_id === emp.id);
    const vales = pagosEmp.filter((p) => p.tipo === 'vale').reduce((suma, p) => suma + p.monto, 0);
    const liquidaciones = pagosEmp
      .filter((p) => p.tipo === 'liquidacion')
      .reduce((suma, p) => suma + p.monto, 0);

    return {
      usuario_id: emp.id,
      nombre: emp.nombre,
      sede_id: emp.sede_id,
      sede: emp.sede.nombre,
      diasTrabajados,
      comisionGanada,
      vales,
      liquidaciones,
      saldoPendiente: comisionGanada - vales - liquidaciones,
    };
  });

  res.json({ empleadas: resultado });
}

// POST /nomina (Admin) - registra un vale o una liquidación.
async function crear(req, res) {
  const { usuario_id, sede_id, tipo, monto, metodo_pago, periodo_inicio, periodo_fin, nota } =
    req.body || {};

  if (!usuario_id || !sede_id || !tipo || !monto || !metodo_pago) {
    return res.status(400).json({ error: 'Empleada, sede, tipo, monto y metodo de pago son requeridos' });
  }
  if (!TIPOS_PAGO.includes(tipo)) {
    return res.status(400).json({ error: 'El tipo debe ser vale o liquidacion' });
  }
  if (!METODOS_PAGO.includes(metodo_pago)) {
    return res.status(400).json({ error: 'El metodo de pago debe ser efectivo o transferencia' });
  }

  const montoNum = Number(monto);
  if (!Number.isFinite(montoNum) || montoNum <= 0) {
    return res.status(400).json({ error: 'El monto debe ser un número positivo' });
  }

  const empleada = await prisma.usuario.findUnique({ where: { id: Number(usuario_id) } });
  if (!empleada || empleada.rol !== 'empleada') {
    return res.status(400).json({ error: 'Empleada inválida' });
  }

  const sede = await prisma.sede.findUnique({ where: { id: Number(sede_id) } });
  if (!sede) {
    return res.status(400).json({ error: 'Sede inválida' });
  }

  const data = {
    usuario_id: empleada.id,
    sede_id: sede.id,
    tipo,
    monto: montoNum,
    metodo_pago,
    nota: nota?.trim() ? nota.trim() : null,
    registrado_por: req.user.id,
  };

  if (periodo_inicio) data.periodo_inicio = new Date(periodo_inicio);
  if (periodo_fin) data.periodo_fin = new Date(periodo_fin);

  const pago = await prisma.pagoNomina.create({
    data,
    include: { registradoPor: { select: { nombre: true } } },
  });

  res.status(201).json({ pago });
}

// GET /nomina/:usuarioId/historial?desde=&hasta= (Admin)
// Sin desde/hasta trae TODO el historial de la empleada, sin límite de
// fecha: el filtro es opcional, no un rango por defecto.
async function historial(req, res) {
  const usuarioId = Number(req.params.usuarioId);
  const { desde, hasta } = req.query;

  const where = { usuario_id: usuarioId };
  if (desde || hasta) {
    where.fecha = {};
    if (desde) where.fecha.gte = new Date(desde);
    if (hasta) where.fecha.lt = new Date(hasta);
  }

  const pagos = await prisma.pagoNomina.findMany({
    where,
    include: { registradoPor: { select: { nombre: true } } },
    orderBy: { fecha: 'desc' },
  });

  res.json({ pagos });
}

module.exports = { resumen, crear, historial };
