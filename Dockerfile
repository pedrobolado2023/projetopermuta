# ================================================================
# PLATAFORMA PERMUTA — Dockerfile (raiz do repositório)
# Usado pelo EasyPanel via GitHub.
# Multi-stage: deps → runner (sem devDependencies, sem root)
# As variáveis de ambiente (JWT_SECRET, DATABASE_URL, etc.) são
# injetadas APENAS em tempo de execução pelo EasyPanel "Environment",
# nunca expostas como ARG/ENV no build — evita os warnings de segurança.
# ================================================================

# ── Stage 1: instala dependências de produção ─────────────────────
FROM node:20-alpine AS deps

# Ferramentas nativas necessárias para bcrypt, pg, etc.
RUN apk add --no-cache python3 make g++ libc6-compat

WORKDIR /app

# Copia apenas os manifestos para cache eficiente de layers
COPY backend/package.json backend/package-lock.json* ./

# Instala somente deps de produção
RUN npm ci --omit=dev && npm cache clean --force


# ── Stage 2: imagem de produção enxuta ───────────────────────────
FROM node:20-alpine AS runner

# Segurança: executa como usuário não-root
RUN addgroup --system --gid 1001 nodejs \
 && adduser  --system --uid 1001 appuser

WORKDIR /app

# Metadados
LABEL org.opencontainers.image.title="Plataforma Permuta API"
LABEL org.opencontainers.image.description="Backend Node.js — StaffStay / HostPass"
LABEL org.opencontainers.image.version="1.0.0"

# Copia node_modules já instalados e limpos do stage anterior
COPY --from=deps --chown=appuser:nodejs /app/node_modules ./node_modules

# Copia apenas o código-fonte do backend
COPY --chown=appuser:nodejs backend/src/ ./src/
COPY --chown=appuser:nodejs backend/package.json ./

# Executa como não-root
USER appuser

# Porta exposta (mapeada pelo EasyPanel)
EXPOSE 3000

# Variáveis padrão não-sensíveis; os secrets são injetados pelo EasyPanel
ENV NODE_ENV=production \
    PORT=3000

# Health check — EasyPanel aguarda este endpoint antes de rotear tráfego
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD wget -qO- http://localhost:3000/api/health || exit 1

# Ponto de entrada
CMD ["node", "src/app.js"]
