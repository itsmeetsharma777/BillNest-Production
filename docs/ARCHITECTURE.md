# BillNest — System Architecture

## 1. Architecture Overview

BillNest uses a separated frontend/backend architecture.

```text
Browser
   |
   v
Frontend (React + TypeScript + Vite)
   |
   | HTTP API
   v
Backend (Node.js + TypeScript)
   |
   v
MongoDB Atlas
```

The frontend is responsible for presentation and user interaction.

The backend owns business logic, authentication, validation, authorization, persistence, and API responses.

---

## 2. Frontend

### Technology

- React
- TypeScript
- Vite
- Tailwind CSS v4
- React Router
- Lucide icons

### Responsibilities

- Page rendering
- Routing
- Forms
- Client-side validation where appropriate
- API communication
- Theme management
- Dashboard UI
- Loading/error/success states

### Suggested Structure

```text
frontend/
└── src/
    ├── components/
    ├── pages/
    ├── layouts/
    ├── routes/
    ├── hooks/
    ├── lib/
    ├── services/
    ├── types/
    ├── App.tsx
    └── main.tsx
```

---

## 3. Backend

### Technology

- Node.js
- TypeScript
- Express
- MongoDB
- Mongoose

### Layered Structure

```text
Routes
  ↓
Controllers
  ↓
Services
  ↓
Repositories
  ↓
Models
  ↓
MongoDB
```

### Responsibilities

**Routes**
- Define API endpoints.
- Attach middleware and controllers.

**Controllers**
- Receive HTTP requests.
- Validate request flow.
- Call services.
- Return HTTP responses.

**Services**
- Contain business logic.
- Coordinate repositories.
- Enforce application rules.

**Repositories**
- Encapsulate database operations.
- Keep MongoDB access separate from business logic.

**Models**
- Define MongoDB/Mongoose schemas.

**Middleware**
- Authentication.
- Authorization.
- Validation.
- Error handling.
- Request-related concerns.

---

## 4. Authentication Flow

```text
User
 ↓
Login form
 ↓
Frontend API request
 ↓
Auth route
 ↓
Auth controller
 ↓
Auth service
 ↓
User/session repository
 ↓
MongoDB
 ↓
Session/cookie
 ↓
Authenticated frontend
```

Protected requests must verify the authenticated session before accessing private resources.

---

## 5. Core Domain Entities

Potential core entities include:

- User
- Session
- Customer
- Product
- Invoice
- Invoice Item
- Warranty

Relationships should be implemented according to the application's actual model definitions rather than duplicating data unnecessarily.

---

## 6. API Design

Use a consistent API structure:

```text
/api/auth/*
/api/users/*
/api/customers/*
/api/products/*
/api/invoices/*
/api/warranties/*
```

Responses should have predictable success and error structures.

---

## 7. Error Handling

Backend errors should flow through centralized error middleware.

```text
Route
 ↓
Controller
 ↓
Service
 ↓
Error
 ↓
Central Error Middleware
 ↓
Consistent HTTP Response
```

Do not expose internal stack traces or sensitive implementation details in production responses.

---

## 8. Deployment

Production architecture:

```text
User Browser
     |
     v
Frontend Hosting
     |
     v
Backend/API Hosting
     |
     v
MongoDB Atlas
```

Environment-specific values must be stored through environment configuration rather than committed secrets.
