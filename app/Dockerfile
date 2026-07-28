# ================================================================
# PLATAFORMA PERMUTA — Frontend Dockerfile
# Serve arquivos estáticos via "serve" (Node.js).
# Node.js é consistente com o setup do backend no EasyPanel.
# Porta 3000 — padrão reconhecido pelo EasyPanel automaticamente.
# ================================================================

FROM node:20-alpine

# Instala o pacote "serve" globalmente
RUN npm install -g serve

WORKDIR /app

# Copia todos os arquivos estáticos do frontend
COPY index.html hotel-panel.html admin-panel.html app.js styles.css ./

# Porta padrão do EasyPanel
EXPOSE 3000

# Inicia o servidor estático na porta 3000
CMD ["serve", "-s", ".", "-l", "3000"]
