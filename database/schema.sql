-- =============================================================================
-- DATABASE SCHEMA DDL - PLATAFORMA DE PERMUTA HOTELEIRA (STAFFSTAY / HOSTPASS)
-- Target Database: PostgreSQL 15+
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- -----------------------------------------------------------------------------
-- ENUMS & TYPES
-- -----------------------------------------------------------------------------
CREATE TYPE user_role AS ENUM ('SUPER_ADMIN', 'GOVERNANCE_AUDITOR', 'HOTEL_ADMIN', 'HOTEL_STAFF', 'STAFF_GUEST');
CREATE TYPE verification_status AS ENUM ('PENDING_DOCS', 'UNDER_ANALYSIS', 'BIOMETRY_FAILED', 'MANUAL_REVIEW', 'APPROVED', 'REJECTED', 'SUSPENDED');
CREATE TYPE hotel_status AS ENUM ('PENDING_ONBOARDING', 'DOCUMENT_ANALYSIS', 'ACTIVE', 'INACTIVE', 'SUSPENDED');
CREATE TYPE booking_status AS ENUM ('HELD_TEMPORARY', 'PENDING_PAYMENT', 'CONFIRMED', 'CHECKED_IN', 'CHECKED_OUT', 'CANCELLED', 'NO_SHOW');
CREATE TYPE payment_status AS ENUM ('PENDING', 'PROCESSING', 'PAID', 'REFUNDED', 'SPLIT_COMPLETED', 'FAILED');
CREATE TYPE payment_method AS ENUM ('PIX', 'CREDIT_CARD', 'HOSTPASS_WALLET', 'HYBRID_PIX_WALLET');
CREATE TYPE pms_provider AS ENUM ('OMNIBEES', 'DESBRAVADOR', 'TOTVS_CMNET', 'CLOUDBEDS', 'ORACLE_OPERA', 'ERBON', 'MANUAL_PANEL');

