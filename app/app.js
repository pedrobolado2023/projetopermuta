/**
 * PLATAFORMA DE PERMUTA HOTELEIRA - CORE ENGINE (STAFFSTAY / HOSTPASS)
 * Frontend State Manager, Interactive Booking Engine, Allotment Controller & QR Code Generator
 * 
 * ARQUITETURA MULTIPLATAFORMA E RESPONSIVIDADE MOBILE (PWA / DESKTOP / APP):
 * - Suporte fluido para Celulares (iPhone/Android), Tablets e Desktops.
 * - Galeria Responsiva de 5 Fotos (Full-width no mobile, Grid 3-colunas no desktop).
 * - Layout em grade responsiva que se adapta automaticamente à orientação do dispositivo.
 */

// Mock Database of Hotels & Allotment
const MOCK_HOTELS = [
  {
    id: "htl_01",
    name: "Grand Palace Resort & Spa Búzios",
    category: "Resort 5 Estrelas",
    city: "Armação dos Búzios",
    state: "RJ",
    rating: 4.9,
    reviewsCount: 184,
    publicRate: 850.00,
    staffRoomRate: 0.00,
    fixedBookingFee: 149.90,
    maxOccupancy: 4,
    allotmentAvailable: 4,
    allotmentTotal: 6,
    thumb: "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80",
    roomPhotos: [
      { url: "https://images.unsplash.com/photo-1618773928121-c32242e63f39?auto=format&fit=crop&w=800&q=80", title: "Suíte Master Vista Mar" },
      { url: "https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=800&q=80", title: "Cama King Size & Enxoval Premium" },
      { url: "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=800&q=80", title: "Banheiro em Mármore com Hidromassagem" },
      { url: "https://images.unsplash.com/photo-1596394516093-501ba68a0ba6?auto=format&fit=crop&w=800&q=80", title: "Varanda Privativa com Vista Resort" },
      { url: "https://images.unsplash.com/photo-1566665797739-1674de7a421a?auto=format&fit=crop&w=800&q=80", title: "Área de Estar e Frigobar" }
    ],
    description: "Resort pé na areia localizado em Búzios, oferecendo 5 piscinas aquecidas, spa de luxo, quadras de tênis e gastronomia internacional com atendimento 5 estrelas.",
    amenities: ["Estacionamento Privativo", "Piscina Aquecida", "Pé na Areia", "Wifi Alta Velocidade", "Recepção 24h", "Academia Kompleta"],
    paidServices: [
      { id: "srv_01", name: "Café da Manhã Buffet", price: 35.00, unit: "por pessoa/dia" },
      { id: "srv_02", name: "Estacionamento com Manobrista", price: 25.00, unit: "por dia" },
      { id: "srv_03", name: "Pass de Acesso ao Spa & Sauna", price: 80.00, unit: "taxa única" },
      { id: "srv_04", name: "Late Check-out Garantido até 16h", price: 60.00, unit: "taxa única" }
    ],
    pms: "OMNIBEES XML"
  },
  {
    id: "htl_02",
    name: "Villa do Sol Boutique Hotel",
    category: "Pousada Boutique",
    city: "Gramado",
    state: "RS",
    rating: 4.8,
    reviewsCount: 120,
    publicRate: 620.00,
    staffRoomRate: 0.00,
    fixedBookingFee: 149.90,
    maxOccupancy: 3,
    allotmentAvailable: 2,
    allotmentTotal: 3,
    thumb: "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=800&q=80",
    roomPhotos: [
      { url: "https://images.unsplash.com/photo-1566665797739-1674de7a421a?auto=format&fit=crop&w=800&q=80", title: "Quarto Alpino com Lareira" },
      { url: "https://images.unsplash.com/photo-1591088398332-8a7791972843?auto=format&fit=crop&w=800&q=80", title: "Cama Casal com Edredom de Plumas" },
      { url: "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=800&q=80", title: "Banheiro Aquecido" },
      { url: "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=800&q=80", title: "Vista para a Serra Gaúcha" },
      { url: "https://images.unsplash.com/photo-1618773928121-c32242e63f39?auto=format&fit=crop&w=800&q=80", title: "Canto de Leitura Privativo" }
    ],
    description: "Charmosa pousada boutique com arquitetura europeia, lareira privativa nos quartos, adega de vinhos selecionados e localização privilegiada no centro de Gramado.",
    amenities: ["Lareira Privativa", "Adega de Vinhos", "Aquecimento Central", "Estacionamento Grátis", "Wifi de Alta Velocidade"],
    paidServices: [
      { id: "srv_05", name: "Café Colonial Tradicional", price: 40.00, unit: "por pessoa/dia" },
      { id: "srv_06", name: "Cesta de Lenha para Lareira", price: 30.00, unit: "por unidade" },
      { id: "srv_07", name: "Garrafa de Vinho da Adega", price: 75.00, unit: "por garrafa" }
    ],
    pms: "DESBRAVADOR REST"
  },
  {
    id: "htl_03",
    name: "Oceanic Resort & Beach Club",
    category: "Resort 4 Estrelas",
    city: "Porto de Galinhas",
    state: "PE",
    rating: 4.9,
    reviewsCount: 230,
    publicRate: 980.00,
    staffRoomRate: 0.00,
    fixedBookingFee: 149.90,
    maxOccupancy: 4,
    allotmentAvailable: 5,
    allotmentTotal: 8,
    thumb: "https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=800&q=80",
    roomPhotos: [
      { url: "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=800&q=80", title: "Bangalô à Beira-Mar" },
      { url: "https://images.unsplash.com/photo-1618773928121-c32242e63f39?auto=format&fit=crop&w=800&q=80", title: "Quarto Amplo com Vista Mar" },
      { url: "https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=800&q=80", title: "Deck Privativo com Redes" },
      { url: "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=800&q=80", title: "Banheiro com Chuveiro Duplo" },
      { url: "https://images.unsplash.com/photo-1596394516093-501ba68a0ba6?auto=format&fit=crop&w=800&q=80", title: "Piscina Privativa do Bangalô" }
    ],
    description: "Complexo de lazer à beira-mar com piscinas naturais privativas, serviço de praia exclusivo, clube infantil e gastronomia regional nordestina.",
    amenities: ["Parque Aquático", "Clube Infantil", "Bar Molhado", "Transfer Aeroporto", "Serviço de Praia"],
    paidServices: [
      { id: "srv_08", name: "Buffet Completo de Refeições", price: 85.00, unit: "por pessoa/dia" },
      { id: "srv_09", name: "Passeio de Jangada nas Piscinas", price: 45.00, unit: "por pessoa" },
      { id: "srv_10", name: "Transfer Aeroporto Recife In/Out", price: 120.00, unit: "serviço" }
    ],
    pms: "TOTVS CMNET"
  },
  {
    id: "htl_04",
    name: "Urban Luxury Hotel & Suites",
    category: "Hotel Corporativo Premium",
    city: "São Paulo",
    state: "SP",
    rating: 4.7,
    reviewsCount: 310,
    publicRate: 550.00,
    staffRoomRate: 0.00,
    fixedBookingFee: 149.90,
    maxOccupancy: 2,
    allotmentAvailable: 6,
    allotmentTotal: 10,
    thumb: "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?auto=format&fit=crop&w=800&q=80",
    roomPhotos: [
      { url: "https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=800&q=80", title: "Suíte Executiva Paulista" },
      { url: "https://images.unsplash.com/photo-1618773928121-c32242e63f39?auto=format&fit=crop&w=800&q=80", title: "Estação Ergonomica & Cama King" },
      { url: "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=800&q=80", title: "Banheiro em Mármore" },
      { url: "https://images.unsplash.com/photo-1566665797739-1674de7a421a?auto=format&fit=crop&w=800&q=80", title: "Vista Panorâmica da Cidade" },
      { url: "https://images.unsplash.com/photo-1596394516093-501ba68a0ba6?auto=format&fit=crop&w=800&q=80", title: "Lounge Privativo da Suíte" }
    ],
    description: "Hotel corporativo de alto padrão na região da Av. Paulista, com suítes modernas, rooftop lounge, academia 24h e bistrô de cozinha internacional.",
    amenities: ["Rooftop Lounge", "Academia 24h", "Bistrô", "Estação de Trabalho Ergonomica", "Valet Parking"],
    paidServices: [
      { id: "srv_11", name: "Acesso ao Rooftop com Drink de Boas-Vindas", price: 45.00, unit: "por pessoa" },
      { id: "srv_12", name: "Estacionamento Coberto 24h", price: 30.00, unit: "por dia" },
      { id: "srv_13", name: "Late Check-out até 16h", price: 50.00, unit: "taxa única" }
    ],
    pms: "CLOUDBEDS API"
  }
];

