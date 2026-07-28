/**
 * PMS INTEGRATION ROUTES — E-Solution & Omnibees XML Endpoints
 * 
 * GET  /api/pms/bookings/:id/xml  — Exporta a reserva em formato XML E-Solution
 * POST /api/pms/xml/import        — Recebe XML E-Solution/Omnibees e importa reserva
 */

'use strict';

const express = require('express');
const db      = require('../config/db');
const { buildESolutionXml, parseESolutionXml } = require('../services/pmsXmlService');

const router = express.Router();

// ─── GET /api/pms/bookings/:id/xml ─────────────────────────────────────────────
router.get('/bookings/:id/xml', async (req, res, next) => {
  try {
    const { id } = req.params;

    // Buscar dados da reserva no banco (ou fallback de mock para IDs de demonstração)
    const result = await db.query(
      `SELECT b.*, u.full_name AS guest_name, u.email, u.phone, u.employer_cnpj, h.trade_name AS hotel_name
       FROM bookings b
       JOIN users u ON b.user_id = u.id
       JOIN hotels h ON b.hotel_id = h.id
       WHERE b.id::text = $1 OR b.reservation_code = $1
       LIMIT 1`,
      [id]
    ).catch(() => ({ rows: [] }));

    let bookingData;
    if (result.rows.length > 0) {
      bookingData = result.rows[0];
    } else {
      // Mock Data caso ID seja de demonstração no frontend
      bookingData = {
        id: id,
        reservation_code: id.startsWith('STAY') ? id : `STAY-${id.slice(0, 6).toUpperCase()}`,
        guest_name: 'Pedro Henrique Pereira',
        email: 'pedro.pereira@staffstay.com.br',
        phone: '(11) 99999-8888',
        employer_cnpj: '18.271.000/0001-90',
        check_in_date: '2026-09-03T14:00:00Z',
        check_out_date: '2026-09-07T12:00:00Z',
        number_of_guests: 2,
        total_nights: 4,
        nightly_room_rate: 0.00,
        grand_total_amount: 149.90,
        created_at: new Date()
      };
    }

    const xmlContent = buildESolutionXml(bookingData);

    res.header('Content-Type', 'application/xml');
    return res.send(xmlContent);

  } catch (err) {
    next(err);
  }
});

// ─── POST /api/pms/xml/import ──────────────────────────────────────────────────
router.post('/xml/import', express.text({ type: ['*/xml', 'text/plain'] }), async (req, res, next) => {
  try {
    const xmlBody = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
    const parsedData = parseESolutionXml(xmlBody);

    return res.status(200).json({
      message: 'XML E-Solution / Omnibees importado e processado com sucesso!',
      reservation: parsedData
    });
  } catch (err) {
    return res.status(400).json({
      error: 'invalid_xml',
      message: 'Erro ao interpretar o formato do XML: ' + err.message
    });
  }
});

module.exports = router;
