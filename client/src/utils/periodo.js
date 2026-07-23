// Los limites de "hoy/semana/mes" se calculan en el navegador (hora local de
// quien usa la app en el mostrador), no en el servidor, para que coincidan
// con lo que la persona espera ver sin depender de la zona horaria del hosting.
export function calcularRango(periodo, fechaDesde, fechaHasta) {
  const ahora = new Date();

  if (periodo === 'hoy') {
    const desde = new Date();
    desde.setHours(0, 0, 0, 0);
    const hasta = new Date(desde);
    hasta.setDate(hasta.getDate() + 1);
    return { desde, hasta };
  }

  if (periodo === 'semana') {
    const desde = new Date();
    desde.setHours(0, 0, 0, 0);
    const diaSemana = (desde.getDay() + 6) % 7; // 0 = lunes
    desde.setDate(desde.getDate() - diaSemana);
    const hasta = new Date(desde);
    hasta.setDate(hasta.getDate() + 7);
    return { desde, hasta };
  }

  if (periodo === 'mes') {
    const desde = new Date(ahora.getFullYear(), ahora.getMonth(), 1);
    const hasta = new Date(ahora.getFullYear(), ahora.getMonth() + 1, 1);
    return { desde, hasta };
  }

  // personalizado: el rango incluye completo el dia "hasta"
  const desde = new Date(`${fechaDesde}T00:00:00`);
  const hasta = new Date(`${fechaHasta}T00:00:00`);
  hasta.setDate(hasta.getDate() + 1);
  return { desde, hasta };
}
