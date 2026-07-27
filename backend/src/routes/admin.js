/**
 * ADMIN ROUTES — Protegidas por role SUPER_ADMIN / HOTEL_ADMIN
 * 
 * GET  /api/admin/dashboard      — Métricas gerais da plataforma (SUPER_ADMIN)
 * GET  /api/admin/users          — Listar usuários pendentes (SUPER_ADMIN)
 * PATCH /api/admin/users/:id/verify — Aprovar/Rejeitar usuário (SUPER_ADMIN)
 * POST /api/admin/hotels         — Cadastrar novo hotel (SUPER_ADMIN)
 * PATCH /api/admin/hotels/:id    — Atualizar allotment/status (HOTEL_ADMIN)
 * GET  /api/admin/bookings       — Listar reservas do hotel (HOTEL_ADMIN)
 * GET  /api/admin/audit-logs     — Trilha de auditoria (GOVERNANCE_AUDITOR)
 */

'use strict';

const express = require('express');
const Joi     = require('joi');
const db      = require('../config/db');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();

// Todas as rotas admin requerem autenticação
router.use(requireAuth);

// ─── GET /api/admin/dashboard ─────────────────────────────────────────────────
router.get('/dashboard', requireRole('SUPER_ADMIN', 'GOVERNANCE_AUDITOR'), async (req, res, next) => {
  try {
    const [hotelsStats, usersStats, bookingsStats, revenueStats] = await Promise.all([
      // Hotéis por status
      db.query(`
        SELECT status, COUNT(*) AS count 
        FROM hotels 
        GROUP BY status
        ORDER BY count DESC
      `),

      // Usuários por status de verificação
      db.query(`
        SELECT verification_status, COUNT(*) AS count
        FROM users
        GROUP BY verification_status
        ORDER BY count DESC
      `),

      // Reservas por status (últimos 30 dias)
      db.query(`
        SELECT status, COUNT(*) AS count, SUM(grand_total_amount) AS total_revenue
        FROM bookings
        WHERE created_at >= NOW() - INTERVAL '30 days'
        GROUP BY status
        ORDER BY count DESC
      `),

      // Receita dos últimos 12 meses
      db.query(`
        SELECT 
          TO_CHAR(DATE_TRUNC('month', created_at), 'YYYY-MM') AS month,
          COUNT(*) AS bookings_count,
          SUM(platform_split_amount) AS platform_revenue,
          SUM(grand_total_amount) AS gross_revenue
        FROM bookings
        WHERE status IN ('CONFIRMED', 'CHECKED_IN', 'CHECKED_OUT')
          AND created_at >= NOW() - INTERVAL '12 months'
        GROUP BY DATE_TRUNC('month', created_at)
        ORDER BY month ASC
      `),
    ]);

    // KPIs rápidos
    const totalHotels        = hotelsStats.rows.reduce((s, r) => s + parseInt(r.count), 0);
    const activeHotels       = (hotelsStats.rows.find(r => r.status === 'ACTIVE') || {}).count || 0;
    const totalUsers         = usersStats.rows.reduce((s, r) => s + parseInt(r.count), 0);
    const approvedUsers      = (usersStats.rows.find(r => r.verification_status === 'APPROVED') || {}).count || 0;
    const pendingVerification = (usersStats.rows.find(r => r.verification_status === 'PENDING_DOCS') || {}).count || 0;
    const last30Revenue      = bookingsStats.rows
      .filter(r => ['CONFIRMED', 'CHECKED_IN', 'CHECKED_OUT'].includes(r.status))
      .reduce((s, r) => s + parseFloat(r.total_revenue || 0), 0);

    return res.status(200).json({
      kpis: {
        total_hotels:          parseInt(totalHotels),
        active_hotels:         parseInt(activeHotels),
        total_users:           parseInt(totalUsers),
        approved_users:        parseInt(approvedUsers),
        pending_verification:  parseInt(pendingVerification),
        revenue_last_30_days:  last30Revenue.toFixed(2),
      },
      hotels_by_status:   hotelsStats.rows,
      users_by_status:    usersStats.rows,
      bookings_last_30d:  bookingsStats.rows,
      monthly_revenue:    revenueStats.rows,
    });

  } catch (err) {
    next(err);
  }
});

