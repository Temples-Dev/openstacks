# ShellNexa API Documentation

This document provides comprehensive API documentation for all ShellNexa services, including endpoints, request/response formats, and integration examples.

---

## 🌐 API Gateway Overview

**Base URL:** `http://localhost:3001` (development)  
**Authentication:** Bearer JWT tokens  
**Content-Type:** `application/json`  
**API Version:** v1  

### Global Headers
```http
Authorization: Bearer <jwt_token>
Content-Type: application/json
X-Request-ID: <unique_request_id>
```

### Standard Response Format
```json
{
  "success": true,
  "data": { ... },
  "message": "Operation completed successfully",
  "timestamp": "2025-10-14T12:00:00Z",
  "requestId": "req_123456789"
}
```

### Error Response Format
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input parameters",
    "details": [
      {
        "field": "email",
        "message": "Invalid email format"
      }
    ]
  },
  "timestamp": "2025-10-14T12:00:00Z",
  "requestId": "req_123456789"
}
```

---

## 🔐 Auth Service API

### Authentication Endpoints

#### POST /auth/login
Authenticate user and obtain JWT tokens.

**Request:**
```json
{
  "username": "librarian@example.com",
  "password": "securePassword123"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "user_123",
      "username": "librarian@example.com",
      "firstName": "Jane",
      "lastName": "Doe",
      "roles": ["librarian", "cataloger"]
    },
    "tokens": {
      "accessToken": "eyJhbGciOiJIUzI1NiIs...",
      "refreshToken": "eyJhbGciOiJIUzI1NiIs...",
      "expiresIn": 3600
    }
  }
}
```

#### POST /auth/refresh
Refresh expired access token.

**Request:**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
}
```

#### POST /auth/logout
Invalidate current session.

**Request:**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
}
```

### User Management Endpoints

#### GET /auth/profile
Get current user profile.

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "user_123",
    "username": "librarian@example.com",
    "firstName": "Jane",
    "lastName": "Doe",
    "email": "jane.doe@library.org",
    "roles": ["librarian", "cataloger"],
    "preferences": {
      "theme": "light",
      "language": "en",
      "timezone": "America/New_York"
    },
    "lastLoginAt": "2025-10-14T08:00:00Z"
  }
}
```

#### PUT /auth/profile
Update user profile.

**Request:**
```json
{
  "firstName": "Jane",
  "lastName": "Smith",
  "email": "jane.smith@library.org",
  "preferences": {
    "theme": "dark",
    "language": "en"
  }
}
```

#### POST /auth/change-password
Change user password.

**Request:**
```json
{
  "currentPassword": "oldPassword123",
  "newPassword": "newSecurePassword456"
}
```

---

## 📚 Catalog Service API

### Bibliographic Records

#### GET /catalog/records
Search bibliographic records.

**Query Parameters:**
- `q` - Search query
- `page` - Page number (default: 1)
- `limit` - Results per page (default: 20)
- `sort` - Sort field (title, author, date)
- `order` - Sort order (asc, desc)
- `materialType` - Filter by material type
- `language` - Filter by language

**Response:**
```json
{
  "success": true,
  "data": {
    "records": [
      {
        "id": "bib_123",
        "title": "Introduction to Library Science",
        "author": "Smith, John",
        "isbn": "978-0123456789",
        "publisher": "Academic Press",
        "publicationYear": 2024,
        "materialType": "book",
        "language": "en",
        "subjects": ["Library Science", "Information Management"],
        "summary": "Comprehensive introduction to modern library science...",
        "items": [
          {
            "id": "item_456",
            "barcode": "31234567890123",
            "callNumber": "020.1 SMI",
            "status": "available",
            "location": "Main Collection"
          }
        ]
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 150,
      "pages": 8
    }
  }
}
```

#### POST /catalog/records
Create new bibliographic record.

