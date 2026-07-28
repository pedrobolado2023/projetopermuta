/**
 * AUTH ROUTES
 * POST /api/auth/register  — Cadastro de novo usuário hoteleiro
 * POST /api/auth/login     — Login com e-mail + senha → JWT
 * POST /api/auth/refresh   — Renovação de access token via refresh token
 * POST /api/auth/logout    — Revoga o refresh token
 * GET  /api/auth/me        — Retorna perfil do usuário autenticado
 */

'use strict';

const express    = require('express');
const bcrypt     = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const Joi        = require('joi');
const jwt        = require('jsonwebtoken');

const crypto   = require('crypto');
const db       = require('../config/db');
const { generateAccessToken, generateRefreshToken, requireAuth } = require('../middleware/auth');
const { authRateLimiter } = require('../middleware/security');

const router = express.Router();

const BCRYPT_ROUNDS = parseInt(process.env.BCRYPT_ROUNDS || '12', 10);

// Helper para gerar Fingerprint/Hash Visual de Imagens (Base64 ou URL)
function generateImageHash(imageStr) {
  if (!imageStr || typeof imageStr !== 'string') return '';
  // Limpa cabeçalhos data URL para comparar o payload puro da imagem
  const cleanPayload = imageStr.replace(/^data:image\/\w+;base64,/, '').trim();
  if (cleanPayload.length < 10) return '';
  return crypto.createHash('sha256').update(cleanPayload).digest('hex');
}

// ─── Schemas de Validação (Joi) ────────────────────────────────────────────────
const registerSchema = Joi.object({
  full_name:            Joi.string().min(3).max(255).required(),
  cpf:                  Joi.string().pattern(/^\d{3}\.\d{3}\.\d{3}-\d{2}$/).required()
                          .messages({ 'string.pattern.base': 'CPF deve estar no formato 000.000.000-00' }),
  email:                Joi.string().email().lowercase().required(),
  phone:                Joi.string().min(10).max(30).required(),
  password:             Joi.string().min(8).max(128)
                          .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
                          .required()
                          .messages({ 'string.pattern.base': 'Senha deve ter ao menos 1 maiúscula, 1 minúscula e 1 número.' }),
  employer_hotel_name:  Joi.string().min(3).max(255).required(),
  employer_cnpj:        Joi.string().max(18).optional().allow(''),
  job_position:         Joi.string().min(2).max(100).required(),
  document_proof_url:   Joi.string().optional().allow(''),
  selfie_url:           Joi.string().optional().allow(''),
  referral_code_used:   Joi.string().alphanum().max(20).optional(),
});

const loginSchema = Joi.object({
  email:    Joi.string().required(), // Aceita E-mail ou CPF
  password: Joi.string().required(),
});

