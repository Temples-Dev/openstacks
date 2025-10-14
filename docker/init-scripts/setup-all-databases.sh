#!/bin/bash

# ShellNexa Docker Database Setup Script
# Automatically creates all databases and users for all services

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Database configuration
DB_HOST=${PGHOST:-postgres}
DB_PORT=${PGPORT:-5432}
DB_USERNAME=${PGUSER:-postgres}
DB_PASSWORD=${PGPASSWORD:-password}
DB_ADMIN_DB=${PGDATABASE:-postgres}

print_header() {
    echo -e "${BLUE}"
    echo "╔══════════════════════════════════════════════════════════════════╗"
    echo "║                ShellNexa Docker Database Setup                   ║"
    echo "║                   All Services Database Creation                 ║"
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

print_section() {
    echo -e "\n${YELLOW}▶ $1${NC}"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
}

# Database and user definitions
declare -A DATABASES=(
    ["api-gateway"]="shellnexa_gateway:shellnexa_gateway_user:gateway_pass:API Gateway & Routing"
    ["auth"]="shellnexa_auth:shellnexa_auth_user:auth_pass:Authentication & Authorization"
    ["catalog"]="shellnexa_catalog:shellnexa_catalog_user:catalog_pass:Library Catalog Management"
    ["circulation"]="shellnexa_circulation:shellnexa_circulation_user:circulation_pass:Circulation & Lending"
    ["acquisitions"]="shellnexa_acquisitions:shellnexa_acquisitions_user:acquisitions_pass:Acquisitions & Ordering"
    ["discovery"]="shellnexa_discovery:shellnexa_discovery_user:discovery_pass:Search & Discovery"
    ["reporting"]="shellnexa_reporting:shellnexa_reporting_user:reporting_pass:Analytics & Reporting"
    ["multi-tenant"]="shellnexa_multitenant:shellnexa_multitenant_user:multitenant_pass:Multi-Tenant Architecture"
    ["ill"]="shellnexa_ill:shellnexa_ill_user:ill_pass:Interlibrary Loan System"
    ["e-resources"]="shellnexa_eresources:shellnexa_eresources_user:eresources_pass:E-Resource Management"
    ["digital-repository"]="shellnexa_repository:shellnexa_repository_user:repository_pass:Digital Repository & Preservation"
    ["ai-ml"]="shellnexa_aiml:shellnexa_aiml_user:aiml_pass:AI/ML Engine & Recommendations"
)

database_exists() {
    local db_name=$1
    psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USERNAME" -d "$DB_ADMIN_DB" \
         -tAc "SELECT 1 FROM pg_database WHERE datname='$db_name';" | grep -q 1
}

user_exists() {
    local username=$1
    psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USERNAME" -d "$DB_ADMIN_DB" \
         -tAc "SELECT 1 FROM pg_roles WHERE rolname='$username';" | grep -q 1
}

create_database() {
    local db_name=$1
    local description=$2
    
    if database_exists "$db_name"; then
        print_info "Database '$db_name' already exists"
        return 0
    fi
    
    if psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USERNAME" -d "$DB_ADMIN_DB" \
           -c "CREATE DATABASE $db_name WITH ENCODING='UTF8' LC_COLLATE='en_US.UTF-8' LC_CTYPE='en_US.UTF-8';" &> /dev/null; then
        print_success "Created database '$db_name' ($description)"
        return 0
    else
        print_error "Failed to create database '$db_name'"
        return 1
    fi
}

create_user() {
    local username=$1
    local password=$2
    
    if user_exists "$username"; then
        print_info "User '$username' already exists"
        return 0
    fi
    
    if psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USERNAME" -d "$DB_ADMIN_DB" \
           -c "CREATE USER $username WITH PASSWORD '$password' CREATEDB;" &> /dev/null; then
        print_success "Created user '$username'"
        return 0
    else
        print_error "Failed to create user '$username'"
        return 1
    fi
}

grant_permissions() {
    local username=$1
    local db_name=$2
    
    if psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USERNAME" -d "$DB_ADMIN_DB" \
           -c "GRANT ALL PRIVILEGES ON DATABASE $db_name TO $username;" &> /dev/null; then
        print_success "Granted permissions on '$db_name' to '$username'"
        return 0
    else
        print_error "Failed to grant permissions on '$db_name' to '$username'"
        return 1
    fi
}

setup_extensions() {
    local db_name=$1
    local service=$2
    
    # Common extensions for all databases
    local common_extensions=("uuid-ossp" "pg_trgm" "btree_gin" "btree_gist")
    
    for ext in "${common_extensions[@]}"; do
        if psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USERNAME" -d "$db_name" \
               -c "CREATE EXTENSION IF NOT EXISTS \"$ext\";" &> /dev/null; then
            print_info "Enabled extension '$ext' in '$db_name'"
        fi
    done
    
    # Service-specific extensions
    case $service in
        "multi-tenant")
            # PostGIS for geospatial features
            if psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USERNAME" -d "$db_name" \
                   -c "CREATE EXTENSION IF NOT EXISTS postgis;" &> /dev/null; then
                print_info "Enabled PostGIS extension for multi-tenant service"
            fi
            ;;
        "catalog"|"discovery")
            # Full text search extensions
            if psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USERNAME" -d "$db_name" \
                   -c "CREATE EXTENSION IF NOT EXISTS unaccent;" &> /dev/null; then
                print_info "Enabled unaccent extension for search functionality"
            fi
            ;;
        "auth")
            # Cryptographic extensions
            if psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USERNAME" -d "$db_name" \
                   -c "CREATE EXTENSION IF NOT EXISTS pgcrypto;" &> /dev/null; then
                print_info "Enabled pgcrypto extension for authentication"
            fi
            ;;
    esac
}

