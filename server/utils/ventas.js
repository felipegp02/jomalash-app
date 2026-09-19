// Compartido entre Dashboard y Cierre de Caja, para que el desglose por
// metodo de pago se calcule con el mismo criterio en los dos lados.
const METODOS_PAGO = ['efectivo', 'transferencia', 'tarjeta'];

function baseVacia() {
  return new Map(METODOS_PAGO.map((m) => [m, { metodo_pago: m, servicios: 0, venta: 0 }]));
}

// Ventas sueltas: metodo_pago vive en la propia venta, igual que siempre.
// Una venta con cobro_id (metodo_pago null) se saltea aca a proposito: su
// pago se cuenta una sola vez a nivel del Cobro (ver sumarCobros), no por
// linea, porque el reparto entre metodos no esta atado a una linea especifica.
function sumarVentasSueltas(base, ventas) {
  for (const v of ventas) {
    if (!v.metodo_pago) continue;
    const actual = base.get(v.metodo_pago);
    actual.servicios += 1;
    actual.venta += v.precio_total;
  }
}

// Regla dura: venta bruta debe coincidir siempre, sin excepcion, con la
// suma efectivo+transferencia+tarjeta. Por eso un Cobro nunca aporta su
// pago_* tal cual: se reduce a su "monto activo" (suma de precio_total de
// sus lineas NO anuladas) y ese monto activo se reparte entre los metodos
// en la misma proporcion en que se cobraron originalmente. Si ninguna
// linea fue anulada, el reparto proporcional devuelve exactamente los
// montos originales; si todas fueron anuladas, el monto activo es 0 y el
// cobro no aporta nada. El ultimo metodo (por monto) absorbe el resto del
// reparto para que la suma de los tres de exacto el monto activo, sin
// arrastrar centavos de redondeo. No suma a "servicios": ese conteo por
// metodo solo tiene sentido para una venta suelta con un metodo unico.
function sumarCobros(base, cobros) {
  for (const c of cobros) {
    const totalLineas = c.ventas.reduce((suma, v) => suma + v.precio_total, 0);
    if (totalLineas <= 0) continue;

    const montoAnulado = c.ventas.reduce((suma, v) => suma + (v.anulada ? v.precio_total : 0), 0);
    const montoActivo = totalLineas - montoAnulado;
    if (montoActivo <= 0) continue;

    const metodos = [
      { key: 'efectivo', monto: c.pago_efectivo },
      { key: 'transferencia', monto: c.pago_transferencia },
      { key: 'tarjeta', monto: c.pago_tarjeta },
    ].sort((a, b) => b.monto - a.monto);

    let asignado = 0;
    metodos.forEach((m, i) => {
      const esUltimo = i === metodos.length - 1;
      const valor = esUltimo ? montoActivo - asignado : Math.round((m.monto * montoActivo) / totalLineas);
      asignado += valor;
      base.get(m.key).venta += valor;
    });
  }
}

// ventas: ya filtradas por sede/periodo/anulada segun corresponda a quien
// llama. cobros: ya filtrados por sede/periodo, con sus ventas incluidas
// (select anulada y precio_total) para que sumarCobros pueda calcular el
// monto activo real de cada cobro. Devuelve el array [{metodo_pago, servicios, venta}].
function porMetodoPagoDe(ventas, cobros = []) {
  const base = baseVacia();
  sumarVentasSueltas(base, ventas);
  sumarCobros(base, cobros);
  return [...base.values()];
}

module.exports = { METODOS_PAGO, porMetodoPagoDe };
