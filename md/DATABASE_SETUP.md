# 🗄️ ShellNexa Database Setup Guide

**Automated Database Creation & Configuration**

---

## 🚀 **Quick Start**

### **One-Command Setup:**
```bash
# Complete setup: environment files + databases + dependencies
pnpm run setup:full
```

### **Individual Commands:**
```bash
# 1. Create environment files
pnpm run env:setup

# 2. Setup databases
pnpm run db:setup

# 3. Check database connection
pnpm run db:check

# 4. Reset databases (drops and recreates)
pnpm run db:reset
```

---

## 📋 **Database Configuration**

### **All Service Databases:**

| Service | Database Name | Port | User | Description |
|---------|---------------|------|------|-------------|
| **API Gateway** | `shellnexa_gateway` | 3001 | `shellnexa_gateway_user` | API Gateway & Routing |
| **Auth** | `shellnexa_auth` | 3002 | `shellnexa_auth_user` | Authentication & Authorization |
| **Catalog** | `shellnexa_catalog` | 3003 | `shellnexa_catalog_user` | Library Catalog Management |
| **Circulation** | `shellnexa_circulation` | 3004 | `shellnexa_circulation_user` | Circulation & Lending |
| **Acquisitions** | `shellnexa_acquisitions` | 3005 | `shellnexa_acquisitions_user` | Acquisitions & Ordering |
| **Discovery** | `shellnexa_discovery` | 3006 | `shellnexa_discovery_user` | Search & Discovery |
| **Reporting** | `shellnexa_reporting` | 3007 | `shellnexa_reporting_user` | Analytics & Reporting |
| **Multi-Tenant** | `shellnexa_multitenant` | 3008 | `shellnexa_multitenant_user` | Multi-Tenant Architecture |
| **ILL** | `shellnexa_ill` | 3009 | `shellnexa_ill_user` | Interlibrary Loan System |
| **E-Resources** | `shellnexa_eresources` | 3010 | `shellnexa_eresources_user` | E-Resource Management |
| **Digital Repository** | `shellnexa_repository` | 3011 | `shellnexa_repository_user` | Digital Repository & Preservation |
| **AI/ML** | `shellnexa_aiml` | 3012 | `shellnexa_aiml_user` | AI/ML Engine & Recommendations |

---

## 🛠️ **Setup Scripts**

### **1. Database Setup Script**
**File:** `scripts/setup-databases.sh`

**Features:**
- ✅ Automatic database creation for all services
- ✅ Service-specific user creation with secure passwords
- ✅ PostgreSQL extension installation (UUID, PostGIS, etc.)
- ✅ Schema creation for organized data structure
- ✅ Permission management for security
- ✅ Connection validation and error handling

**Usage:**
```bash
# Basic setup
./scripts/setup-databases.sh

# Check connection only
./scripts/setup-databases.sh --check-only

# Drop and recreate databases
./scripts/setup-databases.sh --drop-existing

# Custom configuration
DB_HOST=db.example.com DB_PASSWORD=secret ./scripts/setup-databases.sh
```

### **2. Environment Files Script**
**File:** `scripts/create-env-files.sh`

**Features:**
- ✅ Automatic `.env` file creation for all services
- ✅ Service-specific configuration templates
- ✅ Database connection strings
- ✅ JWT secrets and security configuration
- ✅ Redis, Elasticsearch, and external service URLs

**Generated Files:**
- `services/*/env` - Individual service configuration
- `.env` - Global environment configuration
- `services/*/.env.example` - Template files for reference

---

## 🔧 **Environment Variables**

### **Database Configuration:**
```bash
# PostgreSQL Settings
DB_HOST=localhost          # Database host
DB_PORT=5432              # Database port
DB_USERNAME=postgres      # Admin username
DB_PASSWORD=password      # Admin password
DB_ADMIN_DB=postgres      # Admin database

# Redis Settings
REDIS_HOST=localhost      # Redis host
REDIS_PORT=6379          # Redis port
REDIS_PASSWORD=          # Redis password (optional)

# Elasticsearch Settings
ELASTICSEARCH_HOST=localhost  # Elasticsearch host
ELASTICSEARCH_PORT=9200      # Elasticsearch port
```

### **Service-Specific Variables:**

#### **Multi-Tenant Service:**
```bash
DEFAULT_TENANT=default
TENANT_ISOLATION=strict
GEOSPATIAL_ENABLED=true
SUBSCRIPTION_TRACKING=true
```

#### **AI/ML Service:**
```bash
ML_SERVICE_URL=http://localhost:8000
TENSORFLOW_BACKEND=cpu
MODEL_STORAGE_PATH=./storage/models
TRAINING_BATCH_SIZE=32
```

#### **Digital Repository:**
```bash
STORAGE_PATH=./storage/repository
PRESERVATION_ENABLED=true
OAI_PMH_ENABLED=true
DOI_MINTING_ENABLED=false
```

