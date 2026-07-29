// Copia el catalogo real (servicios activos, insumos y recetas) de la base
// local a una base de produccion, preservando los valores tal cual estan en
// local. No copia stock_actual/stock_minimo (arrancan en 0 en produccion,
// igual que se hizo originalmente en local: el stock real lo carga el admin
// a mano con "Inventario inicial", no se puede inventar desde ac".
//
// Uso: node scripts/sincronizar-catalogo-produccion.js "<DATABASE_URL_PROD>"
require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

const DATABASE_URL_PROD = process.argv[2];
if (!DATABASE_URL_PROD) {
  console.error('Uso: node scripts/sincronizar-catalogo-produccion.js "<DATABASE_URL_PRODUCCION>"');
  process.exit(1);
}

const local = new PrismaClient();
const prod = new PrismaClient({ datasources: { db: { url: DATABASE_URL_PROD } } });

async function main() {
  // 1) Servicios activos (el catalogo real; deja afuera el servicio de
  // prueba desactivado "Manicure Semipermanente").
  const servicios = await local.servicio.findMany({ where: { activo: true } });
  const servicioIdProdPorNombre = new Map();

  for (const s of servicios) {
    const existente = await prod.servicio.findFirst({ where: { nombre: s.nombre } });
    const creado = existente
      ? await prod.servicio.update({
          where: { id: existente.id },
          data: { categoria: s.categoria, precio: s.precio, activo: true },
        })
      : await prod.servicio.create({
          data: { nombre: s.nombre, categoria: s.categoria, precio: s.precio, activo: true },
        });
    servicioIdProdPorNombre.set(s.nombre, creado.id);
  }

  // 2) Insumos (todos: no hay flag de prueba/real distinto en la tabla,
  // todo lo que hay en local a esta altura es real).
  const insumos = await local.insumo.findMany();
  const insumoIdProdPorNombre = new Map();

  for (const i of insumos) {
    const existente = await prod.insumo.findFirst({ where: { nombre: i.nombre } });
    const creado = existente
      ? await prod.insumo.update({
          where: { id: existente.id },
          data: {
            tipo: i.tipo,
            tipo_medida: i.tipo_medida,
            unidad_compra: i.unidad_compra,
            contenido_por_compra: i.contenido_por_compra,
          },
        })
      : await prod.insumo.create({
          data: {
            nombre: i.nombre,
            tipo: i.tipo,
            tipo_medida: i.tipo_medida,
            unidad_compra: i.unidad_compra,
            contenido_por_compra: i.contenido_por_compra,
            stock_actual: 0,
            stock_minimo: 0,
          },
        });
    insumoIdProdPorNombre.set(i.nombre, creado.id);
  }

  // 3) Recetas: para cada servicio, reemplaza por completo su receta en
  // produccion con la de local (mapeando ids por nombre, no por id crudo,
  // porque los ids difieren entre las dos bases).
  let totalLineas = 0;
  for (const s of servicios) {
    const recetaLocal = await local.receta.findMany({
      where: { servicio_id: s.id },
      include: { insumo: { select: { nombre: true } } },
    });

    const servicioIdProd = servicioIdProdPorNombre.get(s.nombre);
    await prod.receta.deleteMany({ where: { servicio_id: servicioIdProd } });
    if (recetaLocal.length) {
      await prod.receta.createMany({
        data: recetaLocal.map((r) => ({
          servicio_id: servicioIdProd,
          insumo_id: insumoIdProdPorNombre.get(r.insumo.nombre),
          cantidad_usada: r.cantidad_usada,
          es_provisional: r.es_provisional,
        })),
      });
      totalLineas += recetaLocal.length;
    }
  }

  console.log(`Servicios sincronizados: ${servicios.length}`);
  console.log(`Insumos sincronizados: ${insumos.length}`);
  console.log(`Lineas de receta sincronizadas: ${totalLineas}`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await local.$disconnect();
    await prod.$disconnect();
  });
