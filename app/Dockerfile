# ================================================================
# PLATAFORMA PERMUTA — Frontend Dockerfile
# Serve arquivos estáticos via "serve" (Node.js).
# serve.json desabilita cleanUrls (que quebra .html) e SPA mode.
# Porta 3000 — padrão reconhecido pelo EasyPanel automaticamente.
# ================================================================

FROM node:20-alpine

# Instala o pacote "serve" globalmente
RUN npm install -g serve

WORKDIR /app

# Copia arquivos estáticos e configuração do serve
COPY index.html hotel-panel.html admin-panel.html app.js styles.css serve.json ./

# Porta padrão do EasyPanel
EXPOSE 3000

# Inicia o servidor estático — serve.json controla o comportamento
CMD ["serve", ".", "-l", "3000"]
