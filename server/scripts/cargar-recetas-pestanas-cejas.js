// Parte 3 del pedido de despliegue: insumos nuevos + recetas de servicios
// que hasta ahora tenian por error las 13 lineas "universales" de insumos
// de uñas (Removedor de esmalte, Crema para pies y manos, etc.), pese a no
// usarlas. Se reemplazan por completo por la receta real de cada servicio.
// Marcadas como es_provisional=true: son estimaciones a validar despues con
// compras reales, no datos confirmados como el resto del catalogo.
//
// Corre solo contra la base local (usa el DATABASE_URL del .env por
// defecto); para llevarlo a produccion se vuelve a correr despues
// scripts/sincronizar-catalogo-produccion.js, que ya sabe replicar
// insumos+recetas por nombre.
require('dotenv').config();
const prisma = require('../lib/prisma');

const NUEVOS_INSUMOS = [
  { nombre: 'Pegante', tipo_medida: 'gramos', unidad_compra: 'frasco', contenido_por_compra: 5 },
  { nombre: 'Cinta micropore', tipo_medida: 'unidades', unidad_compra: 'rollo', contenido_por_compra: 1 },
  { nombre: 'Removedor de pestañas', tipo_medida: 'ml', unidad_compra: 'frasco', contenido_por_compra: 100 },
  { nombre: 'Pestañas sueltas', tipo_medida: 'unidades', unidad_compra: 'bandeja', contenido_por_compra: 16 },
  { nombre: 'Cera depilatoria', tipo_medida: 'gramos', unidad_compra: 'bolsa', contenido_por_compra: 1000 },
  { nombre: 'Bandas de cera', tipo_medida: 'unidades', unidad_compra: 'paquete', contenido_por_compra: 100 },
  { nombre: 'Henna crema/polvo', tipo_medida: 'gramos', unidad_compra: 'tarro', contenido_por_compra: 50 },
  { nombre: 'Solución 1 (perm)', tipo_medida: 'ml', unidad_compra: 'frasco', contenido_por_compra: 100 },
  { nombre: 'Solución 2 (fijador)', tipo_medida: 'ml', unidad_compra: 'frasco', contenido_por_compra: 100 },
  { nombre: 'Pegamento almohadilla', tipo_medida: 'gramos', unidad_compra: 'frasco', contenido_por_compra: 5 },
  { nombre: 'Sales/gel jelly spa', tipo_medida: 'gramos', unidad_compra: 'bolsa', contenido_por_compra: 1000 },
];

const LIFTING = [
  { insumo: 'Solución 1 (perm)', cantidad: 2 },
  { insumo: 'Solución 2 (fijador)', cantidad: 2 },
  { insumo: 'Pegamento almohadilla', cantidad: 0.3 },
];

// Reemplaza por completo la receta de cada servicio (tenian las 13 lineas
// universales de uñas por error, no algo que hubiera que conservar).
const RECETAS_REEMPLAZAR = {
  'Pestañas Clásicas/2D/3D': [
    { insumo: 'Pegante', cantidad: 0.3 },
    { insumo: 'Cinta micropore', cantidad: 0.05 },
    { insumo: 'Removedor de pestañas', cantidad: 1 },
    { insumo: 'Pestañas sueltas', cantidad: 1 },
  ],
  'Pestañas 6D': [
    { insumo: 'Pegante', cantidad: 0.5 },
    { insumo: 'Cinta micropore', cantidad: 0.05 },
    { insumo: 'Removedor de pestañas', cantidad: 1 },
    { insumo: 'Pestañas sueltas', cantidad: 2 },
  ],
  'Cejas Cera': [
    { insumo: 'Cera depilatoria', cantidad: 15 },
    { insumo: 'Bandas de cera', cantidad: 2 },
  ],
  'Cejas Hilo': [], // Manual, sin insumo consumible.
  Bozo: [
    { insumo: 'Cera depilatoria', cantidad: 10 },
    { insumo: 'Bandas de cera', cantidad: 1 },
  ],
  Henna: [{ insumo: 'Henna crema/polvo', cantidad: 3 }],
  Lifting: LIFTING,
  Laminado: LIFTING,
};

// Se agregan encima de la receta ya existente (no la reemplazan): Jelly Spa
// Solo y con Pies ya tenian su base (Pies ademas incluye los "genericos de
// pedicure tradicional" que pidio el usuario, heredados del catalogo real).
const RECETAS_AGREGAR = {
  'Jelly Spa Solo': [{ insumo: 'Sales/gel jelly spa', cantidad: 80 }],
  'Jelly Spa con Pies Tradicional': [{ insumo: 'Sales/gel jelly spa', cantidad: 80 }],
};

async function main() {
  const insumoIdPorNombre = new Map();
  for (const i of NUEVOS_INSUMOS) {
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

  let totalLineas = 0;

  for (const [nombreServicio, lineas] of Object.entries(RECETAS_REEMPLAZAR)) {
    const servicio = await prisma.servicio.findFirst({ where: { nombre: nombreServicio } });
    if (!servicio) throw new Error(`No existe el servicio "${nombreServicio}"`);

    await prisma.receta.deleteMany({ where: { servicio_id: servicio.id } });
    if (lineas.length) {
      await prisma.receta.createMany({
        data: lineas.map((l) => ({
          servicio_id: servicio.id,
          insumo_id: insumoIdPorNombre.get(l.insumo),
          cantidad_usada: l.cantidad,
          es_provisional: true,
        })),
      });
    }
    totalLineas += lineas.length;
    console.log(`${nombreServicio}: receta reemplazada (${lineas.length} lineas, provisional).`);
  }

  for (const [nombreServicio, lineas] of Object.entries(RECETAS_AGREGAR)) {
    const servicio = await prisma.servicio.findFirst({ where: { nombre: nombreServicio } });
    if (!servicio) throw new Error(`No existe el servicio "${nombreServicio}"`);

    await prisma.receta.createMany({
      data: lineas.map((l) => ({
        servicio_id: servicio.id,
        insumo_id: insumoIdPorNombre.get(l.insumo),
        cantidad_usada: l.cantidad,
        es_provisional: true,
      })),
    });
    totalLineas += lineas.length;
    console.log(`${nombreServicio}: ${lineas.length} linea(s) agregada(s) (provisional).`);
  }

  console.log(`\nInsumos nuevos: ${NUEVOS_INSUMOS.length}`);
  console.log(`Lineas de receta nuevas/reemplazadas: ${totalLineas}`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