// Mock User Profile
const CURRENT_USER = {
  id: "usr_9988",
  name: "Pedro Henrique Pereira",
  cpf: "123.456.789-00",
  email: "pedro.pereira@hotelaria.com.br",
  hotel: "Grand Hyatt São Paulo",
  role: "Analista de Revenue Management",
  tier: "GOLD STAFF",
  verificationStatus: "APPROVED"
};

// Global App State
let state = {
  hotels: [...MOCK_HOTELS],
  selectedHotel: null,
  selectedDates: { checkIn: "2026-08-10", checkOut: "2026-08-13" },
  guestsCount: 2,
  selectedServices: [],
  activePhotoIndex: 0,
  currentScreen: 'list'
};

// Render B2C Hotels Grid (List Screen)
function renderHotelsGrid(filterCity = "", checkIn = null, checkOut = null, guestsCount = 2) {
  const container = document.getElementById("hotels-grid");
  if (!container) return;

  const cityTerm = filterCity ? filterCity.trim().toLowerCase() : "";

  const filtered = state.hotels.filter(hotel => {
    // 1. Filtro por Cidade, Estado ou Nome
    const matchLocation = !cityTerm || 
      hotel.city.toLowerCase().includes(cityTerm) || 
      hotel.state.toLowerCase().includes(cityTerm) || 
      hotel.name.toLowerCase().includes(cityTerm) ||
      hotel.category.toLowerCase().includes(cityTerm);

    // 2. Filtro por Capacidade de Hóspedes
    const matchGuests = hotel.maxOccupancy >= guestsCount;

    // 3. Filtro por Vagas Disponíveis
    const hasAllotment = hotel.allotmentAvailable > 0;

    return matchLocation && matchGuests && hasAllotment;
  });

  if (filtered.length === 0) {
    container.innerHTML = `
      <div style="grid-column: 1/-1; text-align: center; padding: 50px 20px;" class="glass-panel">
        <div style="font-size: 3rem; margin-bottom: 10px;">🔍</div>
        <h3 style="font-size: 1.4rem; margin-bottom: 8px;">Nenhum hotel disponível para esta busca</h3>
        <p style="color: var(--text-muted); margin-bottom: 20px; font-size: 0.95rem;">
          Não encontramos vagas para <strong>${guestsCount} hóspede(s)</strong> ${cityTerm ? `em "${filterCity}"` : ''}.<br>
          Tente buscar por "Búzios", "Gramado", "Porto de Galinhas" ou reduzir o número de hóspedes.
        </p>
        <button class="btn-secondary" onclick="resetSearchFilters()">🔄 Limpar Filtros de Busca</button>
      </div>
    `;
    return;
  }

  container.innerHTML = filtered.map(hotel => `
    <div class="hotel-card" onclick="openHotelDetail('${hotel.id}')">
      <div class="hotel-thumb-wrapper">
        <img src="${hotel.thumb}" alt="${hotel.name}" class="hotel-thumb" />
        <span class="badge-tag">${hotel.category}</span>
        <span class="allotment-counter">🔥 Restam ${hotel.allotmentAvailable} Vagas</span>
      </div>
      <div class="hotel-info">
        <div class="hotel-location">📍 ${hotel.city}, ${hotel.state} • Até ${hotel.maxOccupancy} Hóspedes</div>
        <h3 class="hotel-name">${hotel.name}</h3>
        <div class="hotel-rating">
          <span>★ ${hotel.rating}</span>
          <span style="color: var(--text-muted);">(${hotel.reviewsCount} avaliações hoteleiras)</span>
        </div>
        <div class="price-container">
          <div>
            <div class="price-original">R$ ${hotel.publicRate.toFixed(2)} / diária (Pública)</div>
            <div class="price-staff" style="color: var(--color-primary);">
              Diária R$ 0,00 
              <span class="price-unit" style="display: block; font-size: 0.75rem; color: var(--color-secondary); font-weight: 700;">Taxa de Reserva: R$ 149,90 (única)</span>
            </div>
          </div>
          <button class="btn-primary" style="padding: 8px 16px; font-size: 0.85rem;">Ver Hotel & Reservar ➔</button>
        </div>
      </div>
    </div>
  `).join('');
}

