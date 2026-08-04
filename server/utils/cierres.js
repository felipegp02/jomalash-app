const prisma = require('../lib/prisma');
const { diaCivilBogota } = require('./bogota');

// True si ya existe un CIERRES_CAJA para la sede y el dia civil (Bogota) al
// que pertenece "fecha". Se usa para bloquear registrar/editar/anular
// ventas de un dia ya cerrado (RNF: un cierre queda fijo, no se le pueden
// seguir sumando ventas por atras). Sin cierre para ese dia, devuelve false
// y quien llama sigue su camino normal sin ningun cambio de comportamiento.
async function diaYaCerrado(sedeId, fecha) {
  const diaStr = diaCivilBogota(fecha);
  const fechaColumna = new Date(`${diaStr}T00:00:00.000Z`);
  const cierre = await prisma.cierreCaja.findFirst({ where: { sede_id: sedeId, fecha: fechaColumna } });
  return Boolean(cierre);
}

module.exports = { diaYaCerrado };
