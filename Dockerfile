# ============================================
# PHANTIA - Dockerfile
# Multi-stage build otimizado para produção
# ============================================

# ============================================
# Stage 1: Dependencies
# ============================================
FROM node:20-alpine AS deps
WORKDIR /app

# Instalar dependências de build
RUN apk add --no-cache libc6-compat

# Copiar apenas arquivos de dependência
COPY package*.json ./

# Instalar apenas dependências de produção
RUN npm ci --only=production && npm cache clean --force

# ============================================
# Stage 2: Builder
# ============================================
FROM node:20-alpine AS builder
WORKDIR /app

# Copiar package files
COPY package*.json ./
COPY tsconfig.json ./

# Instalar todas as dependências (incluindo devDependencies)
RUN npm ci

# Copiar código fonte
COPY src ./src

# Build do TypeScript
RUN npm run build

# ============================================
# Stage 3: Production
# ============================================
FROM node:20-alpine AS production
WORKDIR /app

# Criar usuário não-root para segurança
RUN addgroup -g 1001 -S phantia && \
    adduser -S phantia -u 1001 -G phantia

# Criar diretório de logs
RUN mkdir -p /app/logs && chown -R phantia:phantia /app/logs

# Copiar dependências de produção do stage deps
COPY --from=deps /app/node_modules ./node_modules

# Copiar build do stage builder
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package.json ./

# Definir proprietário
RUN chown -R phantia:phantia /app

# Trocar para usuário não-root
USER phantia

# Variáveis de ambiente padrão
ENV NODE_ENV=production
ENV PORT=3000
ENV LOG_LEVEL=info

# Healthcheck
HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=3 \
  CMD wget -q --spider http://localhost:3000/health || exit 1

# Expor porta
EXPOSE 3000

# Comando de inicialização
CMD ["node", "dist/index.js"]
