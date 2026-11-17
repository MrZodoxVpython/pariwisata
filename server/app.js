import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { query, isDatabaseConfigured, databaseUrlSource } from './lib/db.js';
import contentRoutes from './routes/content.js';
import bookingRoutes from './routes/bookings.js';
import contactRoutes from './routes/contact.js';

const here = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(here, '.env') });

const app = express();
const clientDist = path.resolve(here, '../client/dist');

const allowedOrigins = (process.env.CORS_ORIGIN || '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

app.set('trust proxy', 1);
app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);
app.use(
  cors({
    origin: allowedOrigins.length ? allowedOrigins : true,
    methods: ['GET', 'POST', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'x-admin-token'],
  })
);
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
app.use(express.json({ limit: '100kb' }));

app.get('/api/health', async (req, res) => {
  if (!isDatabaseConfigured) {
    return res.status(503).json({
      status: 'error',
      service: 'canyoning-bali-api',
      database: 'not_configured',
      error:
        'DATABASE_URL is not set. Add it in Vercel → Settings → Environment Variables, then redeploy.',
    });
  }

  try {
    const { rows } = await query('select now() as time');
    res.json({
      status: 'ok',
      service: 'canyoning-bali-api',
      database: 'connected',
      source: databaseUrlSource,
      timestamp: rows[0].time,
    });
  } catch (error) {
    res.status(503).json({
      status: 'error',
      database: 'unavailable',
      error: error.message,
    });
  }
});

app.use('/api', contentRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/contact', contactRoutes);

// Serve the built React app when it exists (single-service VPS/Render deploy).
// On Vercel the static build is served by the CDN instead.
if (!process.env.VERCEL && existsSync(clientDist)) {
  app.use(express.static(clientDist, { maxAge: '1h', index: false }));
  app.get(/^(?!\/api).*/, (req, res) => {
    res.sendFile(path.join(clientDist, 'index.html'));
  });
}

app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  const isConfigError = /DATABASE_URL is not configured/.test(err.message || '');
  const status = err.status || (isConfigError ? 503 : 500);
  if (status >= 500) console.error(err);
  res.status(status).json({
    error: err.message || 'Internal server error',
    ...(err.details ? { details: err.details } : {}),
  });
});

export default app;