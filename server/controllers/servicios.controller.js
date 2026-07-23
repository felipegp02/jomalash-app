const prisma = require('../lib/prisma');

// GET /servicios (RF-05: catalogo para autocompletar el total de la venta)
async function listar(req, res) {
  const servicios = await prisma.servicio.findMany({
    where: { activo: true },
    orderBy: [{ categoria: 'asc' }, { nombre: 'asc' }],
    select: { id: true, nombre: true, categoria: true, precio: true },
  });

  res.json({ servicios });
}

module.exports = { listar };
