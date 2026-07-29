// Actualizacion final de insumos/recetas con datos reales del negocio,
// reemplazando los estimados provisionales cargados antes. Corre contra la
// base local por defecto (usa el DATABASE_URL del .env); para otra base
// pasarla como argumento:
//   node scripts/actualizar-insumos-datos-reales.js "<DATABASE_URL>"
require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

const DATABASE_URL_OVERRIDE = process.argv[2];
const prisma = DATABASE_URL_OVERRIDE
  ? new PrismaClient({ datasources: { db: { url: DATABASE_URL_OVERRIDE } } })
  : new PrismaClient();

// --- A) Insumos "sueltos" que en realidad vienen en paquete/rollo -------
const CORRECCIONES_UNIDAD = [
  { nombre: 'Toalla limpiadora', unidad_compra: 'rollo', contenido_por_compra: 800 },
  { nombre: 'Separador de dedos', unidad_compra: 'paquete', contenido_por_compra: 50 },
  { nombre: 'Lima de agua', unidad_compra: 'paquete', contenido_por_compra: 100 },
  { nombre: 'Lima (general)', unidad_compra: 'paquete', contenido_por_compra: 12 },
  { nombre: 'Palitos de naranjo', unidad_compra: 'paquete', contenido_por_compra: 50 },
  { nombre: 'Bandas de cera', unidad_compra: 'rollo', contenido_por_compra: 88 },
];

// --- B) Correcciones de cantidad en insumos ya existentes ----------------
const CORRECCIONES_CANTIDAD = [
  { nombre: 'Cera depilatoria', unidad_compra: 'frasco', contenido_por_compra: 250 },
  { nombre: 'Henna crema/polvo', unidad_compra: 'frasco', contenido_por_compra: 30 },
];

// --- C) Pegante/Cinta/Removedor de pestañas: correccion de unidad y receta
const PEGANTE_ACTUALIZADO = { tipo_medida: 'ml', unidad_compra: 'frasco', contenido_por_compra: 5 };
const REMOVEDOR_PESTANAS_ACTUALIZADO = { tipo_medida: 'gramos', unidad_compra: 'frasco', contenido_por_compra: 15 };

// --- Insumos nuevos --------------------------------------------------
const INSUMOS_NUEVOS = [
  { nombre: 'Pestañas volumen/abanicos', tipo_medida: 'unidades', unidad_compra: 'caja', contenido_por_compra: 10 },
  { nombre: 'Pestañas pelo a pelo/clásicas', tipo_medida: 'unidades', unidad_compra: 'caja', contenido_por_compra: 10 },
  { nombre: 'Base coat', tipo_medida: 'ml', unidad_compra: 'frasco', contenido_por_compra: 15 },
  { nombre: 'Top coat', tipo_medida: 'ml', unidad_compra: 'frasco', contenido_por_compra: 15 },
  { nombre: 'Protein', tipo_medida: 'ml', unidad_compra: 'frasco', contenido_por_compra: 15 },
  { nombre: 'Acrílico', tipo_medida: 'gramos', unidad_compra: 'frasco', contenido_por_compra: 150 },
  { nombre: 'Poly Gel', tipo_medida: 'gramos', unidad_compra: 'frasco', contenido_por_compra: 60 },
  { nombre: 'Kit de lifting', tipo_medida: 'unidades', unidad_compra: 'kit', contenido_por_compra: 1 },
];

// Insumos que se eliminan (reemplazados por los nuevos de arriba). Ya se
// confirmo que no tienen compras registradas en ninguna base.
const INSUMOS_A_BORRAR = ['Pestañas sueltas', 'Solución 1 (perm)', 'Solución 2 (fijador)', 'Pegamento almohadilla'];

// Servicios "de uñas semipermanente/gel" (confirmado por el usuario) que
// llevan Base coat + Top coat + Protein, 0.75ml cada uno.
const SERVICIOS_BASE_TOP_PROTEIN = [
  'Manos Semipermanente',
  'Pies Semipermanente',
  'Press On',
  'Dipping',
  'Base Rubber',
  'Montura de Acrílico',
  'Retoque de Acrílico',
  'Montura Poly Gel',
  'Retoque de Poly Gel',
  'Montura Acrílico y Poly Gel',
  'Retoque Acrílico y Poly Gel',
];

