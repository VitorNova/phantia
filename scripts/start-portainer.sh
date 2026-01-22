#!/bin/bash
# ============================================
# PHANTIA - Script para iniciar Portainer
# ============================================

set -e

# Cores
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }

# Diretório do projeto
PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$PROJECT_DIR"

echo ""
echo "============================================"
echo "  PHANTIA - Portainer Setup"
echo "============================================"
echo ""

# Verificar se rede existe
log_info "Verificando rede Docker..."
docker network inspect phantia-network >/dev/null 2>&1 || {
    log_info "Criando rede phantia-network..."
    docker network create phantia-network
}

# Iniciar Portainer
log_info "Iniciando Portainer..."
docker compose -f docker-compose.portainer.yml up -d

log_success "Portainer iniciado!"
echo ""
echo "============================================"
echo "  PORTAINER DISPONÍVEL"
echo "============================================"
echo ""
echo "Acesse:"
echo "  - HTTPS: https://localhost:9443"
echo "  - HTTP:  http://localhost:9000"
echo ""
echo "Na primeira vez:"
echo "  1. Crie um usuário admin"
echo "  2. Defina uma senha forte (mínimo 12 caracteres)"
echo "  3. Selecione 'Get Started' para ambiente local"
echo ""
