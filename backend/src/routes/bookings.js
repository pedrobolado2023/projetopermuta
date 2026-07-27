/**
 * BOOKINGS ROUTES
 * POST /api/bookings        — Criar reserva (com lock otimista de allotment + transaction ACID)
 * GET  /api/bookings/my     — Minhas reservas (usuário autenticado)
 * GET  /api/bookings/:code  — Detalhe de reserva por código
 * POST /api/bookings/:id/cancel — Cancelar reserva
 * 
 * SEGURANÇA:
 * - Requer autenticação JWT
 * - Requer verification_status = 'APPROVED'
 * - Lock otimista via UPDATE ... RETURNING para prevenir overbooking
 * - Toda operação financeira dentro de transaction ACID
 */

'use strict';

const express = require('express');
const Joi     = require('joi');
const crypto  = require('crypto');
const db      = require('../config/db');
const { requireAuth } = require('../middleware/auth');
const { bookingRateLimiter } = require('../middleware/security');

const router = express.Router();

// Taxa fixa da plataforma (em centavos para evitar floating point)
const PLATFORM_FEE_CENTS = 14990; // R$ 149,90

// ─── Schema de Validação ───────────────────────────────────────────────────────
const createBookingSchema = Joi.object({
  hotel_id:      Joi.string().uuid().required(),
  room_type_id:  Joi.string().uuid().required(),
  check_in_date: Joi.date().iso().min('now').required(),
  check_out_date: Joi.date().iso().required(),
  number_of_guests: Joi.number().integer().min(1).max(10).required(),
  guest_names:   Joi.array().items(Joi.string().max(150)).optional(),
  selected_addons: Joi.array().items(Joi.object({
    name:       Joi.string().required(),
    unit_price: Joi.number().min(0).required(),
    quantity:   Joi.number().integer().min(1).required(),
  })).optional().default([]),
  payment_method: Joi.string().valid('PIX', 'CREDIT_CARD', 'HOSTPASS_WALLET', 'HYBRID_PIX_WALLET').required(),
});

