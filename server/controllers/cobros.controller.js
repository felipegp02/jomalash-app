const prisma = require('../lib/prisma');
const { diaYaCerrado, MENSAJE_DIA_CERRADO } = require('../utils/cierres');
const { ventaConRelaciones } = require('./ventas.controller');

const METODOS_PAGO = ['efectivo', 'transferencia', 'tarjeta'];

function toNumber(valor) {
  if (valor === null || valor === undefined) return 0;
  return typeof valor === 'object' && typeof valor.toNumber === 'function'
    ? valor.toNumber()
    : Number(valor);
}

// POST /cobros - reemplaza al viejo POST /ventas. Acepta 1+ lineas (cada una
// con su propio servicio/empleada/monto/propina, igual que una venta
// individual de siempre) y 1+ metodos de pago que juntos deben cubrir
// exactamente la suma de las lineas. El pago no esta atado a una linea
// especifica: puede repartirse libremente entre metodos.
//
// Caso simple (1 linea, 1 metodo de pago): no se crea ningun Cobro, se
// guarda una VENTA suelta identica a como se guardaba antes de que
// existiera este endpoint (mismos campos, mismo calculo de comision, mismo
// descuento de insumos).
async function crear(req, res) {
  const { lineas, pagos, fecha } = req.body || {};

  if (!Array.isArray(lineas) || lineas.length === 0) {
    return res.status(400).json({ error: 'Se requiere al menos un servicio' });
  }
  if (!Array.isArray(pagos) || pagos.length === 0) {
    return res.status(400).json({ error: 'Se requiere al menos un método de pago' });
  }

  const metodosVistos = new Set();
  let totalPagos = 0;
  for (const p of pagos) {
    if (!METODOS_PAGO.includes(p?.metodo_pago)) {
      return res.status(400).json({ error: 'El metodo de pago debe ser efectivo, transferencia o tarjeta' });
    }
    if (metodosVistos.has(p.metodo_pago)) {
      return res.status(400).json({ error: 'No repitas el mismo método de pago' });
    }
    metodosVistos.add(p.metodo_pago);

    const montoNum = Number(p.monto);
    if (!Number.isFinite(montoNum) || montoNum <= 0) {
      return res.status(400).json({ error: 'Cada monto de pago debe ser un número positivo' });
    }
    totalPagos += montoNum;
  }

  // Fecha retroactiva (solo Admin): mismo criterio que ya existia en
  // ventas.controller.js. Vacia = ahora mismo, sin tocar data.fecha abajo.
  let fechaVenta;
  if (fecha) {
    if (req.user.rol !== 'admin') {
      return res.status(403).json({ error: 'Solo un administrador puede registrar una venta con fecha retroactiva' });
    }
    fechaVenta = new Date(`${fecha}T17:00:00.000Z`);
    if (Number.isNaN(fechaVenta.getTime()) || fechaVenta.getTime() > Date.now()) {
      return res.status(400).json({ error: 'La fecha debe ser una fecha valida, no futura' });
    }
  }
  const fechaEfectiva = fechaVenta || new Date();

  const lineasResueltas = [];
  let sedeIdComun = null;

  for (const linea of lineas) {
    const { servicio_id, precio_total, propina, propina_metodo_pago } = linea || {};
    if (!servicio_id) {
      return res.status(400).json({ error: 'Cada línea requiere un servicio' });
    }

    const servicio = await prisma.servicio.findUnique({ where: { id: Number(servicio_id) } });
    if (!servicio || !servicio.activo) {
      return res.status(400).json({ error: 'Servicio inválido' });
    }

    let usuarioAtiende;
    if (req.user.rol === 'empleada') {
      // Una empleada solo puede registrar lineas propias: se ignora
      // cualquier usuario_id que venga, en cada linea, y se usa siempre el
      // de su sesión. Esto impide de raiz que arme un cobro con lineas de
      // otra empleada - solo Admin puede mezclar empleadas en un cobro.
      usuarioAtiende = await prisma.usuario.findUnique({ where: { id: req.user.id } });
    } else {
      const { usuario_id } = linea;
      if (!usuario_id) {
        return res.status(400).json({ error: 'Cada línea requiere una empleada' });
      }
      usuarioAtiende = await prisma.usuario.findUnique({ where: { id: Number(usuario_id) } });
    }

    if (!usuarioAtiende || !usuarioAtiende.activo) {
      return res.status(400).json({ error: 'Empleada inválida' });
    }

    if (sedeIdComun === null) {
      sedeIdComun = usuarioAtiende.sede_id;
    } else if (sedeIdComun !== usuarioAtiende.sede_id) {
      return res.status(400).json({ error: 'Todas las líneas de un mismo cobro deben ser de la misma sede' });
    }

    const total = precio_total === undefined || precio_total === null || precio_total === ''
      ? servicio.precio
      : Number(precio_total);
    if (!Number.isFinite(total) || total <= 0) {
      return res.status(400).json({ error: 'El total de cada servicio debe ser un número positivo' });
    }

    let propinaNum = 0;
    let propinaMetodo;
    if (propina !== undefined && propina !== null && propina !== '') {
      propinaNum = Number(propina);
      if (!Number.isFinite(propinaNum) || propinaNum <= 0) {
        return res.status(400).json({ error: 'La propina debe ser un número positivo' });
      }
      if (!METODOS_PAGO.includes(propina_metodo_pago)) {
        return res.status(400).json({ error: 'El metodo de pago de la propina debe ser efectivo, transferencia o tarjeta' });
      }
      propinaMetodo = propina_metodo_pago;
    }

    const receta = await prisma.receta.findMany({ where: { servicio_id: servicio.id } });

    // RF-08 / RNF-03: la comision se calcula en el servidor, nunca se acepta desde el cliente.
    const comision = Math.round(total * toNumber(usuarioAtiende.porcentaje_comision));

    lineasResueltas.push({ servicio, usuarioAtiende, total, comision, propina: propinaNum, propinaMetodo, receta });
  }

  const totalLineas = lineasResueltas.reduce((suma, l) => suma + l.total, 0);
  if (totalLineas !== totalPagos) {
    return res.status(400).json({ error: 'La suma de los pagos debe coincidir con el total de los servicios' });
  }

  if (await diaYaCerrado(sedeIdComun, fechaEfectiva)) {
    return res.status(400).json({ error: MENSAJE_DIA_CERRADO });
  }

  // Caso simple: 1 sola linea pagada con 1 solo metodo -> ninguna fila de
  // COBROS, la VENTA queda identica a como se guardaba antes de este cambio.
  const esCasoSimple = lineasResueltas.length === 1 && pagos.length === 1;

  const resultado = await prisma.$transaction(async (tx) => {
    let cobroId = null;

    if (!esCasoSimple) {
      const dataCobro = { sede_id: sedeIdComun };
      if (fechaVenta) dataCobro.fecha = fechaVenta;
      for (const p of pagos) {
        if (p.metodo_pago === 'efectivo') dataCobro.pago_efectivo = Number(p.monto);
        if (p.metodo_pago === 'transferencia') dataCobro.pago_transferencia = Number(p.monto);
        if (p.metodo_pago === 'tarjeta') dataCobro.pago_tarjeta = Number(p.monto);
      }
      const cobro = await tx.cobro.create({ data: dataCobro });
      cobroId = cobro.id;
    }

    const ventasCreadas = [];
    for (const l of lineasResueltas) {
      const nuevaVenta = await tx.venta.create({
        data: {
          servicio_id: l.servicio.id,
          usuario_id: l.usuarioAtiende.id,
          sede_id: l.usuarioAtiende.sede_id,
          precio_total: l.total,
          comision: l.comision,
          metodo_pago: esCasoSimple ? pagos[0].metodo_pago : null,
          cobro_id: cobroId,
          propina: l.propina,
          propina_metodo_pago: l.propinaMetodo,
          ...(fechaVenta ? { fecha: fechaVenta } : {}),
        },
        include: ventaConRelaciones,
      });
      ventasCreadas.push(nuevaVenta);

      for (const receta of l.receta) {
        await tx.insumo.update({
          where: { id: receta.insumo_id },
          data: { stock_actual: { decrement: receta.cantidad_usada } },
        });
      }
    }

    return { ventas: ventasCreadas, cobroId };
  });

  res.status(201).json({ ventas: resultado.ventas, cobro_id: resultado.cobroId });
}

