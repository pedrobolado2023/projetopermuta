/**
 * STAFFSTAY / HOSTPASS — BACKEND API SERVER
 * Express Application with Full Security Stack
 * 
 * Security Stack:
 * - Helmet (HTTP headers hardening)
 * - CORS (whitelist-based)
 * - Rate Limiting (per-IP, per-endpoint)
 * - JWT Authentication (RS256-style via shared secret)
 * - Input Validation (Joi + express-validator)
 * - GZIP Compression
 * - Structured Request Logging (Morgan)
 */

'use strict';

require('dotenv').config();

const express    = require('express');
const helmet     = require('helmet');
const cors       = require('cors');
const morgan     = require('morgan');
const compression = require('compression');

// ─── Routes ───────────────────────────────────────────────────────────────────
const authRoutes    = require('./routes/auth');
const hotelRoutes   = require('./routes/hotels');
const bookingRoutes = require('./routes/bookings');
const adminRoutes   = require('./routes/admin');
const pmsRoutes     = require('./routes/pms');

// ─── Security Middleware ───────────────────────────────────────────────────────
const { globalRateLimiter } = require('./middleware/security');

const app  = express();
const PORT = process.env.PORT || 3000;
const ENV  = process.env.NODE_ENV || 'development';

// ─── Allowed Origins (CORS Whitelist) ─────────────────────────────────────────
const ALLOWED_ORIGINS = (process.env.CORS_ORIGIN || 'http://localhost:5500')
  .split(',')
  .map(o => o.trim());

// ─── Core Security Headers (Helmet) ───────────────────────────────────────────
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc:  ["'self'"],
      styleSrc:   ["'self'", 'https://fonts.googleapis.com'],
      fontSrc:    ["'self'", 'https://fonts.gstatic.com'],
      imgSrc:     ["'self'", 'https://images.unsplash.com', 'data:'],
      connectSrc: ["'self'"],
    },
  },
  hsts: {
    maxAge:            63072000, // 2 years
    includeSubDomains: true,
    preload:           true,
  },
  frameguard:       { action: 'deny' },
  noSniff:          true,
  xssFilter:        true,
  referrerPolicy:   { policy: 'strict-origin-when-cross-origin' },
}));

// ─── CORS ─────────────────────────────────────────────────────────────────────
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, Postman, server-to-server)
    if (!origin) return callback(null, true);
    if (ALLOWED_ORIGINS.includes(origin)) return callback(null, true);
    callback(new Error(`Origin "${origin}" not allowed by CORS policy.`));
  },
  methods:            ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders:     ['Content-Type', 'Authorization', 'X-Request-ID'],
  exposedHeaders:     ['X-Request-ID', 'X-RateLimit-Remaining'],
  credentials:        true,
  maxAge:             86400, // preflight cache: 24h
}));

// ─── Compression ──────────────────────────────────────────────────────────────
app.use(compression({ threshold: 1024 }));

// ─── Body Parsing (with size limits to prevent payload attacks) ───────────────
app.use(express.json({ limit: '256kb' }));
app.use(express.urlencoded({ extended: true, limit: '256kb' }));

// ─── HTTP Request Logging ─────────────────────────────────────────────────────
if (ENV !== 'test') {
  app.use(morgan(ENV === 'production' ? 'combined' : 'dev'));
}

// ─── Global Rate Limiter (anti-DDoS) ──────────────────────────────────────────
app.use(globalRateLimiter);

// ─── Health Check (EasyPanel readiness probe) ─────────────────────────────────
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status:      'ok',
    service:     'staffstay-api',
    version:     '1.0.0',
    environment: ENV,
    timestamp:   new Date().toISOString(),
  });
});

// ─── API Routes ───────────────────────────────────────────────────────────────
app.use('/api/auth',     authRoutes);
app.use('/api/hotels',   hotelRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/admin',    adminRoutes);
app.use('/api/pms',      pmsRoutes);

// ─── 404 Handler ──────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({
    error:   'not_found',
    message: `Rota ${req.method} ${req.path} não encontrada.`,
  });
});

// ─── Global Error Handler ─────────────────────────────────────────────────────
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  // CORS errors
  if (err.message && err.message.includes('CORS')) {
    return res.status(403).json({ error: 'cors_denied', message: err.message });
  }

  // Validation errors (Joi)
  if (err.isJoi) {
    return res.status(422).json({
      error:   'validation_error',
      details: err.details.map(d => d.message),
    });
  }

  // JWT errors
  if (err.name === 'UnauthorizedError' || err.name === 'JsonWebTokenError') {
    return res.status(401).json({ error: 'invalid_token', message: 'Token inválido ou expirado.' });
  }

  // Database errors (pg)
  if (err.code && err.code.startsWith('2') || err.code === '23505') {
    return res.status(409).json({ error: 'conflict', message: 'Registro duplicado no banco de dados.' });
  }

  console.error('[ERROR]', {
    path:    req.path,
    method:  req.method,
    message: err.message,
    stack:   ENV === 'development' ? err.stack : undefined,
  });

  res.status(err.statusCode || 500).json({
    error:   'internal_server_error',
    message: ENV === 'production' ? 'Erro interno. Tente novamente em instantes.' : err.message,
  });
});

// ─── Start Server ─────────────────────────────────────────────────────────────
app.listen(PORT, '0.0.0.0', () => {
  console.log(`\n🚀 StaffStay API rodando na porta ${PORT} [${ENV.toUpperCase()}]`);
  console.log(`   Health check: http://localhost:${PORT}/api/health\n`);
});

module.exports = app;