// ─── GET /api/admin/users ──────────────────────────────────────────────────────
router.get('/users', requireRole('SUPER_ADMIN'), async (req, res, next) => {
  try {
    const { status, page = 1, limit = 30 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    const params = [];
    let where = 'WHERE 1=1';

    if (status) {
      params.push(status);
      where += ` AND u.verification_status = $${params.length}`;
    }

    params.push(parseInt(limit), offset);
    const result = await db.query(
      `SELECT 
          u.id, u.full_name, u.cpf, u.email, u.phone,
          u.employer_hotel_name, u.job_position, u.verification_status,
          u.gamification_tier, u.is_active, u.created_at, u.last_login_at
       FROM users u
       ${where}
       ORDER BY u.created_at DESC
       LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params
    );

    return res.status(200).json({ users: result.rows });
  } catch (err) {
    next(err);
  }
});

// ─── PATCH /api/admin/users/:id/verify ────────────────────────────────────────
router.patch('/users/:id/verify', requireRole('SUPER_ADMIN'), async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, rejection_reason } = req.body;

    const validStatuses = ['APPROVED', 'REJECTED', 'SUSPENDED', 'UNDER_ANALYSIS', 'MANUAL_REVIEW'];
    if (!validStatuses.includes(status)) {
      return res.status(422).json({
        error: 'invalid_status',
        message: `Status deve ser um de: ${validStatuses.join(', ')}`,
      });
    }

    const result = await db.query(
      `UPDATE users SET verification_status = $1, updated_at = NOW() WHERE id = $2 RETURNING id, full_name, email, verification_status`,
      [status, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'not_found' });
    }

    // Log de auditoria
    await db.query(
      `INSERT INTO audit_logs (user_id, ip_address, user_agent, action, entity_name, entity_id, new_value)
       VALUES ($1, $2, $3, 'USER_VERIFICATION_UPDATED', 'users', $4, $5)`,
      [req.user.id, req.ip, req.get('user-agent'), id, JSON.stringify({ status, rejection_reason })]
    );

    return res.status(200).json({
      message: `Usuário ${status === 'APPROVED' ? 'aprovado' : 'atualizado'} com sucesso.`,
      user:    result.rows[0],
    });

  } catch (err) {
    next(err);
  }
});

// ─── POST /api/admin/hotels ────────────────────────────────────────────────────
const hotelSchema = Joi.object({
  corporate_name:           Joi.string().required(),
  cnpj:                     Joi.string().pattern(/^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/).required(),
  trade_name:               Joi.string().required(),
  category:                 Joi.string().valid('Hotel', 'Resort', 'Pousada', 'Hostel', 'Flat', 'Apart-Hotel').required(),
  star_rating:              Joi.number().integer().min(1).max(5).required(),
  description:              Joi.string().required(),
  email:                    Joi.string().email().required(),
  phone:                    Joi.string().required(),
  website:                  Joi.string().uri().optional(),
  zip_code:                 Joi.string().required(),
  address_line:             Joi.string().required(),
  neighborhood:             Joi.string().optional(),
  city:                     Joi.string().required(),
  state:                    Joi.string().length(2).uppercase().required(),
  legal_representative_name: Joi.string().required(),
  legal_representative_cpf:  Joi.string().required(),
  pms_type:                 Joi.string().valid('OMNIBEES','DESBRAVADOR','TOTVS_CMNET','CLOUDBEDS','ORACLE_OPERA','ERBON','MANUAL_PANEL').default('MANUAL_PANEL'),
  bank_code:                Joi.string().required(),
  bank_agency:              Joi.string().required(),
  bank_account:             Joi.string().required(),
  pix_key:                  Joi.string().required(),
  amenities:                Joi.array().items(Joi.string()).optional().default([]),
}).options({ allowUnknown: false });

router.post('/hotels', requireRole('SUPER_ADMIN'), async (req, res, next) => {
  try {
    const { error, value } = hotelSchema.validate(req.body, { abortEarly: false });
    if (error) {
      return res.status(422).json({ error: 'validation_error', details: error.details.map(d => d.message) });
    }

    const result = await db.query(
      `INSERT INTO hotels (
        corporate_name, cnpj, trade_name, category, star_rating, description,
        email, phone, website, zip_code, address_line, neighborhood, city, state,
        legal_representative_name, legal_representative_cpf, pms_type,
        bank_code, bank_agency, bank_account, pix_key, amenities
       ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22)
       RETURNING id, trade_name, status, created_at`,
      [
        value.corporate_name, value.cnpj, value.trade_name, value.category, value.star_rating,
        value.description, value.email, value.phone, value.website || null,
        value.zip_code, value.address_line, value.neighborhood || null, value.city, value.state,
        value.legal_representative_name, value.legal_representative_cpf, value.pms_type,
        value.bank_code, value.bank_agency, value.bank_account, value.pix_key,
        JSON.stringify(value.amenities),
      ]
    );

    // Audit log
    await db.query(
      `INSERT INTO audit_logs (user_id, hotel_id, ip_address, user_agent, action, entity_name, entity_id, new_value)
       VALUES ($1, $2, $3, $4, 'HOTEL_CREATED', 'hotels', $2, $5)`,
      [req.user.id, result.rows[0].id, req.ip, req.get('user-agent'), JSON.stringify({ trade_name: value.trade_name })]
    );

    return res.status(201).json({
      message: 'Hotel cadastrado com sucesso. Aguardando revisão e ativação.',
      hotel:   result.rows[0],
    });

  } catch (err) {
    // CNPJ duplicado
    if (err.code === '23505') {
      return res.status(409).json({ error: 'conflict', message: 'CNPJ já cadastrado.' });
    }
    next(err);
  }
});

// ─── GET /api/admin/bookings ───────────────────────────────────────────────────
router.get('/bookings', requireRole('HOTEL_ADMIN', 'SUPER_ADMIN'), async (req, res, next) => {
  try {
    // HOTEL_ADMIN só vê as reservas do seu hotel
    // SUPER_ADMIN vê todas
    const { hotel_id, status, page = 1, limit = 50 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    let where   = 'WHERE 1=1';
    const params = [];

    if (req.user.role === 'HOTEL_ADMIN') {
      // Buscar hotel_id do admin
      const adminHotel = await db.query(
        'SELECT employer_hotel_id FROM users WHERE id = $1', [req.user.id]
      );
      if (!adminHotel.rows[0]?.employer_hotel_id) {
        return res.status(403).json({ error: 'no_hotel_linked' });
      }
      params.push(adminHotel.rows[0].employer_hotel_id);
      where += ` AND b.hotel_id = $${params.length}`;
    } else if (hotel_id) {
      params.push(hotel_id);
      where += ` AND b.hotel_id = $${params.length}`;
    }

    if (status) {
      params.push(status);
      where += ` AND b.status = $${params.length}`;
    }

    params.push(parseInt(limit), offset);
    const result = await db.query(
      `SELECT b.id, b.reservation_code, b.check_in_date, b.check_out_date,
              b.total_nights, b.number_of_guests, b.grand_total_amount,
              b.hotel_split_amount, b.status, b.created_at,
              u.full_name AS guest_name, u.employer_hotel_name AS guest_hotel,
              h.trade_name AS hotel_name, rt.name AS room_name
       FROM bookings b
       JOIN users u ON b.user_id = u.id
       JOIN hotels h ON b.hotel_id = h.id
       JOIN room_types rt ON b.room_type_id = rt.id
       ${where}
       ORDER BY b.created_at DESC
       LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params
    );

    return res.status(200).json({ bookings: result.rows });
  } catch (err) {
    next(err);
  }
});

// ─── GET /api/admin/audit-logs ─────────────────────────────────────────────────
router.get('/audit-logs', requireRole('SUPER_ADMIN', 'GOVERNANCE_AUDITOR'), async (req, res, next) => {
  try {
    const { action, entity, page = 1, limit = 100 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    const params = [];
    let where = 'WHERE 1=1';

    if (action) { params.push(`%${action}%`); where += ` AND al.action ILIKE $${params.length}`; }
    if (entity) { params.push(entity); where += ` AND al.entity_name = $${params.length}`; }

    params.push(parseInt(limit), offset);
    const result = await db.query(
      `SELECT al.*, u.full_name AS user_name, u.email AS user_email
       FROM audit_logs al
       LEFT JOIN users u ON al.user_id = u.id
       ${where}
       ORDER BY al.created_at DESC
       LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params
    );

    return res.status(200).json({ audit_logs: result.rows });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
