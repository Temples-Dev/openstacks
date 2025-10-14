#!/bin/bash

# ShellNexa Environment Files Creation Script
# Automatically creates .env files for all services with database configuration

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Default configuration
DB_HOST=${DB_HOST:-localhost}
DB_PORT=${DB_PORT:-5432}
REDIS_HOST=${REDIS_HOST:-localhost}
REDIS_PORT=${REDIS_PORT:-6379}
ELASTICSEARCH_HOST=${ELASTICSEARCH_HOST:-localhost}
ELASTICSEARCH_PORT=${ELASTICSEARCH_PORT:-9200}

print_header() {
    echo -e "${BLUE}"
    echo "╔══════════════════════════════════════════════════════════════════╗"
    echo "║                ShellNexa Environment Setup                       ║"
    echo "║              Automated .env File Creation                       ║"
    echo "╚══════════════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

create_env_file() {
    local service=$1
    local db_name=$2
    local db_user=$3
    local port=$4
    local description=$5
    
    local env_file="services/$service/.env"
    local env_example="services/$service/.env.example"
    
    # Create .env.example if it doesn't exist
    if [ ! -f "$env_example" ]; then
        cat > "$env_example" << EOF
# $description Environment Configuration
# Copy this file to .env and update values as needed

# Application
NODE_ENV=development
PORT=$port
SERVICE_NAME=$service

# Database Configuration
DB_HOST=$DB_HOST
DB_PORT=$DB_PORT
DB_NAME=$db_name
DB_USERNAME=$db_user
DB_PASSWORD=\${service}_pass
DB_SYNCHRONIZE=true
DB_LOGGING=true

# Redis Configuration
REDIS_HOST=$REDIS_HOST
REDIS_PORT=$REDIS_PORT
REDIS_PASSWORD=

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRES_IN=24h
JWT_REFRESH_EXPIRES_IN=7d

# API Configuration
API_PREFIX=api/v1
API_RATE_LIMIT=100
API_RATE_WINDOW=15

# Logging
LOG_LEVEL=debug
LOG_FORMAT=combined

# CORS Configuration
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001

# Health Check
HEALTH_CHECK_TIMEOUT=5000
HEALTH_CHECK_INTERVAL=30000

EOF
    fi
    
    # Create .env file with actual values
    cat > "$env_file" << EOF
# $description Environment Configuration
# Generated automatically by setup script

# Application
NODE_ENV=development
PORT=$port
SERVICE_NAME=$service

# Database Configuration
DB_HOST=$DB_HOST
DB_PORT=$DB_PORT
DB_NAME=$db_name
DB_USERNAME=$db_user
DB_PASSWORD=${db_user//_user/}_pass
DB_SYNCHRONIZE=true
DB_LOGGING=true

# Redis Configuration
REDIS_HOST=$REDIS_HOST
REDIS_PORT=$REDIS_PORT
REDIS_PASSWORD=

# JWT Configuration
JWT_SECRET=shellnexa-dev-secret-$(date +%s)
JWT_EXPIRES_IN=24h
JWT_REFRESH_EXPIRES_IN=7d

# API Configuration
API_PREFIX=api/v1
API_RATE_LIMIT=100
API_RATE_WINDOW=15

# Logging
LOG_LEVEL=debug
LOG_FORMAT=combined

# CORS Configuration
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001

# Health Check
HEALTH_CHECK_TIMEOUT=5000
HEALTH_CHECK_INTERVAL=30000

EOF

    # Add service-specific configuration
    case $service in
        "api-gateway")
            cat >> "$env_file" << EOF

# Gateway Specific
GATEWAY_TIMEOUT=30000
GATEWAY_RETRIES=3
RATE_LIMIT_GLOBAL=1000
RATE_LIMIT_WINDOW=60

# Service Discovery
AUTH_SERVICE_URL=http://localhost:3002
CATALOG_SERVICE_URL=http://localhost:3003
CIRCULATION_SERVICE_URL=http://localhost:3004
ACQUISITIONS_SERVICE_URL=http://localhost:3005
DISCOVERY_SERVICE_URL=http://localhost:3006
REPORTING_SERVICE_URL=http://localhost:3007
MULTITENANT_SERVICE_URL=http://localhost:3008
ILL_SERVICE_URL=http://localhost:3009
ERESOURCES_SERVICE_URL=http://localhost:3010
REPOSITORY_SERVICE_URL=http://localhost:3011
AIML_SERVICE_URL=http://localhost:3012

EOF
            ;;
        "auth")
            cat >> "$env_file" << EOF

# Authentication Specific
PASSWORD_SALT_ROUNDS=12
SESSION_SECRET=auth-session-secret-$(date +%s)
OAUTH_GOOGLE_CLIENT_ID=
OAUTH_GOOGLE_CLIENT_SECRET=
OAUTH_MICROSOFT_CLIENT_ID=
OAUTH_MICROSOFT_CLIENT_SECRET=
LDAP_URL=
LDAP_BIND_DN=
LDAP_BIND_PASSWORD=

EOF
            ;;
        "discovery")
            cat >> "$env_file" << EOF

# Search & Discovery Specific
ELASTICSEARCH_HOST=$ELASTICSEARCH_HOST
ELASTICSEARCH_PORT=$ELASTICSEARCH_PORT
ELASTICSEARCH_USERNAME=
ELASTICSEARCH_PASSWORD=
SEARCH_INDEX_PREFIX=shellnexa
SEARCH_BATCH_SIZE=1000

