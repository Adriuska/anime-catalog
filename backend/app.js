const express = require('express');
const cors = require('cors');
const studioRoutes = require('./src/routes/studioRoutes');
const animeRoutes = require('./src/routes/animeRoutes');
const notFound = require('./src/middlewares/notFound');
const errorHandler = require('./src/middlewares/errorHandler');

const app = express();

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.status(200).json({
    ok: true,
    message: 'Anime Catalog API is running',
    health: '/api/v1/health',
  });
});

app.get('/api/v1/health', (req, res) => {
  res.status(200).json({ ok: true });
});

app.use('/api/v1/studios', studioRoutes);
app.use('/api/v1/animes', animeRoutes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;
