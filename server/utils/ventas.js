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

// Un Cobro se cuenta siempre completo, tal como se cobro, sin importar si
// alguna de sus lineas fue anulada despues (RNF confirmado: el desglose de
// caja no se recalcula, refleja lo que fisicamente entro a caja en el
// momento del cobro). No suma a "servicios": ese conteo por metodo solo
// tiene sentido para una venta suelta con un metodo unico.
function sumarCobros(base, cobros) {
  for (const c of cobros) {
    base.get('efectivo').venta += c.pago_efectivo;
    base.get('transferencia').venta += c.pago_transferencia;
    base.get('tarjeta').venta += c.pago_tarjeta;
  }
}

// ventas: ya filtradas por sede/periodo/anulada segun corresponda a quien
// llama. cobros: ya filtrados por sede/periodo (independiente de anulada,
// ver sumarCobros). Devuelve el array [{metodo_pago, servicios, venta}].
function porMetodoPagoDe(ventas, cobros = []) {
  const base = baseVacia();
  sumarVentasSueltas(base, ventas);
  sumarCobros(base, cobros);
  return [...base.values()];
}

module.exports = { METODOS_PAGO, porMetodoPagoDe };