// Open Full-Screen Hotel Detail View
function openHotelDetail(hotelId) {
  state.selectedHotel = state.hotels.find(h => h.id === hotelId);
  state.currentScreen = 'detail';
  state.guestsCount = 2; // Default 2 Adultos
  state.selectedServices = [];
  state.activePhotoIndex = 0;
  
  renderCurrentScreen();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Return to List Screen
function backToListScreen() {
  state.currentScreen = 'list';
  renderCurrentScreen();
}

// Helper to calculate total nights
function calculateNights() {
  const checkIn = new Date(state.selectedDates.checkIn);
  const checkOut = new Date(state.selectedDates.checkOut);
  const diffTime = Math.abs(checkOut - checkIn);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays > 0 ? diffDays : 1;
}

// Helper to calculate total optional services price
function calculateServicesTotal() {
  if (!state.selectedHotel) return 0;
  const nights = calculateNights();
  const guests = state.guestsCount;

  return state.selectedServices.reduce((total, serviceId) => {
    const srv = state.selectedHotel.paidServices.find(s => s.id === serviceId);
    if (!srv) return total;

    let srvCost = srv.price;
    if (srv.unit.includes("por dia")) {
      srvCost *= nights;
    }
    if (srv.unit.includes("por pessoa")) {
      srvCost *= guests;
    }
    return total + srvCost;
  }, 0);
}

function setActivePhoto(index) {
  state.activePhotoIndex = index;
  renderCurrentScreen();
}

function toggleService(serviceId) {
  const index = state.selectedServices.indexOf(serviceId);
  if (index >= 0) {
    state.selectedServices.splice(index, 1);
  } else {
    state.selectedServices.push(serviceId);
  }
  renderCurrentScreen();
}

function updateDates() {
  const inVal = document.getElementById("detail-input-checkin")?.value;
  const outVal = document.getElementById("detail-input-checkout")?.value;
  if (inVal && outVal) {
    state.selectedDates.checkIn = inVal;
    state.selectedDates.checkOut = outVal;
    renderCurrentScreen();
  }
}

function updateGuests() {
  const select = document.getElementById("detail-select-guests");
  if (select) {
    state.guestsCount = parseInt(select.value, 10);
    renderCurrentScreen();
  }
}

function goToScreen(screenName) {
  state.currentScreen = screenName;
  renderCurrentScreen();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Render Master Screen Switcher (Tela Inteira com Responsividade Adaptativa)
function renderCurrentScreen() {
  const listSection = document.getElementById("screen-list-view");
  const fullDetailSection = document.getElementById("screen-detail-view");

  if (!listSection || !fullDetailSection) return;

  if (state.currentScreen === 'list') {
    listSection.style.display = "block";
    fullDetailSection.style.display = "none";
    renderHotelsGrid();
  } else if (state.currentScreen === 'detail') {
    listSection.style.display = "none";
    fullDetailSection.style.display = "block";
    renderFullDetailContent();
  } else if (state.currentScreen === 'biometry') {
    listSection.style.display = "none";
    fullDetailSection.style.display = "block";
    renderBiometryContent();
  } else if (state.currentScreen === 'checkout') {
    listSection.style.display = "none";
    fullDetailSection.style.display = "block";
    renderCheckoutContent();
  } else if (state.currentScreen === 'voucher') {
    listSection.style.display = "none";
    fullDetailSection.style.display = "block";
    renderVoucherContent();
  }
}

// Render Full Screen Hotel Page Content (TELA INTEIRA RESPONSIVA)
function renderFullDetailContent() {
  const container = document.getElementById("screen-detail-view");
  if (!container || !state.selectedHotel) return;

  const h = state.selectedHotel;
  const nights = calculateNights();
  const servicesTotal = calculateServicesTotal();
  const grandTotal = 149.90 + servicesTotal;

  container.innerHTML = `
    <!-- Top Navigation Bar for Full Screen View -->
    <div style="margin-bottom: 20px; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 12px;">
      <button class="btn-secondary" onclick="backToListScreen()" style="display: inline-flex; align-items: center; gap: 8px; font-weight: 700;">
        ← Voltar para Todos os Hotéis
      </button>
      <div style="display: flex; gap: 10px; align-items: center; flex-wrap: wrap;">
        <span class="badge-tag" style="position: static; font-size: 0.85rem;">${h.category}</span>
        <span style="font-size: 0.9rem; color: var(--accent-gold); font-weight: 700;">★ ${h.rating} (${h.reviewsCount} avaliações)</span>
        <span style="font-size: 0.85rem; color: var(--color-secondary); font-weight: 700;">Conector: ${h.pms}</span>
      </div>
    </div>

    <!-- Hotel Header Title -->
    <div style="margin-bottom: 20px;">
      <h1 class="detail-hotel-title" style="font-size: 2.2rem; font-weight: 800; margin-bottom: 6px;">${h.name}</h1>
      <p style="color: var(--text-muted); font-size: 1rem; font-weight: 600;">📍 ${h.city}, ${h.state} • Canal Privado de Permuta StaffStay</p>
    </div>

    <!-- GALERIA DE FOTOS EM TELA INTEIRA RESPONSIVA -->
    <div class="detail-photo-gallery" style="display: grid; grid-template-columns: 2fr 1fr 1fr; gap: 12px; height: 420px; border-radius: var(--radius-lg); overflow: hidden; border: 1px solid var(--glass-border); margin-bottom: 28px; box-shadow: var(--glass-shadow);">
      <!-- Foto 1 Grande Principal -->
      <div onclick="setActivePhoto(0)" class="detail-main-photo" style="position: relative; height: 100%; cursor: pointer; overflow: hidden; background: #0F172A;">
        <img src="${h.roomPhotos[0].url}" alt="${h.roomPhotos[0].title}" style="width: 100%; height: 100%; object-fit: cover; transition: transform 0.4s ease;" class="gallery-photo" />
        <div style="position: absolute; bottom: 0; inset-x: 0; background: linear-gradient(0deg, rgba(15,23,42,0.85) 0%, transparent 100%); padding: 14px 18px; color: #FFF; font-weight: 700; font-size: 0.9rem;">
          📷 ${h.roomPhotos[0].title}
        </div>
      </div>

      <!-- Coluna 2 e 3 (Sub-fotos) -->
      <div class="detail-photo-gallery-sub" style="display: grid; grid-template-rows: 1fr 1fr; gap: 12px; height: 100%;">
        <div onclick="setActivePhoto(1)" style="position: relative; height: 100%; cursor: pointer; overflow: hidden; background: #0F172A;">
          <img src="${h.roomPhotos[1].url}" alt="${h.roomPhotos[1].title}" style="width: 100%; height: 100%; object-fit: cover;" class="gallery-photo" />
        </div>
        <div onclick="setActivePhoto(2)" style="position: relative; height: 100%; cursor: pointer; overflow: hidden; background: #0F172A;">
          <img src="${h.roomPhotos[2].url}" alt="${h.roomPhotos[2].title}" style="width: 100%; height: 100%; object-fit: cover;" class="gallery-photo" />
        </div>
      </div>

      <div class="detail-photo-gallery-sub" style="display: grid; grid-template-rows: 1fr 1fr; gap: 12px; height: 100%;">
        <div onclick="setActivePhoto(3)" style="position: relative; height: 100%; cursor: pointer; overflow: hidden; background: #0F172A;">
          <img src="${h.roomPhotos[3].url}" alt="${h.roomPhotos[3].title}" style="width: 100%; height: 100%; object-fit: cover;" class="gallery-photo" />
        </div>
        <div onclick="setActivePhoto(4)" style="position: relative; height: 100%; cursor: pointer; overflow: hidden; background: #0F172A;">
          <img src="${h.roomPhotos[4].url}" alt="${h.roomPhotos[4].title}" style="width: 100%; height: 100%; object-fit: cover;" class="gallery-photo" />
          <div style="position: absolute; inset: 0; background: rgba(15,23,42,0.45); display: flex; align-items: center; justify-content: center; color: #FFF; font-weight: 800; font-size: 1rem;">
            +5 Fotos
          </div>
        </div>
      </div>
    </div>

    <!-- CONTEÚDO PRINCIPAL ADAPTÁVEL (DETALHES DO HOTEL + WIDGET DE RESERVA) -->
    <div class="detail-layout-grid" style="display: grid; grid-template-columns: 1.8fr 1.2fr; gap: 32px; align-items: start;">
      
      <!-- Coluna Esquerda: Descrição, Comodidades & Serviços Fornecidos -->
      <div>
        <div style="background: #CCFBF1; border: 1px solid var(--accent-mint); padding: 18px; border-radius: var(--radius-md); margin-bottom: 24px;">
          <div style="display: flex; align-items: center; gap: 12px;">
            <div style="font-size: 1.8rem;">🎉</div>
            <div>
              <h3 style="color: #115E59; font-weight: 800; font-size: 1.05rem;">Hospedagem 100% Isenta de Diárias de Quarto!</h3>
              <p style="font-size: 0.88rem; color: #134E4A; margin-top: 4px;">Este hotel parceiro disponibilizou quartos ociosos para hoteleiros validados. Você paga <strong>R$ 0,00 nas diárias</strong> e apenas a taxa fixa de reserva de <strong>R$ 149,90</strong>.</p>
            </div>
          </div>
        </div>

        <div style="margin-bottom: 28px;">
          <h3 style="margin-bottom: 10px; font-size: 1.3rem;">Sobre a Propriedade</h3>
          <p style="color: var(--text-secondary); font-size: 1rem; line-height: 1.6;">${h.description}</p>
        </div>

        <div style="margin-bottom: 28px;">
          <h3 style="margin-bottom: 14px; font-size: 1.3rem;">Comodidades Incluídas no Hotel</h3>
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 12px;">
            ${h.amenities.map(a => `
              <div class="glass-panel" style="padding: 12px 16px; display: flex; align-items: center; gap: 8px; font-weight: 600; font-size: 0.9rem;">
                <span style="color: var(--accent-emerald); font-size: 1rem;">✓</span> ${a}
              </div>
            `).join('')}
          </div>
        </div>

        <!-- Bloco de Serviços Fornecidos pelo Hotel (Com Checkbox e Valor) -->
        <div class="glass-panel" style="padding: 20px;">
          <h3 style="color: var(--color-primary); font-size: 1.15rem; font-weight: 800; margin-bottom: 6px;">Serviços Fornecidos pelo Hotel (Opcionais)</h3>
          <p style="color: var(--text-muted); font-size: 0.88rem; margin-bottom: 16px;">Selecione os serviços que deseja incluir no seu quarto (se preferir, não precisa marcar nenhum):</p>
          
          <div style="display: flex; flex-direction: column; gap: 10px;">
            ${h.paidServices.map(srv => {
              const isChecked = state.selectedServices.includes(srv.id);
              return `
                <label style="display: flex; align-items: center; justify-content: space-between; padding: 12px 16px; background: #F8FAFC; border: 1px solid ${isChecked ? 'var(--color-primary)' : 'var(--glass-border)'}; border-radius: var(--radius-sm); cursor: pointer; transition: var(--transition-fast);">
                  <div style="display: flex; align-items: center; gap: 12px;">
                    <input type="checkbox" id="detail-srv-${srv.id}" ${isChecked ? 'checked' : ''} onchange="toggleService('${srv.id}')" style="width: 18px; height: 18px; accent-color: var(--color-primary); cursor: pointer;">
                    <span style="font-size: 0.95rem; font-weight: 700; color: var(--color-primary);">${srv.name}</span>
                  </div>
                  <div style="font-size: 0.95rem; font-weight: 800; color: var(--color-primary);">
                    R$ ${srv.price.toFixed(2)} <span style="font-size: 0.75rem; color: var(--text-muted); font-weight: 500;">/ ${srv.unit}</span>
                  </div>
                </label>
              `;
            }).join('')}
          </div>
        </div>
      </div>

      <!-- Coluna Direita: Widget Sticky de Reserva & Checkout (Adaptável ao Celular) -->
      <div class="glass-panel sticky-booking-widget" style="padding: 24px; position: sticky; top: 90px; box-shadow: 0 16px 40px rgba(15, 23, 42, 0.08);">
        <div style="display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 18px; padding-bottom: 14px; border-bottom: 1px solid var(--glass-border);">
          <div>
            <span style="font-size: 0.8rem; text-decoration: line-through; color: var(--text-muted);">R$ ${h.publicRate.toFixed(2)} / dia</span>
            <div style="font-size: 1.7rem; font-weight: 900; color: var(--color-primary);">Diária R$ 0,00</div>
          </div>
          <span style="font-size: 0.8rem; background: var(--accent-rose); color: #FFF; padding: 4px 10px; border-radius: 20px; font-weight: 800;">
            🔥 ${h.allotmentAvailable} Vagas
          </span>
        </div>

        <!-- Seletor de Datas -->
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 14px;">
          <div class="form-group" style="margin-bottom: 0;">
            <label class="form-label">CHECK-IN</label>
            <input type="date" class="form-control" value="${state.selectedDates.checkIn}" id="detail-input-checkin" onchange="updateDates()">
          </div>
          <div class="form-group" style="margin-bottom: 0;">
            <label class="form-label">CHECK-OUT</label>
            <input type="date" class="form-control" value="${state.selectedDates.checkOut}" id="detail-input-checkout" onchange="updateDates()">
          </div>
        </div>

        <!-- Seletor de Quantidade de Hóspedes (Pré-setado 2 Adultos) -->
        <div class="form-group" style="margin-bottom: 20px;">
          <label class="form-label">HÓSPEDES (MÁX: ${h.maxOccupancy} PESSOAS)</label>
          <select class="form-control" id="detail-select-guests" onchange="updateGuests()">
            ${Array.from({ length: h.maxOccupancy }, (_, i) => i + 1).map(num => `
              <option value="${num}" ${num === state.guestsCount ? 'selected' : ''}>
                ${num} ${num === 1 ? 'Adulto' : 'Adultos'} ${num === 2 ? '(Pré-setado)' : ''}
              </option>
            `).join('')}
          </select>
        </div>

        <!-- Resumo Financeiro no Widget -->
        <div style="background: var(--bg-tertiary); padding: 16px; border-radius: var(--radius-sm); margin-bottom: 20px;">
          <div style="display: flex; justify-content: space-between; margin-bottom: 6px; font-size: 0.88rem;">
            <span>Diárias do Quarto (${nights} noites):</span>
            <strong style="color: var(--accent-emerald);">R$ 0,00 (ISENTO)</strong>
          </div>
          <div style="display: flex; justify-content: space-between; margin-bottom: 6px; font-size: 0.88rem;">
            <span>Taxa Fixa de Reserva:</span>
            <span>R$ 149,90</span>
          </div>
          <div style="display: flex; justify-content: space-between; margin-bottom: 10px; font-size: 0.88rem;">
            <span>Serviços Opcionais:</span>
            <span>R$ ${servicesTotal.toFixed(2)}</span>
          </div>

          <div style="border-top: 1px dashed var(--glass-border); padding-top: 10px; display: flex; justify-content: space-between; font-weight: 900; font-size: 1.25rem; color: var(--color-primary);">
            <span>TOTAL:</span>
            <span>R$ ${grandTotal.toFixed(2)}</span>
          </div>
        </div>

        <!-- Botão Principal de Reserva -->
        <button class="btn-primary" style="width: 100%; padding: 14px; font-size: 1rem;" onclick="goToScreen('biometry')">
          Reservar & Ir para Verificação Facial ➔
        </button>

        <p style="font-size: 0.72rem; color: var(--text-muted); text-align: center; margin-top: 10px;">
          🔒 Reserva protegida via canal fechado de permuta hoteleira.
        </p>
      </div>

    </div>
  `;
}

// Render Biometry Screen (Tela Inteira)
function renderBiometryContent() {
  const container = document.getElementById("screen-detail-view");
  if (!container) return;

  container.innerHTML = `
    <div style="max-width: 620px; margin: 20px auto;" class="glass-panel">
      <div style="text-align: center; padding: 28px 20px;">
        <div style="font-size: 3rem; margin-bottom: 10px;">📸</div>
        <h1 style="font-size: 1.8rem; margin-bottom: 8px;">Validação Biométrica em Tempo Real</h1>
        <p style="color: var(--text-muted); max-width: 480px; margin: 0 auto 24px; font-size: 0.95rem;">Como esta reserva é 100% isenta de diária, confirme sua identidade e vínculo hoteleiro via Prova de Vida.</p>

        <div style="position: relative; width: 200px; height: 200px; border-radius: 50%; border: 3px dashed var(--color-tertiary); margin: 0 auto 24px; display: flex; align-items: center; justify-content: center; background: #CCFBF1; overflow: hidden;" id="camera-box">
          <div style="font-size: 0.85rem; color: #115E59; font-weight: 700; padding: 16px;" id="camera-text">Posicione seu rosto na área delimitada...</div>
        </div>

        <div style="display: flex; flex-direction: column; gap: 10px; max-width: 320px; margin: 0 auto;">
          <button class="btn-primary" id="btn-scan" onclick="simulateBiometricScanFull()">Simular Captura Facial & Prova de Vida</button>
          <button class="btn-secondary" onclick="goToScreen('detail')">← Voltar para o Hotel</button>
        </div>
      </div>
    </div>
  `;
}

function simulateBiometricScanFull() {
  const box = document.getElementById("camera-box");
  const text = document.getElementById("camera-text");
  const btn = document.getElementById("btn-scan");

  if (!box || !btn) return;

  btn.disabled = true;
  btn.innerText = "Analisando 128 pontos faciais...";
  box.style.borderColor = "var(--accent-gold)";
  text.innerHTML = "⏳ OCR & Face Match em progresso...";

  setTimeout(() => {
    box.style.borderColor = "var(--accent-emerald)";
    box.style.background = "#D1FAE5";
    text.innerHTML = "✅ Biometria 99.4% Match!<br>Prova de Vida Confirmada";
    
    setTimeout(() => {
      goToScreen('checkout');
    }, 1200);
  }, 1600);
}

// Render Checkout Screen (Tela Inteira)
function renderCheckoutContent() {
  const container = document.getElementById("screen-detail-view");
  if (!container || !state.selectedHotel) return;

  const h = state.selectedHotel;
  const nights = calculateNights();
  const servicesTotal = calculateServicesTotal();
  const grandTotal = 149.90 + servicesTotal;

  container.innerHTML = `
    <div style="max-width: 680px; margin: 20px auto;" class="glass-panel">
      <div style="padding: 24px;">
        <h1 style="font-size: 1.8rem; margin-bottom: 6px;">Checkout & Confirmar Reserva</h1>
        <p style="color: var(--text-muted); margin-bottom: 20px; font-size: 0.95rem;">Titular: <strong>${CURRENT_USER.name}</strong> (${CURRENT_USER.hotel}) • <strong>${state.guestsCount} Hóspedes</strong></p>

        <div style="background: var(--bg-tertiary); padding: 20px; border-radius: var(--radius-md); margin-bottom: 24px; border: 1px solid var(--glass-border);">
          <h3 style="margin-bottom: 14px; color: var(--color-primary); font-size: 1.05rem;">Resumo da Reserva & Split de Pagamento</h3>
          <div style="display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 0.9rem;">
            <span>Diárias do Quarto (${nights} noites / ${state.guestsCount} Pessoas):</span>
            <strong style="color: var(--accent-emerald);">R$ 0,00 (ISENTO)</strong>
          </div>
          <div style="display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 0.9rem;">
            <span>Taxa Fixa de Reserva StaffStay:</span>
            <span>R$ 149,90</span>
          </div>
          <div style="display: flex; justify-content: space-between; margin-bottom: 14px; font-size: 0.9rem;">
            <span>Serviços Opcionais do Hotel:</span>
            <span>R$ ${servicesTotal.toFixed(2)}</span>
          </div>
          
          <div style="border-top: 1px dashed var(--glass-border); padding-top: 14px; display: flex; justify-content: space-between; font-weight: 900; font-size: 1.4rem; color: var(--color-primary);">
            <span>TOTAL A PAGAR:</span>
            <span>R$ ${grandTotal.toFixed(2)}</span>
          </div>
          <div style="font-size: 0.78rem; color: var(--text-muted); margin-top: 8px;">
            * R$ 149,90 repassados para a plataforma StaffStay ${servicesTotal > 0 ? `e R$ ${servicesTotal.toFixed(2)} repassados diretamente para a conta do hotel.` : '.'}
          </div>
        </div>

        <div style="margin-bottom: 24px;">
          <label class="form-label" style="font-size: 0.85rem;">FORMA DE PAGAMENTO</label>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
            <button class="btn-primary" style="padding: 12px; font-size: 0.9rem;">❖ PIX Instantâneo (Split)</button>
            <button class="btn-outlined" style="padding: 12px; font-size: 0.9rem;">💳 Cartão de Crédito</button>
          </div>
        </div>

        <div style="display: flex; justify-content: space-between; align-items: center; gap: 12px;">
          <button class="btn-secondary" onclick="goToScreen('biometry')">← Voltar</button>
          <button class="btn-primary" style="padding: 12px 24px; font-size: 0.95rem;" onclick="confirmBookingFull()">Pagar R$ ${grandTotal.toFixed(2)} & Gerar Voucher ➔</button>
        </div>
      </div>
    </div>
  `;
}

function confirmBookingFull() {
  if (state.selectedHotel) {
    state.selectedHotel.allotmentAvailable = Math.max(0, state.selectedHotel.allotmentAvailable - 1);
  }
  goToScreen('voucher');
}

// Render Voucher Screen (Tela Inteira)
function renderVoucherContent() {
  const container = document.getElementById("screen-detail-view");
  if (!container || !state.selectedHotel) return;

  const h = state.selectedHotel;
  const code = "STAFF-" + Math.floor(1000 + Math.random() * 9000) + "-FREE";

  container.innerHTML = `
    <div style="max-width: 580px; margin: 20px auto; text-align: center;" class="glass-panel">
      <div style="padding: 28px 20px;">
        <div style="font-size: 3rem; margin-bottom: 10px;">🎉</div>
        <h1 style="color: var(--accent-emerald); font-size: 1.8rem; margin-bottom: 8px;">Reserva Confirmada com Sucesso!</h1>
        <p style="color: var(--text-muted); margin-bottom: 20px; font-size: 0.95rem;">Voucher 100% integrado ao PMS <strong>${h.pms}</strong> do hotel.</p>

        <div style="background: #0F172A; color: #FFF; padding: 24px 20px; border-radius: var(--radius-md); max-width: 380px; margin: 0 auto 24px; box-shadow: 0 15px 40px rgba(0,0,0,0.2);">
          <div style="font-weight: 800; font-size: 1.2rem; margin-bottom: 4px; color: var(--color-tertiary);">HOSTPASS FREE ROOM VOUCHER</div>
          <div style="font-size: 0.8rem; color: #94A3B8; margin-bottom: 16px;">Código: <strong>${code}</strong></div>
          
          <!-- SVG QR Code -->
          <div style="width: 160px; height: 160px; margin: 0 auto 16px; background: #FFF; padding: 10px; border-radius: 12px; display: flex; align-items: center; justify-content: center;">
            <svg viewBox="0 0 100 100" width="140" height="140" fill="#0F172A">
              <rect x="0" y="0" width="30" height="30"/>
              <rect x="70" y="0" width="30" height="30"/>
              <rect x="0" y="70" width="30" height="30"/>
              <rect x="10" y="10" width="10" height="10" fill="#FFF"/>
              <rect x="80" y="10" width="10" height="10" fill="#FFF"/>
              <rect x="10" y="80" width="10" height="10" fill="#FFF"/>
              <rect x="40" y="40" width="20" height="20"/>
              <rect x="40" y="10" width="10" height="20"/>
              <rect x="70" y="50" width="20" height="30"/>
            </svg>
          </div>
          
          <div style="font-size: 0.9rem; font-weight: 800;">Hóspede: ${CURRENT_USER.name}</div>
          <div style="font-size: 0.8rem; color: #CBD5E1; margin-top: 2px;">Hotel: ${h.name} (${state.guestsCount} Hóspedes)</div>
          <div style="font-size: 0.75rem; color: var(--color-tertiary); font-weight: 800; margin-top: 8px;">Diárias: R$ 0,00 | Taxa Paga: R$ 149,90</div>
        </div>

        <button class="btn-primary" style="padding: 14px 24px; font-size: 1rem; width: 100%; max-width: 320px;" onclick="backToListScreen()">Concluir & Voltar para a Busca</button>
      </div>
    </div>
  `;
}

// Search Handler
function handleSearch() {
  const cityInput = document.getElementById("search-city");
  const checkInInput = document.getElementById("search-checkin");
  const checkOutInput = document.getElementById("search-checkout");
  const guestsSelect = document.getElementById("search-guests");

  const filterCity = cityInput ? cityInput.value : "";
  const checkIn = checkInInput ? checkInInput.value : state.selectedDates.checkIn;
  const checkOut = checkOutInput ? checkOutInput.value : state.selectedDates.checkOut;
  const guestsCount = guestsSelect ? parseInt(guestsSelect.value, 10) : 2;

  // Validação simples de datas
  if (checkIn && checkOut && new Date(checkOut) <= new Date(checkIn)) {
    // Se checkout for menor que checkin, ajusta automaticamente para +1 dia
    const nextDay = new Date(checkIn);
    nextDay.setDate(nextDay.getDate() + 1);
    const newCheckOut = nextDay.toISOString().split('T')[0];
    if (checkOutInput) checkOutInput.value = newCheckOut;
    state.selectedDates.checkOut = newCheckOut;
  } else {
    state.selectedDates.checkIn = checkIn;
    state.selectedDates.checkOut = checkOut;
  }

  state.guestsCount = guestsCount;
  renderHotelsGrid(filterCity, state.selectedDates.checkIn, state.selectedDates.checkOut, guestsCount);
}

function resetSearchFilters() {
  const cityInput = document.getElementById("search-city");
  const checkInInput = document.getElementById("search-checkin");
  const checkOutInput = document.getElementById("search-checkout");
  const guestsSelect = document.getElementById("search-guests");

  if (cityInput) cityInput.value = "";
  if (checkInInput) checkInInput.value = "2026-08-10";
  if (checkOutInput) checkOutInput.value = "2026-08-13";
  if (guestsSelect) guestsSelect.value = "2";

  state.selectedDates = { checkIn: "2026-08-10", checkOut: "2026-08-13" };
  state.guestsCount = 2;

  renderHotelsGrid("", "2026-08-10", "2026-08-13", 2);
}

/* ==========================================================================
   AUTHENTICATION & USER REGISTRATION WIZARD LOGIC
   ========================================================================== */

let currentUserState = JSON.parse(localStorage.getItem('staffstay_user')) || null;
let registerStepState = 1;
let uploadedDocData = null;
let uploadedSelfieData = null;

function renderUserNav() {
  const container = document.getElementById("nav-auth-container");
  if (container) {
    if (currentUserState) {
      const roleLabel = {
        'SUPER_ADMIN': 'SUPER ADMIN',
        'GOVERNANCE_AUDITOR': 'GOVERNANCE',
        'HOTEL_ADMIN': 'HOTEL ADMIN',
        'STAFF_GUEST': currentUserState.tier || 'GOLD STAFF'
      }[currentUserState.role] || 'STAFF GUEST';

      container.innerHTML = `
        <div class="user-badge" style="cursor: pointer;" onclick="openAuthModal()" title="Clique para gerenciar sua conta">
          <span>👤 ${currentUserState.full_name || currentUserState.name}</span>
          <span class="tier-pill">${roleLabel}</span>
        </div>
        <button class="btn-secondary" onclick="logoutUser()" style="font-size: 0.8rem; padding: 6px 12px; border-color: var(--accent-rose); color: var(--accent-rose);">Sair</button>
      `;
    } else {
      container.innerHTML = `
        <button class="btn-primary" onclick="openAuthModal()" style="font-size: 0.85rem; padding: 8px 18px;">
          🔑 Entrar / Cadastrar
        </button>
      `;
    }
  }

  renderNavLinks();
  enforcePageAccessControl();
}

function renderNavLinks() {
  const navContainer = document.getElementById("main-nav-links");
  if (!navContainer) return;

  const path = window.location.pathname;
  const isHome = path === '/' || path.endsWith('index.html') || path === '';
  const isHotel = path.includes('hotel-panel');
  const isAdmin = path.includes('admin-panel');

  const role = currentUserState ? currentUserState.role : null;

  let links = [
    `<li><a href="/" class="nav-link ${isHome ? 'active' : ''}">Explorar</a></li>`
  ];

  // Painel B2B: disponível apenas para HOTEL_ADMIN e SUPER_ADMIN
  if (role === 'HOTEL_ADMIN' || role === 'SUPER_ADMIN') {
    links.push(`<li><a href="/hotel-panel" class="nav-link ${isHotel ? 'active' : ''}">Painel B2B</a></li>`);
  }

  // Governança: disponível apenas para SUPER_ADMIN e GOVERNANCE_AUDITOR
  if (role === 'SUPER_ADMIN' || role === 'GOVERNANCE_AUDITOR') {
    links.push(`<li><a href="/admin-panel" class="nav-link ${isAdmin ? 'active' : ''}">Governança</a></li>`);
  }

  navContainer.innerHTML = links.join('');
}

function enforcePageAccessControl() {
  const path = window.location.pathname;
  const mainElem = document.querySelector("main.container");
  if (!mainElem) return;

  const role = currentUserState ? currentUserState.role : null;

  // ─── Proteção do Painel B2B do Hotel (/hotel-panel) ───────────────────────
  if (path.includes('hotel-panel')) {
    if (role !== 'HOTEL_ADMIN' && role !== 'SUPER_ADMIN') {
      mainElem.innerHTML = `
        <div style="max-width: 600px; margin: 60px auto; text-align: center;" class="glass-panel">
          <div style="padding: 40px 24px;">
            <div style="font-size: 3.5rem; margin-bottom: 12px;">🔒</div>
            <h1 style="font-size: 1.8rem; color: var(--color-primary); margin-bottom: 10px;">Acesso Restrito ao Painel B2B</h1>
            <p style="color: var(--text-muted); font-size: 0.95rem; line-height: 1.6; margin-bottom: 24px;">
              Esta página é exclusiva para <strong>Administradores de Hotéis Parceiros</strong> validados.<br>
              ${currentUserState ? `Sua conta atual (<strong>${currentUserState.full_name}</strong>) está cadastrada como <strong>Hóspede Staff</strong> e não possui permissão de gestão B2B.` : 'Você precisa estar autenticado como Administrador de Hotel para acessar este painel.'}
            </p>

            <div style="display: flex; gap: 12px; justify-content: center; flex-wrap: wrap;">
              <button class="btn-primary" onclick="loginAsDemoRole('HOTEL_ADMIN')">🔑 Entrar como Admin de Hotel (Demo)</button>
              <a href="/" class="btn-secondary" style="text-decoration: none; display: inline-flex; align-items: center;">← Voltar para Explorar</a>
            </div>
          </div>
        </div>
      `;
    }
  }

  // ─── Proteção da Central de Governança (/admin-panel) ──────────────────────
  if (path.includes('admin-panel')) {
    if (role !== 'SUPER_ADMIN' && role !== 'GOVERNANCE_AUDITOR') {
      mainElem.innerHTML = `
        <div style="max-width: 600px; margin: 60px auto; text-align: center;" class="glass-panel">
          <div style="padding: 40px 24px;">
            <div style="font-size: 3.5rem; margin-bottom: 12px;">🛡️</div>
            <h1 style="font-size: 1.8rem; color: var(--accent-rose); margin-bottom: 10px;">Acesso Restrito à Governança</h1>
            <p style="color: var(--text-muted); font-size: 0.95rem; line-height: 1.6; margin-bottom: 24px;">
              Esta área é exclusiva para a equipe de <strong>Governança & SuperAdmin</strong> do sistema.<br>
              ${currentUserState ? `Usuários com perfil <strong>${currentUserState.role}</strong> não possuem autorização de auditoria LGPD/antifraude.` : 'Você precisa estar autenticado com credenciais de SuperAdmin para visualizar esta central.'}
            </p>

            <div style="display: flex; gap: 12px; justify-content: center; flex-wrap: wrap;">
              <button class="btn-primary" onclick="loginAsDemoRole('SUPER_ADMIN')" style="background: var(--accent-rose);">🔑 Entrar como SuperAdmin (Demo)</button>
              <a href="/" class="btn-secondary" style="text-decoration: none; display: inline-flex; align-items: center;">← Voltar para Explorar</a>
            </div>
          </div>
        </div>
      `;
    }
  }
}

function loginAsDemoRole(targetRole) {
  if (targetRole === 'HOTEL_ADMIN') {
    currentUserState = {
      id: "usr_hotel_admin_01",
      full_name: "Carlos Alberto (Gerente Geral)",
      email: "carlos@grandpalace.com.br",
      role: "HOTEL_ADMIN",
      hotel: "Grand Palace Resort Búzios",
      tier: "HOTEL ADMIN"
    };
  } else if (targetRole === 'SUPER_ADMIN') {
    currentUserState = {
      id: "usr_super_admin_01",
      full_name: "Compliance Master (SuperAdmin)",
      email: "admin@staffstay.com.br",
      role: "SUPER_ADMIN",
      tier: "LEVEL 5 ADMIN"
    };
  } else {
    currentUserState = {
      id: "usr_guest_01",
      full_name: "Pedro Henrique Pereira",
      email: "pedro.pereira@hotelaria.com.br",
      role: "STAFF_GUEST",
      hotel: "Grand Hyatt São Paulo",
      tier: "GOLD STAFF"
    };
  }

  localStorage.setItem('staffstay_user', JSON.stringify(currentUserState));
  renderUserNav();
  window.location.reload();
}

function openAuthModal() {
  const modal = document.getElementById("auth-modal");
  if (modal) {
    modal.style.display = "flex";
    if (currentUserState) {
      switchAuthTab('login');
    }
  }
}

function closeAuthModal() {
  const modal = document.getElementById("auth-modal");
  if (modal) {
    modal.style.display = "none";
  }
}

function switchAuthTab(tab) {
  const loginForm = document.getElementById("form-auth-login");
  const regForm = document.getElementById("form-auth-register");
  const loginBtn = document.getElementById("tab-btn-login");
  const regBtn = document.getElementById("tab-btn-register");

  if (tab === 'login') {
    loginForm.style.display = "block";
    regForm.style.display = "none";
    loginBtn.classList.add("active");
    regBtn.classList.remove("active");
  } else {
    loginForm.style.display = "none";
    regForm.style.display = "block";
    loginBtn.classList.remove("active");
    regBtn.classList.add("active");
    nextRegisterStep(1);
  }
}

function nextRegisterStep(step) {
  if (step === 2) {
    const fullName = document.getElementById("reg-full-name")?.value;
    const cpf = document.getElementById("reg-cpf")?.value;
    const email = document.getElementById("reg-email")?.value;
    const whatsapp = document.getElementById("reg-whatsapp")?.value;
    const password = document.getElementById("reg-password")?.value;

    if (!fullName || !cpf || !email || !whatsapp || !password) {
      alert("Por favor, preencha todos os campos obrigatórios da etapa 1.");
      return;
    }
  } else if (step === 3) {
    const empName = document.getElementById("reg-employer-name")?.value;
    const empCnpj = document.getElementById("reg-employer-cnpj")?.value;
    const jobPos = document.getElementById("reg-job-position")?.value;

    if (!empName || !empCnpj || !jobPos) {
      alert("Por favor, preencha todos os dados da empresa e seu cargo.");
      return;
    }
  }

  registerStepState = step;
  [1, 2, 3].forEach(s => {
    const stepDiv = document.getElementById(`reg-step-${s}`);
    const nodeDiv = document.getElementById(`step-node-${s}`);
    if (stepDiv && nodeDiv) {
      stepDiv.style.display = (s === step) ? "block" : "none";
      nodeDiv.classList.remove("active", "completed");
      if (s === step) nodeDiv.classList.add("active");
      if (s < step) nodeDiv.classList.add("completed");
    }
  });
}

function handleDocUpload(event) {
  const file = event.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = function(e) {
      uploadedDocData = e.target.result;
      const preview = document.getElementById("preview-doc");
      const label = document.getElementById("doc-label");
      if (preview && label) {
        preview.src = uploadedDocData;
        preview.style.display = "block";
        label.innerText = `✅ Comprovante anexado: ${file.name}`;
      }
    };
    reader.readAsDataURL(file);
  }
}

function handleSelfieUpload(event) {
  const file = event.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = function(e) {
      uploadedSelfieData = e.target.result;
      const preview = document.getElementById("preview-selfie");
      const label = document.getElementById("selfie-label");
      if (preview && label) {
        preview.src = uploadedSelfieData;
        preview.style.display = "block";
        label.innerText = `✅ Selfie capturada: ${file.name}`;
      }
    };
    reader.readAsDataURL(file);
  }
}

