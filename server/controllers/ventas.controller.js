const prisma = require('../lib/prisma');

const ventaConRelaciones = {
  servicio: { select: { nombre: true, categoria: true } },
  usuario: { select: { nombre: true } },
  sede: { select: { nombre: true } },
};

function toNumber(valor) {
  if (valor === null || valor === undefined) return 0;
  return typeof valor === 'object' && typeof valor.toNumber === 'function'
    ? valor.toNumber()
    : Number(valor);
}

const METODOS_PAGO = ['efectivo', 'transferencia', 'tarjeta'];

// GET /ventas (RF-21: filtrable por empleada y sede; empleada solo ve las suyas)
async function listar(req, res) {
  const { sede_id, usuario_id, desde, hasta } = req.query;
  const where = {};

  if (req.user.rol === 'empleada') {
    where.usuario_id = req.user.id;
  } else if (usuario_id) {
    where.usuario_id = Number(usuario_id);
  }

  if (sede_id) where.sede_id = Number(sede_id);

  if (desde || hasta) {
    where.fecha = {};
    if (desde) where.fecha.gte = new Date(desde);
    if (hasta) where.fecha.lte = new Date(hasta);
  }

  const ventas = await prisma.venta.findMany({
    where,
    orderBy: { fecha: 'desc' },
    include: ventaConRelaciones,
  });

  res.json({ ventas });
}

// POST /ventas (RF-05, RF-06, RF-07, RF-08, RF-10, RNF-03, RNF-10)
async function crear(req, res) {
  const { servicio_id, precio_total, metodo_pago } = req.body || {};

  if (!servicio_id) {
    return res.status(400).json({ error: 'El servicio es requerido' });
  }

  if (!METODOS_PAGO.includes(metodo_pago)) {
    return res.status(400).json({ error: 'El metodo de pago debe ser efectivo, transferencia o tarjeta' });
  }

  const servicio = await prisma.servicio.findUnique({ where: { id: Number(servicio_id) } });
  if (!servicio || !servicio.activo) {
    return res.status(400).json({ error: 'Servicio invalido' });
  }

  let usuarioAtiende;
  if (req.user.rol === 'empleada') {
    // Una empleada solo puede registrar ventas propias: se ignora cualquier
    // usuario_id que venga en el body y se usa el de su sesion.
    usuarioAtiende = await prisma.usuario.findUnique({ where: { id: req.user.id } });
  } else {
    const { usuario_id } = req.body || {};
    if (!usuario_id) {
      return res.status(400).json({ error: 'La empleada es requerida' });
    }
    usuarioAtiende = await prisma.usuario.findUnique({ where: { id: Number(usuario_id) } });
  }

  if (!usuarioAtiende || !usuarioAtiende.activo) {
    return res.status(400).json({ error: 'Empleada invalida' });
  }

  // RF-05: la venta total se autocompleta desde el catalogo y es editable.
  const total = precio_total === undefined || precio_total === null || precio_total === ''
    ? servicio.precio
    : Number(precio_total);

  if (!Number.isFinite(total) || total <= 0) {
    return res.status(400).json({ error: 'El total de la venta debe ser un numero positivo' });
  }

  // RF-08 / RNF-03: la comision se calcula en el servidor, nunca se acepta desde el cliente.
  const comision = Math.round(total * toNumber(usuarioAtiende.porcentaje_comision));

  const receta = await prisma.receta.findMany({ where: { servicio_id: servicio.id } });

  // RNF-10: registrar la venta y descontar insumos es una sola transaccion atomica.
  const venta = await prisma.$transaction(async (tx) => {
    const nuevaVenta = await tx.venta.create({
      data: {
        servicio_id: servicio.id,
        usuario_id: usuarioAtiende.id,
        // RF-06: la sede se genera automaticamente, tomada de donde trabaja
        // la empleada que atendio (no de la sesion de quien registra, ya que
        // un admin puede registrar por cualquiera de las dos sedes).
        sede_id: usuarioAtiende.sede_id,
        precio_total: total,
        comision,
        metodo_pago,
      },
      include: ventaConRelaciones,
    });

    for (const linea of receta) {
      await tx.insumo.update({
        where: { id: linea.insumo_id },
        data: { stock_actual: { decrement: linea.cantidad_usada } },
      });
    }

    return nuevaVenta;
  });

  // RF-07: resumen de confirmacion (servicio, empleada, total, hora) va incluido en la respuesta.
  res.status(201).json({ venta });
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
  if (venta.anulada) {
    return res.status(400).json({ error: 'La venta ya esta anulada' });
  }

  if (anulada) {
    if (!motivo) {
      return res.status(400).json({ error: 'El motivo de anulacion es requerido' });
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
      return res.status(400).json({ error: 'El total de la venta debe ser un numero positivo' });
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

module.exports = { listar, crear, actualizar };
