#!/bin/bash

# ShellNexa Database Setup Script
# Automatically creates all databases for Phase 1 and Phase 2 services

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default database configuration
DB_HOST=${DB_HOST:-localhost}
DB_PORT=${DB_PORT:-5432}
DB_USERNAME=${DB_USERNAME:-postgres}
DB_PASSWORD=${DB_PASSWORD:-password}
DB_ADMIN_DB=${DB_ADMIN_DB:-postgres}

# Database names for all services
declare -A DATABASES=(
    ["api-gateway"]="shellnexa_gateway"
    ["auth"]="shellnexa_auth"
    ["catalog"]="shellnexa_catalog"
    ["circulation"]="shellnexa_circulation"
    ["acquisitions"]="shellnexa_acquisitions"
    ["discovery"]="shellnexa_discovery"
    ["reporting"]="shellnexa_reporting"
    ["multi-tenant"]="shellnexa_multitenant"
    ["ill"]="shellnexa_ill"
    ["e-resources"]="shellnexa_eresources"
    ["digital-repository"]="shellnexa_repository"
    ["ai-ml"]="shellnexa_aiml"
)

# Service descriptions
declare -A SERVICE_DESCRIPTIONS=(
    ["api-gateway"]="API Gateway & Routing"
    ["auth"]="Authentication & Authorization"
    ["catalog"]="Library Catalog Management"
    ["circulation"]="Circulation & Lending"
    ["acquisitions"]="Acquisitions & Ordering"
    ["discovery"]="Search & Discovery"
    ["reporting"]="Analytics & Reporting"
    ["multi-tenant"]="Multi-Tenant Architecture"
    ["ill"]="Interlibrary Loan System"
    ["e-resources"]="E-Resource Management"
    ["digital-repository"]="Digital Repository & Preservation"
    ["ai-ml"]="AI/ML Engine & Recommendations"
)

print_header() {
    echo -e "${BLUE}"
    echo "╔══════════════════════════════════════════════════════════════════╗"
    echo "║                    ShellNexa Database Setup                      ║"
    echo "║                  Automated Database Creation                     ║"
    echo "╚══════════════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
}

