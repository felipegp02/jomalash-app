const prisma = require('../lib/prisma');
const { diaYaCerrado, MENSAJE_DIA_CERRADO } = require('../utils/cierres');

const ventaConRelaciones = {
  servicio: { select: { nombre: true, categoria: true } },
  usuario: { select: { nombre: true } },
  sede: { select: { nombre: true } },
  editadoPor: { select: { nombre: true } },
  // Para lineas de un Cobro (metodo_pago null): el Historial necesita el
  // desglose de pago del cobro para mostrarlo agrupado (ver ListaMovimientos.jsx).
  cobro: { select: { id: true, pago_efectivo: true, pago_transferencia: true, pago_tarjeta: true } },
};

function toNumber(valor) {
  if (valor === null || valor === undefined) return 0;
  return typeof valor === 'object' && typeof valor.toNumber === 'function'
    ? valor.toNumber()
    : Number(valor);
}

const METODOS_PAGO = ['efectivo', 'transferencia', 'tarjeta'];

// GET /ventas (RF-21: filtrable por empleada, sede, servicio y rango de fechas; empleada solo ve las suyas)
async function listar(req, res) {
  const { sede_id, usuario_id, servicio_id, desde, hasta } = req.query;
  const where = {};

  if (req.user.rol === 'empleada') {
    where.usuario_id = req.user.id;
  } else if (usuario_id) {
    where.usuario_id = Number(usuario_id);
  }

  if (sede_id) where.sede_id = Number(sede_id);
  if (servicio_id) where.servicio_id = Number(servicio_id);

  if (desde || hasta) {
    where.fecha = {};
    // "hasta" se trata como límite exclusivo (igual que en /dashboard/*): el
    // caller debe mandar el inicio del dia siguiente para incluir el dia
    // completo, no una hora exacta que dejaria afuera casi todo ese dia.
    if (desde) where.fecha.gte = new Date(desde);
    if (hasta) where.fecha.lt = new Date(hasta);
  }

  const ventas = await prisma.venta.findMany({
    where,
    orderBy: { fecha: 'desc' },
    include: ventaConRelaciones,
  });

  res.json({ ventas });
}

// PUT /ventas/:id (RF-09, RNF-11: editar o anular, dejando constancia de quien y cuando)
async function actualizar(req, res) {
  const id = Number(req.params.id);
  const { precio_total, metodo_pago, anulada, motivo } = req.body || {};

  if (metodo_pago !== undefined && !METODOS_PAGO.includes(metodo_pago)) {
    return res.status(400).json({ error: 'El metodo de pago debe ser efectivo, transferencia o tarjeta' });
  }

  const venta = await prisma.venta.findUnique({ where: { id }, include: { usuario: true } });
  if (!venta) {
    return res.status(404).json({ error: 'Venta no encontrada' });
  }

  // Aplica tanto a editar como a anular: el dia de la venta (no el de hoy)
  // es lo que importa, ya que se puede estar corrigiendo una venta vieja.
  if (await diaYaCerrado(venta.sede_id, venta.fecha)) {
    return res.status(400).json({ error: MENSAJE_DIA_CERRADO });
  }

  if (venta.anulada) {
    return res.status(400).json({ error: 'La venta ya está anulada' });
  }

  // El metodo de pago de una linea que pertenece a un Cobro vive en el
  // Cobro (posiblemente repartido entre varios metodos), no por linea: no
  // hay un valor unico que editar aca. Anular o editar el precio_total de
  // esa linea individual si sigue permitido, igual que siempre.
  if (metodo_pago !== undefined && venta.cobro_id) {
    return res.status(400).json({
      error: 'Esta venta forma parte de un cobro con varios servicios: el metodo de pago se edita a nivel del cobro completo, no por servicio individual',
    });
  }

  if (anulada) {
    // Un cobro de 2+ servicios ya no se anula linea por linea: hay que
    // anular el cobro completo (PUT /cobros/:id/anular) para no dejar
    // ambiguedad sobre como quedo repartido el pago entre los metodos. Un
    // cobro de 1 sola linea (pago dividido pero un solo servicio) no entra
    // aca: anular esa unica linea ya anula el cobro entero, sin ambiguedad.
    if (venta.cobro_id) {
      const lineasDelCobro = await prisma.venta.count({ where: { cobro_id: venta.cobro_id } });
      if (lineasDelCobro >= 2) {
        return res.status(400).json({
          error:
            'Esta venta forma parte de un cobro con varios servicios: no se puede anular una sola línea. Anulá el cobro completo, o si la clienta se queda con algunos servicios, registrá un cobro nuevo con lo que corresponda.',
        });
      }
    }

    if (!motivo) {
      return res.status(400).json({ error: 'El motivo de anulación es requerido' });
    }

    const receta = await prisma.receta.findMany({ where: { servicio_id: venta.servicio_id } });

    const ventaAnulada = await prisma.$transaction(async (tx) => {
      const actualizada = await tx.venta.update({
        where: { id },
        data: {
          anulada: true,
          motivo_anulacion: motivo,
          editado_por: req.user.id,
          fecha_edicion: new Date(),
        },
        include: ventaConRelaciones,
      });

      // Revierte el descuento de insumos aplicado al registrar la venta.
      for (const linea of receta) {
        await tx.insumo.update({
          where: { id: linea.insumo_id },
          data: { stock_actual: { increment: linea.cantidad_usada } },
        });
      }

      return actualizada;
    });

    return res.json({ venta: ventaAnulada });
  }

  const sinCambios = (precio_total === undefined || precio_total === null || precio_total === '')
    && metodo_pago === undefined;
  if (sinCambios) {
    return res.status(400).json({ error: 'Nada para actualizar' });
  }

  const data = { editado_por: req.user.id, fecha_edicion: new Date() };

  if (precio_total !== undefined && precio_total !== null && precio_total !== '') {
    const total = Number(precio_total);
    if (!Number.isFinite(total) || total <= 0) {
      return res.status(400).json({ error: 'El total de la venta debe ser un número positivo' });
    }
    data.precio_total = total;
    data.comision = Math.round(total * toNumber(venta.usuario.porcentaje_comision));
  }

  if (metodo_pago !== undefined) {
    data.metodo_pago = metodo_pago;
  }

  const actualizada = await prisma.venta.update({
    where: { id },
    data,
    include: ventaConRelaciones,
  });

  res.json({ venta: actualizada });
}

module.exports = { listar, actualizar, ventaConRelaciones };
