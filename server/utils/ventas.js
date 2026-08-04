// Compartido entre Dashboard y Cierre de Caja, para que el desglose por
// metodo de pago se calcule con el mismo criterio en los dos lados.
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

module.exports = { METODOS_PAGO, porMetodoPagoDe };
