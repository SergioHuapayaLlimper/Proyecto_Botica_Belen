import express from 'express';
import cors from 'cors';
import { pool } from './db.js';
import authRoutes from './routes/auth.js';
import catalogoRoutes from './routes/catalogo.js';
import pedidosRoutes from './routes/pedidos.js';
import gestionRoutes from './routes/gestion.js';

const PORT = Number(process.env.PORT ?? 3200);
const app = express();

app.use(cors({ origin: (process.env.CORS_ORIGIN ?? 'http://localhost:4200').split(',') }));
app.use(express.json({ limit: '100kb' }));

// Registro en la terminal de cada petición: hora, método, ruta, código de respuesta y tiempo.
app.use((req, res, next) => {
  const inicio = performance.now();
  res.on('finish', () => {
    const ms = Math.round(performance.now() - inicio);
    console.log(`[${new Date().toLocaleTimeString('es-PE')}] ${req.method} ${req.originalUrl} → ${res.statusCode} (${ms} ms)`);
  });
  next();
});

app.get('/api/salud', async (req, res) => {
  await pool.query('SELECT 1');
  res.json({ estado: 'ok', baseDeDatos: process.env.DB_NAME }); 
});

app.use('/api/auth', authRoutes);
app.use('/api', catalogoRoutes);
app.use('/api', pedidosRoutes);
app.use('/api/gestion', gestionRoutes);

app.use((req, res) => res.status(404).json({ message: `Ruta no encontrada: ${req.method} ${req.originalUrl}` }));

// Manejador de errores: los HttpError se devuelven tal cual; el resto se registra y se oculta el detalle.
app.use((error, req, res, next) => {
  if (error.status && error.status < 500) return res.status(error.status).json({ message: error.message });
  if (error.type === 'entity.parse.failed') return res.status(400).json({ message: 'JSON inválido.' });
  console.error(`[${new Date().toLocaleTimeString('es-PE')}] ${req.method} ${req.originalUrl}`, error);
  res.status(500).json({ message: 'Ocurrió un error inesperado en el servidor.' });
});

try {
  await pool.query('SELECT 1');
  app.listen(PORT, () => console.log(`API de Botica Belén lista en http://localhost:${PORT}/api`));
} catch (error) {
  console.error(`No se pudo conectar a MySQL (${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}): ${error.message}`);
  console.error('Revisa que el servicio de MySQL esté iniciado y los datos del archivo .env.');
  process.exit(1);
}