-- -----------------------------------------------------------------------------
-- TABLE: HOTELS (Hotéis e Propriedades Parceiras)
-- -----------------------------------------------------------------------------
CREATE TABLE hotels (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    corporate_name VARCHAR(255) NOT NULL,
    cnpj VARCHAR(18) NOT NULL UNIQUE,
    trade_name VARCHAR(255) NOT NULL,
    category VARCHAR(50) NOT NULL, -- Hotel, Resort, Pousada, Hostel, Flat
    star_rating INT CHECK (star_rating BETWEEN 1 AND 5),
    description TEXT,
    email VARCHAR(150) NOT NULL,
    phone VARCHAR(30) NOT NULL,
    website VARCHAR(255),
    
    -- Endereço e Geolocalização
    zip_code VARCHAR(20) NOT NULL,
    address_line TEXT NOT NULL,
    neighborhood VARCHAR(100),
    city VARCHAR(100) NOT NULL,
    state VARCHAR(2) NOT NULL,
    country VARCHAR(3) DEFAULT 'BRA',
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    
    -- Gestão e Compliance
    legal_representative_name VARCHAR(150) NOT NULL,
    legal_representative_cpf VARCHAR(14) NOT NULL,
    operating_license_number VARCHAR(100),
    status hotel_status DEFAULT 'PENDING_ONBOARDING',
    pms_type pms_provider DEFAULT 'MANUAL_PANEL',
    pms_api_credentials JSONB DEFAULT '{}',
    
    -- Dados Bancários e Split
    bank_code VARCHAR(10) NOT NULL,
    bank_agency VARCHAR(20) NOT NULL,
    bank_account VARCHAR(30) NOT NULL,
    pix_key VARCHAR(100) NOT NULL,
    gateway_recipient_id VARCHAR(100), -- ID de Split no Gateway
    
    -- Políticas Hoteleiras
    check_in_time TIME DEFAULT '14:00:00',
    check_out_time TIME DEFAULT '12:00:00',
    cancellation_policy_days INT DEFAULT 7,
    amenities JSONB DEFAULT '[]', -- Wifi, Pool, Gym, Parking, Breakfast
    photos JSONB DEFAULT '[]',
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- -----------------------------------------------------------------------------
-- TABLE: ROOM_TYPES (Categorias de Acomodação)
-- -----------------------------------------------------------------------------
CREATE TABLE room_types (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hotel_id UUID NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
    name VARCHAR(150) NOT NULL, -- ex: Standard Casal, Deluxe Vista Mar
    description TEXT,
    max_occupancy INT NOT NULL DEFAULT 2,
    max_adults INT NOT NULL DEFAULT 2,
    max_children INT NOT NULL DEFAULT 1,
    base_marginal_cost DECIMAL(10,2) NOT NULL, -- Custo limpo de governança + lavanderia
    suggested_staff_rate DECIMAL(10,2) NOT NULL, -- Preço praticado no canal privado
    photos JSONB DEFAULT '[]',
    amenities JSONB DEFAULT '[]',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- -----------------------------------------------------------------------------
-- TABLE: ALLOTMENTS (Gestão Diária de Inventário e Tarifas)
-- -----------------------------------------------------------------------------
CREATE TABLE allotments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    room_type_id UUID NOT NULL REFERENCES room_types(id) ON DELETE CASCADE,
    hotel_id UUID NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
    allotment_date DATE NOT NULL,
    quantity_available INT NOT NULL DEFAULT 0,
    quantity_sold INT NOT NULL DEFAULT 0,
    quantity_held INT NOT NULL DEFAULT 0, -- Reservas em andamento no checkout
    nightly_rate DECIMAL(10,2) NOT NULL,
    min_stay_nights INT DEFAULT 1,
    max_stay_nights INT DEFAULT 7,
    is_blackout BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_room_date UNIQUE (room_type_id, allotment_date)
);

-- -----------------------------------------------------------------------------
-- TABLE: USERS (Usuários e Funcionários Hoteleiros Validados)
-- -----------------------------------------------------------------------------
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    full_name VARCHAR(255) NOT NULL,
    cpf VARCHAR(14) NOT NULL UNIQUE,
    email VARCHAR(150) NOT NULL UNIQUE,
    corporate_email VARCHAR(150),
    phone VARCHAR(30) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role user_role DEFAULT 'STAFF_GUEST',
    
    -- Vínculo Empregatício Hoteleiro
    employer_hotel_name VARCHAR(255) NOT NULL,
    employer_hotel_id UUID REFERENCES hotels(id) ON DELETE SET NULL,
    job_position VARCHAR(100) NOT NULL, -- Recepcionista, Governança, Gerente, etc.
    employment_start_date DATE,
    employee_badge_id VARCHAR(50),
    
    -- Estado de Verificação & Biometria
    verification_status verification_status DEFAULT 'PENDING_DOCS',
    biometric_hash VARCHAR(255),
    liveness_verification_score DECIMAL(5,2),
    
    -- Gamificação & Carteira Digital
    gamification_tier VARCHAR(20) DEFAULT 'BRONZE', -- BRONZE, SILVER, GOLD, PLATINUM
    experience_points INT DEFAULT 0,
    wallet_balance DECIMAL(10,2) DEFAULT 0.00,
    referral_code VARCHAR(20) UNIQUE NOT NULL,
    referred_by_user_id UUID REFERENCES users(id),
    
    is_active BOOLEAN DEFAULT TRUE,
    last_login_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- -----------------------------------------------------------------------------
-- TABLE: USER_VERIFICATIONS (Logs e Auditoria de BI / OCR / Prova de Vida)
-- -----------------------------------------------------------------------------
CREATE TABLE user_verifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    document_type VARCHAR(20) NOT NULL, -- RG, CNH, PASSPORT
    document_front_s3_path TEXT NOT NULL,
    document_back_s3_path TEXT NOT NULL,
    selfie_s3_path TEXT NOT NULL,
    employment_proof_s3_path TEXT NOT NULL,
    
    ocr_extracted_data JSONB DEFAULT '{}',
    facial_match_score DECIMAL(5,2),
    liveness_status BOOLEAN DEFAULT FALSE,
    rejection_reason TEXT,
    analyzed_by_admin_id UUID REFERENCES users(id),
    analyzed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- -----------------------------------------------------------------------------
-- TABLE: BOOKINGS (Reservas de Hospedagem)
-- -----------------------------------------------------------------------------
CREATE TABLE bookings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    reservation_code VARCHAR(20) NOT NULL UNIQUE,
    user_id UUID NOT NULL REFERENCES users(id),
    hotel_id UUID NOT NULL REFERENCES hotels(id),
    room_type_id UUID NOT NULL REFERENCES room_types(id),
    
    check_in_date DATE NOT NULL,
    check_out_date DATE NOT NULL,
    total_nights INT NOT NULL,
    number_of_guests INT NOT NULL DEFAULT 1,
    guest_names JSONB DEFAULT '[]',
    
    -- Valores Financeiros
    nightly_room_rate DECIMAL(10,2) NOT NULL,
    total_room_amount DECIMAL(10,2) NOT NULL,
    total_addons_amount DECIMAL(10,2) DEFAULT 0.00,
    service_fee_amount DECIMAL(10,2) NOT NULL, -- Taxa da Plataforma
    insurance_fee_amount DECIMAL(10,2) DEFAULT 0.00,
    wallet_cashback_used DECIMAL(10,2) DEFAULT 0.00,
    grand_total_amount DECIMAL(10,2) NOT NULL,
    
    -- Split Financeiro
    hotel_split_amount DECIMAL(10,2) NOT NULL,
    platform_split_amount DECIMAL(10,2) NOT NULL,
    
    -- Voucher e Status
    status booking_status DEFAULT 'HELD_TEMPORARY',
    qr_code_signature TEXT NOT NULL,
    checked_in_at TIMESTAMP WITH TIME ZONE,
    checked_out_at TIMESTAMP WITH TIME ZONE,
    cancellation_reason TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- -----------------------------------------------------------------------------
-- TABLE: BOOKING_ADDONS (Serviços Extras Reservados)
-- -----------------------------------------------------------------------------
CREATE TABLE booking_addons (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
    addon_name VARCHAR(100) NOT NULL, -- Café da Manhã, Spa, Estacionamento
    unit_price DECIMAL(10,2) NOT NULL,
    quantity INT NOT NULL DEFAULT 1,
    total_price DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- -----------------------------------------------------------------------------
-- TABLE: PAYMENTS (Transações Financeiras e Split)
-- -----------------------------------------------------------------------------
CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
    gateway_transaction_id VARCHAR(100) NOT NULL,
    payment_method payment_method NOT NULL,
    status payment_status DEFAULT 'PENDING',
    amount DECIMAL(10,2) NOT NULL,
    pix_qr_code_payload TEXT,
    pix_expiration_time TIMESTAMP WITH TIME ZONE,
    split_details JSONB DEFAULT '{}',
    paid_at TIMESTAMP WITH TIME ZONE,
    refunded_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- -----------------------------------------------------------------------------
-- TABLE: REVIEWS (Avaliações dos Hotéis por Hóspedes Staff)
-- -----------------------------------------------------------------------------
CREATE TABLE reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    booking_id UUID NOT NULL REFERENCES bookings(id),
    user_id UUID NOT NULL REFERENCES users(id),
    hotel_id UUID NOT NULL REFERENCES hotels(id),
    rating_cleanliness INT CHECK (rating_cleanliness BETWEEN 1 AND 5),
    rating_service INT CHECK (rating_service BETWEEN 1 AND 5),
    rating_comfort INT CHECK (rating_comfort BETWEEN 1 AND 5),
    rating_overall INT CHECK (rating_overall BETWEEN 1 AND 5),
    comment TEXT,
    photos JSONB DEFAULT '[]',
    is_published BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- -----------------------------------------------------------------------------
-- TABLE: AUDIT_LOGS (Trilha de Auditoria e Governança LGPD)
-- -----------------------------------------------------------------------------
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    hotel_id UUID REFERENCES hotels(id),
    ip_address VARCHAR(45) NOT NULL,
    user_agent TEXT,
    action VARCHAR(100) NOT NULL,
    entity_name VARCHAR(50) NOT NULL,
    entity_id VARCHAR(100) NOT NULL,
    old_value JSONB,
    new_value JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- -----------------------------------------------------------------------------
-- INDEXES DE ALTA PERFORMANCE
-- -----------------------------------------------------------------------------
CREATE INDEX idx_hotels_city_state ON hotels(city, state) WHERE status = 'ACTIVE';
CREATE INDEX idx_hotels_cnpj ON hotels(cnpj);
CREATE INDEX idx_allotments_room_date ON allotments(room_type_id, allotment_date);
CREATE INDEX idx_allotments_search ON allotments(hotel_id, allotment_date, quantity_available) WHERE is_blackout = FALSE;
CREATE INDEX idx_users_cpf ON users(cpf);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_verification ON users(verification_status);
CREATE INDEX idx_bookings_user ON bookings(user_id);
CREATE INDEX idx_bookings_hotel ON bookings(hotel_id);
CREATE INDEX idx_bookings_status ON bookings(status);
CREATE INDEX idx_bookings_code ON bookings(reservation_code);

-- -----------------------------------------------------------------------------
-- TRIGGERS E PROCEDURES DE NEGÓCIO
-- -----------------------------------------------------------------------------

-- Trigger para atualizar timestamp `updated_at`
CREATE OR REPLACE FUNCTION update_timestamp_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = CURRENT_TIMESTAMP;
   RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER trg_update_hotels_timestamp BEFORE UPDATE ON hotels FOR EACH ROW EXECUTE PROCEDURE update_timestamp_column();
CREATE TRIGGER trg_update_users_timestamp BEFORE UPDATE ON users FOR EACH ROW EXECUTE PROCEDURE update_timestamp_column();
CREATE TRIGGER trg_update_bookings_timestamp BEFORE UPDATE ON bookings FOR EACH ROW EXECUTE PROCEDURE update_timestamp_column();
CREATE TRIGGER trg_update_allotments_timestamp BEFORE UPDATE ON allotments FOR EACH ROW EXECUTE PROCEDURE update_timestamp_column();

-- -----------------------------------------------------------------------------
-- TABLE: REFRESH_TOKENS (Controle de Sessões e Rotação de JWT)
-- Permite invalidação de sessões específicas sem afetar outras sessões do mesmo usuário.
-- -----------------------------------------------------------------------------
CREATE TABLE refresh_tokens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token TEXT NOT NULL UNIQUE,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    revoked_at TIMESTAMP WITH TIME ZONE, -- NULL = ainda válido
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Índice para lookup rápido do token (usado no /refresh endpoint)
CREATE INDEX idx_refresh_tokens_token ON refresh_tokens(token) WHERE revoked_at IS NULL;
-- Índice para limpeza de tokens expirados (job noturno)
CREATE INDEX idx_refresh_tokens_expires ON refresh_tokens(expires_at);

-- -----------------------------------------------------------------------------
-- VIEW: v_hotels_with_allotment (Consulta otimizada para listagem de hotéis)
-- Agrega disponibilidade em tempo real sem JOINs repetidos no código.
-- -----------------------------------------------------------------------------
CREATE OR REPLACE VIEW v_hotels_with_allotment AS
SELECT
    h.id,
    h.trade_name,
    h.category,
    h.star_rating,
    h.city,
    h.state,
    h.description,
    h.amenities,
    h.photos,
    h.pms_type,
    h.check_in_time,
    h.check_out_time,
    COALESCE(SUM(a.quantity_available), 0) AS total_allotment_available,
    COALESCE(
        (SELECT ROUND(AVG(r.rating_overall::numeric), 1) 
         FROM reviews r 
         WHERE r.hotel_id = h.id AND r.is_published = TRUE), 
        0
    ) AS avg_rating,
    (
        SELECT COUNT(*) FROM reviews r 
        WHERE r.hotel_id = h.id AND r.is_published = TRUE
    ) AS review_count,
    (
        SELECT MIN(rt2.suggested_staff_rate) 
        FROM room_types rt2 
        WHERE rt2.hotel_id = h.id AND rt2.is_active = TRUE
    ) AS min_staff_rate
FROM hotels h
LEFT JOIN allotments a ON a.hotel_id = h.id
    AND a.is_blackout = FALSE
    AND a.allotment_date >= CURRENT_DATE
    AND a.allotment_date <= CURRENT_DATE + INTERVAL '90 days'
LEFT JOIN room_types rt ON a.room_type_id = rt.id AND rt.is_active = TRUE
WHERE h.status = 'ACTIVE'
GROUP BY h.id;

-- =============================================================================
-- SEED DE DADOS INICIAIS DE DEMONSTRAÇÃO
-- =============================================================================

INSERT INTO hotels (id, corporate_name, cnpj, trade_name, category, star_rating, description, email, phone, zip_code, address_line, city, state, legal_representative_name, legal_representative_cpf, status, pms_type, bank_code, bank_agency, bank_account, pix_key)
VALUES 
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Grand Palace Resort & Spa Ltda', '12.345.678/0001-90', 'Grand Palace Resort Búzios', 'Resort', 5, 'Resort pé na areia com 5 piscinas, spa completo e gastronomia internacional.', 'contato@grandpalace.com.br', '(22) 2623-9000', '28950-000', 'Av. José Bento Ribeiro Dantas, 1000', 'Armação dos Búzios', 'RJ', 'Carlos Alberto Silva', '111.222.333-44', 'ACTIVE', 'OMNIBEES', '341', '0001', '12345-6', 'financeiro@grandpalace.com.br'),

('b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'Pousada Boutique Villa do Sol Ltda', '98.765.432/0001-10', 'Villa do Sol Boutique Hotel', 'Pousada', 4, 'Pousada charmosa no coração de Gramado com lareira e café da manhã colonial.', 'reserva@villadosol.com.br', '(54) 3286-5000', '95670-000', 'Rua das Hortênsias, 500', 'Gramado', 'RS', 'Fernanda Oliveira', '555.666.777-88', 'ACTIVE', 'DESBRAVADOR', '001', '1234', '98765-4', 'financeiro@villadosol.com.br');