// Acrílico (polvo): mismos 4 servicios que ya usan Polímero (acrílico), el
// liquido que se usa junto con el polvo (inferido de la receta actual, no
// confirmado explicitamente por el usuario).
const SERVICIOS_ACRILICO_POLVO = [
  'Montura de Acrílico',
  'Retoque de Acrílico',
  'Montura Acrílico y Poly Gel',
  'Retoque Acrílico y Poly Gel',
];
// Poly Gel: los puros de Poly Gel + los combinados (misma logica).
const SERVICIOS_POLY_GEL = [
  'Montura Poly Gel',
  'Retoque de Poly Gel',
  'Montura Acrílico y Poly Gel',
  'Retoque Acrílico y Poly Gel',
];

async function actualizarInsumo(nombre, data) {
  const existente = await prisma.insumo.findFirst({ where: { nombre } });
  if (!existente) {
    console.log(`AVISO: no existe el insumo "${nombre}", se omite.`);
    return null;
  }
  const actualizado = await prisma.insumo.update({ where: { id: existente.id }, data });
  console.log(`Insumo actualizado: ${nombre} -> ${JSON.stringify(data)}`);
  return actualizado;
}

async function crearOReusarInsumo(def) {
  const existente = await prisma.insumo.findFirst({ where: { nombre: def.nombre } });
  if (existente) {
    const actualizado = await prisma.insumo.update({
      where: { id: existente.id },
      data: {
        tipo_medida: def.tipo_medida,
        unidad_compra: def.unidad_compra,
        contenido_por_compra: def.contenido_por_compra,
      },
    });
    console.log(`Insumo ya existia, actualizado: ${def.nombre}`);
    return actualizado;
  }
  const creado = await prisma.insumo.create({
    data: {
      nombre: def.nombre,
      tipo: 'consumible',
      tipo_medida: def.tipo_medida,
      unidad_compra: def.unidad_compra,
      contenido_por_compra: def.contenido_por_compra,
      stock_actual: 0,
      stock_minimo: 0,
    },
  });
  console.log(`Insumo nuevo creado: ${def.nombre}`);
  return creado;
}

async function reemplazarLineaReceta(servicioNombre, insumoNombre, cantidad, insumoIdPorNombre) {
  const servicio = await prisma.servicio.findFirst({ where: { nombre: servicioNombre } });
  if (!servicio) throw new Error(`No existe el servicio "${servicioNombre}"`);
  const insumoId = insumoIdPorNombre.get(insumoNombre);
  if (!insumoId) throw new Error(`No existe el insumo "${insumoNombre}" (para "${servicioNombre}")`);

  await prisma.receta.deleteMany({ where: { servicio_id: servicio.id, insumo_id: insumoId } });
  await prisma.receta.create({
    data: { servicio_id: servicio.id, insumo_id: insumoId, cantidad_usada: cantidad, es_provisional: false },
  });
}

