# ShellNexa - Modern Integrated Library System

**ShellNexa** is a comprehensive, cloud-native library management system built with modern microservices architecture. It provides complete library operations including cataloging, circulation, acquisitions, discovery, and business intelligence.

---

## 🌟 Overview

ShellNexa Phase 1 delivers a **production-ready, enterprise-grade library management platform** with six core microservices working seamlessly together to provide comprehensive library operations.

### Key Features
- 🔐 **Secure Authentication** - JWT-based auth with role-based access control
- 📚 **Complete Cataloging** - MARC21 support with advanced search capabilities
- 🔄 **Full Circulation** - Check-in/out, holds, fines, patron management
- 💰 **Financial Management** - Purchase orders, budgets, vendor management
- 🔍 **Public Discovery** - Patron self-service with recommendations
- 📊 **Business Intelligence** - Real-time analytics and automated reporting

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Client Layer                             │
├─────────────────────────────────────────────────────────────────┤
│  Web App  │  Mobile App  │  Staff Interface  │  Admin Panel    │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                      API Gateway (3001)                        │
│  Authentication • Routing • Load Balancing • Documentation     │
└─────────────────────────────────────────────────────────────────┘
                                │
                ┌───────────────┼───────────────┐
                ▼               ▼               ▼
┌─────────────────────┐ ┌─────────────────────┐ ┌─────────────────────┐
│   Auth Service      │ │  Catalog Service    │ │ Circulation Service │
│     (3002)          │ │     (3003)          │ │       (3004)        │
│ • User Management   │ │ • MARC Records      │ │ • Patron Management │
│ • Authentication    │ │ • Item Tracking     │ │ • Check-in/out      │
│ • Authorization     │ │ • Search & Browse   │ │ • Holds & Fines     │
└─────────────────────┘ └─────────────────────┘ └─────────────────────┘
                ▼               ▼               ▼
┌─────────────────────┐ ┌─────────────────────┐ ┌─────────────────────┐
│ Acquisitions Service│ │ Discovery Service   │ │ Reporting Service   │
│     (3005)          │ │     (3006)          │ │       (3007)        │
│ • Purchase Orders   │ │ • Public Catalog    │ │ • Analytics         │
│ • Vendor Management │ │ • Self-Service      │ │ • Dashboards        │
│ • Budget Tracking   │ │ • Recommendations   │ │ • Automated Reports │
└─────────────────────┘ └─────────────────────┘ └─────────────────────┘
```

---

## 🚀 Quick Start

### Prerequisites
- Docker 24.0+
- Docker Compose 2.20+
- Node.js 18+ (for development)

### Development Setup

1. **Clone Repository**
```bash
git clone https://github.com/your-org/shellnexa.git
cd shellnexa
```

2. **Environment Configuration**
```bash
# Copy environment files
cp .env.example .env
find services -name ".env.example" -exec sh -c 'cp "$1" "${1%.example}"' _ {} \;
```

3. **Start Services**
```bash
# Start infrastructure
docker-compose up -d postgres redis elasticsearch

# Install dependencies
pnpm install

# Start all services
pnpm run dev
```

4. **Access Applications**
- **API Gateway:** http://localhost:3001
- **API Documentation:** http://localhost:3001/docs
- **Individual Services:** Ports 3002-3007

### Production Deployment
```bash
# Production deployment with Docker Compose
docker-compose -f docker-compose.prod.yml up -d

