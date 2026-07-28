/**
 * HOTELS ROUTES
 * GET  /api/hotels            — Lista hotéis ativos com disponibilidade real do banco
 * GET  /api/hotels/:id        — Detalhe completo do hotel + tipos de quarto + allotment
 * GET  /api/hotels/:id/rooms  — Tipos de quarto disponíveis para as datas
 */

'use strict';

const express = require('express');
const Joi     = require('joi');
const db      = require('../config/db');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();

// ─── Schema de Validação para filtros ─────────────────────────────────────────
const searchSchema = Joi.object({
  city:       Joi.string().max(100).optional(),
  state:      Joi.string().length(2).uppercase().optional(),
  check_in:   Joi.date().iso().min('now').optional(),
  check_out:  Joi.date().iso().optional(),
  guests:     Joi.number().integer().min(1).max(10).optional(),
  page:       Joi.number().integer().min(1).default(1),
  limit:      Joi.number().integer().min(1).max(50).default(20),
});

// ─── GET /api/hotels ───────────────────────────────────────────────────────────
// Lista pública (sem auth) — qualquer um pode ver hotéis disponíveis
router.get('/', async (req, res, next) => {
  try {
    // Validar query params
    const { error, value } = searchSchema.validate(req.query, { abortEarly: false });
    if (error) {
      return res.status(422).json({
        error:   'validation_error',
        details: error.details.map(d => d.message),
      });
    }

    const { city, state, check_in, check_out, guests, page, limit } = value;
    const offset = (page - 1) * limit;
    const params = [];
    let   paramIndex = 1;

    // ── Build WHERE clause ───────────────────────────────────────────────────
    let whereClause = `WHERE h.status = 'ACTIVE'`;

    if (city) {
      params.push(`%${city}%`);
      whereClause += ` AND (h.city ILIKE $${paramIndex} OR h.trade_name ILIKE $${paramIndex})`;
      paramIndex++;
    }
    if (state) {
      params.push(state);
      whereClause += ` AND h.state = $${paramIndex++}`;
    }

    // ── Subquery para allotment disponível ─────────────────────────────────
    let allotmentJoin = '';
    let allotmentSelect = `
      (SELECT COALESCE(SUM(a.quantity_available), 0) 
       FROM allotments a 
       JOIN room_types rt ON a.room_type_id = rt.id
       WHERE a.hotel_id = h.id AND a.is_blackout = FALSE) AS total_allotment_available`;

    if (check_in && check_out) {
      const checkInStr  = check_in instanceof Date ? check_in.toISOString().split('T')[0] : check_in;
      const checkOutStr = check_out instanceof Date ? check_out.toISOString().split('T')[0] : check_out;
      params.push(checkInStr, checkOutStr);
      allotmentSelect = `
        (SELECT COALESCE(MIN(a.quantity_available), 0)
         FROM allotments a
         JOIN room_types rt ON a.room_type_id = rt.id
         WHERE a.hotel_id = h.id 
           AND a.allotment_date >= $${paramIndex} 
           AND a.allotment_date < $${paramIndex + 1}
           AND a.is_blackout = FALSE
           ${guests ? `AND rt.max_occupancy >= ${parseInt(guests, 10)}` : ''}
        ) AS total_allotment_available`;
      paramIndex += 2;
    }

    // ── Buscar hotéis com allotment + avaliação média ──────────────────────
    const countResult = await db.query(
      `SELECT COUNT(DISTINCT h.id) FROM hotels h ${whereClause}`,
      params
    );
    const total = parseInt(countResult.rows[0].count, 10);

    params.push(limit, offset);
    const result = await db.query(
      `SELECT 
          h.id,
          h.trade_name,
          h.category,
          h.star_rating,
          h.city,
          h.state,
          h.description,
          h.amenities,
          h.photos,
          h.check_in_time,
          h.check_out_time,
          h.pms_type,
          ${allotmentSelect},
          COALESCE(
            (SELECT ROUND(AVG(r.rating_overall::numeric), 1) 
             FROM reviews r WHERE r.hotel_id = h.id AND r.is_published = TRUE), 
            0
          ) AS avg_rating,
          (SELECT COUNT(*) FROM reviews r WHERE r.hotel_id = h.id AND r.is_published = TRUE) AS review_count,
          (SELECT json_agg(json_build_object(
            'id', rt.id, 'name', rt.name, 
            'max_occupancy', rt.max_occupancy,
            'suggested_staff_rate', rt.suggested_staff_rate,
            'photos', rt.photos
          ))
           FROM room_types rt WHERE rt.hotel_id = h.id AND rt.is_active = TRUE
           LIMIT 3
          ) AS room_types
       FROM hotels h
       ${whereClause}
       GROUP BY h.id
       HAVING ${check_in && check_out ? '' : '(SELECT COALESCE(SUM(a.quantity_available),0) FROM allotments a WHERE a.hotel_id = h.id AND a.is_blackout = FALSE) >'} ${check_in && check_out ? '(SELECT COALESCE(MIN(a.quantity_available),0) FROM allotments a JOIN room_types rt ON a.room_type_id = rt.id WHERE a.hotel_id = h.id AND a.is_blackout = FALSE) >' : ''} -1
       ORDER BY avg_rating DESC, h.trade_name ASC
       LIMIT $${paramIndex++} OFFSET $${paramIndex++}`,
      params
    );

    return res.status(200).json({
      hotels: result.rows,
      pagination: {
        page,
        limit,
        total,
        total_pages: Math.ceil(total / limit),
        has_next:    page * limit < total,
      },
    });

  } catch (err) {
    next(err);
  }
});

