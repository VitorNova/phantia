#!/bin/bash
# ============================================
# PHANTIA - Script de Deploy
# ============================================

set -e  # Sair em caso de erro

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Diretório do projeto
PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$PROJECT_DIR"

# Funções de log
log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
log_warning() { echo -e "${YELLOW}[WARNING]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# Header
echo ""
echo "============================================"
echo "  PHANTIA - Deploy Script"
echo "============================================"
echo ""

# Verificar .env
if [ ! -f ".env" ]; then
    log_error "Arquivo .env não encontrado!"
    log_info "Copie .env.example para .env e configure as variáveis"
    exit 1
fi

# Carregar variáveis
source .env

# Verificar variáveis obrigatórias
check_var() {
    if [ -z "${!1}" ]; then
        log_error "Variável $1 não definida no .env"
        exit 1
    fi
}

log_info "Verificando variáveis de ambiente..."
check_var "REDIS_PASSWORD"
check_var "SUPABASE_URL"
check_var "ANTHROPIC_API_KEY"
log_success "Variáveis OK"

# Criar rede se não existir
log_info "Verificando rede Docker..."
docker network inspect phantia-network >/dev/null 2>&1 || {
    log_info "Criando rede phantia-network..."
    docker network create phantia-network
}
log_success "Rede OK"

# Build da imagem (se solicitado)
if [ "$1" == "--build" ] || [ "$1" == "-b" ]; then
    log_info "Fazendo build da imagem..."
    docker compose build --no-cache
    log_success "Build concluído"
fi

# Parar containers antigos
log_info "Parando containers existentes..."
docker compose down --remove-orphans 2>/dev/null || true
log_success "Containers parados"

# Subir novos containers
log_info "Iniciando containers..."
docker compose up -d

# Aguardar healthchecks
log_info "Aguardando serviços ficarem healthy..."
sleep 10

# Verificar status
log_info "Verificando status dos serviços..."
echo ""
docker compose ps
echo ""

# Testar endpoints
log_info "Testando endpoints..."

# Redis
if docker exec phantia-redis redis-cli -a "$REDIS_PASSWORD" ping 2>/dev/null | grep -q "PONG"; then
    log_success "Redis: OK"
else
    log_warning "Redis: Verificar logs"
fi

# Backend health
if curl -sf http://localhost:${PORT:-3000}/health > /dev/null 2>&1; then
    log_success "Backend: OK"
else
    log_warning "Backend: Verificar logs (pode ainda estar iniciando)"
fi

echo ""
echo "============================================"
echo "  DEPLOY CONCLUÍDO!"
echo "============================================"
echo ""
echo "Endpoints:"
echo "  - Backend:   http://localhost:${PORT:-3000}"
echo "  - Health:    http://localhost:${PORT:-3000}/health"
echo ""
echo "Comandos úteis:"
echo "  - Ver logs:     docker compose logs -f"
echo "  - Ver status:   docker compose ps"
echo "  - Reiniciar:    docker compose restart"
echo "  - Parar:        docker compose down"
echo ""
