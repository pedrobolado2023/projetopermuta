/**
 * JWT AUTHENTICATION MIDDLEWARE
 * Verifica tokens JWT e implementa RBAC (Role-Based Access Control)
 * 
 * Tokens:
 * - Access Token:  expira em 15 minutos (curto prazo, stateless)
 * - Refresh Token: expira em 7 dias (rotacionado a cada uso)
 * 
 * RBAC Roles (do mais ao menos privilegiado):
 * SUPER_ADMIN > GOVERNANCE_AUDITOR > HOTEL_ADMIN > HOTEL_STAFF > STAFF_GUEST
 */

'use strict';

const jwt = require('jsonwebtoken');

const JWT_SECRET         = process.env.JWT_SECRET;
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET;

if (!JWT_SECRET || !JWT_REFRESH_SECRET) {
  throw new Error('[AUTH] JWT_SECRET e JWT_REFRESH_SECRET devem ser definidos nas variáveis de ambiente.');
}

// ─── Hierarquia de Roles ───────────────────────────────────────────────────────
const ROLE_HIERARCHY = {
  SUPER_ADMIN:        100,
  GOVERNANCE_AUDITOR: 80,
  HOTEL_ADMIN:        60,
  HOTEL_STAFF:        40,
  STAFF_GUEST:        20,
};

// ─── Gerar Access Token ────────────────────────────────────────────────────────
function generateAccessToken(payload) {
  return jwt.sign(
    {
      sub:   payload.id,
      email: payload.email,
      role:  payload.role,
      tier:  payload.gamification_tier,
    },
    JWT_SECRET,
    {
      expiresIn:  '15m',
      issuer:     'staffstay-api',
      audience:   'staffstay-client',
    }
  );
}

// ─── Gerar Refresh Token ───────────────────────────────────────────────────────
function generateRefreshToken(userId) {
  return jwt.sign(
    { sub: userId },
    JWT_REFRESH_SECRET,
    {
      expiresIn:  '7d',
      issuer:     'staffstay-api',
      audience:   'staffstay-client',
    }
  );
}

// ─── Middleware: Requer Autenticação ───────────────────────────────────────────
function requireAuth(req, res, next) {
  const authHeader = req.headers['authorization'];

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      error:   'unauthorized',
      message: 'Token de autenticação não fornecido. Use o header: Authorization: Bearer <token>',
    });
  }

  const token = authHeader.substring(7);

  try {
    const decoded = jwt.verify(token, JWT_SECRET, {
      issuer:   'staffstay-api',
      audience: 'staffstay-client',
    });

    // Adiciona dados do usuário ao request
    req.user = {
      id:    decoded.sub,
      email: decoded.email,
      role:  decoded.role,
      tier:  decoded.tier,
    };

    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({
        error:   'token_expired',
        message: 'Token expirado. Use o endpoint /api/auth/refresh para renovar.',
      });
    }
    return res.status(401).json({
      error:   'invalid_token',
      message: 'Token inválido ou adulterado.',
    });
  }
}

// ─── Middleware: Requer Role Mínima (RBAC) ─────────────────────────────────────
function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'unauthorized', message: 'Autenticação necessária.' });
    }

    const userLevel    = ROLE_HIERARCHY[req.user.role] || 0;
    const requiredLevel = Math.max(...roles.map(r => ROLE_HIERARCHY[r] || 0));

    if (userLevel < requiredLevel) {
      return res.status(403).json({
        error:   'forbidden',
        message: `Acesso negado. Sua role (${req.user.role}) não tem permissão para esta ação.`,
        required: roles,
      });
    }

    next();
  };
}

// ─── Middleware: Requer Verificação Aprovada ───────────────────────────────────
// Garante que o usuário passou por KYC/biometria antes de reservar
function requireVerified(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ error: 'unauthorized' });
  }
  // A verificação do status vem do DB na rota de booking — este middleware é um placeholder
  // O controller de booking faz a validação completa via SELECT no banco
  next();
}

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  requireAuth,
  requireRole,
  requireVerified,
};