// ─── GET /api/hotels/:id ───────────────────────────────────────────────────────
router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;

    // UUID validation
    if (!/^[0-9a-f-]{36}$/i.test(id)) {
      return res.status(400).json({ error: 'invalid_id', message: 'ID de hotel inválido.' });
    }

    // Hotel base
    const hotelResult = await db.query(
      `SELECT 
          h.id, h.trade_name, h.corporate_name, h.category, h.star_rating, 
          h.description, h.email, h.phone, h.website,
          h.city, h.state, h.zip_code, h.address_line, h.neighborhood,
          h.amenities, h.photos, h.pms_type, h.status,
          h.check_in_time, h.check_out_time, h.cancellation_policy_days,
          COALESCE(
            (SELECT ROUND(AVG(r.rating_overall::numeric), 1) FROM reviews r 
             WHERE r.hotel_id = h.id AND r.is_published = TRUE), 0
          ) AS avg_rating,
          (SELECT COUNT(*) FROM reviews r WHERE r.hotel_id = h.id AND r.is_published = TRUE) AS review_count
       FROM hotels h 
       WHERE h.id = $1 AND h.status = 'ACTIVE'`,
      [id]
    );

    if (hotelResult.rows.length === 0) {
      return res.status(404).json({ error: 'not_found', message: 'Hotel não encontrado.' });
    }

    const hotel = hotelResult.rows[0];

    // Room Types com allotment dos próximos 30 dias
    const roomsResult = await db.query(
      `SELECT 
          rt.id, rt.name, rt.description, rt.max_occupancy, rt.max_adults, rt.max_children,
          rt.base_marginal_cost, rt.suggested_staff_rate, rt.photos, rt.amenities,
          COALESCE(SUM(a.quantity_available), 0) AS allotment_available,
          MIN(a.nightly_rate) AS min_nightly_rate
       FROM room_types rt
       LEFT JOIN allotments a ON a.room_type_id = rt.id 
           AND a.allotment_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '30 days'
           AND a.is_blackout = FALSE
       WHERE rt.hotel_id = $1 AND rt.is_active = TRUE
       GROUP BY rt.id
       ORDER BY rt.suggested_staff_rate ASC`,
      [id]
    );

    // Reviews recentes (últimas 5)
    const reviewsResult = await db.query(
      `SELECT 
          r.rating_cleanliness, r.rating_service, r.rating_comfort, r.rating_overall,
          r.comment, r.created_at,
          u.full_name AS guest_name, u.employer_hotel_name AS guest_hotel
       FROM reviews r
       JOIN users u ON r.user_id = u.id
       WHERE r.hotel_id = $1 AND r.is_published = TRUE
       ORDER BY r.created_at DESC
       LIMIT 5`,
      [id]
    );

    return res.status(200).json({
      hotel:      hotel,
      room_types: roomsResult.rows,
      reviews:    reviewsResult.rows,
    });

  } catch (err) {
    next(err);
  }
});