**Request:**
```json
{
  "title": "Advanced Database Systems",
  "author": "Johnson, Mary",
  "isbn": "978-0987654321",
  "publisher": "Tech Publications",
  "publicationYear": 2024,
  "materialType": "book",
  "language": "en",
  "subjects": ["Database Systems", "Computer Science"],
  "summary": "Advanced concepts in database design and implementation...",
  "marcRecord": {
    "leader": "00000nam a2200000 a 4500",
    "fields": [
      {
        "tag": "245",
        "indicators": ["1", "0"],
        "subfields": [
          {"code": "a", "value": "Advanced Database Systems"}
        ]
      }
    ]
  }
}
```

#### GET /catalog/records/:id
Get specific bibliographic record.

#### PUT /catalog/records/:id
Update bibliographic record.

#### DELETE /catalog/records/:id
Delete bibliographic record.

### Items Management

#### GET /catalog/items
List items with filtering options.

#### POST /catalog/items
Add new item to existing record.

**Request:**
```json
{
  "bibliographicRecordId": "bib_123",
  "barcode": "31234567890124",
  "callNumber": "020.1 SMI c.2",
  "location": "Reference Collection",
  "status": "available",
  "condition": "good",
  "acquisitionDate": "2024-10-01",
  "price": 89.99,
  "notes": "Second copy for reference"
}
```

#### GET /catalog/items/:id
Get item details.

#### PUT /catalog/items/:id
Update item information.

### Search and Browse

#### GET /catalog/search
Advanced catalog search with facets.

**Query Parameters:**
- `title` - Title search
- `author` - Author search
- `subject` - Subject search
- `isbn` - ISBN search
- `keyword` - Keyword search
- `materialType[]` - Material type filters
- `language[]` - Language filters
- `publicationYear` - Publication year range
- `availability` - Available items only

**Response:**
```json
{
  "success": true,
  "data": {
    "results": [...],
    "facets": {
      "materialType": [
        {"value": "book", "count": 1250},
        {"value": "dvd", "count": 340},
        {"value": "audiobook", "count": 180}
      ],
      "language": [
        {"value": "en", "count": 1500},
        {"value": "es", "count": 200},
        {"value": "fr", "count": 70}
      ],
      "subjects": [
        {"value": "Computer Science", "count": 150},
        {"value": "History", "count": 200}
      ]
    },
    "pagination": {...}
  }
}
```

#### GET /catalog/subjects
Browse subjects hierarchy.

#### GET /catalog/authors
Browse authors with works count.

---

## 🔄 Circulation Service API

### Patron Management

#### GET /circulation/patrons
List patrons with search and filtering.

**Query Parameters:**
- `q` - Search query (name, email, barcode)
- `patronType` - Filter by patron type
- `status` - Filter by status
- `page` - Page number
- `limit` - Results per page

#### POST /circulation/patrons
Register new patron.

**Request:**
```json
{
  "barcode": "21234567890123",
  "firstName": "Alice",
  "lastName": "Johnson",
  "email": "alice.johnson@email.com",
  "phone": "+1-555-0123",
  "address": {
    "street": "123 Main St",
    "city": "Anytown",
    "state": "NY",
    "zipCode": "12345"
  },
  "patronType": "adult",
  "expirationDate": "2025-12-31"
}
```

#### GET /circulation/patrons/:id
Get patron details with current loans and holds.

**Response:**
```json
{
  "success": true,
  "data": {
    "patron": {
      "id": "patron_123",
      "barcode": "21234567890123",
      "firstName": "Alice",
      "lastName": "Johnson",
      "email": "alice.johnson@email.com",
      "patronType": "adult",
      "status": "active",
      "registrationDate": "2024-01-15",
      "expirationDate": "2025-12-31"
    },
    "summary": {
      "currentLoans": 3,
      "currentHolds": 1,
      "totalFines": 2.50,
      "overdueItems": 0
    },
    "loans": [...],
    "holds": [...],
    "fines": [...]
  }
}
```

### Circulation Operations

#### POST /circulation/checkout
Check out item to patron.

