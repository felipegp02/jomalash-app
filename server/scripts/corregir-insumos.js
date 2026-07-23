// Correcciones puntuales al catalogo de insumos: modelo de "Esmalte"
// (quedo con datos viejos de prueba en unidades en vez de ml), unidad de
// compra de Algodon, y stock_minimo real de cada insumo (arrancaron en 0,
// asi que la alerta de bajo stock nunca se disparaba).
require('dotenv').config();
const prisma = require('../lib/prisma');

const STOCK_MINIMO = {
  Aceite: 200,
  'Algodón': 100,
  'Bolsa pequeña': 5,
  'Crema para pies y manos': 150,
  'Exfoliante': 150,
  'Lima (general)': 5,
  'Lima de agua': 10,
  'Lima de cartón': 5,
  'Lima spongy': 5,
  'Palitos de naranjo': 20,
  'Polímero (acrílico)': 150,
  'Removedor de callos': 300,
  'Removedor de cutícula': 150,
  'Removedor de esmalte': 300,
  'Repuesto de lima (pulidor)': 5, // "Repuesto de lima" en el pedido del usuario
  'Separador de dedos': 20,
  'Toalla limpiadora': 20,
  'Toalla wypall': 10,
};

async function main() {
  // 1. "Esmalte" seguia con el modelo viejo de prueba (unidades/frasco/50).
  const esmalte = await prisma.insumo.findFirst({ where: { nombre: { startsWith: 'Esmalte' } } });
  if (esmalte) {
    await prisma.insumo.update({
      where: { id: esmalte.id },
      data: { tipo_medida: 'ml', unidad_compra: 'frasco', contenido_por_compra: 15, stock_minimo: 30 },
    });
  }

  // 2. Algodon: unidad de compra real.
  await prisma.insumo.updateMany({
    where: { nombre: 'Algodón' },
    data: { unidad_compra: 'paquete', contenido_por_compra: 500 },
  });

  // 3. stock_minimo real de cada insumo.
  for (const [nombre, minimo] of Object.entries(STOCK_MINIMO)) {
    await prisma.insumo.updateMany({ where: { nombre }, data: { stock_minimo: minimo } });
  }

  console.log('Correcciones aplicadas.');
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
