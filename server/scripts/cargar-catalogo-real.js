// Carga el catalogo real de servicios de Jomalash y el modelo de insumos
// y recetas que lo acompana, reemplazando los datos de ejemplo/prueba de
// las Fases 2-5. Pensado para correrse una sola vez contra la base ya
// existente (no es el seed de bootstrap de un ambiente nuevo).
require('dotenv').config();
const prisma = require('../lib/prisma');

const SERVICIOS = [
  { nombre: 'Manicure', categoria: 'Uñas', precio: 22000 },
  { nombre: 'Pedicure', categoria: 'Uñas', precio: 26000 },
  { nombre: 'Manos Semipermanente', categoria: 'Uñas', precio: 46000 },
  { nombre: 'Pies Semipermanente', categoria: 'Uñas', precio: 48000 },
  { nombre: 'Press On', categoria: 'Uñas', precio: 90000 },
  { nombre: 'Montura de Acrílico', categoria: 'Uñas', precio: 120000 },
  { nombre: 'Retoque de Acrílico', categoria: 'Uñas', precio: 85000 },
  { nombre: 'Montura Poly Gel', categoria: 'Uñas', precio: 120000 },
  { nombre: 'Retoque de Poly Gel', categoria: 'Uñas', precio: 85000 },
  { nombre: 'Dipping', categoria: 'Uñas', precio: 76000 },
  { nombre: 'Base Rubber', categoria: 'Uñas', precio: 65000 },
  { nombre: 'Montura Acrílico y Poly Gel', categoria: 'Uñas', precio: 90000 },
  { nombre: 'Retoque Acrílico y Poly Gel', categoria: 'Uñas', precio: 85000 },
  { nombre: 'Cejas Cera', categoria: 'Pestañas y cejas', precio: 15000 },
  { nombre: 'Cejas Hilo', categoria: 'Pestañas y cejas', precio: 26000 },
  { nombre: 'Bozo', categoria: 'Pestañas y cejas', precio: 10000 },
  { nombre: 'Lifting', categoria: 'Pestañas y cejas', precio: 70000 },
  { nombre: 'Laminado', categoria: 'Pestañas y cejas', precio: 70000 },
  { nombre: 'Henna', categoria: 'Pestañas y cejas', precio: 14000 },
  { nombre: 'Pestañas Clásicas/2D/3D', categoria: 'Pestañas y cejas', precio: 150000 },
  { nombre: 'Pestañas 6D', categoria: 'Pestañas y cejas', precio: 170000 },
  { nombre: 'Jelly Spa Solo', categoria: 'Estética', precio: 30000 },
  { nombre: 'Jelly Spa con Pies Tradicional', categoria: 'Estética', precio: 56000 },
];

// Clasificación usada para armar las recetas condicionales. "Pies" incluye
// Jelly Spa con Pies Tradicional ademas de Pedicure/Pies Semipermanente,
// por el "con Pies" del nombre - es una suposición mía, no algo que el
// usuario haya confirmado explicitamente.
const PIES = new Set(['Pedicure', 'Pies Semipermanente', 'Jelly Spa con Pies Tradicional']);
const MANOS = new Set([
  'Manicure',
  'Manos Semipermanente',
  'Press On',
  'Montura de Acrílico',
  'Retoque de Acrílico',
  'Montura Poly Gel',
  'Retoque de Poly Gel',
  'Dipping',
  'Base Rubber',
  'Montura Acrílico y Poly Gel',
  'Retoque Acrílico y Poly Gel',
]);
const ACRILICO = new Set([
  'Montura de Acrílico',
  'Retoque de Acrílico',
  'Montura Acrílico y Poly Gel',
  'Retoque Acrílico y Poly Gel',
]);
const MANICURE_TRADICIONAL = new Set(['Manicure']);

// tipo_medida 'unidades', unidad_compra 'unidad', contenido_por_compra 1
// (se compran y se gastan en la misma medida).
const INSUMOS_POR_UNIDAD = [
  'Toalla limpiadora',
  'Separador de dedos',
  'Palitos de naranjo',
  'Algodón',
  'Lima de agua',
  'Toalla wypall',
  'Repuesto de lima (pulidor)',
  'Bolsa pequeña',
  'Lima (general)',
  'Lima de cartón',
  'Lima spongy',
];

// { nombre, tipo_medida, unidad_compra, contenido_por_compra }
const INSUMOS_LIQUIDOS = [
  { nombre: 'Exfoliante', tipo_medida: 'ml', unidad_compra: 'tarro grande', contenido_por_compra: 1000 },
  { nombre: 'Removedor de cutícula', tipo_medida: 'ml', unidad_compra: 'tarro grande', contenido_por_compra: 1000 },
  { nombre: 'Aceite', tipo_medida: 'ml', unidad_compra: 'tarro', contenido_por_compra: 1000 },
  { nombre: 'Crema para pies y manos', tipo_medida: 'gramos', unidad_compra: 'tarro grande', contenido_por_compra: 950 },
  { nombre: 'Removedor de callos', tipo_medida: 'ml', unidad_compra: 'tarro grande', contenido_por_compra: 4000 },
  { nombre: 'Removedor de esmalte', tipo_medida: 'ml', unidad_compra: 'unidad', contenido_por_compra: 3780 },
  { nombre: 'Polímero (acrílico)', tipo_medida: 'ml', unidad_compra: 'tarro', contenido_por_compra: 1000 },
];