// ─── Gerar código de reserva único ────────────────────────────────────────────
function generateReservationCode() {
  const chars  = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const prefix = 'SS'; // StaffStay
  let   code   = prefix;
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// ─── Gerar assinatura criptográfica do voucher ─────────────────────────────────
function generateVoucherSignature(bookingData) {
  const payload = `${bookingData.id}:${bookingData.user_id}:${bookingData.hotel_id}:${bookingData.check_in_date}`;
  return crypto
    .createHmac('sha256', process.env.JWT_SECRET)
    .update(payload)
    .digest('hex')
    .substring(0, 32)
    .toUpperCase();
}

// ─── POST /api/bookings ────────────────────────────────────────────────────────
router.post('/', requireAuth, bookingRateLimiter, async (req, res, next) => {
  try {
    // 1. Validar input
    const { error, value } = createBookingSchema.validate(req.body, { abortEarly: false });
    if (error) {
      return res.status(422).json({
        error:   'validation_error',
        details: error.details.map(d => d.message),
      });
    }

    const {
      hotel_id, room_type_id, check_in_date, check_out_date,
      number_of_guests, guest_names, selected_addons, payment_method,
    } = value;

    // Normalizar datas
    const checkIn  = check_in_date instanceof Date ? check_in_date : new Date(check_in_date);
    const checkOut = check_out_date instanceof Date ? check_out_date : new Date(check_out_date);
    
    if (checkOut <= checkIn) {
      return res.status(422).json({
        error: 'validation_error',
        message: 'Data de check-out deve ser posterior ao check-in.',
      });
    }

    const totalNights = Math.ceil((checkOut - checkIn) / (1000 * 60 * 60 * 24));

    // 2. Verificar se usuário está aprovado (KYC)
    const userResult = await db.query(
      'SELECT id, verification_status, wallet_balance FROM users WHERE id = $1',
      [req.user.id]
    );

    const user = userResult.rows[0];
    if (!user) {
      return res.status(404).json({ error: 'user_not_found' });
    }

    if (user.verification_status !== 'APPROVED') {
      return res.status(403).json({
        error:   'kyc_required',
        message: `Sua conta precisa estar verificada para fazer reservas. Status atual: ${user.verification_status}`,
        verification_status: user.verification_status,
      });
    }

    // 3. Verificar tipo de quarto e hotel
    const roomResult = await db.query(
      `SELECT rt.id, rt.name, rt.max_occupancy, rt.suggested_staff_rate, rt.base_marginal_cost,
              h.trade_name AS hotel_name, h.pix_key, h.gateway_recipient_id
       FROM room_types rt
       JOIN hotels h ON rt.hotel_id = h.id
       WHERE rt.id = $1 AND rt.hotel_id = $2 AND rt.is_active = TRUE AND h.status = 'ACTIVE'`,
      [room_type_id, hotel_id]
    );

    if (roomResult.rows.length === 0) {
      return res.status(404).json({ error: 'room_not_found', message: 'Quarto ou hotel não encontrado.' });
    }

    const room = roomResult.rows[0];

    if (number_of_guests > room.max_occupancy) {
      return res.status(422).json({
        error:   'occupancy_exceeded',
        message: `Este quarto comporta no máximo ${room.max_occupancy} hóspedes.`,
      });
    }

    // 4. Executar reserva dentro de uma TRANSACTION ACID
    const booking = await db.withTransaction(async (client) => {
      // 4a. Lock otimista: decrementar allotment atomicamente para CADA data
      const checkInStr  = checkIn.toISOString().split('T')[0];
      const checkOutStr = checkOut.toISOString().split('T')[0];

      const allotmentUpdate = await client.query(
        `UPDATE allotments
         SET quantity_available = quantity_available - 1,
             quantity_sold      = quantity_sold + 1,
             updated_at         = NOW()
         WHERE room_type_id = $1
           AND allotment_date >= $2::date
           AND allotment_date <  $3::date
           AND quantity_available > 0
           AND is_blackout = FALSE
         RETURNING allotment_date`,
        [room_type_id, checkInStr, checkOutStr]
      );

      // Verificar se todas as datas tinham disponibilidade
      if (allotmentUpdate.rows.length < totalNights) {
        const lockedDates = allotmentUpdate.rows.map(r => r.allotment_date);
        // O ROLLBACK ocorre automaticamente pelo withTransaction
        throw Object.assign(new Error('ALLOTMENT_UNAVAILABLE'), {
          statusCode: 409,
          availableDates: lockedDates,
          requestedNights: totalNights,
        });
      }

      // 4b. Calcular valores
      const nightly_room_rate     = parseFloat(room.suggested_staff_rate);
      const total_room_amount     = nightly_room_rate * totalNights; // R$ 0 no modelo atual
      const service_fee_amount    = PLATFORM_FEE_CENTS / 100;        // R$ 149,90
      const addons_total          = selected_addons.reduce((sum, a) => sum + (a.unit_price * a.quantity), 0);
      const total_addons_amount   = addons_total;
      const grand_total_amount    = service_fee_amount + total_addons_amount; // Diária isenta
      const hotel_split_amount    = total_addons_amount;               // Hotel recebe os addons
      const platform_split_amount = service_fee_amount;               // Plataforma recebe a taxa

      // 4c. Gerar código e assinatura
      const reservation_code = generateReservationCode();
      const bookingId        = require('crypto').randomUUID();
      const signature        = generateVoucherSignature({
        id: bookingId, user_id: req.user.id, hotel_id, check_in_date: checkInStr,
      });

      // 4d. Inserir booking
      const bookingResult = await client.query(
        `INSERT INTO bookings 
          (id, reservation_code, user_id, hotel_id, room_type_id,
           check_in_date, check_out_date, total_nights, number_of_guests, guest_names,
           nightly_room_rate, total_room_amount, total_addons_amount, service_fee_amount,
           grand_total_amount, hotel_split_amount, platform_split_amount,
           status, qr_code_signature)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,'PENDING_PAYMENT',$18)
         RETURNING *`,
        [
          bookingId, reservation_code, req.user.id, hotel_id, room_type_id,
          checkInStr, checkOutStr, totalNights, number_of_guests,
          JSON.stringify(guest_names || []),
          nightly_room_rate, total_room_amount, total_addons_amount, service_fee_amount,
          grand_total_amount, hotel_split_amount, platform_split_amount,
          signature,
        ]
      );

      const newBooking = bookingResult.rows[0];

      // 4e. Inserir addons
      if (selected_addons.length > 0) {
        for (const addon of selected_addons) {
          await client.query(
            `INSERT INTO booking_addons (booking_id, addon_name, unit_price, quantity, total_price)
             VALUES ($1, $2, $3, $4, $5)`,
            [newBooking.id, addon.name, addon.unit_price, addon.quantity, addon.unit_price * addon.quantity]
          );
        }
      }

      // 4f. Registrar pagamento pendente
      await client.query(
        `INSERT INTO payments (booking_id, gateway_transaction_id, payment_method, status, amount, split_details)
         VALUES ($1, $2, $3, 'PENDING', $4, $5)`,
        [
          newBooking.id,
          `PAY-${newBooking.reservation_code}-${Date.now()}`,
          payment_method,
          grand_total_amount,
          JSON.stringify({
            platform: platform_split_amount,
            hotel:    hotel_split_amount,
            hotel_pix_key: room.pix_key,
          }),
        ]
      );

      // 4g. Audit log
      await client.query(
        `INSERT INTO audit_logs (user_id, hotel_id, ip_address, user_agent, action, entity_name, entity_id, new_value)
         VALUES ($1, $2, $3, $4, 'BOOKING_CREATED', 'bookings', $5, $6)`,
        [
          req.user.id, hotel_id, req.ip, req.get('user-agent'),
          newBooking.id,
          JSON.stringify({ reservation_code, total: grand_total_amount, nights: totalNights }),
        ]
      );

      return newBooking;
    });

    return res.status(201).json({
      message:          'Reserva criada com sucesso! Prossiga para o pagamento.',
      booking: {
        id:               booking.id,
        reservation_code: booking.reservation_code,
        check_in_date:    booking.check_in_date,
        check_out_date:   booking.check_out_date,
        total_nights:     booking.total_nights,
        grand_total:      booking.grand_total_amount,
        status:           booking.status,
        qr_signature:     booking.qr_code_signature,
      },
    });

  } catch (err) {
    // Tratamento de erro de allotment esgotado
    if (err.message === 'ALLOTMENT_UNAVAILABLE') {
      return res.status(409).json({
        error:   'allotment_unavailable',
        message: 'Sem disponibilidade para as datas selecionadas. Tente outras datas.',
      });
    }
    next(err);
  }
});

// ─── GET /api/bookings/my ──────────────────────────────────────────────────────
router.get('/my', requireAuth, async (req, res, next) => {
  try {
    const result = await db.query(
      `SELECT 
          b.id, b.reservation_code, b.check_in_date, b.check_out_date, b.total_nights,
          b.number_of_guests, b.grand_total_amount, b.status, b.qr_code_signature,
          b.created_at,
          h.trade_name AS hotel_name, h.city, h.state, h.photos AS hotel_photos,
          rt.name AS room_name
       FROM bookings b
       JOIN hotels h ON b.hotel_id = h.id
       JOIN room_types rt ON b.room_type_id = rt.id
       WHERE b.user_id = $1
       ORDER BY b.created_at DESC
       LIMIT 50`,
      [req.user.id]
    );

    return res.status(200).json({ bookings: result.rows });
  } catch (err) {
    next(err);
  }
});

// ─── GET /api/bookings/:code ───────────────────────────────────────────────────
router.get('/:code', requireAuth, async (req, res, next) => {
  try {
    const { code } = req.params;

    const result = await db.query(
      `SELECT 
          b.*, 
          h.trade_name AS hotel_name, h.city, h.state, h.phone AS hotel_phone,
          h.address_line, h.amenities AS hotel_amenities, h.photos AS hotel_photos,
          rt.name AS room_name, rt.max_occupancy,
          json_agg(DISTINCT ba.*) FILTER (WHERE ba.id IS NOT NULL) AS addons,
          json_build_object(
            'status', p.status, 'method', p.payment_method,
            'paid_at', p.paid_at, 'amount', p.amount
          ) AS payment
       FROM bookings b
       JOIN hotels h ON b.hotel_id = h.id
       JOIN room_types rt ON b.room_type_id = rt.id
       LEFT JOIN booking_addons ba ON ba.booking_id = b.id
       LEFT JOIN payments p ON p.booking_id = b.id
       WHERE b.reservation_code = $1 AND b.user_id = $2
       GROUP BY b.id, h.id, rt.id, p.id`,
      [code.toUpperCase(), req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'not_found', message: 'Reserva não encontrada.' });
    }

    return res.status(200).json({ booking: result.rows[0] });
  } catch (err) {
    next(err);
  }
});