print_section() {
    echo -e "\n${YELLOW}▶ $1${NC}"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
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

check_postgresql() {
    print_section "Checking PostgreSQL Connection"
    
    if ! command -v psql &> /dev/null; then
        print_error "PostgreSQL client (psql) is not installed"
        echo "Please install PostgreSQL client:"
        echo "  Ubuntu/Debian: sudo apt-get install postgresql-client"
        echo "  macOS: brew install postgresql"
        echo "  Windows: Download from https://www.postgresql.org/download/"
        exit 1
    fi
    
    # Test connection
    export PGPASSWORD="$DB_PASSWORD"
    if psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USERNAME" -d "$DB_ADMIN_DB" -c "SELECT 1;" &> /dev/null; then
        print_success "PostgreSQL connection successful"
        print_info "Host: $DB_HOST:$DB_PORT"
        print_info "User: $DB_USERNAME"
    else
        print_error "Cannot connect to PostgreSQL"
        echo "Please check your database configuration:"
        echo "  DB_HOST=$DB_HOST"
        echo "  DB_PORT=$DB_PORT"
        echo "  DB_USERNAME=$DB_USERNAME"
        echo "  DB_PASSWORD=***"
        exit 1
    fi
}

database_exists() {
    local db_name=$1
    export PGPASSWORD="$DB_PASSWORD"
    psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USERNAME" -d "$DB_ADMIN_DB" \
         -tAc "SELECT 1 FROM pg_database WHERE datname='$db_name';" | grep -q 1
}

create_database() {
    local service=$1
    local db_name=$2
    local description=$3
    
    if database_exists "$db_name"; then
        print_info "Database '$db_name' already exists for $service"
        return 0
    fi
    
    export PGPASSWORD="$DB_PASSWORD"
    if psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USERNAME" -d "$DB_ADMIN_DB" \
           -c "CREATE DATABASE $db_name;" &> /dev/null; then
        print_success "Created database '$db_name' for $service ($description)"
        return 0
    else
        print_error "Failed to create database '$db_name' for $service"
        return 1
    fi
}

create_user_if_not_exists() {
    local username=$1
    local password=$2
    
    export PGPASSWORD="$DB_PASSWORD"
    local user_exists=$(psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USERNAME" -d "$DB_ADMIN_DB" \
                       -tAc "SELECT 1 FROM pg_roles WHERE rolname='$username';" | grep -c 1 || true)
    
    if [ "$user_exists" = "0" ]; then
        if psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USERNAME" -d "$DB_ADMIN_DB" \
               -c "CREATE USER $username WITH PASSWORD '$password';" &> /dev/null; then
            print_success "Created user '$username'"
        else
            print_error "Failed to create user '$username'"
            return 1
        fi
    else
        print_info "User '$username' already exists"
    fi
}

grant_permissions() {
    local username=$1
    local db_name=$2
    
    export PGPASSWORD="$DB_PASSWORD"
    if psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USERNAME" -d "$DB_ADMIN_DB" \
           -c "GRANT ALL PRIVILEGES ON DATABASE $db_name TO $username;" &> /dev/null; then
        print_success "Granted permissions on '$db_name' to '$username'"
    else
        print_error "Failed to grant permissions on '$db_name' to '$username'"
        return 1
    fi
}

setup_extensions() {
    local db_name=$1
    
    export PGPASSWORD="$DB_PASSWORD"
    
    # Enable commonly needed extensions
    local extensions=("uuid-ossp" "pg_trgm" "btree_gin" "btree_gist")
    
    for ext in "${extensions[@]}"; do
        if psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USERNAME" -d "$db_name" \
               -c "CREATE EXTENSION IF NOT EXISTS \"$ext\";" &> /dev/null; then
            print_info "Enabled extension '$ext' in '$db_name'"
        fi
    done
    
    # Special extensions for specific services
    case $db_name in
        "shellnexa_multitenant")
            # PostGIS for geospatial features
            if psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USERNAME" -d "$db_name" \
                   -c "CREATE EXTENSION IF NOT EXISTS postgis;" &> /dev/null; then
                print_info "Enabled PostGIS extension for multi-tenant service"
            fi
            ;;
        "shellnexa_catalog"|"shellnexa_discovery")
            # Full text search extensions
            if psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USERNAME" -d "$db_name" \
                   -c "CREATE EXTENSION IF NOT EXISTS unaccent;" &> /dev/null; then
                print_info "Enabled unaccent extension for search functionality"
            fi
            ;;
    esac
}

create_schemas() {
    local db_name=$1
    local service=$2
    
    export PGPASSWORD="$DB_PASSWORD"
    
    # Create common schemas
    local schemas=("public" "audit" "config")
    
    for schema in "${schemas[@]}"; do
        if psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USERNAME" -d "$db_name" \
               -c "CREATE SCHEMA IF NOT EXISTS $schema;" &> /dev/null; then
            print_info "Created schema '$schema' in '$db_name'"
        fi
    done
    
    # Service-specific schemas
    case $service in
        "multi-tenant")
            psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USERNAME" -d "$db_name" \
                 -c "CREATE SCHEMA IF NOT EXISTS tenants;" &> /dev/null
            psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USERNAME" -d "$db_name" \
                 -c "CREATE SCHEMA IF NOT EXISTS libraries;" &> /dev/null
            ;;
        "digital-repository")
            psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USERNAME" -d "$db_name" \
                 -c "CREATE SCHEMA IF NOT EXISTS preservation;" &> /dev/null
            psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USERNAME" -d "$db_name" \
                 -c "CREATE SCHEMA IF NOT EXISTS metadata;" &> /dev/null
            ;;
        "ai-ml")
            psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USERNAME" -d "$db_name" \
                 -c "CREATE SCHEMA IF NOT EXISTS models;" &> /dev/null
            psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USERNAME" -d "$db_name" \
                 -c "CREATE SCHEMA IF NOT EXISTS predictions;" &> /dev/null
            ;;
    esac
}

