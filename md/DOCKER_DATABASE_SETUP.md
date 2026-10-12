# 🐳 ShellNexa Docker Database Setup

**Complete containerized database infrastructure for all services**

---

## 🚀 **Quick Start**

### **One-Command Docker Setup:**
```bash
# Start all database services with Docker
pnpm run docker:db:start

# Setup all service databases
pnpm run docker:db:setup
```

### **Individual Docker Commands:**
```bash
# Start database containers
pnpm run docker:db:start

# Stop database containers
pnpm run docker:db:stop

# Restart all services
pnpm run docker:db:restart

# Show service status
pnpm run docker:db:status

# View logs
pnpm run docker:db:logs

# Show connection info
pnpm run docker:db:info

# Clean up (removes all data!)
pnpm run docker:db:cleanup
```

---

## 🏗️ **Docker Infrastructure**

### **Services Included:**

| Service | Container | Port | Purpose |
|---------|-----------|------|---------|
| **PostgreSQL** | `shellnexa-postgres` | 5432 | Primary database server |
| **Redis** | `shellnexa-redis` | 6379 | Caching and sessions |
| **Elasticsearch** | `shellnexa-elasticsearch` | 9200 | Search engine |
| **Kibana** | `shellnexa-kibana` | 5601 | Elasticsearch dashboard |
| **MailHog** | `shellnexa-mailhog` | 8025/1025 | Email testing |
| **DB Init** | `shellnexa-db-init` | - | Database setup automation |

### **Container Features:**
- ✅ **Persistent volumes** for data retention
- ✅ **Health checks** for all services
- ✅ **Optimized configurations** for development and production
- ✅ **Automatic database creation** for all 12 services
- ✅ **Network isolation** with custom bridge network
- ✅ **Resource limits** and performance tuning

---

## 📊 **Database Architecture**

### **Automated Database Creation:**
All 12 service databases are created automatically:

| Service | Database | User | Description |
|---------|----------|------|-------------|
| **API Gateway** | `shellnexa_gateway` | `shellnexa_gateway_user` | API Gateway & Routing |
| **Auth** | `shellnexa_auth` | `shellnexa_auth_user` | Authentication & Authorization |
| **Catalog** | `shellnexa_catalog` | `shellnexa_catalog_user` | Library Catalog Management |
| **Circulation** | `shellnexa_circulation` | `shellnexa_circulation_user` | Circulation & Lending |
| **Acquisitions** | `shellnexa_acquisitions` | `shellnexa_acquisitions_user` | Acquisitions & Ordering |
| **Discovery** | `shellnexa_discovery` | `shellnexa_discovery_user` | Search & Discovery |
| **Reporting** | `shellnexa_reporting` | `shellnexa_reporting_user` | Analytics & Reporting |
| **Multi-Tenant** | `shellnexa_multitenant` | `shellnexa_multitenant_user` | Multi-Tenant Architecture |
| **ILL** | `shellnexa_ill` | `shellnexa_ill_user` | Interlibrary Loan System |
| **E-Resources** | `shellnexa_eresources` | `shellnexa_eresources_user` | E-Resource Management |
| **Digital Repository** | `shellnexa_repository` | `shellnexa_repository_user` | Digital Repository & Preservation |
| **AI/ML** | `shellnexa_aiml` | `shellnexa_aiml_user` | AI/ML Engine & Recommendations |

### **PostgreSQL Extensions:**
Automatically installed extensions:
- `uuid-ossp` - UUID generation
- `pg_trgm` - Text search and similarity
- `btree_gin` - Advanced indexing
- `btree_gist` - Spatial indexing
- `postgis` - Geospatial support (multi-tenant)
- `unaccent` - Text normalization (search services)
- `pgcrypto` - Encryption (auth service)

---

## 🔧 **Configuration Files**

### **Docker Compose:**
**File:** `docker/docker-compose.databases.yml`

**Features:**
- Multi-service orchestration
- Health checks and dependencies
- Volume persistence
- Network isolation
- Environment variable support

### **PostgreSQL Configuration:**
**File:** `docker/postgres.conf`

**Optimizations:**
- Connection pooling (200 max connections)
- Memory settings (256MB shared buffers)
- Query optimization
- Logging configuration
- Performance tuning

### **Redis Configuration:**
**File:** `docker/redis.conf`

**Features:**
- Memory management (256MB limit)
- Persistence (AOF + RDB)
- Security settings
- Performance optimization

---

## 🚀 **Usage Examples**

### **Complete Setup:**
```bash
# 1. Start all database services
pnpm run docker:db:start

# 2. Wait for services to be ready (automatic)
# 3. Create all service databases
pnpm run docker:db:setup

# 4. Verify everything is working
pnpm run docker:db:info
```

### **Development Workflow:**
```bash
# Daily development
pnpm run docker:db:start    # Start databases
# ... develop your services ...
pnpm run docker:db:stop     # Stop when done

# Check what's running
pnpm run docker:db:status

# View logs if issues occur
pnpm run docker:db:logs postgres
```