**Request:**
```json
{
  "patronBarcode": "21234567890123",
  "itemBarcode": "31234567890123",
  "dueDate": "2024-11-14",
  "notes": "Regular checkout"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "loan": {
      "id": "loan_456",
      "patronId": "patron_123",
      "itemId": "item_456",
      "checkoutDate": "2024-10-14",
      "dueDate": "2024-11-14",
      "status": "active",
      "renewalCount": 0
    },
    "receipt": {
      "title": "Introduction to Library Science",
      "dueDate": "2024-11-14",
      "renewalsRemaining": 2
    }
  }
}
```

#### POST /circulation/checkin
Check in returned item.

**Request:**
```json
{
  "itemBarcode": "31234567890123",
  "returnDate": "2024-10-14T14:30:00Z",
  "condition": "good",
  "notes": "Returned in good condition"
}
```

#### POST /circulation/renew
Renew loan.

**Request:**
```json
{
  "loanId": "loan_456",
  "newDueDate": "2024-12-14"
}
```

### Holds Management

#### POST /circulation/holds
Place hold on item.

**Request:**
```json
{
  "patronId": "patron_123",
  "itemId": "item_456",
  "pickupLocation": "Main Library",
  "expirationDate": "2024-11-14",
  "notificationMethod": "email"
}
```

#### GET /circulation/holds
List holds with filtering options.

#### PUT /circulation/holds/:id
Update hold (suspend, activate, cancel).

#### DELETE /circulation/holds/:id
Cancel hold.

### Fines Management

#### GET /circulation/fines
List fines with filtering.

#### POST /circulation/fines/:id/pay
Process fine payment.

**Request:**
```json
{
  "amount": 5.00,
  "paymentMethod": "cash",
  "transactionId": "txn_789",
  "notes": "Paid in full"
}
```

#### POST /circulation/fines/:id/waive
Waive fine.

---

## 💰 Acquisitions Service API

### Vendor Management

#### GET /acquisitions/vendors
List vendors with search and filtering.

#### POST /acquisitions/vendors
Create new vendor.

**Request:**
```json
{
  "code": "ACME001",
  "name": "ACME Book Distributors",
  "contactPerson": "John Smith",
  "email": "orders@acmebooks.com",
  "phone": "+1-555-0199",
  "address": {
    "street": "456 Commerce Ave",
    "city": "Business City",
    "state": "CA",
    "zipCode": "90210"
  },
  "paymentTerms": "net_30",
  "discountPercentage": 15.0,
  "vendorType": "books"
}
```

### Purchase Orders

#### GET /acquisitions/purchase-orders
List purchase orders with filtering.

#### POST /acquisitions/purchase-orders
Create new purchase order.

**Request:**
```json
{
  "vendorId": "vendor_123",
  "budgetId": "budget_456",
  "orderType": "standard",
  "expectedDeliveryDate": "2024-11-15",
  "shippingAddress": "Library Receiving Dept...",
  "specialInstructions": "Deliver to back entrance",
  "orderLines": [
    {
      "title": "Database Design Fundamentals",
      "author": "Wilson, Robert",
      "isbn": "978-1122334455",
      "publisher": "Tech Press",
      "materialType": "book",
      "quantityOrdered": 2,
      "unitPrice": 79.99,
      "listPrice": 89.99,
      "fundCode": "COMP_SCI_2024"
    }
  ]
}
```

#### PUT /acquisitions/purchase-orders/:id/approve
Approve purchase order.

#### PUT /acquisitions/purchase-orders/:id/send
Send order to vendor.

#### POST /acquisitions/purchase-orders/:id/receive
Receive items from order.

**Request:**
```json
{
  "receiptType": "complete",
  "notes": "All items received in good condition",
  "receiptLines": [
    {
      "purchaseOrderLineId": "line_789",
      "quantityReceived": 2,
      "condition": "good",
      "notes": "Perfect condition"
    }
  ]
}
```

### Budget Management

#### GET /acquisitions/budgets
List budgets with utilization data.

#### POST /acquisitions/budgets
Create new budget.

#### GET /acquisitions/budgets/:id
Get budget details with allocations.

