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

// Los dos cortes quincenales de un mes calendario en Bogota: Corte 1 (dia 1
// al 15) y Corte 2 (dia 16 al ultimo dia del mes). Cada corte trae "desde"/
// "hasta" como fechas civiles "YYYY-MM-DD" (para mostrar y comparar contra
// "hoy") ademas de "inicio"/"fin" como instantes UTC (para filtrar
// VENTAS.fecha / PAGOS_NOMINA.fecha, igual que rangoBogota).
function rangosQuincenaBogota(mes, anio) {
  const pad = (n) => String(n).padStart(2, '0');
  const mesStr = pad(mes);
  const ultimoDia = new Date(Date.UTC(anio, mes, 0)).getUTCDate();

  const desde1 = `${anio}-${mesStr}-01`;
  const hasta1 = `${anio}-${mesStr}-15`;
  const desde2 = `${anio}-${mesStr}-16`;
  const hasta2 = `${anio}-${mesStr}-${pad(ultimoDia)}`;

  return {
    corte1: { desde: desde1, hasta: hasta1, ...rangoBogota(desde1, hasta1) },
    corte2: { desde: desde2, hasta: hasta2, ...rangoBogota(desde2, hasta2) },
  };
}

module.exports = { diaCivilBogota, rangoMesBogota, rangoBogota, rangosQuincenaBogota };
