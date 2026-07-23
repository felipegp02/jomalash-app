const prisma = require('../lib/prisma');

// GET /servicios (RF-05: catalogo para autocompletar el total de la venta).
// Un admin gestionando el catalogo puede pedir tambien los desactivados
// con ?incluirInactivos=true; para cualquier otro uso (Registrar,
// Dashboard, Historial) solo se listan los activos.
async function listar(req, res) {
  const verInactivos = req.user.rol === 'admin' && req.query.incluirInactivos === 'true';

  const servicios = await prisma.servicio.findMany({
    where: verInactivos ? {} : { activo: true },
    orderBy: [{ categoria: 'asc' }, { nombre: 'asc' }],
    select: { id: true, nombre: true, categoria: true, precio: true, activo: true },
  });

  res.json({ servicios });
}

// POST /servicios (RF-11)
async function crear(req, res) {
  const { nombre, categoria, precio } = req.body || {};

  if (!nombre || !categoria) {
    return res.status(400).json({ error: 'Nombre y categoria son requeridos' });
  }

  const precioNum = Number(precio);
  if (!Number.isFinite(precioNum) || precioNum <= 0) {
    return res.status(400).json({ error: 'El precio debe ser un numero positivo' });
  }

  const servicio = await prisma.servicio.create({
    data: { nombre, categoria, precio: precioNum, activo: true },
  });

  res.status(201).json({ servicio });
}

// PUT /servicios/:id (RF-11 nombre/categoria/activo; RF-12 historial de precio)
async function actualizar(req, res) {
  const id = Number(req.params.id);
  const { nombre, categoria, precio, activo } = req.body || {};

  const existente = await prisma.servicio.findUnique({ where: { id } });
  if (!existente) {
    return res.status(404).json({ error: 'Servicio no encontrado' });
  }

  const data = {};
  if (nombre !== undefined) data.nombre = nombre;
  if (categoria !== undefined) data.categoria = categoria;
  if (activo !== undefined) data.activo = Boolean(activo);

  let precioNum = null;
  if (precio !== undefined && precio !== null && precio !== '') {
    precioNum = Number(precio);
    if (!Number.isFinite(precioNum) || precioNum <= 0) {
      return res.status(400).json({ error: 'El precio debe ser un numero positivo' });
    }
    data.precio = precioNum;
  }

  const cambiaPrecio = precioNum !== null && precioNum !== existente.precio;

  const servicio = await prisma.$transaction(async (tx) => {
    const actualizado = await tx.servicio.update({ where: { id }, data });

    // RF-12: se guarda el precio anterior y el nuevo antes de sobreescribir.
    if (cambiaPrecio) {
      await tx.historialPrecio.create({
        data: {
          servicio_id: id,
          precio_anterior: existente.precio,
          precio_nuevo: precioNum,
          usuario_id: req.user.id,
        },
      });
    }

    return actualizado;
  });

  res.json({ servicio });
}

// GET /servicios/:id/historial (RF-12)
async function historialPrecios(req, res) {
  const servicioId = Number(req.params.id);

  const servicio = await prisma.servicio.findUnique({ where: { id: servicioId } });
  if (!servicio) {
    return res.status(404).json({ error: 'Servicio no encontrado' });
  }

  const historial = await prisma.historialPrecio.findMany({
    where: { servicio_id: servicioId },
    include: { usuario: { select: { nombre: true } } },
    orderBy: { fecha_cambio: 'desc' },
  });

  res.json({ historial });
}

module.exports = { listar, crear, actualizar, historialPrecios };