---

## 📊 **Database Schema Structure**

### **Common Schemas (All Databases):**
- `public` - Main application tables
- `audit` - Audit logging and change tracking
- `config` - Configuration and settings

### **Service-Specific Schemas:**

#### **Multi-Tenant Database:**
- `tenants` - Tenant management
- `libraries` - Library branch information
- `geospatial` - Location and mapping data

#### **Digital Repository:**
- `preservation` - Digital preservation workflows
- `metadata` - Metadata schemas and validation
- `collections` - Collection organization
- `objects` - Digital object management

#### **AI/ML Database:**
- `models` - ML model definitions and metadata
- `predictions` - Prediction results and feedback
- `training` - Training data and model versions
- `analytics` - Performance metrics and monitoring

---

## 🔐 **Security Features**

### **Database Security:**
- ✅ **Service-specific users** with limited permissions
- ✅ **Secure password generation** for each service
- ✅ **Database isolation** between services
- ✅ **Permission-based access control**

### **Connection Security:**
- ✅ **SSL/TLS support** for production environments
- ✅ **Connection pooling** for performance
- ✅ **Timeout configuration** for reliability
- ✅ **Environment-based configuration**

---

## 🚀 **Production Deployment**

### **Environment-Specific Configuration:**

#### **Development:**
```bash
NODE_ENV=development
DB_SYNCHRONIZE=true
DB_LOGGING=true
```

#### **Staging:**
```bash
NODE_ENV=staging
DB_HOST=staging-db.shellnexa.com
DB_SSL=true
DB_SYNCHRONIZE=false
```

#### **Production:**
```bash
NODE_ENV=production
DB_HOST=prod-db.shellnexa.com
DB_SSL=true
DB_SYNCHRONIZE=false
DB_POOL_SIZE=20
```

---

## 📈 **Database Extensions**

### **Automatically Installed Extensions:**

#### **Core Extensions (All Databases):**
- `uuid-ossp` - UUID generation
- `pg_trgm` - Text search and similarity
- `btree_gin` - Advanced indexing
- `btree_gist` - Spatial indexing

#### **Service-Specific Extensions:**

| Service | Extensions | Purpose |
|---------|------------|---------|
| **Multi-Tenant** | `postgis` | Geospatial calculations |
| **Catalog/Discovery** | `unaccent` | Text normalization for search |
| **Auth** | `pgcrypto` | Password hashing and encryption |

---

## 🔄 **Migration & Seeding**

### **Database Migrations:**
```bash
# Run migrations for all services
pnpm run migrate:all

# Run migrations for specific service
cd services/catalog && pnpm run migrate
```

### **Data Seeding:**
```bash
# Seed all databases with sample data
pnpm run seed:all

# Seed specific service
cd services/auth && pnpm run seed
```

---

## 🩺 **Health Checks & Monitoring**

### **Database Health Checks:**
```bash
# Check all database connections
pnpm run db:check

# Individual service health check
curl http://localhost:3001/health
```

### **Monitoring Features:**
- ✅ **Connection pool monitoring**
- ✅ **Query performance tracking**
- ✅ **Database size monitoring**
- ✅ **Automated backup verification**

---

## 🛠️ **Troubleshooting**

### **Common Issues:**

#### **Connection Failed:**
```bash
# Check PostgreSQL is running
sudo systemctl status postgresql

# Check connection parameters
pnpm run db:check
```

#### **Permission Denied:**
```bash
# Verify user permissions
psql -h localhost -U postgres -c "\du"

# Reset permissions
pnpm run db:reset
```

#### **Database Already Exists:**
```bash
# Drop and recreate
pnpm run db:reset

# Or manually drop
psql -h localhost -U postgres -c "DROP DATABASE shellnexa_catalog;"
```

---

## 📚 **Additional Resources**

### **Configuration Files:**
- `scripts/database-config.json` - Database configuration schema
- `docker-compose.dev.yml` - Development database containers
- `.devcontainer/docker-compose.yml` - VS Code dev container setup

### **Documentation:**
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [TypeORM Documentation](https://typeorm.io/)
- [NestJS Database Guide](https://docs.nestjs.com/techniques/database)

---

## 🎯 **Next Steps After Setup**

1. **Verify Setup:**
   ```bash
   pnpm run db:check
   ```

2. **Start Services:**
   ```bash
   pnpm run dev:services
   ```

3. **Run Migrations:**
   ```bash
   pnpm run migrate:all
   ```

4. **Seed Sample Data:**
   ```bash
   pnpm run seed:all
   ```

5. **Test API Endpoints:**
   ```bash
   curl http://localhost:3001/health
   ```

---

**🎉 Your ShellNexa database infrastructure is now fully automated and ready for enterprise deployment!**
