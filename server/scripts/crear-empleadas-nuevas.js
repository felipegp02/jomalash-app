// Parte 2 del pedido de despliegue: empleadas reales sin acceso a login
// (solo existen para poder asignarles ventas/comision desde Registrar). Se
// les genera una contraseña aleatoria que nunca se comparte con nadie -
// nadie deberia intentar usarla para entrar.
//
// Uso local (usa el DATABASE_URL del .env): node scripts/crear-empleadas-nuevas.js
// Uso contra otra base: node scripts/crear-empleadas-nuevas.js "<DATABASE_URL>"
require('dotenv').config();
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { PrismaClient } = require('@prisma/client');

const DATABASE_URL_OVERRIDE = process.argv[2];
const prisma = DATABASE_URL_OVERRIDE
  ? new PrismaClient({ datasources: { db: { url: DATABASE_URL_OVERRIDE } } })
  : new PrismaClient();

const COMISION = 0.5; // 50%, igual para las 9 (confirmado por el usuario).

const EMPLEADAS = [
  { nombre: 'María', sede: 'Marsella' },
  { nombre: 'Nicoll', sede: 'Marsella' },
  { nombre: 'Paula', sede: 'Marsella' },
  { nombre: 'Ingrid', sede: 'Marsella' },
  { nombre: 'Carolina', sede: 'Marsella' },
  { nombre: 'Adriana', sede: 'Castilla' },
  { nombre: 'Luciana', sede: 'Castilla' },
  { nombre: 'Yuranny', sede: 'Castilla' },
  { nombre: 'Juanita', sede: 'Castilla' },
];

function slug(texto) {
  return texto
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '') // quita tildes tras normalizar (marcas diacriticas NFD)
    .toLowerCase();
}

async function main() {
  const sedes = await prisma.sede.findMany();
  const sedeIdPorNombre = new Map(sedes.map((s) => [s.nombre, s.id]));

  for (const e of EMPLEADAS) {
    const sedeId = sedeIdPorNombre.get(e.sede);
    if (!sedeId) throw new Error(`No existe la sede "${e.sede}"`);

    const email = `${slug(e.nombre)}.${slug(e.sede)}@jomalash.local`;
    const existente = await prisma.usuario.findUnique({ where: { email_recuperacion: email } });
    if (existente) {
      console.log(`Ya existia: ${e.nombre} (${e.sede}) <${email}> id ${existente.id}`);
      continue;
    }

    const passwordAleatoria = crypto.randomBytes(24).toString('hex');
    const passwordHash = await bcrypt.hash(passwordAleatoria, 10);

    const creada = await prisma.usuario.create({
      data: {
        nombre: e.nombre,
        rol: 'empleada',
        sede_id: sedeId,
        password_hash: passwordHash,
        email_recuperacion: email,
        porcentaje_comision: COMISION,
        activo: true,
      },
    });
    console.log(`Creada: ${creada.nombre} (${e.sede}) <${email}> id ${creada.id}`);
  }
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
