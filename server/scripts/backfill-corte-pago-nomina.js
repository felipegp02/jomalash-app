// Backfill unico: asigna "corte" a los PagoNomina existentes (creados antes
// de que el campo fuera obligatorio) reproduciendo exactamente el criterio
// que usaba resumen() hasta ahora - dia civil en Bogota de "fecha": 1-15 ->
// corte1, 16-fin de mes -> corte2. Deja los saldos por corte identicos a
// los que se veian antes de este cambio.
require('dotenv').config();
const prisma = require('../lib/prisma');
const { diaCivilBogota } = require('../utils/bogota');

async function main() {
  const pendientes = await prisma.pagoNomina.findMany({ where: { corte: null } });
  console.log(`Pagos sin corte: ${pendientes.length}`);

  let corte1 = 0;
  let corte2 = 0;
  for (const pago of pendientes) {
    const dia = Number(diaCivilBogota(pago.fecha).slice(8, 10));
    const corte = dia <= 15 ? 'corte1' : 'corte2';
    await prisma.pagoNomina.update({ where: { id: pago.id }, data: { corte } });
    if (corte === 'corte1') corte1 += 1;
    else corte2 += 1;
  }

  console.log(`Asignados a corte1: ${corte1} | corte2: ${corte2}`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
