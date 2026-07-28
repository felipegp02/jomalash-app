// Limpieza pre-despliegue (unica vez): deja la base con los usuarios reales
// del negocio y sin datos de prueba, sin tocar el catalogo de servicios ni
// los insumos/recetas ya cargados con datos reales de Jomalash.
require('dotenv').config();
const bcrypt = require('bcryptjs');
const prisma = require('../lib/prisma');

const PASSWORD_TEMPORAL = 'Jomalash2026!';

const PERMISOS_ADMIN = {
  ve_insumos: true,
  ve_nomina: true,
  ve_caja: true,
  ve_dashboard_completo: true,
  gestiona_catalogo: true,
  gestiona_empleadas: true,
};

async function upsertAdmin(nombre, email, sedeId) {
  const passwordHash = await bcrypt.hash(PASSWORD_TEMPORAL, 10);

  const usuario = await prisma.usuario.upsert({
    where: { email_recuperacion: email },
    update: {
      password_hash: passwordHash,
      debe_cambiar_password: true,
      activo: true,
      ...PERMISOS_ADMIN,
    },
    create: {
      nombre,
      email_recuperacion: email,
      password_hash: passwordHash,
      rol: 'admin',
      sede_id: sedeId,
      porcentaje_comision: 0,
      activo: true,
      debe_cambiar_password: true,
      ...PERMISOS_ADMIN,
    },
  });

  console.log(`Admin listo: ${usuario.nombre} <${usuario.email_recuperacion}> (id ${usuario.id})`);
}

async function main() {
  const castilla = await prisma.sede.findFirst({ where: { nombre: 'Castilla' } });
  if (!castilla) throw new Error('No existe la sede Castilla');

  // 1) Cuentas admin reales, con contraseña temporal y flag de cambio obligatorio.
  // upsert en los tres casos: crea la cuenta si no existe (ej. produccion,
  // recien migrada) o solo le actualiza password+permisos si ya existia
  // (ej. local, donde Camila es la cuenta de siempre desde el seed inicial).
  await upsertAdmin('Felipe', 'felipegp02@gmail.com', castilla.id);
  await upsertAdmin('Administración General', 'admin@jomalash.com', castilla.id);
  await upsertAdmin('Camila Caballero', 'camila@jomalash.com', castilla.id);

  // 2) Borrar datos de prueba: ventas (todas, son ficticias) y la compra de
  // prueba (revirtiendo su efecto en el stock antes de borrarla).
  const compraPrueba = await prisma.compra.findFirst({ where: { insumo_id: 4 } });
  if (compraPrueba) {
    const insumo = await prisma.insumo.findUnique({ where: { id: compraPrueba.insumo_id } });
    const incrementoOriginal =
      insumo.tipo === 'herramienta'
        ? Number(compraPrueba.cantidad)
        : Number(compraPrueba.cantidad) * Number(insumo.contenido_por_compra);

    await prisma.$transaction([
      prisma.insumo.update({
        where: { id: insumo.id },
        data: { stock_actual: { decrement: incrementoOriginal } },
      }),
      prisma.compra.delete({ where: { id: compraPrueba.id } }),
    ]);
    console.log(`Compra de prueba borrada, stock de "${insumo.nombre}" revertido en -${incrementoOriginal}.`);
  }

  const ventasBorradas = await prisma.venta.deleteMany({});
  console.log(`Ventas de prueba borradas: ${ventasBorradas.count}`);

  // 3) Borrar empleadas de prueba (Valentina y cualquier otra que no sea
  // personal real). Se hace después de borrar las ventas para no chocar con
  // la relación Venta.usuario_id / Venta.editado_por.
  const empleadasPrueba = await prisma.usuario.findMany({ where: { rol: 'empleada' } });
  for (const empleada of empleadasPrueba) {
    await prisma.usuario.delete({ where: { id: empleada.id } });
    console.log(`Empleada de prueba borrada: ${empleada.nombre} <${empleada.email_recuperacion}>`);
  }

  console.log('\nListo. Catalogo de servicios e insumos no fue tocado.');
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
