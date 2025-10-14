#!/bin/bash

# ShellNexa Docker Database Setup Script
# Manages Docker-based database infrastructure

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
COMPOSE_FILE="docker/docker-compose.databases.yml"
ENV_FILE=".env"

print_header() {
    echo -e "${BLUE}"
    echo "╔══════════════════════════════════════════════════════════════════╗"
    echo "║                ShellNexa Docker Database Manager                 ║"
    echo "║                   Container-based Infrastructure                 ║"
    echo "╚══════════════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_section() {
    echo -e "\n${YELLOW}▶ $1${NC}"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
}

check_requirements() {
    print_section "Checking Requirements"
    
    # Check Docker
    if ! command -v docker &> /dev/null; then
        print_error "Docker is not installed"
        echo "Please install Docker: https://docs.docker.com/get-docker/"
        exit 1
    fi
    print_success "Docker is installed"
    
    # Check Docker Compose
    if ! docker compose version &> /dev/null; then
        print_error "Docker Compose is not available"
        echo "Please install Docker Compose: https://docs.docker.com/compose/install/"
        exit 1
    fi
    print_success "Docker Compose is available"
    
    # Check if Docker daemon is running
    if ! docker info &> /dev/null; then
        print_error "Docker daemon is not running"
        echo "Please start Docker daemon"
        exit 1
    fi
    print_success "Docker daemon is running"
}

create_env_file() {
    print_section "Creating Environment Configuration"
    
    if [ ! -f "$ENV_FILE" ]; then
        cat > "$ENV_FILE" << EOF
# ShellNexa Docker Database Configuration

# Database Settings
DB_PASSWORD=shellnexa_secure_password_2024
DB_PORT=5432

# Redis Settings
REDIS_PORT=6379

# Elasticsearch Settings
ELASTICSEARCH_PORT=9200

# Kibana Settings
KIBANA_PORT=5601

# MailHog Settings
MAILHOG_SMTP_PORT=1025
MAILHOG_WEB_PORT=8025

# Docker Settings
COMPOSE_PROJECT_NAME=shellnexa
EOF
        print_success "Created $ENV_FILE"
    else
        print_info "$ENV_FILE already exists"
    fi
}

start_services() {
    print_section "Starting Database Services"
    
    print_info "Starting PostgreSQL, Redis, Elasticsearch, and supporting services..."
    
    if docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" up -d; then
        print_success "Database services started successfully"
    else
        print_error "Failed to start database services"
        exit 1
    fi
}

stop_services() {
    print_section "Stopping Database Services"
    
    if docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" down; then
        print_success "Database services stopped successfully"
    else
        print_error "Failed to stop database services"
        exit 1
    fi
}

restart_services() {
    print_section "Restarting Database Services"
    
    stop_services
    start_services
}

show_status() {
    print_section "Service Status"
    
    docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" ps
}

show_logs() {
    local service=${1:-}
    
    if [ -n "$service" ]; then
        print_section "Logs for $service"
        docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" logs -f "$service"
    else
        print_section "All Service Logs"
        docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" logs -f
    fi
}

cleanup() {
    print_section "Cleaning Up"
    
    print_warning "This will remove all containers and volumes. Data will be lost!"
    read -p "Are you sure? (y/N): " -n 1 -r
    echo
    
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        if docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" down -v --remove-orphans; then
            print_success "Cleanup completed"
        else
            print_error "Cleanup failed"
            exit 1
        fi
    else
        print_info "Cleanup cancelled"
    fi
}