async function handleLoginSubmit(event) {
  event.preventDefault();
  const email = document.getElementById("login-email")?.value;
  const password = document.getElementById("login-password")?.value;

  try {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    if (response.ok) {
      const data = await response.json();
      currentUserState = data.user;
      localStorage.setItem('staffstay_token', data.access_token);
    } else {
      // Fallback local caso API responda com erro em teste
      currentUserState = {
        name: email.split('@')[0],
        full_name: email.split('@')[0],
        email: email,
        tier: 'GOLD STAFF',
        role: 'STAFF_GUEST'
      };
    }
  } catch (err) {
    currentUserState = {
      name: email.split('@')[0],
      full_name: email.split('@')[0],
      email: email,
      tier: 'GOLD STAFF',
      role: 'STAFF_GUEST'
    };
  }

  localStorage.setItem('staffstay_user', JSON.stringify(currentUserState));
  renderUserNav();
  closeAuthModal();
  alert(`🔥 Bem-vindo(a), ${currentUserState.full_name || currentUserState.name}!`);
}

async function handleRegisterSubmit() {
  const fullName = document.getElementById("reg-full-name")?.value;
  const cpf = document.getElementById("reg-cpf")?.value;
  const email = document.getElementById("reg-email")?.value;
  const whatsapp = document.getElementById("reg-whatsapp")?.value;
  const password = document.getElementById("reg-password")?.value;

  const employerName = document.getElementById("reg-employer-name")?.value;
  const employerCnpj = document.getElementById("reg-employer-cnpj")?.value;
  const jobPosition = document.getElementById("reg-job-position")?.value;

  if (!uploadedDocData || !uploadedSelfieData) {
    if (!confirm("Aviso: Você não anexou o comprovante de trabalho ou selfie. Deseja continuar com validação pendente?")) {
      return;
    }
  }

  const payload = {
    full_name: fullName,
    cpf: cpf,
    email: email,
    phone: whatsapp,
    password: password,
    employer_hotel_name: employerName,
    employer_cnpj: employerCnpj,
    job_position: jobPosition,
    document_proof_url: uploadedDocData || '',
    selfie_url: uploadedSelfieData || ''
  };

  try {
    const response = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const data = await response.json();

    if (response.ok) {
      currentUserState = data.user;
      localStorage.setItem('staffstay_token', data.access_token);
    } else if (response.status === 409) {
      alert(`❌ ${data.message || 'Cadastro Bloqueado: O E-mail, CPF ou a foto enviada (documento/selfie) já pertence a outro usuário cadastrado no sistema.'}`);
      return;
    } else {
      currentUserState = {
        name: fullName,
        full_name: fullName,
        email: email,
        cpf: cpf,
        hotel: employerName,
        job: jobPosition,
        tier: 'BRONZE STAFF',
        verification_status: 'APPROVED',
        role: 'STAFF_GUEST'
      };
    }
  } catch (err) {
    currentUserState = {
      name: fullName,
      full_name: fullName,
      email: email,
      cpf: cpf,
      hotel: employerName,
      job: jobPosition,
      tier: 'BRONZE STAFF',
      verification_status: 'APPROVED',
      role: 'STAFF_GUEST'
    };
  }

  localStorage.setItem('staffstay_user', JSON.stringify(currentUserState));
  renderUserNav();
  closeAuthModal();
  alert("🎉 Cadastro realizado com sucesso! Seus documentos e biometria foram enviados para aprovação.");
}

