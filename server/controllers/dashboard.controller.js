const prisma = require('../lib/prisma');
const { costoPromedioInsumos, costoInsumosDeVentas } = require('../utils/costos');

const MESES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
const DIAS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
const MAPA_DIA_BOGOTA = { Mon: 0, Tue: 1, Wed: 2, Thu: 3, Fri: 4, Sat: 5, Sun: 6 };

function requiereRango(query) {
  const { desde, hasta } = query;
  if (!desde || !hasta) {
    const err = new Error('Debes indicar desde y hasta');
    err.status = 400;
    throw err;
  }
  return { desde: new Date(desde), hasta: new Date(hasta) };
}

// Los servicios se registran desde el mostrador en Bogota; el servidor puede
// correr en otra zona horaria (ej. UTC en el hosting), así que el dia y la
// hora de cada venta se extraen siempre en America/Bogota, sin depender de
// la zona horaria del proceso de Node.
function diaYHoraBogota(fecha) {
  const partes = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Bogota',
    weekday: 'short',
    hour: 'numeric',
    hour12: false,
  }).formatToParts(fecha);

  const weekday = partes.find((p) => p.type === 'weekday').value;
  let hora = Number(partes.find((p) => p.type === 'hour').value);
  if (hora === 24) hora = 0;

  return { diaIndex: MAPA_DIA_BOGOTA[weekday], hora };
}

function construirFiltrosComunes(req, query) {
  const filtros = {};

  if (!req.user.ve_dashboard_completo) {
    // Aislamiento de datos: sin el permiso de dashboard completo, cada quien
    // solo ve su propio desempeno (el default de una empleada recien creada).
    filtros.usuario_id = req.user.id;
  } else {
    if (query.usuario_id) filtros.usuario_id = Number(query.usuario_id);
    if (query.sede_id) filtros.sede_id = Number(query.sede_id);
  }

  if (query.servicio_id) filtros.servicio_id = Number(query.servicio_id);

  return filtros;
}

function sedeEfectiva(req, query) {
  if (!req.user.ve_dashboard_completo) return req.user.sede_id;
  return query.sede_id ? Number(query.sede_id) : null;
}

async function ventasEnRango(filtrosComunes, desde, hasta) {
  return prisma.venta.findMany({
    where: { ...filtrosComunes, anulada: false, fecha: { gte: desde, lt: hasta } },
    include: {
      servicio: { select: { id: true, nombre: true, categoria: true } },
      usuario: { select: { id: true, nombre: true } },
    },
  });
}

// Los gastos son por sede, no por empleada: solo tienen sentido restados en
// una vista de equipo/sede completa. En modo individual (usuario_id presente
// en los filtros) se devuelve 0 sin consultar nada, para que la vista
// personal de cada empleada quede exactamente igual que antes de que
// existieran los gastos.
async function gastoTotalEnRango(filtrosComunes, desde, hasta) {
  if (filtrosComunes.usuario_id) return 0;

  const where = { fecha: { gte: desde, lt: hasta } };
  if (filtrosComunes.sede_id) where.sede_id = filtrosComunes.sede_id;

  const agregado = await prisma.gasto.aggregate({ where, _sum: { monto: true } });
  return agregado._sum.monto || 0;
}

function totalesDe(ventas) {
  const servicios = ventas.length;
  const ventaBruta = ventas.reduce((suma, v) => suma + v.precio_total, 0);
  const comisionTotal = ventas.reduce((suma, v) => suma + v.comision, 0);
  const ticketMedio = servicios ? Math.round(ventaBruta / servicios) : 0;
  return { servicios, ventaBruta, ticketMedio, comisionTotal };
}

// Ganancia neta = venta bruta - comisiones pagadas - costo de insumos
// consumidos - gastos operativos del periodo (estos ultimos solo en vista de
// equipo, ver gastoTotalEnRango). Un periodo sin gastos da gastoTotal=0, que
// deja gananciaNeta identica a la formula anterior (sin gastos).
async function totalesCompletos(ventas, costoPromedio, filtrosComunes, desde, hasta) {
  const base = totalesDe(ventas);
  const costoInsumos = await costoInsumosDeVentas(ventas, costoPromedio);
  const gastoTotal = await gastoTotalEnRango(filtrosComunes, desde, hasta);
  const gananciaNeta = base.ventaBruta - base.comisionTotal - costoInsumos - gastoTotal;
  return { ...base, costoInsumos, gastoTotal, gananciaNeta };
}