wait_for_services() {
    print_section "Waiting for Services to be Ready"
    
    local max_attempts=30
    local attempt=0
    
    # Wait for PostgreSQL
    print_info "Waiting for PostgreSQL..."
    while [ $attempt -lt $max_attempts ]; do
        if docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" exec -T postgres pg_isready -U postgres &> /dev/null; then
            print_success "PostgreSQL is ready"
            break
        fi
        attempt=$((attempt + 1))
        sleep 2
    done
    
    if [ $attempt -eq $max_attempts ]; then
        print_error "PostgreSQL failed to start within timeout"
        exit 1
    fi
    
    # Wait for Redis
    print_info "Waiting for Redis..."
    attempt=0
    while [ $attempt -lt $max_attempts ]; do
        if docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" exec -T redis redis-cli ping &> /dev/null; then
            print_success "Redis is ready"
            break
        fi
        attempt=$((attempt + 1))
        sleep 2
    done
    
    if [ $attempt -eq $max_attempts ]; then
        print_error "Redis failed to start within timeout"
        exit 1
    fi
    
    # Wait for Elasticsearch
    print_info "Waiting for Elasticsearch..."
    attempt=0
    while [ $attempt -lt $max_attempts ]; do
        if curl -s http://localhost:9200/_cluster/health &> /dev/null; then
            print_success "Elasticsearch is ready"
            break
        fi
        attempt=$((attempt + 1))
        sleep 2
    done
    
    if [ $attempt -eq $max_attempts ]; then
        print_warning "Elasticsearch may not be ready yet"
    fi
}

show_connection_info() {
    print_section "Connection Information"
    
    echo "📊 Database Services:"
    echo "   • PostgreSQL: localhost:5432"
    echo "     - Admin: postgres / shellnexa_secure_password_2024"
    echo "     - 12 service databases created automatically"
    echo ""
    echo "   • Redis: localhost:6379"
    echo "     - No password (development mode)"
    echo ""
    echo "   • Elasticsearch: localhost:9200"
    echo "     - No authentication (development mode)"
    echo ""
    echo "   • Kibana: http://localhost:5601"
    echo "     - Web interface for Elasticsearch"
    echo ""
    echo "   • MailHog: http://localhost:8025"
    echo "     - Email testing interface"
    echo "     - SMTP: localhost:1025"
    echo ""
    echo "🔗 Service URLs:"
    echo "   • Health Check: curl http://localhost:5432"
    echo "   • Redis Check: redis-cli -h localhost ping"
    echo "   • ES Check: curl http://localhost:9200/_cluster/health"
}

setup_databases() {
    print_section "Setting Up Service Databases"
    
    print_info "Running database initialization script..."
    
    # Wait for PostgreSQL to be ready
    wait_for_services
    
    # Run the database setup script
    if docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" exec postgres /scripts/setup-all-databases.sh; then
        print_success "All service databases created successfully"
    else
        print_error "Database setup failed"
        exit 1
    fi
}

show_help() {
    echo "ShellNexa Docker Database Manager"
    echo ""
    echo "Usage: $0 [command]"
    echo ""
    echo "Commands:"
    echo "  start       Start all database services"
    echo "  stop        Stop all database services"
    echo "  restart     Restart all database services"
    echo "  status      Show service status"
    echo "  logs [svc]  Show logs (optionally for specific service)"
    echo "  setup       Setup databases (run after first start)"
    echo "  cleanup     Remove all containers and volumes"
    echo "  info        Show connection information"
    echo "  help        Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 start              # Start all services"
    echo "  $0 logs postgres      # Show PostgreSQL logs"
    echo "  $0 setup              # Create all databases"
    echo ""
    echo "Services: postgres, redis, elasticsearch, kibana, mailhog"
}

main() {
    local command=${1:-help}
    
    case $command in
        start)
            print_header
            check_requirements
            create_env_file
            start_services
            wait_for_services
            show_connection_info
            echo ""
            print_info "Run '$0 setup' to create all service databases"
            ;;
        stop)
            print_header
            stop_services
            ;;
        restart)
            print_header
            restart_services
            wait_for_services
            ;;
        status)
            print_header
            show_status
            ;;
        logs)
            show_logs "$2"
            ;;
        setup)
            print_header
            setup_databases
            show_connection_info
            ;;
        cleanup)
            print_header
            cleanup
            ;;
        info)
            print_header
            show_connection_info
            ;;
        help|--help|-h)
            show_help
            ;;
        *)
            print_error "Unknown command: $command"
            echo ""
            show_help
            exit 1
            ;;
    esac
}

main "$@"