**Response:**
```json
{
  "success": true,
  "data": {
    "budget": {
      "id": "budget_456",
      "code": "FY2024_MAIN",
      "name": "FY 2024 Main Collection",
      "fiscalYear": 2024,
      "totalAllocation": 100000.00,
      "totalEncumbered": 25000.00,
      "totalExpended": 45000.00,
      "availableBalance": 30000.00,
      "utilizationPercentage": 70.0,
      "status": "active"
    },
    "allocations": [
      {
        "fundCode": "BOOKS_2024",
        "fundName": "Books Collection",
        "allocatedAmount": 60000.00,
        "encumberedAmount": 15000.00,
        "expendedAmount": 25000.00,
        "availableBalance": 20000.00
      }
    ]
  }
}
```

### Invoice Processing

#### GET /acquisitions/invoices
List invoices with filtering.

#### POST /acquisitions/invoices
Create new invoice.

#### PUT /acquisitions/invoices/:id/approve
Approve invoice for payment.

#### PUT /acquisitions/invoices/:id/dispute
Dispute invoice.

---

## 🔍 Discovery Service API

### Public Search

#### GET /search
Basic catalog search for public users.

**Query Parameters:**
- `q` - Search query
- `page` - Page number
- `limit` - Results per page
- `sort` - Sort option
- `filters` - JSON encoded filters
- `facets` - Include facets (true/false)

**Response:**
```json
{
  "success": true,
  "data": {
    "results": [
      {
        "id": "bib_123",
        "title": "Introduction to Library Science",
        "author": "Smith, John",
        "publicationYear": 2024,
        "materialType": "book",
        "availability": {
          "totalCopies": 3,
          "availableCopies": 2,
          "status": "available"
        },
        "coverImage": "https://covers.example.com/123.jpg",
        "summary": "Comprehensive introduction..."
      }
    ],
    "facets": {
      "materialType": [...],
      "subjects": [...],
      "authors": [...]
    },
    "suggestions": [
      "library science",
      "library management",
      "information science"
    ],
    "pagination": {...}
  }
}
```

#### POST /search/advanced
Advanced search with multiple criteria.

#### GET /search/suggestions
Get search suggestions for autocomplete.

### Patron Self-Service

#### GET /patron/profile
Get patron profile (requires authentication).

#### GET /patron/loans
Get current loans.

#### POST /patron/renew
Renew loans.

#### GET /patron/holds
Get current holds.

#### POST /patron/holds
Place new hold.

#### GET /patron/fines
Get outstanding fines.

#### GET /patron/history
Get borrowing history.

### Recommendations

#### GET /recommendations/personal
Get personalized recommendations.

#### GET /recommendations/similar/:id
Get items similar to specified item.

#### GET /recommendations/popular
Get popular items.

#### GET /recommendations/new
Get new and noteworthy items.

### Collections

#### GET /collections/featured
Get featured collections.

#### GET /collections/seasonal
Get seasonal collections.

#### GET /collections/:id
Get specific collection details.

---

## 📊 Reporting Service API

### Analytics

#### GET /analytics/overview
Get comprehensive system overview.

**Response:**
```json
{
  "success": true,
  "data": {
    "timestamp": "2024-10-14T12:00:00Z",
    "circulation": {
      "totalCheckouts": 1250,
      "totalCheckins": 1180,
      "currentLoans": 850,
      "overdueItems": 45,
      "totalHolds": 120
    },
    "financial": {
      "totalSpending": 75000.00,
      "budgetUtilization": 75.0,
      "pendingOrders": 15,
      "overdueOrders": 2
    },
    "collection": {
      "totalItems": 25000,
      "newAcquisitions": 150,
      "turnoverRate": 3.2
    },
    "patron": {
      "totalPatrons": 5000,
      "activePatrons": 2500,
      "newRegistrations": 25
    },
    "alerts": [
      {
        "type": "financial",
        "severity": "warning",
        "message": "Budget utilization approaching 80% threshold"
      }
    ]
  }
}
```

#### GET /analytics/circulation
Get circulation-specific metrics.

#### GET /analytics/financial
Get financial analytics.

#### GET /analytics/trends
Get trend analysis.

### Dashboard Management

#### GET /dashboards
List available dashboards.

#### POST /dashboards
Create new dashboard.

