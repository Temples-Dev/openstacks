# OpenStacks Services Overview

This document provides a comprehensive overview of all OpenStacks microservices, their responsibilities, and interactions.

---

## 🏗️ Architecture Overview

OpenStacks follows a **microservices architecture** with each service responsible for a specific domain of library operations. All services communicate through well-defined REST APIs and are orchestrated through a central API Gateway.

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
│  • Authentication & Authorization                               │
│  • Request Routing & Load Balancing                            │
│  • Rate Limiting & Security                                    │
│  • API Documentation & Monitoring                              │
└─────────────────────────────────────────────────────────────────┘
                                │
                ┌───────────────┼───────────────┐
                ▼               ▼               ▼
┌─────────────────────┐ ┌─────────────────────┐ ┌─────────────────────┐
│   Auth Service      │ │  Catalog Service    │ │ Circulation Service │
│     (3002)          │ │     (3003)          │ │       (3004)        │
└─────────────────────┘ └─────────────────────┘ └─────────────────────┘
                ▼               ▼               ▼
┌─────────────────────┐ ┌─────────────────────┐ ┌─────────────────────┐
│ Acquisitions Service│ │ Discovery Service   │ │ Reporting Service   │
│     (3005)          │ │     (3006)          │ │       (3007)        │
└─────────────────────┘ └─────────────────────┘ └─────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Infrastructure Layer                         │
├─────────────────────────────────────────────────────────────────┤
│ PostgreSQL │ Redis │ Elasticsearch │ File Storage │ Message Queue│
└─────────────────────────────────────────────────────────────────┘
```

---

## 🔐 Auth Service (Port 3002)

### Purpose
Central authentication and authorization service managing user accounts, roles, and permissions across the entire OpenStacks ecosystem.

### Core Responsibilities
- **User Authentication** - Login, logout, password management
- **Authorization** - Role-based access control (RBAC)
- **Session Management** - JWT token lifecycle
- **User Profile Management** - Account settings and preferences
- **Security Policies** - Password policies, account lockout, audit logging

### Key Entities
```typescript
User {
  id, username, email, passwordHash, firstName, lastName,
  isActive, lastLoginAt, failedLoginAttempts, lockedUntil
}

Role {
  id, name, description, permissions[], isSystemRole
}

Permission {
  id, name, resource, action, description
}

UserRole {
  userId, roleId, assignedAt, assignedBy, expiresAt
}

Session {
  id, userId, token, refreshToken, expiresAt, ipAddress, userAgent
}
```

### API Endpoints
- `POST /auth/login` - User authentication
- `POST /auth/logout` - Session termination
- `POST /auth/refresh` - Token refresh
- `GET /auth/profile` - User profile
- `PUT /auth/profile` - Update profile
- `POST /auth/change-password` - Password change
- `GET /auth/roles` - Available roles
- `POST /auth/users` - Create user (admin)
- `GET /auth/users` - List users (admin)

### Integration Points
- **All Services** - Authentication validation
- **API Gateway** - Token verification
- **Reporting Service** - User activity analytics

---

## 📚 Catalog Service (Port 3003)

### Purpose
Manages bibliographic records, items, and collection metadata using MARC21 standards for comprehensive library cataloging.

### Core Responsibilities
- **Bibliographic Records** - MARC21 record management
- **Item Management** - Physical and digital item tracking
- **Authority Control** - Authors, subjects, publishers
- **Search & Discovery** - Catalog search capabilities
- **Collection Management** - Holdings and availability
- **Duplicate Detection** - Record deduplication

### Key Entities
```typescript
BibliographicRecord {
  id, marcRecord, title, author, isbn, publisher, publicationYear,
  subjects[], language, materialType, summary, notes
}

Item {
  id, bibliographicRecordId, barcode, callNumber, location,
  status, condition, acquisitionDate, price, notes
}

Copy {
  id, itemId, copyNumber, status, location, condition,
  lastInventoryDate, notes
}

Subject {
  id, heading, authority, subdivisions[], relatedSubjects[]
}

Author {
  id, name, authorityId, dates, biography, works[]
}
```

### API Endpoints
- `GET /catalog/records` - Search bibliographic records
- `POST /catalog/records` - Create new record
- `GET /catalog/records/:id` - Get record details
- `PUT /catalog/records/:id` - Update record
- `GET /catalog/items` - List items
- `POST /catalog/items` - Add new item
- `GET /catalog/subjects` - Browse subjects
- `GET /catalog/authors` - Browse authors
- `GET /catalog/search` - Advanced search
- `GET /catalog/statistics` - Collection statistics

### Integration Points
- **Circulation Service** - Item availability and status
- **Acquisitions Service** - New item processing
- **Discovery Service** - Public catalog search
- **Reporting Service** - Collection analytics

---

## 🔄 Circulation Service (Port 3004)

### Purpose
Handles all patron-related services including check-in/check-out, holds, fines, and patron account management.

### Core Responsibilities
- **Patron Management** - Registration, profiles, account maintenance
- **Circulation Operations** - Check-in, check-out, renewals
- **Hold System** - Reservations and queue management
- **Fine Management** - Calculation, payment, forgiveness
- **Circulation Policies** - Loan periods, limits, restrictions
- **Overdue Processing** - Automated notifications and processing

### Key Entities
```typescript
Patron {
  id, barcode, firstName, lastName, email, phone, address,
  patronType, registrationDate, expirationDate, status, notes
}