// ─── POST /api/bookings/:id/cancel ────────────────────────────────────────────
router.post('/:id/cancel', requireAuth, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    await db.withTransaction(async (client) => {
      // Buscar reserva e verificar se pertence ao usuário
      const bookingResult = await client.query(
        `SELECT id, user_id, hotel_id, room_type_id, check_in_date, check_out_date, status
         FROM bookings WHERE id = $1 AND user_id = $2 FOR UPDATE`,
        [id, req.user.id]
      );

      if (bookingResult.rows.length === 0) {
        throw Object.assign(new Error('NOT_FOUND'), { statusCode: 404 });
      }

      const b = bookingResult.rows[0];

      if (!['PENDING_PAYMENT', 'CONFIRMED'].includes(b.status)) {
        throw Object.assign(new Error('CANNOT_CANCEL'), {
          statusCode: 422,
          message: `Reservas com status "${b.status}" não podem ser canceladas.`,
        });
      }

      // Cancelar reserva
      await client.query(
        `UPDATE bookings SET status = 'CANCELLED', cancellation_reason = $1, updated_at = NOW() WHERE id = $2`,
        [reason || 'Cancelado pelo usuário', id]
      );

      // Devolver allotment
      await client.query(
        `UPDATE allotments 
         SET quantity_available = quantity_available + 1,
             quantity_sold      = GREATEST(0, quantity_sold - 1),
             updated_at         = NOW()
         WHERE room_type_id = $1
           AND allotment_date >= $2 AND allotment_date < $3`,
        [b.room_type_id, b.check_in_date, b.check_out_date]
      );

      // Audit log
      await client.query(
        `INSERT INTO audit_logs (user_id, hotel_id, ip_address, user_agent, action, entity_name, entity_id, new_value)
         VALUES ($1, $2, $3, $4, 'BOOKING_CANCELLED', 'bookings', $5, $6)`,
        [req.user.id, b.hotel_id, req.ip, req.get('user-agent'), id, JSON.stringify({ reason })]
      );
    });

    return res.status(200).json({ message: 'Reserva cancelada com sucesso.' });

  } catch (err) {
    if (err.message === 'NOT_FOUND') {
      return res.status(404).json({ error: 'not_found', message: 'Reserva não encontrada.' });
    }
    if (err.message === 'CANNOT_CANCEL') {
      return res.status(422).json({ error: 'cannot_cancel', message: err.message });
    }
    next(err);
  }
});

module.exports = router;
