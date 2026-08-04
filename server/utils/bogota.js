// Colombia no tiene horario de verano: el offset UTC-5 es constante todo el ano.
const OFFSET_BOGOTA_MS = 5 * 60 * 60 * 1000;

// "YYYY-MM-DD" del dia civil en Bogota al que pertenece un instante. El
// servidor puede correr en otra zona horaria (ej. UTC en el hosting), por
// eso nunca se usan los metodos locales de Date (getDate/getHours, etc).
function diaCivilBogota(fecha) {
  const partes = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Bogota',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(fecha);
  const year = partes.find((p) => p.type === 'year').value;
  const month = partes.find((p) => p.type === 'month').value;
  const day = partes.find((p) => p.type === 'day').value;
  return `${year}-${month}-${day}`;
}

// Rango [inicio, fin) de instantes UTC que corresponde a un mes calendario
// completo en Bogota (para filtrar VENTAS.fecha / PAGOS_NOMINA.fecha).
function rangoMesBogota(mes, anio) {
  const inicioColumna = new Date(Date.UTC(anio, mes - 1, 1));
  const finColumna = new Date(Date.UTC(anio, mes, 1));
  const inicio = new Date(inicioColumna.getTime() + OFFSET_BOGOTA_MS);
  const fin = new Date(finColumna.getTime() + OFFSET_BOGOTA_MS);
  return { inicio, fin };
}

// Rango [inicio, fin) de instantes UTC entre dos fechas civiles "YYYY-MM-DD"
// en Bogota, ambas inclusive (para filtrar VENTAS.fecha por un rango
// arbitrario, ej. la lista de dias de Cierre de Caja).
function rangoBogota(desde, hasta) {
  const [yDesde, mDesde, dDesde] = desde.split('-').map(Number);
  const [yHasta, mHasta, dHasta] = hasta.split('-').map(Number);
  const inicioColumna = new Date(Date.UTC(yDesde, mDesde - 1, dDesde));
  // dia siguiente al "hasta" para que el limite superior quede exclusivo.
  const finColumna = new Date(Date.UTC(yHasta, mHasta - 1, dHasta + 1));
  const inicio = new Date(inicioColumna.getTime() + OFFSET_BOGOTA_MS);
  const fin = new Date(finColumna.getTime() + OFFSET_BOGOTA_MS);
  return { inicio, fin };
}

module.exports = { diaCivilBogota, rangoMesBogota, rangoBogota };