// ─── POST /api/hotels (Cadastro B2B de Hotel) ─────────────────────────────────
router.post('/', requireAuth, requireRole('HOTEL_ADMIN', 'SUPER_ADMIN'), async (req, res, next) => {
  try {
    const { corporate_name, cnpj, trade_name, category, description, email, phone, zip_code, address_line, city, state, legal_representative_name, legal_representative_cpf, pms_type, amenities, photos } = req.body;

    if (!corporate_name || !cnpj || !trade_name || !email || !city || !state) {
      return res.status(400).json({ error: 'bad_request', message: 'Preencha todos os campos obrigatórios do hotel.' });
    }

    const existing = await db.query('SELECT id FROM hotels WHERE cnpj = $1 LIMIT 1', [cnpj]);
    if (existing.rows.length > 0) {
      return res.status(409).json({ error: 'conflict', message: 'CNPJ já cadastrado.' });
    }

    const result = await db.query(
      `INSERT INTO hotels 
        (corporate_name, cnpj, trade_name, category, description, email, phone, zip_code, address_line, city, state, legal_representative_name, legal_representative_cpf, pms_type, amenities, photos, bank_code, bank_agency, bank_account, pix_key, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, '000', '0000', '00000-0', $6, 'ACTIVE')
       RETURNING *`,
      [corporate_name, cnpj, trade_name, category || 'Hotel', description || '', email, phone || '', zip_code || '00000-000', address_line || '', city, state, legal_representative_name || trade_name, legal_representative_cpf || '000.000.000-00', pms_type || 'MANUAL_PANEL', JSON.stringify(amenities || []), JSON.stringify(photos || [])]
    );

    return res.status(201).json({ message: 'Hotel cadastrado com sucesso!', hotel: result.rows[0] });
  } catch (err) {
    next(err);
  }
});

// ─── POST /api/hotels/:id/rooms (Cadastro de Tipo de Quarto) ───────────────────
router.post('/:id/rooms', requireAuth, requireRole('HOTEL_ADMIN', 'SUPER_ADMIN'), async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, description, max_occupancy, suggested_staff_rate, photos, amenities } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'bad_request', message: 'Nome do quarto é obrigatório.' });
    }

    const result = await db.query(
      `INSERT INTO room_types (hotel_id, name, description, max_occupancy, base_marginal_cost, suggested_staff_rate, photos, amenities)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [id, name, description || '', max_occupancy || 2, 0.00, suggested_staff_rate || 0.00, JSON.stringify(photos || []), JSON.stringify(amenities || [])]
    );

    return res.status(201).json({ message: 'Tipo de quarto adicionado!', room: result.rows[0] });
  } catch (err) {
    next(err);
  }
});

// ─── POST /api/hotels/:id/allotments (Alimentar Allotment por Período) ─────────
router.post('/:id/allotments', requireAuth, requireRole('HOTEL_ADMIN', 'SUPER_ADMIN'), async (req, res, next) => {
  try {
    const { id } = req.params;
    const { room_type_id, start_date, end_date, quantity, nightly_rate, is_blackout } = req.body;

    if (!room_type_id || !start_date || !end_date) {
      return res.status(400).json({ error: 'bad_request', message: 'Tipo de quarto e período (início e fim) são obrigatórios.' });
    }

    const start = new Date(start_date);
    const end = new Date(end_date);
    const qty = parseInt(quantity || 0, 10);
    const rate = parseFloat(nightly_rate || 0);

    const created = [];
    const curr = new Date(start);

    while (curr <= end) {
      const dateStr = curr.toISOString().split('T')[0];
      const resVal = await db.query(
        `INSERT INTO allotments (room_type_id, hotel_id, allotment_date, quantity_available, nightly_rate, is_blackout)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (room_type_id, allotment_date) 
         DO UPDATE SET quantity_available = EXCLUDED.quantity_available, nightly_rate = EXCLUDED.nightly_rate, is_blackout = EXCLUDED.is_blackout, updated_at = NOW()
         RETURNING *`,
        [room_type_id, id, dateStr, qty, rate, !!is_blackout]
      );
      created.push(resVal.rows[0]);
      curr.setDate(curr.getDate() + 1);
    }

    return res.status(201).json({ message: `Allotment de ${created.length} dias atualizado com sucesso!`, allotments: created });
  } catch (err) {
    next(err);
  }
});

module.exports = router;

