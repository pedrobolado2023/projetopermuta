# ================================================================
# STAFFSTAY BACKEND — Dockerfile
# Node.js 20 Alpine — Multi-stage build otimizado para EasyPanel
# ================================================================

# ── Stage 1: Dependencies ────────────────────────────────────────
FROM node:20-alpine AS deps

# Instala dependências necessárias para bcrypt e pg nativo
RUN apk add --no-cache python3 make g++ libc6-compat

WORKDIR /app

# Copia apenas package.json para cache eficiente de layers
COPY package.json package-lock.json* ./

# Instala apenas dependências de produção
RUN npm ci --only=production && npm cache clean --force


# ── Stage 2: Production Image ─────────────────────────────────────
FROM node:20-alpine AS runner

# Segurança: não rodar como root
RUN addgroup --system --gid 1001 nodejs \
 && adduser  --system --uid 1001 staffstay

WORKDIR /app

# Metadados da imagem
LABEL maintainer="StaffStay Tecnologia da Informação S.A."
LABEL version="1.0.0"
LABEL description="StaffStay / HostPass API Backend"

# Copia node_modules do stage anterior (já limpo e sem devDeps)
COPY --from=deps --chown=staffstay:nodejs /app/node_modules ./node_modules

# Copia código-fonte da aplicação
COPY --chown=staffstay:nodejs src/ ./src/
COPY --chown=staffstay:nodejs package.json ./

# Muda para usuário não-root
USER staffstay

# Porta que o EasyPanel vai mapear
EXPOSE 3000

# Variáveis de ambiente padrão (sobrescritas pelo EasyPanel)
ENV NODE_ENV=production \
    PORT=3000

# Health check para EasyPanel detectar quando o container está pronto
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD wget -qO- http://localhost:3000/api/health || exit 1

# Comando de inicialização
CMD ["node", "src/app.js"]
