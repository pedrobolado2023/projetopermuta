/**
 * PMS XML SERVICE — E-Solution & Omnibees XML Generator / Parser
 * Converte reservas do ecossistema StaffStay para o formato XML padrão E-Solution PMS e vice-versa.
 */

'use strict';

function formatDateXml(dateInput) {
  const d = dateInput instanceof Date ? dateInput : new Date(dateInput);
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  const seconds = String(d.getSeconds()).padStart(2, '0');
  return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;
}

function formatDateShort(dateInput) {
  const d = dateInput instanceof Date ? dateInput : new Date(dateInput);
  return d.toISOString().split('T')[0];
}

/**
 * Gera o XML de Reserva no padrão E-Solution PMS
 * @param {Object} booking - Dados da reserva da plataforma
 * @returns {string} XML formatado em string
 */
function buildESolutionXml(booking) {
  const checkInStr = formatDateXml(booking.check_in_date || '2026-09-03T14:00:00Z');
  const checkOutStr = formatDateXml(booking.check_out_date || '2026-09-07T12:00:00Z');
  const nowStr = formatDateXml(booking.created_at || new Date());
  
  const guestName = booking.guest_name || booking.full_name || 'Hóspede Hoteleiro';
  const reservationCode = booking.reservation_code || booking.id || 'STAFFSTAY-1001';
  const totalAmount = parseFloat(booking.grand_total_amount || booking.total_room_amount || 149.90).toFixed(2).replace('.', ',');
  const nightlyRate = parseFloat(booking.nightly_room_rate || 0.00).toFixed(2).replace('.', ',');
  const numGuests = booking.number_of_guests || 2;
  const numNights = booking.total_nights || 3;

  // Gerar linhas de valores diários (<Valor data="..." valortarifa="..." />)
  const checkInDate = new Date(booking.check_in_date || Date.now());
  const dailyValuesXml = [];
  const dailyPensionsXml = [];

  for (let i = 0; i < numNights; i++) {
    const curDate = new Date(checkInDate);
    curDate.setDate(curDate.getDate() + i);
    const curDateStr = formatDateXml(curDate);
    const curDateShort = formatDateShort(curDate);

    dailyValuesXml.push(
      `    <Valor data="${curDateStr}" valorcafemanha="0,00" valortarifa="${nightlyRate}" valorpensao="0" valoriss="0,00" valortaxa="0,00" />`
    );
    dailyPensionsXml.push(
      `    <Pensao Data="${curDateShort}" PensaoCafe="S" PDVCafe="10" PDVAlmoco="10" PDVJantar="10" />`
    );
  }

  const xmlString = `<?xml version="1.0" encoding="utf-8"?>
<Reserva 
  Numero="${reservationCode}" 
  Status="CF" 
  CheckIn="${checkInStr}" 
  CheckOut="${checkOutStr}" 
  QuantidadeAdulto="${numGuests}" 
  QuantidadeCrianca1="0" 
  QuantidadeCrianca2="0" 
  Aconfirmar="${nowStr}" 
  GrupoHospedagem="" 
  TipoUh="1091" 
  TipoUhUpgrade="" 
  Uh="" 
  TipoTarifacao="D" 
  ValorTarifa="${totalAmount}" 
  ValorCafeManha="0.00" 
  ValorPensao="0.00" 
  ValorAConfirmar="0.00" 
  SegmentoMercado="13" 
  Tarifario="" 
  DataBaseTarifa="${nowStr}" 
  TipoPensao="CF" 
  OrigemReserva="10" 
  Desconto="0.00" 
  Cofre="N" 
  GaranteNoShow="S" 
  Incognito="N" 
  ReservanteNome="${guestName}" 
  ReservanteTelefone="${booking.phone || ''}" 
  EmpresaHospedagem="${booking.employer_cnpj || '18271'}" 
  VoucherEmpresa="${reservationCode}" 
  Observacao="Reserva StaffStay Permuta Hoteleira — Voucher Isento de Diárias — ${guestName}" 
  ObservacaoIntegracao="Integrado com Sucesso via StaffStay Engine PMS Adapter" 
  Cidade="279" 
  EmailReservante="${booking.email || 'hospede@staffstay.com.br'}" 
  ChannelManager="STAFFSTAY_PMS" 
  OmnibeesPropertyId="${booking.hotel_id || '9924'}" 
  OtaId="${reservationCode}" 
  ReservationUID="${booking.id || '1001'}"
>
  <Hospedes>
    <Hospede Id="${booking.user_id || '101'}" Nome="${guestName}" Principal="S" FaixaEtaria="AD" Incognito="N" />
  </Hospedes>
  <Valores>
${dailyValuesXml.join('\n')}
  </Valores>
  <Pensoes>
${dailyPensionsXml.join('\n')}
  </Pensoes>
  <Requerimentos></Requerimentos>
  <ServicosHotel></ServicosHotel>
</Reserva>`;

  return xmlString;
}

/**
 * Faz o parse simples de XML E-Solution para extrair atributos principais da reserva
 * @param {string} xmlString 
 * @returns {Object} Objeto com dados extraídos
 */
function parseESolutionXml(xmlString) {
  if (!xmlString || typeof xmlString !== 'string') {
    throw new Error('XML inválido ou vazio.');
  }

  const getAttr = (attr) => {
    const match = xmlString.match(new RegExp(`${attr}="([^"]*)"`, 'i'));
    return match ? match[1] : null;
  };

  return {
    reservation_code: getAttr('Numero') || getAttr('OtaId') || 'UNKNOWN',
    status: getAttr('Status') || 'CF',
    check_in: getAttr('CheckIn'),
    check_out: getAttr('CheckOut'),
    guest_name: getAttr('ReservanteNome'),
    email: getAttr('EmailReservante'),
    adults: parseInt(getAttr('QuantidadeAdulto') || '1', 10),
    total_amount: parseFloat((getAttr('ValorTarifa') || '0').replace(',', '.')),
    hotel_property_id: getAttr('OmnibeesPropertyId')
  };
}

module.exports = {
  buildESolutionXml,
  parseESolutionXml
};