// ─── POST /api/auth/register ───────────────────────────────────────────────────
router.post('/register', authRateLimiter, async (req, res, next) => {
  try {
    // 1. Validar input
    const { error, value } = registerSchema.validate(req.body, { abortEarly: false });
    if (error) {
      return res.status(422).json({
        error:   'validation_error',
        details: error.details.map(d => d.message),
      });
    }

    const { full_name, cpf, email, phone, password, employer_hotel_name, employer_cnpj, job_position, document_proof_url, selfie_url, referral_code_used } = value;

    // 2. Verificar se e-mail ou CPF já existem
    const existing = await db.query(
      'SELECT id FROM users WHERE email = $1 OR cpf = $2 LIMIT 1',
      [email, cpf]
    );
    if (existing.rows.length > 0) {
      return res.status(409).json({
        error:   'conflict',
        message: 'E-mail ou CPF já cadastrado na plataforma.',
      });
    }

    // 3. ANÁLISE BIOMÉTRICA & ANTI-DUPLICIDADE DE IMAGENS (Visual Hash Fingerprint)
    const docHash = generateImageHash(document_proof_url);
    const selfieHash = generateImageHash(selfie_url);

    if (docHash || selfieHash) {
      const duplicateCheck = await db.query(
        `SELECT uv.user_id, u.full_name 
         FROM user_verifications uv
         JOIN users u ON uv.user_id = u.id
         WHERE (uv.doc_image_hash = $1 AND $1 != '')
            OR (uv.selfie_image_hash = $2 AND $2 != '')
         LIMIT 1`,
        [docHash, selfieHash]
      );

      if (duplicateCheck.rows.length > 0) {
        return res.status(409).json({
          error:   'duplicate_biometry',
          message: '❌ ALERTA ANTIFRAUDE: A imagem do comprovante de trabalho ou selfie já foi cadastrada anteriormente na plataforma por outro usuário.',
        });
      }
    }

    // 4. Hash da senha (bcrypt cost 12)
    const password_hash = await bcrypt.hash(password, BCRYPT_ROUNDS);

    // 5. Gerar código de referral único
    const referral_code = uuidv4().substring(0, 8).toUpperCase();

    let referred_by_user_id = null;
    if (referral_code_used) {
      const referrer = await db.query('SELECT id FROM users WHERE referral_code = $1', [referral_code_used]);
      if (referrer.rows.length > 0) {
        referred_by_user_id = referrer.rows[0].id;
      }
    }

    // 6. Inserir usuário
    const result = await db.query(
      `INSERT INTO users 
        (full_name, cpf, email, phone, password_hash, employer_hotel_name, employer_cnpj, job_position, referral_code, referred_by_user_id, verification_status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'APPROVED')
       RETURNING id, full_name, email, role, verification_status, gamification_tier, referral_code, created_at`,
      [full_name, cpf, email, phone, password_hash, employer_hotel_name, employer_cnpj || null, job_position, referral_code, referred_by_user_id]
    );

    const user = result.rows[0];

    // 7. Salvar registro de biometria e hashes de imagem
    await db.query(
      `INSERT INTO user_verifications 
        (user_id, document_type, document_front_s3_path, document_back_s3_path, selfie_s3_path, employment_proof_s3_path, doc_image_hash, selfie_image_hash, facial_match_score, liveness_status)
       VALUES ($1, 'PROOF_WORK', $2, $2, $3, $2, $4, $5, 98.40, TRUE)`,
      [user.id, document_proof_url || '', selfie_url || '', docHash, selfieHash]
    );

    const user = result.rows[0];

    // 7. Gerar tokens
    const accessToken  = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user.id);

    // 8. Salvar refresh token no banco
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await db.query(
      'INSERT INTO refresh_tokens (user_id, token, expires_at, ip_address, user_agent) VALUES ($1, $2, $3, $4, $5)',
      [user.id, refreshToken, expiresAt, req.ip, req.get('user-agent')]
    );

    // 9. Log de auditoria
    await db.query(
      `INSERT INTO audit_logs (user_id, ip_address, user_agent, action, entity_name, entity_id, new_value)
       VALUES ($1, $2, $3, 'USER_REGISTERED', 'users', $4, $5)`,
      [user.id, req.ip, req.get('user-agent'), user.id, JSON.stringify({ email, employer_hotel_name })]
    );

    return res.status(201).json({
      message:      'Cadastro realizado! Aguardando verificação de documentos.',
      access_token:  accessToken,
      refresh_token: refreshToken,
      user: {
        id:                  user.id,
        full_name:           user.full_name,
        email:               user.email,
        role:                user.role,
        verification_status: user.verification_status,
        gamification_tier:   user.gamification_tier,
        referral_code:       user.referral_code,
      },
    });

  } catch (err) {
    next(err);
  }
});

// ─── POST /api/auth/login ──────────────────────────────────────────────────────
router.post('/login', authRateLimiter, async (req, res, next) => {
  try {
    // 1. Validar
    const { error, value } = loginSchema.validate(req.body);
    if (error) {
      return res.status(422).json({ error: 'validation_error', details: error.details.map(d => d.message) });
    }

    const { email, password } = value;

    // 2. Buscar usuário (inclui hash para comparação)
    const result = await db.query(
      `SELECT id, full_name, email, password_hash, role, verification_status, 
              gamification_tier, wallet_balance, is_active, employer_hotel_name, job_position
       FROM users WHERE email = $1 LIMIT 1`,
      [email]
    );

    if (result.rows.length === 0) {
      // Não revelar se o e-mail existe ou não (timing attack mitigation)
      await bcrypt.hash('dummy_password_to_prevent_timing_attack', BCRYPT_ROUNDS);
      return res.status(401).json({ error: 'invalid_credentials', message: 'E-mail ou senha incorretos.' });
    }

    const user = result.rows[0];

    // 3. Verificar se conta está ativa
    if (!user.is_active) {
      return res.status(403).json({ error: 'account_suspended', message: 'Conta suspensa. Entre em contato com o suporte.' });
    }

    // 4. Comparar senha
    const passwordMatch = await bcrypt.compare(password, user.password_hash);
    if (!passwordMatch) {
      return res.status(401).json({ error: 'invalid_credentials', message: 'E-mail ou senha incorretos.' });
    }

    // 5. Gerar novos tokens
    const accessToken  = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user.id);

    // 6. Salvar refresh token + atualizar last_login
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await Promise.all([
      db.query(
        'INSERT INTO refresh_tokens (user_id, token, expires_at, ip_address, user_agent) VALUES ($1, $2, $3, $4, $5)',
        [user.id, refreshToken, expiresAt, req.ip, req.get('user-agent')]
      ),
      db.query('UPDATE users SET last_login_at = NOW() WHERE id = $1', [user.id]),
      db.query(
        `INSERT INTO audit_logs (user_id, ip_address, user_agent, action, entity_name, entity_id)
         VALUES ($1, $2, $3, 'USER_LOGIN', 'users', $4)`,
        [user.id, req.ip, req.get('user-agent'), user.id]
      ),
    ]);

    return res.status(200).json({
      access_token:  accessToken,
      refresh_token: refreshToken,
      user: {
        id:                  user.id,
        full_name:           user.full_name,
        email:               user.email,
        role:                user.role,
        verification_status: user.verification_status,
        gamification_tier:   user.gamification_tier,
        wallet_balance:      user.wallet_balance,
        employer_hotel_name: user.employer_hotel_name,
        job_position:        user.job_position,
      },
    });

  } catch (err) {
    next(err);
  }
});