### **Troubleshooting:**
```bash
# Restart everything
pnpm run docker:db:restart

# View specific service logs
pnpm run docker:db:logs redis

# Complete reset (WARNING: deletes all data)
pnpm run docker:db:cleanup
```

---

## 🔗 **Connection Information**

### **Database Connections:**
```bash
# PostgreSQL
Host: localhost
Port: 5432
Admin User: postgres
Password: shellnexa_secure_password_2024

# Example connection string
postgresql://postgres:shellnexa_secure_password_2024@localhost:5432/shellnexa_catalog
```

### **Service Connections:**
```bash
# Redis
redis://localhost:6379

# Elasticsearch
http://localhost:9200

# Kibana Dashboard
http://localhost:5601

# MailHog Web Interface
http://localhost:8025

# MailHog SMTP
localhost:1025
```

---

## 📈 **Performance & Monitoring**

### **Health Checks:**
All services include health checks:
- **PostgreSQL:** `pg_isready` check every 10s
- **Redis:** `redis-cli ping` every 10s  
- **Elasticsearch:** Cluster health check every 30s
- **Kibana:** API status check every 30s
- **MailHog:** HTTP endpoint check every 30s

### **Resource Limits:**
```yaml
PostgreSQL:
  Memory: 1GB effective cache
  Connections: 200 max
  
Redis:
  Memory: 256MB limit
  Policy: allkeys-lru
  
Elasticsearch:
  Memory: 512MB heap
  Disk: Unlimited (development)
```

---

## 🔐 **Security Features**

### **Network Security:**
- **Isolated network:** Custom bridge network (172.20.0.0/16)
- **Port exposure:** Only necessary ports exposed to host
- **Container communication:** Internal network for service-to-service

### **Database Security:**
- **Service users:** Each service has dedicated database user
- **Limited permissions:** Users only access their service database
- **Secure passwords:** Auto-generated strong passwords
- **SSL ready:** Configuration supports SSL for production

---

## 🌍 **Environment Support**

### **Development:**
```bash
# Default configuration
DB_PASSWORD=shellnexa_secure_password_2024
NODE_ENV=development
```

### **Production:**
```bash
# Override for production
DB_PASSWORD=your_secure_production_password
NODE_ENV=production
SSL_MODE=require
```

---

## 📋 **File Structure**

```
docker/
├── docker-compose.databases.yml    # Main compose file
├── postgres.conf                   # PostgreSQL configuration
├── redis.conf                      # Redis configuration
└── init-scripts/
    └── setup-all-databases.sh      # Database setup script

scripts/
└── docker-db-setup.sh              # Management script
```

---

## 🔄 **Data Persistence**

### **Docker Volumes:**
- `postgres_data` - PostgreSQL data directory
- `redis_data` - Redis persistence files
- `elasticsearch_data` - Elasticsearch indices

### **Backup & Restore:**
```bash
# Backup PostgreSQL
docker exec shellnexa-postgres pg_dumpall -U postgres > backup.sql

# Restore PostgreSQL
docker exec -i shellnexa-postgres psql -U postgres < backup.sql

# Backup Redis
docker exec shellnexa-redis redis-cli BGSAVE
```

---

## 🚨 **Troubleshooting**

### **Common Issues:**

#### **Port Conflicts:**
```bash
# Check what's using ports
lsof -i :5432
lsof -i :6379
lsof -i :9200

# Stop conflicting services
sudo systemctl stop postgresql
sudo systemctl stop redis
```

#### **Container Won't Start:**
```bash
# Check Docker daemon
docker info

# View container logs
pnpm run docker:db:logs postgres

# Restart Docker daemon
sudo systemctl restart docker
```

#### **Database Connection Failed:**
```bash
# Check container status
pnpm run docker:db:status

# Test connection
docker exec shellnexa-postgres pg_isready -U postgres

# Restart database
pnpm run docker:db:restart
```

---

## ⚡ **Advantages of Docker Setup**

### **vs. Local Installation:**
- ✅ **No local dependencies** - Everything runs in containers
- ✅ **Consistent environment** - Same setup across all machines
- ✅ **Easy cleanup** - Remove containers without affecting host
- ✅ **Version control** - Exact service versions specified
- ✅ **Isolation** - No conflicts with existing services

### **vs. Cloud Databases:**
- ✅ **Cost effective** - No cloud charges for development
- ✅ **Offline development** - Works without internet
- ✅ **Full control** - Complete configuration access
- ✅ **Fast iteration** - Instant setup and teardown
- ✅ **Data privacy** - All data stays local

---

## 🎯 **Next Steps**

1. **Start Services:**
   ```bash
   pnpm run docker:db:start
   ```

2. **Setup Databases:**
   ```bash
   pnpm run docker:db:setup
   ```

3. **Update Service Configs:**
   ```bash
   pnpm run env:setup
   ```

4. **Start Development:**
   ```bash
   pnpm run dev:services
   ```

---

**🎉 Your containerized database infrastructure is ready! All 12 service databases are automatically created and configured for immediate use.**