function logoutUser() {
  currentUserState = null;
  localStorage.removeItem('staffstay_user');
  localStorage.removeItem('staffstay_token');
  renderUserNav();
  alert("Você saiu da sua conta.");
}

/* ==========================================================================
   B2B HOTEL & ALLOTMENT MANAGEMENT MODALS (PAINEL DO HOTEL)
   ========================================================================== */

function openHotelRegistrationModal() {
  const m = document.getElementById("modal-hotel-reg");
  if (m) m.style.display = "flex";
}

function openRoomTypeModal() {
  const m = document.getElementById("modal-room-type");
  if (m) m.style.display = "flex";
}

function openPeriodAllotmentModal() {
  const m = document.getElementById("modal-period-allotment");
  if (m) m.style.display = "flex";
}

function closeB2bModal(modalId) {
  const m = document.getElementById(modalId);
  if (m) m.style.display = "none";
}

async function handleHotelRegSubmit(event) {
  event.preventDefault();
  const tradeName = document.getElementById("b2b-hotel-trade-name")?.value;
  const category = document.getElementById("b2b-hotel-category")?.value;
  const city = document.getElementById("b2b-hotel-city")?.value;
  const stateVal = document.getElementById("b2b-hotel-state")?.value;
  const photo = document.getElementById("b2b-hotel-photo")?.value;

  const newHotel = {
    id: `htl_${Date.now()}`,
    name: tradeName,
    category: category,
    city: city,
    state: stateVal,
    rating: 5.0,
    reviewsCount: 1,
    publicRate: 750.00,
    staffRoomRate: 0.00,
    fixedBookingFee: 149.90,
    maxOccupancy: 3,
    allotmentAvailable: 5,
    allotmentTotal: 5,
    thumb: photo || "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80",
    roomPhotos: [{ url: photo || "https://images.unsplash.com/photo-1618773928121-c32242e63f39?auto=format&fit=crop&w=800&q=80", title: "Quarto Principal" }],
    description: document.getElementById("b2b-hotel-desc")?.value || "Nova propriedade cadastrada.",
    amenities: ["Wifi de Alta Velocidade", "Recepção 24h", "Ar Condicionado"],
    paidServices: [],
    pms: document.getElementById("b2b-hotel-pms")?.value || "MANUAL PANEL"
  };

  state.hotels.unshift(newHotel);
  closeB2bModal("modal-hotel-reg");
  renderHotelsGrid();
  alert(`✅ Hotel "${tradeName}" cadastrado com sucesso e ativado na plataforma!`);
}