function porSedeDe(ventas) {
  const mapa = new Map();
  for (const v of ventas) {
    const actual = mapa.get(v.sede_id) || { sede_id: v.sede_id, servicios: 0, ventaBruta: 0 };
    actual.servicios += 1;
    actual.ventaBruta += v.precio_total;
    mapa.set(v.sede_id, actual);
  }
  return [...mapa.values()];
}

const METODOS_PAGO = ['efectivo', 'transferencia', 'tarjeta'];

function porMetodoPagoDe(ventas) {
  const base = new Map(METODOS_PAGO.map((m) => [m, { metodo_pago: m, servicios: 0, venta: 0 }]));
  for (const v of ventas) {
    const actual = base.get(v.metodo_pago);
    actual.servicios += 1;
    actual.venta += v.precio_total;
  }
  return [...base.values()];
}

async function calcularAvanceMeta(req, query) {
  const ahora = new Date();
  const mes = ahora.getMonth() + 1;
  const anio = ahora.getFullYear();
  const sedeId = sedeEfectiva(req, query);

  const metaWhere = { mes, anio };
  if (sedeId) metaWhere.sede_id = sedeId;
  const metas = await prisma.meta.findMany({ where: metaWhere });
  const metaVenta = metas.length ? metas.reduce((suma, m) => suma + m.meta_venta, 0) : null;

  const inicioMes = new Date(anio, mes - 1, 1);
  const finMes = new Date(anio, mes, 1);
  const ventaWhere = { anulada: false, fecha: { gte: inicioMes, lt: finMes } };
  if (sedeId) ventaWhere.sede_id = sedeId;
  if (!req.user.ve_dashboard_completo) ventaWhere.usuario_id = req.user.id;

  const agregado = await prisma.venta.aggregate({ where: ventaWhere, _sum: { precio_total: true } });
  const ventaActual = agregado._sum.precio_total || 0;

  return {
    metaVenta,
    ventaActual,
    porcentaje: metaVenta ? Math.round((ventaActual / metaVenta) * 100) : null,
  };
}

// GET /dashboard/resumen
async function resumen(req, res) {
  const { desde, hasta } = requiereRango(req.query);
  const filtros = construirFiltrosComunes(req, req.query);

  const ventas = await ventasEnRango(filtros, desde, hasta);
  const costoPromedio = await costoPromedioInsumos();
  const totales = await totalesCompletos(ventas, costoPromedio, filtros, desde, hasta);
  const avanceMeta = await calcularAvanceMeta(req, req.query);
  const porSede = porSedeDe(ventas);
  const porMetodoPago = porMetodoPagoDe(ventas);

  let comparación = null;
  if (req.query.comparar === 'true') {
    const duracion = hasta.getTime() - desde.getTime();
    const prevHasta = desde;
    const prevDesde = new Date(desde.getTime() - duracion);
    const prevVentas = await ventasEnRango(filtros, prevDesde, prevHasta);
    comparación = await totalesCompletos(prevVentas, costoPromedio, filtros, prevDesde, prevHasta);
  }

  res.json({ ...totales, avanceMeta, comparación, porSede, porMetodoPago });
}

// GET /dashboard/tiempo
async function tiempo(req, res) {
  const { desde, hasta } = requiereRango(req.query);
  const filtros = construirFiltrosComunes(req, req.query);
  const ventas = await ventasEnRango(filtros, desde, hasta);

  const porDiaSemana = DIAS.map((dia) => ({ dia, servicios: 0 }));
  const porHora = Array.from({ length: 24 }, (_, hora) => ({ hora, servicios: 0 }));

  for (const v of ventas) {
    const { diaIndex, hora } = diaYHoraBogota(v.fecha);
    porDiaSemana[diaIndex].servicios += 1;
    porHora[hora].servicios += 1;
  }

  res.json({ porDiaSemana, porHora });
}

