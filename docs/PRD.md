# BillNest — Product Requirements Document

## 1. Product Overview

**BillNest** is a web platform for managing billing, customers, purchases, invoices, and product warranties in one organized place.

It supports two primary roles:

- **Shopkeeper** — creates and manages invoices, customers, products, and warranties.
- **Customer** — accesses purchases, digital invoices, and warranty information.

### Product Vision

> Every bill. One organized home.

BillNest aims to replace scattered paper bills, messages, and manually maintained records with a simple digital system.

---

## 2. Goals

### Primary Goals

1. Allow shopkeepers to create and manage invoices.
2. Maintain organized customer records.
3. Track products and warranty information.
4. Allow customers to access their purchase history.
5. Provide digital invoice and warranty information.
6. Provide secure authentication for both roles.
7. Keep the interface simple and responsive.
8. Persist application data using MongoDB.

### Non-Goals

- Full accounting/ERP functionality.
- Banking or payment processing.
- Replacing professional tax/accounting software.
- Native mobile applications in the first release.

---

## 3. User Roles

### Shopkeeper

Can:

- Register/login.
- Manage profile/business information.
- Create invoices.
- Manage customers.
- Manage products.
- Track warranties.
- View reports/dashboard information.
- Logout securely.

### Customer

Can:

- Register/login.
- View purchases.
- View digital invoices.
- View warranty details.
- Track warranty expiry.
- Logout securely.

---

## 4. Core Features

### Authentication

- Registration
- Login
- Logout
- Current-user/session check
- Protected routes
- Role-aware access

### Invoice Management

- Create invoice
- Store invoice details
- View invoices
- Associate invoice with customer
- Associate products/items with invoice

### Customer Management

- Create customer records
- View customers
- Update customer information
- Search/filter customer records

### Product Management

- Store product information
- Associate products with invoices
- Store warranty information

### Warranty Management

- Warranty start date
- Warranty expiry date
- Automatically generated warranty/serial information where applicable
- Warranty status
- Customer access to warranty details

### Dashboard

Shopkeeper dashboard should surface:

- Total invoices
- Total customers
- Active warranties
- Recent invoices
- Relevant business activity

Customer dashboard should surface:

- Purchases
- Invoices
- Warranty information
- Warranty status/expiry

---

## 5. UX Requirements

The interface should:

- Use a clean SaaS visual language.
- Support Light, Dark, and System themes.
- Be responsive for desktop and smaller screens.
- Use clear role separation.
- Provide visible loading, success, and error states.
- Avoid unnecessary visual clutter.
- Keep important actions easy to discover.

---

## 6. Security Requirements

- Authentication must be handled server-side.
- Protected resources must require an authenticated session.
- User roles must be validated server-side.
- Passwords must never be stored in plain text.
- Sensitive configuration must use environment variables.
- Authentication/session cookies must use appropriate security flags.
- Users must not be able to access another user's protected resources.

---

## 7. Success Criteria

The MVP is successful when:

- A shopkeeper can register, login, create/manage invoices, customers, products and warranties.
- A customer can register, login, and access their purchases/invoices/warranties.
- Unauthorized API access returns an appropriate authentication error.
- Logout invalidates the session.
- Frontend production build completes successfully.
- Backend and database operate reliably in the deployed environment.
