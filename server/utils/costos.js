const prisma = require('../lib/prisma');

// Costo promedio ponderado por unidad de cada insumo, a partir de todo su
// historial de compras (no del periodo filtrado: es una tarifa de
// valorizacion, no una metrica del rango de fechas seleccionado).
// Usado por el Dashboard y por el Cierre de Caja (Fase 7), que necesitan
// el mismo criterio de "ganancia neta" para que los números cuadren entre si.
async function costoPromedioInsumos() {
  const compras = await prisma.compra.groupBy({
    by: ['insumo_id'],
    _sum: { costo_total: true, cantidad: true },
  });

  const mapa = new Map();
  for (const c of compras) {
    const cantidad = Number(c._sum.cantidad || 0);
    const costoTotal = c._sum.costo_total || 0;
    mapa.set(c.insumo_id, cantidad > 0 ? costoTotal / cantidad : 0);
  }
  return mapa;
}

// Costo de los insumos consumidos por un conjunto de ventas, según la RECETA
// de cada servicio realizado y el costo promedio de compra de cada insumo.
async function costoInsumosDeVentas(ventas, costoPromedio) {
  if (!ventas.length) return 0;

  const conteoServicios = new Map();
  for (const v of ventas) {
    conteoServicios.set(v.servicio_id, (conteoServicios.get(v.servicio_id) || 0) + 1);
  }

  const recetas = await prisma.receta.findMany({
    where: { servicio_id: { in: [...conteoServicios.keys()] } },
  });

  let costoTotal = 0;
  for (const receta of recetas) {
    const vecesRealizado = conteoServicios.get(receta.servicio_id) || 0;
    const costoUnitario = costoPromedio.get(receta.insumo_id) || 0;
    costoTotal += vecesRealizado * Number(receta.cantidad_usada) * costoUnitario;
  }
  return Math.round(costoTotal);
}

module.exports = { costoPromedioInsumos, costoInsumosDeVentas };
