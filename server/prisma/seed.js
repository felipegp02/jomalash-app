require('dotenv').config();
const bcrypt = require('bcryptjs');
const prisma = require('../lib/prisma');

// RF-04: sedes Castilla y Marsella (hoja "Modelo de Datos" / "Resumen").
const SEDES = ['Castilla', 'Marsella'];

async function main() {
  for (const nombre of SEDES) {
    const existente = await prisma.sede.findFirst({ where: { nombre } });
    if (!existente) {
      await prisma.sede.create({ data: { nombre } });
    }
  }

  const nombreAdmin = process.env.SEED_ADMIN_NOMBRE || 'Camila Caballero';
  const emailAdmin = process.env.SEED_ADMIN_EMAIL || 'camila@jomalash.com';
  const passwordAdmin = process.env.SEED_ADMIN_PASSWORD || 'cambiar-esta-clave';

  const sedeCastilla = await prisma.sede.findFirst({ where: { nombre: 'Castilla' } });
  const passwordHash = await bcrypt.hash(passwordAdmin, 10);

  await prisma.usuario.upsert({
    where: { email_recuperacion: emailAdmin },
    update: {},
    create: {
      nombre: nombreAdmin,
      rol: 'admin',
      sede_id: sedeCastilla.id,
      password_hash: passwordHash,
      email_recuperacion: emailAdmin,
      porcentaje_comision: 0,
      activo: true,
    },
  });

  // Empleada de prueba, para poder probar el flujo de registro de ventas (Fase 2)
  // sin depender todavia de la pantalla de "Gestionar empleadas" (Fase 6).
  const nombreEmpleada = process.env.SEED_EMPLEADA_NOMBRE || 'Valentina Ramirez';
  const emailEmpleada = process.env.SEED_EMPLEADA_EMAIL || 'valentina@jomalash.com';
  const passwordEmpleada = process.env.SEED_EMPLEADA_PASSWORD || 'cambiar-esta-clave';
  const passwordHashEmpleada = await bcrypt.hash(passwordEmpleada, 10);

  const empleada = await prisma.usuario.upsert({
    where: { email_recuperacion: emailEmpleada },
    update: { porcentaje_comision: 0.5 },
    create: {
      nombre: nombreEmpleada,
      rol: 'empleada',
      sede_id: sedeCastilla.id,
      password_hash: passwordHashEmpleada,
      email_recuperacion: emailEmpleada,
      porcentaje_comision: 0.5,
      activo: true,
    },
  });

  // Servicio + insumo + receta de ejemplo (mismos nombres usados como ejemplo
  // en la hoja "Modelo de Datos"), para poder probar el descuento automatico
  // de insumos al registrar una venta.
  const servicio = await prisma.servicio.upsert({
    where: { id: 1 },
    update: {},
    create: {
      nombre: 'Manicure Semipermanente',
      categoria: 'Unas',
      precio: 45000,
      activo: true,
    },
  });

  const insumo = await prisma.insumo.upsert({
    where: { id: 1 },
    update: {},
    create: {
      nombre: 'Esmalte rosa',
      unidad: 'ml',
      stock_actual: 500,
      stock_minimo: 50,
    },
  });

  const recetaExistente = await prisma.receta.findFirst({
    where: { servicio_id: servicio.id, insumo_id: insumo.id },
  });
  if (!recetaExistente) {
    await prisma.receta.create({
      data: { servicio_id: servicio.id, insumo_id: insumo.id, cantidad_usada: 5 },
    });
  }

  console.log('Seed completado: sedes, admin, empleada de prueba, y un servicio con receta de ejemplo.');
  console.log(`Admin    -> correo: ${emailAdmin} | contrasena: ${passwordAdmin}`);
  console.log(`Empleada -> correo: ${emailEmpleada} | contrasena: ${passwordEmpleada}`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
