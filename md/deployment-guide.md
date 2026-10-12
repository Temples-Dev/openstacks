# OpenStacks Deployment Guide

This guide provides deployment instructions for OpenStacks in various environments.

---

## 🏗️ Architecture Overview

```
Load Balancer → API Gateway (3001) → Microservices
                                   ├── Auth (3002)
                                   ├── Catalog (3003)
                                   ├── Circulation (3004)
                                   ├── Acquisitions (3005)
                                   ├── Discovery (3006)
                                   └── Reporting (3007)
```

---

## 🛠️ Prerequisites

### System Requirements
- **CPU:** 4+ cores (dev), 8+ cores (prod)
- **RAM:** 8+ GB (dev), 32+ GB (prod)
- **Storage:** 50+ GB SSD (dev), 500+ GB SSD (prod)

### Software Dependencies
- Docker 24.0+
- Docker Compose 2.20+
- Node.js 18+ (development)
- PostgreSQL 15+
- Redis 7+

---

## 🐳 Docker Deployment

### Development Setup

1. **Clone and Configure**
```bash
git clone https://github.com/your-org/openstacks.git
cd openstacks
cp .env.example .env
# Copy .env files for each service
```

2. **Start Development Environment**
```bash
docker-compose -f docker-compose.dev.yml up -d
```

### Production Setup

1. **Production Docker Compose**
```yaml
version: '3.8'
services:
  nginx:
    image: nginx:alpine
    ports: ["80:80", "443:443"]
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf
  
  postgres:
    image: postgres:15
    environment:
      POSTGRES_USER: ${POSTGRES_USER}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
  
  redis:
    image: redis:7-alpine
    command: redis-server --requirepass ${REDIS_PASSWORD}
  
  api-gateway:
    image: openstacks/api-gateway:latest
    environment:
      - NODE_ENV=production
      - DB_HOST=postgres
    deploy:
      replicas: 2
  
  # Additional services...
```

---

## ☸️ Kubernetes Deployment

### Basic Kubernetes Setup

1. **Namespace**
```yaml
apiVersion: v1
kind: Namespace
metadata:
  name: openstacks
```

2. **ConfigMap**
```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: openstacks-config
  namespace: openstacks
data:
  NODE_ENV: "production"
  DB_HOST: "postgres-service"
```

3. **API Gateway Deployment**
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: api-gateway
  namespace: openstacks
spec:
  replicas: 3
  selector:
    matchLabels:
      app: api-gateway
  template:
    spec:
      containers:
      - name: api-gateway
        image: openstacks/api-gateway:latest
        ports:
        - containerPort: 3001
        livenessProbe:
          httpGet:
            path: /health
            port: 3001
```

### Auto-scaling
```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: api-gateway-hpa
spec:
  scaleTargetRef:
    kind: Deployment
    name: api-gateway
  minReplicas: 2
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        averageUtilization: 70
```

---

## 🌩️ Cloud Deployment

### AWS EKS
```bash
# Create cluster
eksctl create cluster --name openstacks-cluster --region us-west-2

# Deploy application
kubectl apply -f k8s/
```

### Google GKE
```bash
# Create cluster
gcloud container clusters create openstacks-cluster --zone us-central1-a

# Deploy
kubectl apply -f k8s/
```

---

## 🔧 Configuration

### Environment Variables
```bash
# API Gateway
NODE_ENV=production
PORT=3001
JWT_SECRET=your-secret-key
DB_HOST=postgres
REDIS_HOST=redis

# Service URLs
AUTH_SERVICE_URL=http://auth-service:3002
CATALOG_SERVICE_URL=http://catalog-service:3003
# ... other services
```

### Nginx Configuration
```nginx
upstream api_gateway {
    server api-gateway:3001;
}

server {
    listen 443 ssl;
    server_name api.openstacks.com;
    
    location / {
        proxy_pass http://api_gateway;
        proxy_set_header Host $host;
    }
}
```

---

## 📊 Monitoring

### Prometheus Configuration
```yaml
scrape_configs:
  - job_name: 'openstacks-services'
    static_configs:
      - targets: 
        - 'api-gateway:9090'
        - 'auth-service:9090'
        - 'catalog-service:9090'
```

### Health Checks
All services expose:
- `/health` - Basic health check
- `/health/ready` - Readiness probe
- `/health/live` - Liveness probe

---

## 🔒 Security

### SSL Configuration
```bash
# Let's Encrypt SSL
certbot certonly --webroot -w /var/www/html -d api.openstacks.com
```

### Database Security
```sql
-- Create service users
CREATE USER openstacks_auth WITH PASSWORD 'secure_password';
GRANT CONNECT ON DATABASE openstacks_auth TO openstacks_auth;
```

---

## 🚀 CI/CD Pipeline

### GitHub Actions
```yaml
name: Deploy OpenStacks
on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Build and Deploy
        run: |
          docker build -t openstacks/api-gateway .
          kubectl apply -f k8s/
```

---

## 📋 Maintenance

### Backup Script
```bash
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
pg_dump -h postgres -U postgres openstacks > backup_${DATE}.sql
```

### Scaling Commands
```bash
# Scale API Gateway
kubectl scale deployment api-gateway --replicas=5

# Update image
kubectl set image deployment/api-gateway api-gateway=openstacks/api-gateway:v2.0
```

---

## 🔍 Troubleshooting

### Common Issues
1. **Database Connection**: Check DB_HOST and credentials
2. **Service Discovery**: Verify service names in Docker/K8s
3. **Memory Issues**: Increase container memory limits
4. **SSL Errors**: Check certificate validity

### Useful Commands
```bash
# Check service logs
docker-compose logs api-gateway
kubectl logs deployment/api-gateway

# Check service health
curl http://localhost:3001/health

# Database connection test
psql -h postgres -U postgres -d openstacks
```

---

This deployment guide covers the essential steps for deploying OpenStacks in development and production environments. For detailed configuration options, refer to individual service documentation.
