# ================================================================
# PLATAFORMA PERMUTA — Frontend Dockerfile
# Serve os arquivos estáticos da pasta app/ via Nginx Alpine.
# Usado como serviço separado no EasyPanel.
# ================================================================

FROM nginx:1.27-alpine

# Remove a config padrão do Nginx
RUN rm /etc/nginx/conf.d/default.conf

# Copia nossa config customizada
COPY nginx.conf /etc/nginx/conf.d/app.conf

# Copia os arquivos estáticos do frontend
COPY index.html hotel-panel.html admin-panel.html app.js styles.css /usr/share/nginx/html/

# Porta padrão do Nginx
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://localhost:80/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
