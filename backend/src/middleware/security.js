/**
 * SECURITY MIDDLEWARE
 * Rate Limiting por IP e por endpoint crítico
 * 
 * Protege contra:
 * - Brute-force em login/register
 * - DDoS de baixa intensidade
 * - Abuso de API pública
 */

'use strict';

const rateLimit = require('express-rate-limit');

// ─── Resposta padrão quando limite é atingido ─────────────────────────────────
const rateLimitHandler = (req, res) => {
  res.status(429).json({
    error:   'too_many_requests',
    message: 'Muitas requisições. Aguarde antes de tentar novamente.',
    retryAfter: Math.ceil(req.rateLimit?.resetTime / 1000) || 60,
  });
};

// ─── 1. Limiter Global (todas as rotas) ───────────────────────────────────────
// 200 requisições por minuto por IP — proteção geral
const globalRateLimiter = rateLimit({
  windowMs:         60 * 1000, // 1 minuto
  max:              200,
  standardHeaders:  true,   // Retorna X-RateLimit-* headers
  legacyHeaders:    false,
  handler:          rateLimitHandler,
  keyGenerator:     (req) => req.ip || req.socket.remoteAddress,
  skip:             (req) => req.path === '/api/health', // Health check nunca é limitado
});

// ─── 2. Limiter Estrito para Auth (Anti Brute-Force) ─────────────────────────
// 10 tentativas de login por 15 minutos por IP
const authRateLimiter = rateLimit({
  windowMs:         15 * 60 * 1000, // 15 minutos
  max:              10,
  standardHeaders:  true,
  legacyHeaders:    false,
  handler:          rateLimitHandler,
  message:          'Muitas tentativas de autenticação. Tente novamente em 15 minutos.',
  keyGenerator:     (req) => req.ip || req.socket.remoteAddress,
});

// ─── 3. Limiter para Criação de Reservas ──────────────────────────────────────
// 5 reservas por hora por IP (evita spam de reservas)
const bookingRateLimiter = rateLimit({
  windowMs:         60 * 60 * 1000, // 1 hora
  max:              5,
  standardHeaders:  true,
  legacyHeaders:    false,
  handler:          rateLimitHandler,
  keyGenerator:     (req) => (req.user?.id || req.ip), // Prefere limitar por usuário logado
});

module.exports = {
  globalRateLimiter,
  authRateLimiter,
  bookingRateLimiter,
};
