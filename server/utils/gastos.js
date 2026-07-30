// Compartido entre Cierre de Caja y Dashboard, para que el desglose de
// gastos por categoria se calcule con el mismo criterio en los dos lados.
const CATEGORIAS_GASTO = ['arriendo', 'servicios', 'varios'];

// Agrupa por categoria y siempre incluye las 3 categorias fijas (en 0 si no
// hubo gasto de esa categoria en el periodo), para que la UI no tenga que
// manejar categorias ausentes.
function gastosPorCategoriaDe(gastos) {
  const mapa = new Map(CATEGORIAS_GASTO.map((c) => [c, { categoria: c, total: 0 }]));
  for (const g of gastos) {
    mapa.get(g.categoria).total += g.monto;
  }
  return [...mapa.values()];
}

module.exports = { CATEGORIAS_GASTO, gastosPorCategoriaDe };
