# ================================================================
# PLATAFORMA PERMUTA — Frontend Dockerfile
# Serve os arquivos estáticos da pasta app/ via Nginx Alpine.
# Nginx escuta na porta 3000 (padrão do EasyPanel — sem config manual).
# ================================================================

FROM nginx:1.27-alpine

# Remove a config padrão do Nginx
RUN rm /etc/nginx/conf.d/default.conf

# Copia nossa config customizada
COPY nginx.conf /etc/nginx/conf.d/app.conf

# Copia os arquivos estáticos do frontend
COPY index.html hotel-panel.html admin-panel.html app.js styles.css /usr/share/nginx/html/

# Porta 3000 — padrão do EasyPanel (evita configurar Port manualmente)
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://localhost:3000/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
