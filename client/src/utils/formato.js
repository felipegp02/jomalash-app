export function formatearHora(fechaIso) {
  return new Date(fechaIso).toLocaleTimeString('es-CO', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

// Intl con { style: 'currency', currency: 'COP' } inserta un espacio entre el
// simbolo y el numero ("$ 1.234.567"). Se arma el signo a mano para obtener
// el formato colombiano usual: "$1.234.567", sin ese espacio.
export function formatearMoneda(valor) {
  const redondeado = Math.round(valor || 0);
  const signo = redondeado < 0 ? '-' : '';
  const numero = new Intl.NumberFormat('es-CO', { maximumFractionDigits: 0 }).format(
    Math.abs(redondeado),
  );
  return `${signo}$${numero}`;
}
