# ShellNexa Backend Setup Guide

This guide will help you set up the ShellNexa backend development environment using either VS Code Dev Containers or local Docker Compose.

## Prerequisites

- **Docker & Docker Compose**: Latest version
- **VS Code** (recommended): With Dev Containers extension
- **Node.js 20+**: If running locally
- **pnpm**: Package manager

## Quick Start with Dev Containers (Recommended)

### 1. Open in Dev Container

```bash
# Clone and open in VS Code
code /home/shelemiah/Desktop/git-repositories/shellnexa

# VS Code will prompt to "Reopen in Container" - click yes
# Or use Command Palette: "Dev Containers: Reopen in Container"
```

### 2. Wait for Setup

The dev container will automatically:
- Install all dependencies
- Start PostgreSQL, Redis, and Elasticsearch
- Create databases and sample data
- Set up the development environment

### 3. Verify Setup

```bash
# Check service health
curl http://localhost:3001/api/v1/health

# View API documentation
open http://localhost:5601  # Kibana
open http://localhost:8025  # MailHog
```

## Alternative: Local Docker Compose Setup

### 1. Start Infrastructure Services

```bash
# Start only infrastructure (no app services)
docker-compose -f docker-compose.dev.yml up -d postgres redis elasticsearch kibana mailhog

# Wait for services to be healthy
docker-compose -f docker-compose.dev.yml ps
```

### 2. Install Dependencies

```bash
# Install root workspace dependencies
pnpm install

# Build shared types
cd shared/types
pnpm run build
cd ../..

# Install API Gateway dependencies
cd services/api-gateway
pnpm install
```

### 3. Start Development Servers

```bash
# Terminal 1: API Gateway
cd services/api-gateway
pnpm run start:dev

# Terminal 2: Auth Service (when ready)
cd services/auth
pnpm run start:dev

# Terminal 3: Catalog Service (when ready)
cd services/catalog
pnpm run start:dev
```

## Project Structure

```
shellnexa/
├── .devcontainer/              # VS Code Dev Container configuration
│   ├── devcontainer.json
│   ├── docker-compose.yml
│   ├── Dockerfile
│   └── init-scripts/
├── services/                   # Microservices
│   ├── api-gateway/           # Main API Gateway (Port 3001)
│   ├── auth/                  # Authentication Service (Port 3002)
│   ├── catalog/               # Catalog Management (Port 3003)
│   ├── circulation/           # Circulation System (Port 3004)
│   ├── acquisitions/          # Acquisitions Management (Port 3005)
│   ├── discovery/             # Search & Discovery (Port 3006)
│   └── reporting/             # Analytics & Reporting (Port 3007)
├── shared/                    # Shared libraries
│   ├── types/                 # TypeScript type definitions
│   ├── utils/                 # Common utilities
│   └── config/                # Shared configuration
├── scripts/                   # Development scripts
└── docker-compose.dev.yml     # Local development compose
```

## Available Services

| Service | Port | Description | Status |
|---------|------|-------------|--------|
| API Gateway | 3001 | Main entry point, routing, auth | ✅ Ready |
| PostgreSQL | 5432 | Primary database | ✅ Ready |
| Redis | 6379 | Caching and sessions | ✅ Ready |
| Elasticsearch | 9200 | Search and indexing | ✅ Ready |
| Kibana | 5601 | Elasticsearch UI | ✅ Ready |
| MailHog | 8025 | Email testing | ✅ Ready |
| Auth Service | 3002 | User authentication | 🚧 Planned |
| Catalog Service | 3003 | Bibliographic records | 🚧 Planned |
| Circulation Service | 3004 | Loans and patrons | 🚧 Planned |
| Acquisitions Service | 3005 | Purchase orders | 🚧 Planned |
| Discovery Service | 3006 | Public search | 🚧 Planned |
| Reporting Service | 3007 | Analytics | 🚧 Planned |

## API Documentation

Once the API Gateway is running:

- **Swagger UI**: http://localhost:3001/api/docs
- **Health Check**: http://localhost:3001/api/v1/health

## Database Access

### PostgreSQL
```bash
# Connect to main database
psql -h localhost -p 5432 -U shellnexa -d shellnexa_dev

# Connect to specific service database
psql -h localhost -p 5432 -U shellnexa -d auth_service
psql -h localhost -p 5432 -U shellnexa -d catalog_service
```

### Redis
```bash
# Connect to Redis
redis-cli -h localhost -p 6379

# View all keys
redis-cli -h localhost -p 6379 KEYS "*"
```

### Elasticsearch
```bash
# Check cluster health
curl http://localhost:9200/_cluster/health

# List indices
curl http://localhost:9200/_cat/indices

# Search catalog
curl "http://localhost:9200/catalog/_search?q=*"
```

## Development Workflow

### 1. Making Changes

```bash
# Changes to shared types
cd shared/types
# Edit files in src/
pnpm run build  # Rebuild types

# Changes to API Gateway
cd services/api-gateway
# Edit files in src/
# Hot reload is enabled with start:dev
```

### 2. Adding New Services

```bash
# Create new service
mkdir services/new-service
cd services/new-service

# Initialize NestJS project
nest new . --package-manager pnpm

# Add to workspace
# Edit pnpm-workspace.yaml to include the service
```

### 3. Running Tests

```bash
# Run tests for specific service
cd services/api-gateway
pnpm test

# Run tests with coverage
pnpm test:cov

# Run e2e tests
pnpm test:e2e
```

## Environment Variables

### API Gateway (.env)
```bash
PORT=3001
NODE_ENV=development
JWT_SECRET=your-secret-key
AUTH_SERVICE_URL=http://localhost:3002
CATALOG_SERVICE_URL=http://localhost:3003
# ... other service URLs
```

### Database Connections
```bash
# PostgreSQL
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USER=shellnexa
DATABASE_PASSWORD=shellnexa_dev

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# Elasticsearch
ELASTICSEARCH_NODE=http://localhost:9200
```

## Troubleshooting

### Services Not Starting

```bash
# Check container logs
docker-compose -f docker-compose.dev.yml logs postgres
docker-compose -f docker-compose.dev.yml logs redis
docker-compose -f docker-compose.dev.yml logs elasticsearch

# Restart services
docker-compose -f docker-compose.dev.yml restart
```

### Port Conflicts

```bash
# Check what's using ports
lsof -i :5432  # PostgreSQL
lsof -i :6379  # Redis
lsof -i :9200  # Elasticsearch

# Stop conflicting services
sudo systemctl stop postgresql
sudo systemctl stop redis
```

### Database Connection Issues

```bash
# Test PostgreSQL connection
pg_isready -h localhost -p 5432 -U shellnexa

# Reset database
docker-compose -f docker-compose.dev.yml down -v
docker-compose -f docker-compose.dev.yml up -d postgres
```

### Clean Reset

```bash
# Stop everything and remove volumes
docker-compose -f docker-compose.dev.yml down -v

# Remove node_modules
find . -name "node_modules" -type d -exec rm -rf {} +

# Reinstall dependencies
pnpm install

# Restart services
docker-compose -f docker-compose.dev.yml up -d
```

## Next Steps

1. **Complete API Gateway**: Add remaining endpoints and middleware
2. **Create Auth Service**: Implement user authentication and authorization
3. **Build Catalog Service**: MARC record management and metadata
4. **Develop Circulation Service**: Patron management and loans
5. **Set up CI/CD**: GitHub Actions for testing and deployment

## Getting Help

- **Documentation**: Check the `phase1-roadmap.md` for detailed implementation plan
- **API Docs**: http://localhost:3001/api/docs when running
- **Health Status**: http://localhost:3001/api/v1/health

---

*This setup provides a solid foundation for ShellNexa Phase 1 development. All services are containerized and ready for development.*