create_schemas() {
    local db_name=$1
    local service=$2
    
    # Common schemas
    local common_schemas=("audit" "config")
    
    for schema in "${common_schemas[@]}"; do
        if psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USERNAME" -d "$db_name" \
               -c "CREATE SCHEMA IF NOT EXISTS $schema;" &> /dev/null; then
            print_info "Created schema '$schema' in '$db_name'"
        fi
    done
    
    # Service-specific schemas
    case $service in
        "multi-tenant")
            local schemas=("tenants" "libraries" "geospatial")
            ;;
        "digital-repository")
            local schemas=("preservation" "metadata" "collections" "objects")
            ;;
        "ai-ml")
            local schemas=("models" "predictions" "training" "analytics")
            ;;
        "catalog")
            local schemas=("marc" "metadata")
            ;;
        "circulation")
            local schemas=("transactions")
            ;;
        "acquisitions")
            local schemas=("orders" "vendors")
            ;;
        "discovery")
            local schemas=("search" "facets")
            ;;
        "reporting")
            local schemas=("analytics" "reports")
            ;;
        "ill")
            local schemas=("requests" "partners" "protocols")
            ;;
        "e-resources")
            local schemas=("licenses" "usage" "access")
            ;;
        "auth")
            local schemas=("sessions")
            ;;
        "api-gateway")
            local schemas=("routing")
            ;;
        *)
            local schemas=()
            ;;
    esac
    
    for schema in "${schemas[@]}"; do
        if psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USERNAME" -d "$db_name" \
               -c "CREATE SCHEMA IF NOT EXISTS $schema;" &> /dev/null; then
            print_info "Created schema '$schema' in '$db_name'"
        fi
    done
}

setup_database_config() {
    local db_name=$1
    
    # Set up database-specific configuration
    psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USERNAME" -d "$db_name" << EOF
-- Set timezone
SET timezone = 'UTC';

-- Create audit trigger function
CREATE OR REPLACE FUNCTION audit.audit_trigger_function()
RETURNS TRIGGER AS \$\$
BEGIN
    IF TG_OP = 'DELETE' THEN
        INSERT INTO audit.audit_log (
            table_name, operation, old_values, changed_by, changed_at
        ) VALUES (
            TG_TABLE_NAME, TG_OP, row_to_json(OLD), current_user, now()
        );
        RETURN OLD;
    ELSIF TG_OP = 'UPDATE' THEN
        INSERT INTO audit.audit_log (
            table_name, operation, old_values, new_values, changed_by, changed_at
        ) VALUES (
            TG_TABLE_NAME, TG_OP, row_to_json(OLD), row_to_json(NEW), current_user, now()
        );
        RETURN NEW;
    ELSIF TG_OP = 'INSERT' THEN
        INSERT INTO audit.audit_log (
            table_name, operation, new_values, changed_by, changed_at
        ) VALUES (
            TG_TABLE_NAME, TG_OP, row_to_json(NEW), current_user, now()
        );
        RETURN NEW;
    END IF;
    RETURN NULL;
END;
\$\$ LANGUAGE plpgsql;

-- Create audit log table
CREATE TABLE IF NOT EXISTS audit.audit_log (
    id SERIAL PRIMARY KEY,
    table_name TEXT NOT NULL,
    operation TEXT NOT NULL,
    old_values JSONB,
    new_values JSONB,
    changed_by TEXT NOT NULL DEFAULT current_user,
    changed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create config table
CREATE TABLE IF NOT EXISTS config.settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key VARCHAR(255) UNIQUE NOT NULL,
    value JSONB,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

EOF
}

main() {
    print_header
    
    print_section "Setting up ShellNexa Databases"
    
    local created_count=0
    local existing_count=0
    local failed_count=0
    
    for service in "${!DATABASES[@]}"; do
        IFS=':' read -r db_name username password description <<< "${DATABASES[$service]}"
        
        echo ""
        print_info "Processing $service service..."
        
        # Create user
        if create_user "$username" "$password"; then
            # Create database
            if create_database "$db_name" "$description"; then
                # Setup extensions
                setup_extensions "$db_name" "$service"
                
                # Create schemas
                create_schemas "$db_name" "$service"
                
                # Setup database configuration
                setup_database_config "$db_name"
                
                # Grant permissions
                grant_permissions "$username" "$db_name"
                
                created_count=$((created_count + 1))
            else
                failed_count=$((failed_count + 1))
            fi
        else
            failed_count=$((failed_count + 1))
        fi
    done
    
    # Summary
    print_section "Setup Summary"
    
    echo "📊 Database Setup Results:"
    echo "   • Created: $created_count databases"
    echo "   • Existing: $existing_count databases"
    echo "   • Failed: $failed_count databases"
    echo "   • Total Services: ${#DATABASES[@]}"
    
    if [ $failed_count -eq 0 ]; then
        print_success "All databases are ready!"
        echo ""
        echo "🎯 Database List:"
        for service in "${!DATABASES[@]}"; do
            IFS=':' read -r db_name username password description <<< "${DATABASES[$service]}"
            echo "   • $db_name ($description)"
        done
        echo ""
        echo "🔗 Connection Details:"
        echo "   • Host: $DB_HOST"
        echo "   • Port: $DB_PORT"
        echo "   • Admin User: $DB_USERNAME"
        echo ""
        echo "🚀 Next Steps:"
        echo "   1. Services can now connect to their databases"
        echo "   2. Run migrations: pnpm run migrate:all"
        echo "   3. Start services: pnpm run dev:services"
    else
        print_error "Some databases failed to create. Check the logs above."
        exit 1
    fi
}

# Run main function
main "$@"
