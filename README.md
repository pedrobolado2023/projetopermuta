# StaffStay | Plataforma de Permuta Hoteleira

> Canal privado de distribuição de inventário hoteleiro para profissionais do setor.

## 🏨 Sobre o Projeto

A **StaffStay / HostPass** é uma plataforma B2B2C que conecta quartos ociosos de hotéis parceiros a funcionários verificados da indústria hoteleira, com diárias 100% isentas e taxa única de reserva.

## 🏗️ Arquitetura

```
├── app/          → Frontend HTML/CSS/JS (PWA)
├── backend/      → API Node.js + Express (REST)
├── database/     → Schema PostgreSQL
├── docs/         → Documentação de negócio e arquitetura
└── docker-compose.yml
```

## 🔒 Stack de Segurança

- **Helmet** — HTTP security headers (CSP, HSTS, X-Frame-Options)
- **JWT** — Access Token (15min) + Refresh Token (7d) com rotação
- **bcryptjs** — Hash de senhas (cost 12)
- **Rate Limiting** — Anti-DDoS e anti brute-force por IP
- **RBAC** — 5 níveis de acesso (SUPER_ADMIN → STAFF_GUEST)
- **ACID Transactions** — Lock otimista anti-overbooking no PostgreSQL
- **Audit Logs** — Trilha imutável de todas as ações críticas

## 🚀 Deploy (EasyPanel)

### Pré-requisitos
- PostgreSQL criado no EasyPanel (banco: `postpermuta`)
- Serviço Node.js/Dockerfile apontando para `backend/`

### Variáveis de Ambiente obrigatórias

```env
DATABASE_URL=postgres://postpermuta:<PASSWORD>@dados_postpermuta:5432/postpermuta?sslmode=disable
JWT_SECRET=<string-aleatoria-64-bytes>
JWT_REFRESH_SECRET=<outra-string-aleatoria-64-bytes>
NODE_ENV=production
PORT=3000
BCRYPT_ROUNDS=12
CORS_ORIGIN=https://seu-dominio.com
```

### Setup do banco

```bash
psql "$DATABASE_URL" -f database/schema.sql
```

### Health Check

```
GET /api/health → 200 OK
```

## 📡 Endpoints da API

| Método | Rota | Auth | Descrição |
|--------|------|------|-----------|
| GET | `/api/health` | — | Health check |
| POST | `/api/auth/register` | — | Cadastro |
| POST | `/api/auth/login` | — | Login + JWT |
| POST | `/api/auth/refresh` | — | Renovar token |
| GET | `/api/hotels` | — | Listar hotéis |
| GET | `/api/hotels/:id` | — | Detalhe hotel |
| POST | `/api/bookings` | ✅ | Criar reserva |
| GET | `/api/bookings/my` | ✅ | Minhas reservas |
| GET | `/api/admin/dashboard` | ✅ ADMIN | KPIs |

## 🛠️ Desenvolvimento Local

```bash
# 1. Configure as variáveis
cp backend/.env.example backend/.env
# edite backend/.env com suas configs

# 2. Suba com Docker Compose
docker-compose up

# API:      http://localhost:3000
# Frontend: http://localhost:5500
```

## 📄 Licença

Proprietário — StaffStay Tecnologia da Informação S.A. © 2026
