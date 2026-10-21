# ==============================================================================
# Snack Store BH - Catálogo, Vendas & PostgreSQL Backend para Easypanel
# Multi-stage build com Node 20
# ==============================================================================

# Estágio 1: Build do Frontend React / Vite
FROM node:20-alpine AS builder

WORKDIR /app

# Copia dependências
COPY package*.json ./
RUN npm ci || npm install

# Copia código fonte
COPY vite.config.js index.html ./
COPY src/ ./src/
COPY public/ ./public/

# Executa build de produção do frontend
RUN npm run build

# Estágio 2: Servidor Node.js de Produção com Conexão ao PostgreSQL
FROM node:20-alpine

WORKDIR /app
ENV NODE_ENV=production
ENV PORT=80

# Instala dependências de produção
COPY package*.json ./
RUN npm ci --omit=dev || npm install --omit=dev

# Copia o bundle compilado do frontend
COPY --from=builder /app/dist ./dist

# Copia código do servidor e dados iniciais
COPY server/ ./server/
COPY src/data/ ./src/data/
COPY catalogo-story/ ./catalogo-story/
COPY template_pdf/ ./template_pdf/

# Copia todas as 52 pastas de fotos dos perfumes para a raiz da aplicação
COPY . /tmp/source/
RUN cp -rn /tmp/source/[0-9]* /app/ 2>/dev/null || true && \
    rm -rf /tmp/source

# Porta padrão de acesso (Easypanel mapeia a porta 80 automaticamente)
EXPOSE 80

# Inicializa o servidor com auto-conexão e migração no PostgreSQL
CMD ["node", "server/index.js"]
