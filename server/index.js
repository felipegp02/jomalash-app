require('dotenv').config();

const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');

const authRoutes = require('./routes/auth.routes');
const ventasRoutes = require('./routes/ventas.routes');
const serviciosRoutes = require('./routes/servicios.routes');
const usuariosRoutes = require('./routes/usuarios.routes');
const sedesRoutes = require('./routes/sedes.routes');
const errorHandler = require('./middleware/errorHandler');

const app = express();

// RNF-09: la app vive en un subdominio separado (app.jomalash.com), por eso
// CORS solo permite el origen del frontend, con credenciales para la cookie httpOnly.
app.use(cors({ origin: process.env.CLIENT_URL, credentials: true }));
app.use(express.json());
app.use(cookieParser());

app.get('/health', (req, res) => res.json({ status: 'ok' }));

app.use('/auth', authRoutes);
app.use('/ventas', ventasRoutes);
app.use('/servicios', serviciosRoutes);
app.use('/usuarios', usuariosRoutes);
app.use('/sedes', sedesRoutes);

app.use((req, res) => {
  res.status(404).json({ error: 'Ruta no encontrada' });
});

app.use(errorHandler);

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Servidor Jomalash escuchando en el puerto ${PORT}`);
});