Loan {
  id, patronId, itemId, checkoutDate, dueDate, returnDate,
  renewalCount, status, notes
}

Hold {
  id, patronId, itemId, placedDate, expirationDate, status,
  queuePosition, notificationSent, pickupLocation
}

Fine {
  id, patronId, loanId, type, amount, description, status,
  createdDate, paidDate, waivedDate, notes
}

CirculationPolicy {
  id, name, patronTypes[], materialTypes[], loanPeriod,
  renewalLimit, fineRate, maxFines, restrictions
}
```

### API Endpoints
- `GET /circulation/patrons` - List patrons
- `POST /circulation/patrons` - Register patron
- `GET /circulation/patrons/:id` - Patron details
- `POST /circulation/checkout` - Check out item
- `POST /circulation/checkin` - Check in item
- `POST /circulation/renew` - Renew loan
- `GET /circulation/loans` - Active loans
- `POST /circulation/holds` - Place hold
- `GET /circulation/fines` - Patron fines
- `POST /circulation/pay-fine` - Process payment

### Integration Points
- **Catalog Service** - Item availability and details
- **Auth Service** - Patron authentication
- **Discovery Service** - Patron self-service
- **Reporting Service** - Circulation analytics

---

## 💰 Acquisitions Service (Port 3005)

### Purpose
Manages the complete procurement lifecycle including purchase orders, vendor relationships, budgets, and financial workflows.

### Core Responsibilities
- **Vendor Management** - Supplier profiles and performance tracking
- **Purchase Orders** - Order creation, approval, and tracking
- **Budget Management** - Fund allocation and spending controls
- **Invoice Processing** - Three-way matching and payment workflow
- **Receiving** - Item receipt and inventory updates
- **Financial Reporting** - Spending analysis and budget reports

### Key Entities
```typescript
Vendor {
  id, code, name, contactInfo, address, paymentTerms,
  performanceRating, status, orderingPreferences
}

PurchaseOrder {
  id, orderNumber, vendorId, budgetId, status, orderDate,
  expectedDeliveryDate, totalAmount, orderLines[]
}

PurchaseOrderLine {
  id, purchaseOrderId, title, author, isbn, quantity,
  unitPrice, lineTotal, status, fundCode
}

Budget {
  id, code, name, fiscalYear, totalAllocation, totalEncumbered,
  totalExpended, status, allocations[]
}

Invoice {
  id, invoiceNumber, vendorId, purchaseOrderId, totalAmount,
  status, invoiceDate, dueDate, paidDate
}
```

### API Endpoints
- `GET /acquisitions/vendors` - List vendors
- `POST /acquisitions/vendors` - Create vendor
- `GET /acquisitions/purchase-orders` - List orders
- `POST /acquisitions/purchase-orders` - Create order
- `PUT /acquisitions/purchase-orders/:id/approve` - Approve order
- `POST /acquisitions/receive` - Receive items
- `GET /acquisitions/budgets` - List budgets
- `GET /acquisitions/invoices` - List invoices
- `GET /acquisitions/statistics` - Financial statistics

### Integration Points
- **Catalog Service** - New item cataloging
- **Auth Service** - User authorization for financial operations
- **Reporting Service** - Financial analytics and reporting

---

## 🔍 Discovery Service (Port 3006)

### Purpose
Public-facing service providing catalog search, patron self-service, and personalized recommendations for library users.

### Core Responsibilities
- **Public Catalog Search** - Advanced search with facets and filters
- **Patron Self-Service** - Account management, renewals, holds
- **Recommendations** - Personalized content suggestions
- **Collections & Exhibits** - Featured content and displays
- **Search Analytics** - Usage tracking and popular searches
- **Mobile Optimization** - Responsive design for all devices

### Key Features
- **Multi-Modal Search** - Basic, advanced, and fuzzy search
- **Smart Filtering** - Material type, language, availability filters
- **Autocomplete** - Real-time search suggestions
- **Personalization** - Based on borrowing history and preferences
- **Social Features** - Reviews, ratings, and recommendations

### API Endpoints
- `GET /search` - Basic catalog search
- `POST /search/advanced` - Advanced search
- `GET /search/suggestions` - Search autocomplete
- `GET /search/popular` - Popular searches
- `GET /catalog/item/:id` - Item details
- `GET /patron/profile` - Patron account
- `GET /patron/loans` - Current loans
- `POST /patron/renew` - Renew items
- `GET /recommendations/personal` - Personal recommendations
- `GET /collections/featured` - Featured collections

### Integration Points
- **Catalog Service** - Search and item details
- **Circulation Service** - Patron data and transactions
- **Auth Service** - Patron authentication
- **Reporting Service** - Usage analytics

---

## 📊 Reporting Service (Port 3007)

### Purpose
Comprehensive business intelligence platform providing analytics, dashboards, and automated reporting across all library operations.

### Core Responsibilities
- **Real-Time Analytics** - Live system metrics and KPIs
- **Dashboard Management** - Customizable business intelligence dashboards
- **Report Generation** - Automated and on-demand reports
- **Data Aggregation** - Cross-service data collection and analysis
- **Trend Analysis** - Historical analysis and forecasting
- **Alert System** - Proactive monitoring and notifications

### Key Entities
```typescript
Metric {
  id, metricKey, name, category, value, unit, timestamp,
  aggregationPeriod, dimensions, metadata
}