setup_service_users() {
    print_section "Setting up Service Users"
    
    # Create service-specific users for better security
    local service_users=(
        "shellnexa_gateway_user:gateway_pass"
        "shellnexa_auth_user:auth_pass"
        "shellnexa_catalog_user:catalog_pass"
        "shellnexa_circulation_user:circulation_pass"
        "shellnexa_acquisitions_user:acquisitions_pass"
        "shellnexa_discovery_user:discovery_pass"
        "shellnexa_reporting_user:reporting_pass"
        "shellnexa_multitenant_user:multitenant_pass"
        "shellnexa_ill_user:ill_pass"
        "shellnexa_eresources_user:eresources_pass"
        "shellnexa_repository_user:repository_pass"
        "shellnexa_aiml_user:aiml_pass"
    )
    
    for user_info in "${service_users[@]}"; do
        IFS=':' read -r username password <<< "$user_info"
        create_user_if_not_exists "$username" "$password"
    done
}

main() {
    print_header
    
    # Check if running with custom configuration
    if [ "$#" -gt 0 ]; then
        case $1 in
            --help|-h)
                echo "Usage: $0 [options]"
                echo ""
                echo "Options:"
                echo "  --help, -h          Show this help message"
                echo "  --check-only        Only check connection, don't create databases"
                echo "  --drop-existing     Drop existing databases before creating new ones"
                echo ""
                echo "Environment Variables:"
                echo "  DB_HOST             Database host (default: localhost)"
                echo "  DB_PORT             Database port (default: 5432)"
                echo "  DB_USERNAME         Database admin username (default: postgres)"
                echo "  DB_PASSWORD         Database admin password (default: password)"
                echo "  DB_ADMIN_DB         Admin database name (default: postgres)"
                echo ""
                echo "Example:"
                echo "  DB_HOST=db.example.com DB_PASSWORD=secret $0"
                exit 0
                ;;
            --check-only)
                check_postgresql
                print_success "Database connection check completed successfully"
                exit 0
                ;;
            --drop-existing)
                DROP_EXISTING=true
                ;;
        esac
    fi
    
    # Check PostgreSQL connection
    check_postgresql
    
    # Setup service users
    setup_service_users
    
    # Create databases
    print_section "Creating Service Databases"
    
    local failed_databases=()
    local created_count=0
    local existing_count=0
    
    for service in "${!DATABASES[@]}"; do
        db_name="${DATABASES[$service]}"
        description="${SERVICE_DESCRIPTIONS[$service]}"
        
        # Drop existing database if requested
        if [ "$DROP_EXISTING" = true ] && database_exists "$db_name"; then
            export PGPASSWORD="$DB_PASSWORD"
            if psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USERNAME" -d "$DB_ADMIN_DB" \
                   -c "DROP DATABASE $db_name;" &> /dev/null; then
                print_info "Dropped existing database '$db_name'"
            fi
        fi
        
        if database_exists "$db_name"; then
            existing_count=$((existing_count + 1))
            print_info "Database '$db_name' already exists for $service"
        else
            if create_database "$service" "$db_name" "$description"; then
                created_count=$((created_count + 1))
                
                # Setup extensions and schemas
                setup_extensions "$db_name"
                create_schemas "$db_name" "$service"
                
                # Grant permissions to service user
                service_user="shellnexa_${service//-/_}_user"
                grant_permissions "$service_user" "$db_name"
            else
                failed_databases+=("$service:$db_name")
            fi
        fi
    done
    
    # Summary
    print_section "Setup Summary"
    
    echo "📊 Database Creation Results:"
    echo "   • Created: $created_count databases"
    echo "   • Existing: $existing_count databases"
    echo "   • Total: $((created_count + existing_count)) databases"
    
    if [ ${#failed_databases[@]} -eq 0 ]; then
        print_success "All databases are ready!"
        echo ""
        echo "🎯 Next Steps:"
        echo "   1. Update service environment files with database credentials"
        echo "   2. Run database migrations: pnpm run migrate"
        echo "   3. Start services: pnpm run start:dev"
        echo ""
        echo "📋 Database List:"
        for service in "${!DATABASES[@]}"; do
            db_name="${DATABASES[$service]}"
            description="${SERVICE_DESCRIPTIONS[$service]}"
            echo "   • $db_name ($description)"
        done
    else
        print_error "Some databases failed to create:"
        for failed in "${failed_databases[@]}"; do
            IFS=':' read -r service db_name <<< "$failed"
            echo "   • $service: $db_name"
        done
        exit 1
    fi
}

# Run main function with all arguments
main "$@"