// PUT /cobros/:id/anular (Admin) - anula TODAS las lineas del cobro de una
// sola vez (mismo motivo, mismo admin, misma fecha/hora), en vez de anular
// una linea individual (ver ventas.controller.js: un cobro de 2+ servicios
// ya no admite anulacion por linea, justamente para no dejar ambiguedad
// sobre como quedo repartido el pago entre metodos). Si la clienta se queda
// con parte de los servicios, se registra un cobro nuevo aparte con lo que
// corresponda.
async function anular(req, res) {
  const id = Number(req.params.id);
  const { motivo } = req.body || {};

  const cobro = await prisma.cobro.findUnique({
    where: { id },
    include: { ventas: true },
  });
  if (!cobro) {
    return res.status(404).json({ error: 'Cobro no encontrado' });
  }

  // Mismo criterio que ventas.controller.js: el dia del cobro (no el de hoy)
  // es lo que importa, por si se esta corrigiendo un cobro viejo.
  if (await diaYaCerrado(cobro.sede_id, cobro.fecha)) {
    return res.status(400).json({ error: MENSAJE_DIA_CERRADO });
  }

  const lineasActivas = cobro.ventas.filter((v) => !v.anulada);
  if (lineasActivas.length === 0) {
    return res.status(400).json({ error: 'Este cobro ya está anulado' });
  }

  if (!motivo) {
    return res.status(400).json({ error: 'El motivo de anulación es requerido' });
  }

  const ventasAnuladas = await prisma.$transaction(async (tx) => {
    const resultado = [];
    for (const linea of lineasActivas) {
      const recetaDeLinea = await tx.receta.findMany({ where: { servicio_id: linea.servicio_id } });

      const actualizada = await tx.venta.update({
        where: { id: linea.id },
        data: {
          anulada: true,
          motivo_anulacion: motivo,
          editado_por: req.user.id,
          fecha_edicion: new Date(),
        },
        include: ventaConRelaciones,
      });
      resultado.push(actualizada);

      // Revierte el descuento de insumos aplicado al registrar cada linea.
      for (const receta of recetaDeLinea) {
        await tx.insumo.update({
          where: { id: receta.insumo_id },
          data: { stock_actual: { increment: receta.cantidad_usada } },
        });
      }
    }
    return resultado;
  });

  res.json({ ventas: ventasAnuladas });
}

module.exports = { crear, anular };
