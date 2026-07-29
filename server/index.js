require('dotenv').config();

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
const errorHandler = require('./middleware/errorHandler');

const app = express();

// RNF-09: la app vive en un subdominio separado (app.jomalash.com), por eso
// CORS solo permite el origen del frontend, con credenciales para la cookie httpOnly.
app.use(cors({ origin: process.env.CLIENT_URL, credentials: true }));
app.use(express.json());
app.use(cookieParser());

app.get('/health', (req, res) => res.json({ status: 'ok' }));

// DIAGNOSTICO TEMPORAL: solo para averiguar la IP publica de salida del
// servidor y poder agregarla a la whitelist de MySQL remoto en Hostinger.
// Sacar esta ruta despues de usarla.
app.get('/diagnostico/ip', async (req, res) => {
  try {
    const respuesta = await fetch('https://api.ipify.org?format=json');
    const datos = await respuesta.json();
    console.log('[diagnostico] IP de salida del servidor:', datos.ip);
    res.json(datos);
  } catch (err) {
    console.error('[diagnostico] Error obteniendo la IP:', err);
    res.status(500).json({ error: 'No se pudo obtener la IP de salida' });
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