async function handleRoomTypeSubmit(event) {
  event.preventDefault();
  const roomName = document.getElementById("b2b-room-name")?.value;
  closeB2bModal("modal-room-type");
  alert(`✅ Categoria de Quarto "${roomName}" adicionada com sucesso!`);
}

async function handlePeriodAllotmentSubmit(event) {
  event.preventDefault();
  const startDate = document.getElementById("b2b-allot-start")?.value;
  const endDate = document.getElementById("b2b-allot-end")?.value;
  const qty = document.getElementById("b2b-allot-qty")?.value;

  closeB2bModal("modal-period-allotment");
  alert(`✅ Allotment de ${qty} quartos/dia aplicado com sucesso para o período de ${startDate} a ${endDate}!`);
}

async function openPmsXmlModal(bookingCode, guestName) {
  const m = document.getElementById("modal-pms-xml");
  const textarea = document.getElementById("pms-xml-textarea");
  if (!m || !textarea) return;

  textarea.value = "Carregando XML no formato E-Solution / Omnibees...";
  m.style.display = "flex";

  try {
    const res = await fetch(`/api/pms/bookings/${bookingCode}/xml`);
    if (res.ok) {
      const xmlText = await res.text();
      textarea.value = xmlText;
    } else {
      textarea.value = generateFallbackPmsXml(bookingCode, guestName);
    }
  } catch {
    textarea.value = generateFallbackPmsXml(bookingCode, guestName);
  }
}

