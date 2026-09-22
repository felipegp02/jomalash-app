const prisma = require('../lib/prisma');
const { diaCivilBogota, rangosQuincenaBogota } = require('../utils/bogota');

const TIPOS_PAGO = ['vale', 'liquidacion'];
const METODOS_PAGO = ['efectivo', 'transferencia'];

// Días trabajados, comisión ganada (de VENTAS), vales y liquidaciones
// entregados, y saldo pendiente = ganado - vales - liquidaciones, todo
// acotado a los registros ya filtrados por rango (ventas/pagos de un solo
// corte). Vales/liquidaciones se cuentan por su fecha de pago (no por el
// periodo que una liquidación diga cubrir): el corte muestra lo realmente
// entregado en ese rango.
function calcularMetricas(ventasEmp, pagosEmp) {
  const diasTrabajados = new Set(ventasEmp.map((v) => diaCivilBogota(v.fecha))).size;
  const comisionGanada = ventasEmp.reduce((suma, v) => suma + v.comision, 0);
  // 100% para la empleada (ver Venta.propina): se suma al saldo igual que
  // la comision. Con propina=0 en toda venta existente, no cambia nada.
  const propinaGanada = ventasEmp.reduce((suma, v) => suma + v.propina, 0);

  const vales = pagosEmp.filter((p) => p.tipo === 'vale').reduce((suma, p) => suma + p.monto, 0);
  const liquidaciones = pagosEmp
    .filter((p) => p.tipo === 'liquidacion')
    .reduce((suma, p) => suma + p.monto, 0);

  return {
    diasTrabajados,
    comisionGanada,
    propinaGanada,
    vales,
    liquidaciones,
    saldoPendiente: comisionGanada + propinaGanada - vales - liquidaciones,
  };
}

// GET /nomina/resumen?mes=&anio=&sede_id= (Admin)
// Una tarjeta por empleada con dos cortes quincenales (1-15 y 16-fin de
// mes). Cada corte trae sus propias métricas, calculadas solo con lo que
// cae en su rango de fechas (ver calcularMetricas). "noIniciado" indica que
// el corte todavía no arrancó (hoy en Bogota es anterior a su fecha de
// inicio) para que el frontend lo distinga de un corte realmente liquidado
// en $0.
async function resumen(req, res) {
  const mes = Number(req.query.mes);
  const anio = Number(req.query.anio);
  if (!mes || !anio || mes < 1 || mes > 12) {
    return res.status(400).json({ error: 'Mes y anio son requeridos' });
  }

  const { corte1, corte2 } = rangosQuincenaBogota(mes, anio);
  const hoy = diaCivilBogota(new Date());

  const where = { rol: 'empleada' };
  if (req.query.sede_id) where.sede_id = Number(req.query.sede_id);

  const empleadas = await prisma.usuario.findMany({
    where,
    select: { id: true, nombre: true, sede_id: true, sede: { select: { nombre: true } } },
    orderBy: { nombre: 'asc' },
  });

  const idsEmpleadas = empleadas.map((e) => e.id);

  // corte1.fin === corte2.inicio (el instante exacto en que empieza el dia
  // 16 en Bogota): un solo query para el mes completo y se separa en
  // memoria comparando contra ese limite.
  const ventas = idsEmpleadas.length
    ? await prisma.venta.findMany({
        where: { usuario_id: { in: idsEmpleadas }, anulada: false, fecha: { gte: corte1.inicio, lt: corte2.fin } },
        select: { usuario_id: true, fecha: true, comision: true, propina: true },
      })
    : [];

  const pagos = idsEmpleadas.length
    ? await prisma.pagoNomina.findMany({
        where: { usuario_id: { in: idsEmpleadas }, fecha: { gte: corte1.inicio, lt: corte2.fin } },
        select: { usuario_id: true, tipo: true, monto: true, fecha: true },
      })
    : [];

  const resultado = empleadas.map((emp) => {
    const ventasEmp = ventas.filter((v) => v.usuario_id === emp.id);
    const pagosEmp = pagos.filter((p) => p.usuario_id === emp.id);

    const ventasCorte1 = ventasEmp.filter((v) => v.fecha < corte1.fin);
    const ventasCorte2 = ventasEmp.filter((v) => v.fecha >= corte1.fin);
    const pagosCorte1 = pagosEmp.filter((p) => p.fecha < corte1.fin);
    const pagosCorte2 = pagosEmp.filter((p) => p.fecha >= corte1.fin);

    return {
      usuario_id: emp.id,
      nombre: emp.nombre,
      sede_id: emp.sede_id,
      sede: emp.sede.nombre,
      corte1: {
        desde: corte1.desde,
        hasta: corte1.hasta,
        noIniciado: corte1.desde > hoy,
        ...calcularMetricas(ventasCorte1, pagosCorte1),
      },
      corte2: {
        desde: corte2.desde,
        hasta: corte2.hasta,
        noIniciado: corte2.desde > hoy,
        ...calcularMetricas(ventasCorte2, pagosCorte2),
      },
    };
  });

  res.json({ empleadas: resultado });
}

// POST /nomina (Admin) - registra un vale o una liquidación. El pago puede
// ir con un solo metodo (metodo_pago, el caso de siempre) o dividido entre
// efectivo y transferencia (monto_efectivo + monto_transferencia, que deben
// sumar exactamente "monto") - nunca ambas formas a la vez.
async function crear(req, res) {
  const {
    usuario_id,
    sede_id,
    tipo,
    monto,
    metodo_pago,
    monto_efectivo,
    monto_transferencia,
    periodo_inicio,
    periodo_fin,
    nota,
  } = req.body || {};

  if (!usuario_id || !sede_id || !tipo || !monto) {
    return res.status(400).json({ error: 'Empleada, sede, tipo y monto son requeridos' });
  }
  if (!TIPOS_PAGO.includes(tipo)) {
    return res.status(400).json({ error: 'El tipo debe ser vale o liquidacion' });
  }

  const montoNum = Number(monto);
  if (!Number.isFinite(montoNum) || montoNum <= 0) {
    return res.status(400).json({ error: 'El monto debe ser un número positivo' });
  }

  const dividido = monto_efectivo !== undefined || monto_transferencia !== undefined;

  let metodoPagoFinal;
  let montoEfectivoFinal;
  let montoTransferenciaFinal;

  if (dividido) {
    if (metodo_pago) {
      return res.status(400).json({ error: 'Elegí un solo método de pago o dividilo, no ambos' });
    }
    montoEfectivoFinal = Number(monto_efectivo) || 0;
    montoTransferenciaFinal = Number(monto_transferencia) || 0;
    if (montoEfectivoFinal < 0 || montoTransferenciaFinal < 0) {
      return res.status(400).json({ error: 'Los montos divididos no pueden ser negativos' });
    }
    if (montoEfectivoFinal + montoTransferenciaFinal !== montoNum) {
      return res.status(400).json({ error: 'La suma de efectivo y transferencia debe coincidir con el monto total' });
    }
  } else {
    if (!METODOS_PAGO.includes(metodo_pago)) {
      return res.status(400).json({ error: 'El metodo de pago debe ser efectivo o transferencia' });
    }
    metodoPagoFinal = metodo_pago;
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
    metodo_pago: metodoPagoFinal,
    monto_efectivo: montoEfectivoFinal,
    monto_transferencia: montoTransferenciaFinal,
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
