const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const app = express();

const corsOrigins = (process.env.CORS_ORIGINS || process.env.CORS_ORIGIN || '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: corsOrigins.length > 0 ? corsOrigins : true,
    credentials: true,
  }),
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/ligas', require('./routes/ligas.routes'));
app.use('/api/temporadas', require('./routes/temporadas.routes'));
app.use('/api/equipos', require('./routes/equipos.routes'));
app.use('/api/jugadoras', require('./routes/jugadoras.routes'));
app.use('/api/partidos', require('./routes/partidos.routes'));
app.use('/api/estadisticas', require('./routes/estadisticas.routes'));

app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'SoccerGDL API activa',
    features: [
      'JWT por roles',
      'Multi-liga y temporadas',
      'CRUD equipos y jugadoras',
      'Partidos y goles por jugadora',
      'Tabla de posiciones y goleo en tiempo real',
    ],
  });
});

module.exports = app;