EOF
            ;;
        "multi-tenant")
            cat >> "$env_file" << EOF

# Multi-Tenant Specific
DEFAULT_TENANT=default
TENANT_ISOLATION=strict
GEOSPATIAL_ENABLED=true
SUBSCRIPTION_TRACKING=true

EOF
            ;;
        "ill")
            cat >> "$env_file" << EOF

# ILL Specific
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USERNAME=
EMAIL_PASSWORD=
EMAIL_FROM=noreply@shellnexa.com
ISO_ILL_ENABLED=true
OCLC_API_KEY=
OCLC_SECRET=

EOF
            ;;
        "e-resources")
            cat >> "$env_file" << EOF

# E-Resources Specific
COUNTER_REPORTS_PATH=./storage/counter
SUSHI_TIMEOUT=30000
LICENSE_ALERTS_ENABLED=true
USAGE_PROCESSING_BATCH=500

EOF
            ;;
        "digital-repository")
            cat >> "$env_file" << EOF

# Digital Repository Specific
STORAGE_PATH=./storage/repository
THUMBNAIL_PATH=./storage/thumbnails
MAX_FILE_SIZE=100MB
PRESERVATION_ENABLED=true
OAI_PMH_ENABLED=true
DOI_MINTING_ENABLED=false
VIRUS_SCANNING_ENABLED=false

EOF
            ;;
        "ai-ml")
            cat >> "$env_file" << EOF

# AI/ML Specific
ML_SERVICE_URL=http://localhost:8000
TENSORFLOW_BACKEND=cpu
MODEL_STORAGE_PATH=./storage/models
TRAINING_BATCH_SIZE=32
PREDICTION_CACHE_TTL=3600
RECOMMENDATION_COUNT=10

EOF
            ;;
    esac
    
    print_success "Created .env file for $service"
}

main() {
    print_header
    
    # Service configuration
    declare -A SERVICES=(
        ["api-gateway"]="shellnexa_gateway:shellnexa_gateway_user:3001:API Gateway & Routing"
        ["auth"]="shellnexa_auth:shellnexa_auth_user:3002:Authentication & Authorization"
        ["catalog"]="shellnexa_catalog:shellnexa_catalog_user:3003:Library Catalog Management"
        ["circulation"]="shellnexa_circulation:shellnexa_circulation_user:3004:Circulation & Lending"
        ["acquisitions"]="shellnexa_acquisitions:shellnexa_acquisitions_user:3005:Acquisitions & Ordering"
        ["discovery"]="shellnexa_discovery:shellnexa_discovery_user:3006:Search & Discovery"
        ["reporting"]="shellnexa_reporting:shellnexa_reporting_user:3007:Analytics & Reporting"
        ["multi-tenant"]="shellnexa_multitenant:shellnexa_multitenant_user:3008:Multi-Tenant Architecture"
        ["ill"]="shellnexa_ill:shellnexa_ill_user:3009:Interlibrary Loan System"
        ["e-resources"]="shellnexa_eresources:shellnexa_eresources_user:3010:E-Resource Management"
        ["digital-repository"]="shellnexa_repository:shellnexa_repository_user:3011:Digital Repository & Preservation"
        ["ai-ml"]="shellnexa_aiml:shellnexa_aiml_user:3012:AI/ML Engine & Recommendations"
    )
    
    print_info "Creating environment files for all services..."
    echo ""
    
    local created_count=0
    
    for service in "${!SERVICES[@]}"; do
        IFS=':' read -r db_name db_user port description <<< "${SERVICES[$service]}"
        
        # Create service directory if it doesn't exist
        mkdir -p "services/$service"
        
        create_env_file "$service" "$db_name" "$db_user" "$port" "$description"
        created_count=$((created_count + 1))
    done
    
    echo ""
    print_success "Created $created_count environment files"
    
    # Create global .env file
    cat > ".env" << EOF
# ShellNexa Global Environment Configuration

# Environment
NODE_ENV=development

# Database Configuration
DB_HOST=$DB_HOST
DB_PORT=$DB_PORT
DB_USERNAME=postgres
DB_PASSWORD=password

# Redis Configuration
REDIS_HOST=$REDIS_HOST
REDIS_PORT=$REDIS_PORT
REDIS_PASSWORD=

# Elasticsearch Configuration
ELASTICSEARCH_HOST=$ELASTICSEARCH_HOST
ELASTICSEARCH_PORT=$ELASTICSEARCH_PORT
ELASTICSEARCH_USERNAME=
ELASTICSEARCH_PASSWORD=

# Global JWT Secret
GLOBAL_JWT_SECRET=shellnexa-global-secret-$(date +%s)

# Monitoring
HEALTH_CHECK_ENABLED=true
METRICS_ENABLED=true
LOGGING_LEVEL=debug

# Development
HOT_RELOAD=true
DEBUG_MODE=true

EOF
    
    print_success "Created global .env file"
    
    echo ""
    echo "🎯 Next Steps:"
    echo "   1. Review and update .env files as needed"
    echo "   2. Run database setup: ./scripts/setup-databases.sh"
    echo "   3. Start services: pnpm run start:dev"
    echo ""
    echo "📁 Environment Files Created:"
    for service in "${!SERVICES[@]}"; do
        echo "   • services/$service/.env"
    done
    echo "   • .env (global)"
}

main "$@"