DataSnapshot {
  id, snapshotType, timestamp, data, metadata,
  circulation, financial, collection, patron, operational
}

Report {
  id, name, reportType, format, status, parameters,
  data, filePath, scheduledAt, recipients[]
}

Dashboard {
  id, name, dashboardType, layout, filters, permissions,
  isActive, autoRefresh, refreshInterval
}
```

### API Endpoints
- `GET /analytics/overview` - System overview
- `GET /analytics/circulation` - Circulation metrics
- `GET /analytics/financial` - Financial analytics
- `GET /analytics/collection` - Collection statistics
- `GET /analytics/alerts` - Current alerts
- `GET /dashboards` - List dashboards
- `POST /dashboards` - Create dashboard
- `GET /reports` - List reports
- `POST /reports/generate` - Generate report

### Integration Points
- **All Services** - Data collection and aggregation
- **External Systems** - Data export and integration

---

## 🌐 API Gateway (Port 3001)

### Purpose
Central entry point providing authentication, routing, load balancing, and API management for all OpenStacks services.

### Core Responsibilities
- **Request Routing** - Intelligent routing to appropriate services
- **Authentication** - JWT token validation and user context
- **Load Balancing** - Traffic distribution across service instances
- **Rate Limiting** - API usage controls and throttling
- **API Documentation** - Centralized Swagger documentation
- **Monitoring** - Request logging and performance metrics

### Key Features
- **Service Discovery** - Automatic service registration and health checks
- **Circuit Breaker** - Fault tolerance and resilience
- **Request/Response Transformation** - Data format standardization
- **CORS Handling** - Cross-origin resource sharing
- **Security Headers** - Standard security headers injection

### Routing Configuration
```typescript
Routes = {
  '/auth/*': 'http://auth-service:3002',
  '/catalog/*': 'http://catalog-service:3003',
  '/circulation/*': 'http://circulation-service:3004',
  '/acquisitions/*': 'http://acquisitions-service:3005',
  '/search/*': 'http://discovery-service:3006',
  '/analytics/*': 'http://reporting-service:3007'
}
```

---

## 🔄 Service Communication

### Inter-Service Communication
Services communicate through:
- **HTTP REST APIs** - Synchronous request/response
- **Event-Driven Architecture** - Asynchronous messaging (future)
- **Shared Database Access** - Read-only cross-service queries (limited)

### Data Flow Examples

#### Checkout Process
1. **Discovery Service** → **Catalog Service** (item availability)
2. **Discovery Service** → **Circulation Service** (create loan)
3. **Circulation Service** → **Catalog Service** (update item status)
4. **Circulation Service** → **Reporting Service** (usage metrics)

#### Purchase Order Workflow
1. **Acquisitions Service** → **Budget Service** (validate funds)
2. **Acquisitions Service** → **Vendor Service** (order placement)
3. **Acquisitions Service** → **Catalog Service** (item creation)
4. **Acquisitions Service** → **Reporting Service** (financial metrics)

---

## 🛡️ Security & Monitoring

### Security Features
- **JWT Authentication** - Stateless token-based auth
- **Role-Based Access Control** - Granular permissions
- **API Rate Limiting** - Abuse prevention
- **Input Validation** - Data sanitization and validation
- **Audit Logging** - Comprehensive activity tracking

### Monitoring & Health Checks
- **Health Endpoints** - `/health`, `/health/ready`, `/health/live`
- **Metrics Collection** - Performance and usage metrics
- **Log Aggregation** - Centralized logging with correlation IDs
- **Error Tracking** - Automated error detection and alerting

---

## 🚀 Deployment & Scaling

### Container Architecture
Each service is containerized with:
- **Docker Images** - Optimized production images
- **Health Checks** - Container health monitoring
- **Resource Limits** - CPU and memory constraints
- **Environment Configuration** - Externalized configuration

### Scaling Strategies
- **Horizontal Scaling** - Multiple service instances
- **Load Balancing** - Traffic distribution
- **Database Scaling** - Read replicas and connection pooling
- **Caching** - Redis for performance optimization

---

## 📈 Performance Characteristics

### Response Time Targets
- **Authentication:** < 100ms
- **Catalog Search:** < 200ms
- **Circulation Operations:** < 150ms
- **Report Generation:** < 5 seconds
- **Dashboard Loading:** < 300ms

### Throughput Capacity
- **Concurrent Users:** 1000+
- **Requests per Second:** 1000+
- **Database Connections:** 100+ per service
- **Cache Hit Ratio:** > 80%

---

This services overview provides the foundation for understanding OpenStacks's microservices architecture and how each component contributes to the complete library management solution.
