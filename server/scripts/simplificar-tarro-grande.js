// El formato de tarjeta de insumo (definido por Camila) muestra "tarro" para
// los envases grandes, no "tarro grande" - se simplifica el texto de
// unidad_compra para que coincida exactamente con el formato pedido.
require('dotenv').config();
const prisma = require('../lib/prisma');

async function main() {
  const resultado = await prisma.insumo.updateMany({
    where: { unidad_compra: 'tarro grande' },
    data: { unidad_compra: 'tarro' },
  });
  console.log(`Insumos actualizados: ${resultado.count}`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