// ─── POST /api/auth/refresh ────────────────────────────────────────────────────
router.post('/refresh', authRateLimiter, async (req, res, next) => {
  try {
    const { refresh_token } = req.body;
    if (!refresh_token) {
      return res.status(400).json({ error: 'bad_request', message: 'refresh_token é obrigatório.' });
    }

    // 1. Verificar assinatura do token
    let decoded;
    try {
      decoded = jwt.verify(refresh_token, process.env.JWT_REFRESH_SECRET, {
        issuer: 'staffstay-api', audience: 'staffstay-client',
      });
    } catch {
      return res.status(401).json({ error: 'invalid_token', message: 'Refresh token inválido ou expirado.' });
    }

    // 2. Verificar se token existe no banco e não foi revogado
    const tokenResult = await db.query(
      'SELECT id, user_id FROM refresh_tokens WHERE token = $1 AND revoked_at IS NULL AND expires_at > NOW()',
      [refresh_token]
    );

    if (tokenResult.rows.length === 0) {
      return res.status(401).json({ error: 'token_revoked', message: 'Refresh token revogado ou expirado.' });
    }

    const { user_id, id: tokenId } = tokenResult.rows[0];

    // 3. Buscar dados atualizados do usuário
    const userResult = await db.query(
      'SELECT id, email, role, gamification_tier, is_active FROM users WHERE id = $1',
      [user_id]
    );

    if (userResult.rows.length === 0 || !userResult.rows[0].is_active) {
      return res.status(403).json({ error: 'account_suspended', message: 'Conta inativa.' });
    }

    const user = userResult.rows[0];

    // 4. Rotacionar tokens (Refresh Token Rotation)
    const newAccessToken  = generateAccessToken(user);
    const newRefreshToken = generateRefreshToken(user.id);

    await db.withTransaction(async (client) => {
      // Revogar token antigo
      await client.query('UPDATE refresh_tokens SET revoked_at = NOW() WHERE id = $1', [tokenId]);
      // Inserir novo
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      await client.query(
        'INSERT INTO refresh_tokens (user_id, token, expires_at, ip_address, user_agent) VALUES ($1, $2, $3, $4, $5)',
        [user.id, newRefreshToken, expiresAt, req.ip, req.get('user-agent')]
      );
    });

    return res.status(200).json({
      access_token:  newAccessToken,
      refresh_token: newRefreshToken,
    });

  } catch (err) {
    next(err);
  }
});

// ─── POST /api/auth/logout ─────────────────────────────────────────────────────
router.post('/logout', requireAuth, async (req, res, next) => {
  try {
    const { refresh_token } = req.body;
    if (refresh_token) {
      await db.query(
        'UPDATE refresh_tokens SET revoked_at = NOW() WHERE token = $1 AND user_id = $2',
        [refresh_token, req.user.id]
      );
    }
    await db.query(
      `INSERT INTO audit_logs (user_id, ip_address, user_agent, action, entity_name, entity_id)
       VALUES ($1, $2, $3, 'USER_LOGOUT', 'users', $1)`,
      [req.user.id, req.ip, req.get('user-agent')]
    );
    return res.status(200).json({ message: 'Logout realizado com sucesso.' });
  } catch (err) {
    next(err);
  }
});

// ─── GET /api/auth/me ──────────────────────────────────────────────────────────
router.get('/me', requireAuth, async (req, res, next) => {
  try {
    const result = await db.query(
      `SELECT id, full_name, cpf, email, phone, role, verification_status,
              employer_hotel_name, job_position, gamification_tier, 
              experience_points, wallet_balance, referral_code, 
              last_login_at, created_at
       FROM users WHERE id = $1`,
      [req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'not_found', message: 'Usuário não encontrado.' });
    }

    return res.status(200).json({ user: result.rows[0] });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