#### GET /dashboards/:id
Get dashboard configuration.

#### PUT /dashboards/:id
Update dashboard.

### Report Generation

#### GET /reports
List generated reports.

#### POST /reports/generate
Generate new report.

**Request:**
```json
{
  "name": "Monthly Circulation Report",
  "reportType": "circulation_summary",
  "format": "pdf",
  "parameters": {
    "dateRange": {
      "startDate": "2024-09-01",
      "endDate": "2024-09-30"
    },
    "includeCharts": true,
    "groupBy": ["materialType", "location"]
  },
  "recipients": [
    {
      "email": "director@library.org",
      "name": "Library Director"
    }
  ]
}
```

#### GET /reports/:id
Get report details.

#### GET /reports/:id/download
Download generated report file.

---

## 🔧 Integration Examples

### Complete Checkout Workflow

```javascript
// 1. Search for item
const searchResponse = await fetch('/search?q=database+design');
const items = searchResponse.data.results;

// 2. Check item availability
const itemResponse = await fetch(`/catalog/items/${itemId}`);
const item = itemResponse.data;

// 3. Authenticate patron
const authResponse = await fetch('/auth/login', {
  method: 'POST',
  body: JSON.stringify({
    username: 'patron@email.com',
    password: 'password'
  })
});

// 4. Checkout item
const checkoutResponse = await fetch('/circulation/checkout', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${authResponse.data.tokens.accessToken}`
  },
  body: JSON.stringify({
    patronBarcode: '21234567890123',
    itemBarcode: '31234567890123'
  })
});
```

### Purchase Order Creation

```javascript
// 1. Create vendor if needed
const vendorResponse = await fetch('/acquisitions/vendors', {
  method: 'POST',
  body: JSON.stringify({
    code: 'NEWVENDOR',
    name: 'New Book Vendor',
    email: 'orders@newvendor.com'
  })
});

// 2. Check budget availability
const budgetResponse = await fetch('/acquisitions/budgets/budget_123');

// 3. Create purchase order
const orderResponse = await fetch('/acquisitions/purchase-orders', {
  method: 'POST',
  body: JSON.stringify({
    vendorId: vendorResponse.data.id,
    budgetId: 'budget_123',
    orderLines: [
      {
        title: 'New Database Book',
        isbn: '978-1234567890',
        quantityOrdered: 1,
        unitPrice: 89.99
      }
    ]
  })
});

// 4. Approve order
await fetch(`/acquisitions/purchase-orders/${orderResponse.data.id}/approve`, {
  method: 'PUT'
});
```

---

## 🚨 Error Handling

### Common Error Codes

| Code | Description | HTTP Status |
|------|-------------|-------------|
| `VALIDATION_ERROR` | Invalid input parameters | 400 |
| `AUTHENTICATION_REQUIRED` | Missing or invalid authentication | 401 |
| `INSUFFICIENT_PERMISSIONS` | User lacks required permissions | 403 |
| `RESOURCE_NOT_FOUND` | Requested resource doesn't exist | 404 |
| `RESOURCE_CONFLICT` | Resource already exists or conflict | 409 |
| `RATE_LIMIT_EXCEEDED` | Too many requests | 429 |
| `INTERNAL_SERVER_ERROR` | Unexpected server error | 500 |
| `SERVICE_UNAVAILABLE` | Service temporarily unavailable | 503 |

### Error Response Examples

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "details": [
      {
        "field": "email",
        "message": "Invalid email format",
        "value": "invalid-email"
      }
    ]
  },
  "timestamp": "2024-10-14T12:00:00Z",
  "requestId": "req_123456789"
}
```

---

## 📝 Rate Limiting

### Default Limits
- **Authentication endpoints:** 5 requests per minute
- **Search endpoints:** 100 requests per minute
- **CRUD operations:** 60 requests per minute
- **Report generation:** 10 requests per hour

### Rate Limit Headers
```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1634208000
```

---

This API documentation provides comprehensive coverage of all ShellNexa service endpoints. For interactive API exploration, visit the Swagger UI at each service's `/docs` endpoint.