# Or deploy to Kubernetes
kubectl apply -f k8s/
```

---

## 📋 Services Overview

| Service | Port | Purpose | Key Features |
|---------|------|---------|--------------|
| **API Gateway** | 3001 | Central entry point | Authentication, routing, documentation |
| **Auth Service** | 3002 | User management | JWT auth, RBAC, user profiles |
| **Catalog Service** | 3003 | Bibliographic data | MARC21, search, item management |
| **Circulation Service** | 3004 | Patron services | Check-in/out, holds, fines |
| **Acquisitions Service** | 3005 | Procurement | Purchase orders, vendors, budgets |
| **Discovery Service** | 3006 | Public interface | Catalog search, self-service |
| **Reporting Service** | 3007 | Business intelligence | Analytics, dashboards, reports |

---

## 🔧 Technology Stack

### Backend
- **Framework:** NestJS with TypeScript
- **Database:** PostgreSQL with TypeORM
- **Caching:** Redis
- **Search:** Elasticsearch
- **Authentication:** JWT with Passport
- **Documentation:** Swagger/OpenAPI

### Infrastructure
- **Containerization:** Docker & Docker Compose
- **Orchestration:** Kubernetes
- **Monitoring:** Prometheus & Grafana
- **Logging:** ELK Stack
- **CI/CD:** GitHub Actions

### Development
- **Package Manager:** pnpm (monorepo)
- **Code Quality:** ESLint, Prettier
- **Testing:** Jest
- **API Testing:** Supertest

---

## 📚 Documentation

### Core Documentation
- **[Phase 1 Completion Report](./phase1-completion-report.md)** - Comprehensive project summary
- **[Services Overview](./services-overview.md)** - Detailed service architecture
- **[API Documentation](./api-documentation.md)** - Complete API reference
- **[Deployment Guide](./deployment-guide.md)** - Production deployment instructions

### Development Guides
- **[Development Setup](./development-setup.md)** - Local development environment
- **[Contributing Guidelines](./contributing.md)** - Code contribution standards
- **[Testing Guide](./testing.md)** - Testing strategies and practices

### Operations
- **[Monitoring Guide](./monitoring.md)** - System monitoring and alerting
- **[Backup & Recovery](./backup-recovery.md)** - Data protection procedures
- **[Troubleshooting](./troubleshooting.md)** - Common issues and solutions

---

## 🎯 Key Capabilities

### For Library Staff
- **Streamlined Cataloging** - MARC21 support with duplicate detection
- **Efficient Circulation** - Fast check-in/out with automated workflows
- **Financial Control** - Complete budget and vendor management
- **Real-time Analytics** - Live dashboards and operational metrics

### for Library Patrons
- **Self-Service Portal** - Account management and renewals
- **Advanced Search** - Powerful discovery with faceted search
- **Personalized Experience** - Recommendations based on history
- **Mobile Optimized** - Responsive design for all devices

### For Library Administration
- **Business Intelligence** - Comprehensive analytics and reporting
- **Performance Monitoring** - System health and usage metrics
- **Budget Oversight** - Financial tracking and spending analysis
- **Strategic Planning** - Data-driven decision support

---

## 📊 System Metrics

### Performance Characteristics
- **Response Time:** < 200ms for 95% of requests
- **Throughput:** 1000+ requests per second
- **Availability:** 99.9% uptime target
- **Scalability:** Horizontal scaling support

### Code Quality
- **Total Lines of Code:** 50,000+ lines
- **API Endpoints:** 120+ RESTful endpoints
- **Database Tables:** 50+ entities
- **Test Coverage:** Comprehensive unit and integration tests

---

## 🔒 Security Features

- **Authentication:** JWT tokens with refresh mechanism
- **Authorization:** Role-based access control (RBAC)
- **Data Protection:** Encrypted sensitive data
- **API Security:** Rate limiting, CORS, input validation
- **Audit Logging:** Comprehensive activity tracking
- **SSL/TLS:** End-to-end encryption

---

## 🌐 API Access

### Authentication
```bash
# Login to get JWT token
curl -X POST http://localhost:3001/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "admin", "password": "password"}'
```

### Example API Calls
```bash
# Search catalog
curl -H "Authorization: Bearer <token>" \
  "http://localhost:3001/search?q=database+design"

# Get patron loans
curl -H "Authorization: Bearer <token>" \
  "http://localhost:3001/circulation/patrons/123/loans"

# System analytics
curl -H "Authorization: Bearer <token>" \
  "http://localhost:3001/analytics/overview"
```

### Interactive Documentation
- **Swagger UI:** http://localhost:3001/docs
- **API Explorer:** Test endpoints directly in browser
- **Schema Documentation:** Complete request/response schemas

---

## 🚀 Deployment Options

### Development
```bash
# Local development with hot reload
pnpm run dev

# Docker development environment
docker-compose -f docker-compose.dev.yml up
```

### Production
```bash
# Docker Compose production
docker-compose -f docker-compose.prod.yml up -d

# Kubernetes deployment
kubectl apply -f k8s/

# Cloud deployment (AWS/GCP/Azure)
# See deployment guide for cloud-specific instructions
```

---

## 📈 Monitoring & Observability

### Health Checks
- **Service Health:** `/health` endpoints for all services
- **Readiness Probes:** `/health/ready` for deployment readiness
- **Liveness Probes:** `/health/live` for container health

### Metrics & Monitoring
- **Prometheus:** Metrics collection and alerting
- **Grafana:** Visualization dashboards
- **ELK Stack:** Centralized logging and analysis
- **Custom Dashboards:** Business-specific KPIs

### Alerting
- **System Alerts:** Service downtime, high error rates
- **Business Alerts:** Budget thresholds, overdue items
- **Performance Alerts:** Response time, throughput issues

---

## 🤝 Contributing

We welcome contributions to ShellNexa! Please see our [Contributing Guidelines](./contributing.md) for details on:

- Code standards and style guide
- Pull request process
- Issue reporting
- Development workflow
- Testing requirements

### Development Workflow
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

---

## 📄 License

ShellNexa is licensed under the [MIT License](../LICENSE). See the LICENSE file for details.

---

## 🆘 Support

### Getting Help
- **Documentation:** Comprehensive guides in `/md` directory
- **Issues:** GitHub Issues for bug reports and feature requests
- **Discussions:** GitHub Discussions for questions and ideas
- **Wiki:** Additional documentation and examples

### Professional Support
For enterprise support, training, and custom development:
- **Email:** support@shellnexa.com
- **Website:** https://shellnexa.com
- **Documentation:** https://docs.shellnexa.com

---

## 🎉 Acknowledgments

ShellNexa Phase 1 represents a complete, production-ready library management system built with modern technologies and best practices. This achievement demonstrates the power of microservices architecture in creating scalable, maintainable enterprise software.

**Special thanks to all contributors and the library community for their valuable feedback and support.**

---

## 🔮 What's Next - Phase 2

Phase 1 completion enables Phase 2 development:
- **Multi-branch Support** - Support for library systems with multiple locations
- **Interlibrary Loan (ILL)** - Resource sharing between libraries
- **E-resource Management** - Digital content and access control
- **Digital Repository** - Institutional repository capabilities
- **Advanced Analytics** - Machine learning and predictive analytics

**The foundation is set. The future is bright.** 🚀

---

*ShellNexa - Empowering libraries with modern technology*