// GET /dashboard/categorias
async function categorias(req, res) {
  const { desde, hasta } = requiereRango(req.query);
  const filtros = construirFiltrosComunes(req, req.query);
  const ventas = await ventasEnRango(filtros, desde, hasta);

  const mapa = new Map();
  for (const v of ventas) {
    const cat = v.servicio.categoria;
    const actual = mapa.get(cat) || { categoria: cat, servicios: 0, venta: 0 };
    actual.servicios += 1;
    actual.venta += v.precio_total;
    mapa.set(cat, actual);
  }

  const resultado = [...mapa.values()].sort((a, b) => b.servicios - a.servicios);
  res.json({ categorias: resultado });
}

// GET /dashboard/servicios (ranking de servicios individuales)
async function serviciosRanking(req, res) {
  const { desde, hasta } = requiereRango(req.query);
  const filtros = construirFiltrosComunes(req, req.query);
  const ventas = await ventasEnRango(filtros, desde, hasta);

  const mapa = new Map();
  for (const v of ventas) {
    const actual = mapa.get(v.servicio_id) || {
      servicio_id: v.servicio_id,
      nombre: v.servicio.nombre,
      categoria: v.servicio.categoria,
      servicios: 0,
      venta: 0,
    };
    actual.servicios += 1;
    actual.venta += v.precio_total;
    mapa.set(v.servicio_id, actual);
  }

  const ranking = [...mapa.values()].sort((a, b) => b.servicios - a.servicios);
  res.json({ ranking });
}

// GET /dashboard/empleadas (Admin)
async function empleadasRanking(req, res) {
  const { desde, hasta } = requiereRango(req.query);
  const filtros = construirFiltrosComunes(req, req.query);
  const ventas = await ventasEnRango(filtros, desde, hasta);

  const mapa = new Map();
  for (const v of ventas) {
    const actual = mapa.get(v.usuario_id) || {
      usuario_id: v.usuario_id,
      nombre: v.usuario.nombre,
      comision: 0,
      servicios: 0,
      venta: 0,
    };
    actual.comision += v.comision;
    actual.servicios += 1;
    actual.venta += v.precio_total;
    mapa.set(v.usuario_id, actual);
  }

  const ranking = [...mapa.values()].sort((a, b) => b.comision - a.comision);
  res.json({ ranking });
}

// GET /dashboard/tendencia (venta de los últimos 6 meses, o de los últimos 30 días)
async function tendencia(req, res) {
  const filtros = construirFiltrosComunes(req, req.query);
  const granularidad = req.query.granularidad === 'diario' ? 'diario' : 'mensual';
  const ahora = new Date();

  if (granularidad === 'diario') {
    const hoy = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate());
    const desde = new Date(hoy);
    desde.setDate(desde.getDate() - 29);
    const hasta = new Date(hoy);
    hasta.setDate(hasta.getDate() + 1);

    const ventas = await ventasEnRango(filtros, desde, hasta);

    const totalesPorDia = new Map();
    for (const v of ventas) {
      const clave = new Date(v.fecha).toDateString();
      const actual = totalesPorDia.get(clave) || { venta: 0, servicios: 0 };
      actual.venta += v.precio_total;
      actual.servicios += 1;
      totalesPorDia.set(clave, actual);
    }

    const puntos = [];
    for (let i = 0; i < 30; i += 1) {
      const dia = new Date(desde);
      dia.setDate(dia.getDate() + i);
      const totales = totalesPorDia.get(dia.toDateString());
      puntos.push({
        etiqueta: `${dia.getDate()} ${MESES[dia.getMonth()]}`,
        venta: totales?.venta || 0,
        servicios: totales?.servicios || 0,
      });
    }

    return res.json({ granularidad, puntos });
  }

  const puntos = [];
  for (let i = 5; i >= 0; i -= 1) {
    const inicio = new Date(ahora.getFullYear(), ahora.getMonth() - i, 1);
    const fin = new Date(ahora.getFullYear(), ahora.getMonth() - i + 1, 1);

    const agregado = await prisma.venta.aggregate({
      where: { ...filtros, anulada: false, fecha: { gte: inicio, lt: fin } },
      _sum: { precio_total: true },
      _count: { _all: true },
    });

    puntos.push({
      etiqueta: `${MESES[inicio.getMonth()]} ${inicio.getFullYear()}`,
      venta: agregado._sum.precio_total || 0,
      servicios: agregado._count._all || 0,
    });
  }

  res.json({ granularidad, puntos });
}

module.exports = { resumen, tiempo, categorias, serviciosRanking, empleadasRanking, tendencia };
