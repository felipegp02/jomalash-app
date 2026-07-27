export function formatearHora(fechaIso) {
  return new Date(fechaIso).toLocaleTimeString('es-CO', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

function esMismoDia(a, b) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

// Agrupador estilo app financiera: "Hoy", "Ayer", y después fecha completa.
export function etiquetaDia(fechaIso) {
  const fecha = new Date(fechaIso);
  const hoy = new Date();
  const ayer = new Date();
  ayer.setDate(ayer.getDate() - 1);

  if (esMismoDia(fecha, hoy)) return 'Hoy';
  if (esMismoDia(fecha, ayer)) return 'Ayer';

  return fecha.toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' });
}

// "1.234" en vez de "1234": separador de miles como se usa en Colombia.
export function formatearNumero(valor) {
  return new Intl.NumberFormat('es-CO', { maximumFractionDigits: 2 }).format(Number(valor) || 0);
}

// Intl con { style: 'currency', currency: 'COP' } inserta un espacio entre el
// simbolo y el número ("$ 1.234.567"). Se arma el signo a mano para obtener
// el formato colombiano usual: "$1.234.567", sin ese espacio.
export function formatearMoneda(valor) {
  const redondeado = Math.round(valor || 0);
  const signo = redondeado < 0 ? '-' : '';
  const número = new Intl.NumberFormat('es-CO', { maximumFractionDigits: 0 }).format(
    Math.abs(redondeado),
  );
  return `${signo}$${número}`;
}