// Consumo universal (todos los servicios), en la tipo_medida del insumo.
const UNIVERSAL = [
  { nombre: 'Toalla limpiadora', cantidad: 1 },
  { nombre: 'Separador de dedos', cantidad: 1 },
  { nombre: 'Palitos de naranjo', cantidad: 1 },
  { nombre: 'Algodón', cantidad: 3 },
  { nombre: 'Lima de agua', cantidad: 1 },
  { nombre: 'Exfoliante', cantidad: 10 },
  { nombre: 'Removedor de cutícula', cantidad: 3 },
  { nombre: 'Aceite', cantidad: 2 },
  { nombre: 'Crema para pies y manos', cantidad: 12 },
  { nombre: 'Removedor de esmalte', cantidad: 12 },
  { nombre: 'Lima (general)', cantidad: 0.003 },
  { nombre: 'Lima de cartón', cantidad: 0.004 },
  { nombre: 'Lima spongy', cantidad: 0.006 },
];

function recetaDe(servicioNombre) {
  const lineas = [...UNIVERSAL];

  if (MANOS.has(servicioNombre)) {
    lineas.push({ nombre: 'Toalla wypall', cantidad: 0.5 });
  }
  if (PIES.has(servicioNombre)) {
    lineas.push({ nombre: 'Toalla wypall', cantidad: 1 });
    lineas.push({ nombre: 'Repuesto de lima (pulidor)', cantidad: 1 });
    lineas.push({ nombre: 'Removedor de callos', cantidad: 8 });
  }
  if (MANICURE_TRADICIONAL.has(servicioNombre)) {
    lineas.push({ nombre: 'Bolsa pequeña', cantidad: 1 });
  }
  if (ACRILICO.has(servicioNombre)) {
    lineas.push({ nombre: 'Polímero (acrílico)', cantidad: 6 });
  }

  return lineas;
}

async function main() {
  // 1. Limpieza de los datos de ejemplo/prueba de las Fases 2-5.
  //    (No se toca "Tijeras de cuticula" ni ningun otro insumo creado por
  //    la propia Camila desde la pantalla de Insumos.)
  const nombresPrueba = ['Esmalte rosa', 'Acetona', 'Toallas'];
  const insumosPrueba = await prisma.insumo.findMany({ where: { nombre: { in: nombresPrueba } } });
  const idsPrueba = insumosPrueba.map((i) => i.id);

  if (idsPrueba.length) {
    await prisma.compra.deleteMany({ where: { insumo_id: { in: idsPrueba } } });
    await prisma.receta.deleteMany({ where: { insumo_id: { in: idsPrueba } } });
    await prisma.insumo.deleteMany({ where: { id: { in: idsPrueba } } });
  }

  // El servicio de prueba no se puede borrar (tiene ventas historicas que
  // no deben perderse), se desactiva para que no aparezca en el catalogo.
  await prisma.servicio.updateMany({
    where: { nombre: 'Manicure Semipermanente' },
    data: { activo: false },
  });

  // 2. Catalogo real de servicios (upsert por nombre para poder re-correr
  //    el script sin duplicar si algo fallara a mitad de camino).
  const servicioIdPorNombre = new Map();
  for (const s of SERVICIOS) {
    const existente = await prisma.servicio.findFirst({ where: { nombre: s.nombre } });
    const servicio = existente
      ? await prisma.servicio.update({
          where: { id: existente.id },
          data: { categoria: s.categoria, precio: s.precio, activo: true },
        })
      : await prisma.servicio.create({ data: { ...s, activo: true } });
    servicioIdPorNombre.set(s.nombre, servicio.id);
  }

  // 3. Insumos nuevos. stock_actual y stock_minimo arrancan en 0: no hay
  // forma de saber el stock real ni el umbral de alerta deseado sin que
  // Camila los cargue (con "Inventario inicial" y editando cada insumo).
  const insumoIdPorNombre = new Map();

  for (const nombre of INSUMOS_POR_UNIDAD) {
    const existente = await prisma.insumo.findFirst({ where: { nombre } });
    const insumo = existente
      ? existente
      : await prisma.insumo.create({
          data: {
            nombre,
            tipo: 'consumible',
            tipo_medida: 'unidades',
            unidad_compra: 'unidad',
            contenido_por_compra: 1,
            stock_actual: 0,
            stock_minimo: 0,
          },
        });
    insumoIdPorNombre.set(nombre, insumo.id);
  }

  for (const i of INSUMOS_LIQUIDOS) {
    const existente = await prisma.insumo.findFirst({ where: { nombre: i.nombre } });
    const insumo = existente
      ? existente
      : await prisma.insumo.create({
          data: {
            nombre: i.nombre,
            tipo: 'consumible',
            tipo_medida: i.tipo_medida,
            unidad_compra: i.unidad_compra,
            contenido_por_compra: i.contenido_por_compra,
            stock_actual: 0,
            stock_minimo: 0,
          },
        });
    insumoIdPorNombre.set(i.nombre, insumo.id);
  }

  // 4. Recetas: reemplaza por completo la receta de cada servicio nuevo.
  let totalLineasReceta = 0;
  for (const s of SERVICIOS) {
    const servicioId = servicioIdPorNombre.get(s.nombre);
    const lineas = recetaDe(s.nombre);

    await prisma.receta.deleteMany({ where: { servicio_id: servicioId } });
    await prisma.receta.createMany({
      data: lineas.map((l) => ({
        servicio_id: servicioId,
        insumo_id: insumoIdPorNombre.get(l.nombre),
        cantidad_usada: l.cantidad,
      })),
    });
    totalLineasReceta += lineas.length;
  }

  console.log(`Servicios cargados: ${SERVICIOS.length}`);
  console.log(`Insumos nuevos: ${INSUMOS_POR_UNIDAD.length + INSUMOS_LIQUIDOS.length}`);
  console.log(`Lineas de receta creadas: ${totalLineasReceta}`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
