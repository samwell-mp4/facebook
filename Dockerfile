# ==============================================================================
# Snack Store BH - Catálogo & Copyboard React/Vite para Easypanel
# Multi-stage build com Node 20 + Nginx Alpine
# ==============================================================================

# Estágio 1: Build do Frontend React / Vite
FROM node:20-alpine AS builder

WORKDIR /app

# Copia dependências
COPY package*.json ./

# Instala dependências
RUN npm ci || npm install

# Copia código fonte
COPY vite.config.js index.html ./
COPY src/ ./src/

# Executa build de produção
RUN npm run build

# Estágio 2: Servidor Nginx ultra-rápido para Produção
FROM nginx:alpine

# Configuração customizada do Nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copia o bundle compilado do React
COPY --from=builder /app/dist /usr/share/nginx/html

# Copia todas as 52 pastas de fotos de perfumes para a raiz web do Nginx
# Preserva os nomes exatos das pastas (ex: "1 - ARABIC A007 FAKHAR PRETO")
COPY . /tmp/source/
RUN cp -rn /tmp/source/[0-9]* /usr/share/nginx/html/ 2>/dev/null || true && \
    rm -rf /tmp/source

# Porta padrão de acesso (Easypanel mapeia a porta 80 automaticamente)
EXPOSE 80

# Inicializa o Nginx
CMD ["nginx", "-g", "daemon off;"]