async function main() {
  console.log('--- A) Correcciones de unidad de compra (sueltos -> paquete/rollo) ---');
  for (const c of CORRECCIONES_UNIDAD) {
    await actualizarInsumo(c.nombre, { unidad_compra: c.unidad_compra, contenido_por_compra: c.contenido_por_compra });
  }

  console.log('\n--- B) Correcciones de cantidad en insumos existentes ---');
  for (const c of CORRECCIONES_CANTIDAD) {
    await actualizarInsumo(c.nombre, { unidad_compra: c.unidad_compra, contenido_por_compra: c.contenido_por_compra });
  }
  // Henna: el consumo por servicio (3g) queda confirmado, ya no es estimado.
  const henna = await prisma.servicio.findFirst({ where: { nombre: 'Henna' } });
  if (henna) {
    await prisma.receta.updateMany({ where: { servicio_id: henna.id }, data: { es_provisional: false } });
  }
  // Cejas Cera / Bozo usan Cera depilatoria: el consumo por servicio no
  // cambio, pero tambien queda confirmado (ya no estimado).
  for (const nombre of ['Cejas Cera', 'Bozo']) {
    const s = await prisma.servicio.findFirst({ where: { nombre } });
    if (s) await prisma.receta.updateMany({ where: { servicio_id: s.id }, data: { es_provisional: false } });
  }

  console.log('\n--- C) Pegante / Removedor de pestañas: unidad de medida corregida ---');
  await actualizarInsumo('Pegante', PEGANTE_ACTUALIZADO);
  await actualizarInsumo('Removedor de pestañas', REMOVEDOR_PESTANAS_ACTUALIZADO);

  console.log('\n--- Insumos nuevos ---');
  const insumoIdPorNombre = new Map();
  for (const def of INSUMOS_NUEVOS) {
    const insumo = await crearOReusarInsumo(def);
    insumoIdPorNombre.set(def.nombre, insumo.id);
  }
  // Tambien necesitamos los ids de los insumos ya existentes que se re-usan
  // en recetas mas abajo (Pegante, Cinta micropore, Removedor de pestañas).
  for (const nombre of ['Pegante', 'Cinta micropore', 'Removedor de pestañas']) {
    const i = await prisma.insumo.findFirst({ where: { nombre } });
    if (i) insumoIdPorNombre.set(nombre, i.id);
  }

  console.log('\n--- Recetas de pestañas (Pegante/Cinta/Removedor uniformes, Pestañas separadas por tecnica) ---');
  for (const servicioNombre of ['Pestañas Clásicas/2D/3D', 'Pestañas 6D']) {
    await reemplazarLineaReceta(servicioNombre, 'Pegante', 0.25, insumoIdPorNombre);
    await reemplazarLineaReceta(servicioNombre, 'Cinta micropore', 0.1, insumoIdPorNombre);
    await reemplazarLineaReceta(servicioNombre, 'Removedor de pestañas', 1.5, insumoIdPorNombre);
  }
  await reemplazarLineaReceta('Pestañas 6D', 'Pestañas volumen/abanicos', 2, insumoIdPorNombre);
  await reemplazarLineaReceta('Pestañas Clásicas/2D/3D', 'Pestañas pelo a pelo/clásicas', 2, insumoIdPorNombre);

  console.log('\n--- Base coat / Top coat / Protein (11 servicios semipermanente/gel) ---');
  for (const servicioNombre of SERVICIOS_BASE_TOP_PROTEIN) {
    await reemplazarLineaReceta(servicioNombre, 'Base coat', 0.75, insumoIdPorNombre);
    await reemplazarLineaReceta(servicioNombre, 'Top coat', 0.75, insumoIdPorNombre);
    await reemplazarLineaReceta(servicioNombre, 'Protein', 0.75, insumoIdPorNombre);
  }

  console.log('\n--- Acrílico (polvo) / Poly Gel ---');
  for (const servicioNombre of SERVICIOS_ACRILICO_POLVO) {
    await reemplazarLineaReceta(servicioNombre, 'Acrílico', 12.5, insumoIdPorNombre);
  }
  for (const servicioNombre of SERVICIOS_POLY_GEL) {
    await reemplazarLineaReceta(servicioNombre, 'Poly Gel', 5, insumoIdPorNombre);
  }

  console.log('\n--- Lifting / Laminado: kit unico reemplaza las 3 lineas provisionales ---');
  for (const servicioNombre of ['Lifting', 'Laminado']) {
    const servicio = await prisma.servicio.findFirst({ where: { nombre: servicioNombre } });
    await prisma.receta.deleteMany({ where: { servicio_id: servicio.id } });
    await reemplazarLineaReceta(servicioNombre, 'Kit de lifting', 0.1, insumoIdPorNombre);
  }

  console.log('\n--- Borrando insumos reemplazados (sin compras registradas, ya verificado) ---');
  for (const nombre of INSUMOS_A_BORRAR) {
    const i = await prisma.insumo.findFirst({ where: { nombre } });
    if (!i) {
      console.log(`${nombre}: ya no existia.`);
      continue;
    }
    await prisma.receta.deleteMany({ where: { insumo_id: i.id } });
    await prisma.compra.deleteMany({ where: { insumo_id: i.id } });
    await prisma.insumo.delete({ where: { id: i.id } });
    console.log(`${nombre}: borrado.`);
  }

  console.log('\n--- Confirmando el resto de recetas como no-provisionales (solo Jelly Spa queda provisional) ---');
  const resultado = await prisma.receta.updateMany({
    where: {
      es_provisional: true,
      insumo: { nombre: { not: 'Sales/gel jelly spa' } },
    },
    data: { es_provisional: false },
  });
  console.log(`Recetas des-marcadas como provisionales: ${resultado.count}`);

  console.log('\n=== RESUMEN ===');
  console.log('Insumos totales:', await prisma.insumo.count());
  console.log('Recetas totales:', await prisma.receta.count());
  console.log('Recetas provisionales:', await prisma.receta.count({ where: { es_provisional: true } }));
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
