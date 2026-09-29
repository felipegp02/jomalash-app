require('dotenv').config();

// Self-heal: si el bit +x del engine binary de Prisma se perdio entre el
// build y el runtime (hosts tipo "Web Apps" separan ambos entornos), lo
// reaplica antes de requerir cualquier ruta - las rutas instancian
// PrismaClient (lib/prisma.js) apenas se cargan. No es fatal si falla: en
// ese caso el runtime es de solo lectura y hay que confiar en el chmod del
// postinstall (ver scripts/asegurar-permisos-prisma-engine.js).
let resultadoSelfHealPrismaEngine;
try {
  resultadoSelfHealPrismaEngine = require('./lib/prismaEnginePermissions').asegurarPermisos();
} catch (err) {
  resultadoSelfHealPrismaEngine = { error: err.message };
  console.error('[prisma-engine] Self-heal de permisos fallo al arrancar:', err.message);
}

const fs = require('fs');
const os = require('os');
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');

const authRoutes = require('./routes/auth.routes');
const ventasRoutes = require('./routes/ventas.routes');
const serviciosRoutes = require('./routes/servicios.routes');
const usuariosRoutes = require('./routes/usuarios.routes');
const sedesRoutes = require('./routes/sedes.routes');
const dashboardRoutes = require('./routes/dashboard.routes');
const insumosRoutes = require('./routes/insumos.routes');
const comprasRoutes = require('./routes/compras.routes');
const recetaRoutes = require('./routes/receta.routes');
const cierresCajaRoutes = require('./routes/cierresCaja.routes');
const metasRoutes = require('./routes/metas.routes');
const reportesRoutes = require('./routes/reportes.routes');
const nominaRoutes = require('./routes/nomina.routes');
const gastosRoutes = require('./routes/gastos.routes');
const cobrosRoutes = require('./routes/cobros.routes');
const errorHandler = require('./middleware/errorHandler');

const app = express();

// Hostinger pone un proxy interno (Passenger) delante del proceso: sin esto
// req.ip devuelve siempre la IP del proxy, no la del cliente real, y el
// rate limiter de /auth/login terminaria compartiendo un solo cupo entre
// todos los usuarios.
app.set('trust proxy', 1);

// RNF-09: la app vive en un subdominio separado (app.jomalash.com), por eso
// CORS solo permite el origen del frontend, con credenciales para la cookie httpOnly.
app.use(cors({ origin: process.env.CLIENT_URL, credentials: true }));
app.use(express.json());
app.use(cookieParser());

app.get('/health', (req, res) => res.json({ status: 'ok' }));

// DIAGNOSTICO TEMPORAL: para confirmar sin SSH si el engine binary de
// Prisma tiene el bit +x, si el archivo es un ELF valido (no una pagina de
// error guardada con el nombre del binario, ni un archivo truncado), y si
// el runtime tiene memoria/libc compatibles. No aplica ningun cambio (el
// chmod ya corrio como self-heal al arrancar, arriba). Sacar esta ruta
// despues de usarla.
app.get('/diagnostico/prisma-engine', (req, res) => {
  try {
    const { listarBinariosEngine, inspeccionar } = require('./lib/prismaEnginePermissions');
    const binariosAhora = listarBinariosEngine().map((archivo) => {
      try {
        return inspeccionar(archivo);
      } catch (err) {
        return { archivo, error: err.message };
      }
    });

    res.json({
      selfHealAlArrancar: resultadoSelfHealPrismaEngine,
      binariosAhora,
      sistema: {
        platform: process.platform,
        arch: process.arch,
        release: os.release(),
        libcMusl: fs.existsSync('/lib/ld-musl-x86_64.so.1'),
        libcGlibc: fs.existsSync('/lib64/ld-linux-x86-64.so.2'),
        memoriaLibreMB: Math.round(os.freemem() / 1024 / 1024),
        memoriaTotalMB: Math.round(os.totalmem() / 1024 / 1024),
        memoriaProcesoRssMB: Math.round(process.memoryUsage().rss / 1024 / 1024),
      },
      envRelevantes: {
        PRISMA_QUERY_ENGINE_BINARY: process.env.PRISMA_QUERY_ENGINE_BINARY || null,
        PRISMA_SCHEMA_ENGINE_BINARY: process.env.PRISMA_SCHEMA_ENGINE_BINARY || null,
        PRISMA_ENGINES_MIRROR: process.env.PRISMA_ENGINES_MIRROR || null,
        PRISMA_CLI_QUERY_ENGINE_TYPE: process.env.PRISMA_CLI_QUERY_ENGINE_TYPE || null,
      },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.use('/auth', authRoutes);
app.use('/ventas', ventasRoutes);
app.use('/servicios', serviciosRoutes);
app.use('/usuarios', usuariosRoutes);
app.use('/sedes', sedesRoutes);
app.use('/dashboard', dashboardRoutes);
app.use('/insumos', insumosRoutes);
app.use('/compras', comprasRoutes);
app.use('/receta', recetaRoutes);
app.use('/cierres-caja', cierresCajaRoutes);
app.use('/metas', metasRoutes);
app.use('/reportes', reportesRoutes);
app.use('/nomina', nominaRoutes);
app.use('/gastos', gastosRoutes);
app.use('/cobros', cobrosRoutes);

app.use((req, res) => {
  res.status(404).json({ error: 'Ruta no encontrada' });
});

app.use(errorHandler);

const PORT = process.env.PORT || 4000;
// 0.0.0.0 por defecto (todas las interfaces), no localhost: en hosting
// compartido el proxy interno (ej. Passenger en Hostinger) necesita poder
// alcanzar el proceso desde afuera del propio proceso. Queda como variable
// de entorno por si el proveedor exige un bind address especifico.
const HOST = process.env.HOST || '0.0.0.0';
app.listen(PORT, HOST, () => {
  console.log(`Servidor Jomalash escuchando en ${HOST}:${PORT}`);
});