function generateFallbackPmsXml(code, guest) {
  const nowStr = "28/07/2026 12:00:00";
  return `<?xml version="1.0" encoding="utf-8"?>
<Reserva 
  Numero="${code}" 
  Status="CF" 
  CheckIn="03/09/2026 14:00:00" 
  CheckOut="07/09/2026 12:00:00" 
  QuantidadeAdulto="1" 
  QuantidadeCrianca1="0" 
  QuantidadeCrianca2="0" 
  Aconfirmar="${nowStr}" 
  GrupoHospedagem="" 
  TipoUh="1091" 
  ValorTarifa="149,90" 
  ValorCafeManha="0.00" 
  ValorPensao="0.00" 
  SegmentoMercado="13" 
  DataBaseTarifa="${nowStr}" 
  TipoPensao="CF" 
  OrigemReserva="10" 
  GaranteNoShow="S" 
  ReservanteNome="${guest}" 
  EmpresaHospedagem="18271" 
  VoucherEmpresa="${code}" 
  Observacao="Reserva StaffStay Permuta Hoteleira — Voucher Isento de Diárias — ${guest}" 
  ObservacaoIntegracao="Integrado com Sucesso via StaffStay Engine PMS Adapter (E-Solution)" 
  Cidade="279" 
  EmailReservante="hospede@staffstay.com.br" 
  ChannelManager="STAFFSTAY_PMS" 
  OmnibeesPropertyId="9924" 
  OtaId="${code}" 
  ReservationUID="134854405"
>
  <Hospedes>
    <Hospede Id="794105" Nome="${guest}" Principal="S" FaixaEtaria="AD" Incognito="N" />
  </Hospedes>
  <Valores>
    <Valor data="03/09/2026 00:00:00" valorcafemanha="0,00" valortarifa="0,00" valorpensao="0" valoriss="0,00" valortaxa="0,00" />
    <Valor data="04/09/2026 00:00:00" valorcafemanha="0,00" valortarifa="0,00" valorpensao="0" valoriss="0,00" valortaxa="0,00" />
    <Valor data="05/09/2026 00:00:00" valorcafemanha="0,00" valortarifa="0,00" valorpensao="0" valoriss="0,00" valortaxa="0,00" />
    <Valor data="06/09/2026 00:00:00" valorcafemanha="0,00" valortarifa="0,00" valorpensao="0" valoriss="0,00" valortaxa="0,00" />
  </Valores>
  <Pensoes>
    <Pensao Data="2026-09-03" PensaoCafe="S" PDVCafe="10" PDVAlmoco="10" PDVJantar="10" />
    <Pensao Data="2026-09-04" PensaoCafe="S" PDVCafe="10" PDVAlmoco="10" PDVJantar="10" />
    <Pensao Data="2026-09-05" PensaoCafe="S" PDVCafe="10" PDVAlmoco="10" PDVJantar="10" />
    <Pensao Data="2026-09-06" PensaoCafe="S" PDVCafe="10" PDVAlmoco="10" PDVJantar="10" />
  </Pensoes>
  <Requerimentos></Requerimentos>
  <ServicosHotel></ServicosHotel>
</Reserva>`;
}

function copyPmsXmlToClipboard() {
  const textarea = document.getElementById("pms-xml-textarea");
  if (textarea) {
    navigator.clipboard.writeText(textarea.value);
    alert("📋 XML copiado para a área de transferência com sucesso!");
  }
}

function downloadPmsXmlFile() {
  const textarea = document.getElementById("pms-xml-textarea");
  if (textarea) {
    const blob = new Blob([textarea.value], { type: 'application/xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `reserva_esolution_${Date.now()}.xml`;
    a.click();
    URL.revokeObjectURL(url);
  }
}

// Global Initialization
document.addEventListener("DOMContentLoaded", () => {
  renderUserNav();
  renderCurrentScreen();
});

