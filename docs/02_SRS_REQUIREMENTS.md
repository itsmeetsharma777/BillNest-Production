# Software Requirements Specification (SRS)
## 1. Introduction
This SRS describes the system capabilities, actors, constraints, and quality expectations for BillNest. It is intended as a baseline for development and acceptance testing.

## 2. Functional requirements
### Identity and access
- FR-01: Users can register/login according to their account role.
- FR-02: Authenticated session is restored after reload through server-side session/cookie.
- FR-03: Users can explicitly log out.
- FR-04: Password reset flows are supported by dedicated backend routes.
- FR-05: Routes enforce role boundaries between shopkeeper and customer.
- FR-06: Shopkeeper operational pages require a shop to be configured where applicable.

### Shop and catalog
- FR-10: Shopkeeper can manage shop information.
- FR-11: Shopkeeper can manage products, product variants, categories, and brands.
- FR-12: Product identifiers (SKU/barcode) should be unique per shop when populated; backend startup performs index normalization/creation for non-empty identifiers.
- FR-13: Product imagery may be handled through Cloudinary integration.
- FR-14: Catalog data is associated with a shop.

### Customers and account ledger
- FR-20: Shopkeeper can manage customer records.
- FR-21: Customer records can be associated with invoices and customer-facing account data.
- FR-22: Customer account/ledger views show relevant transaction and due information.
- FR-23: Global customer-by-phone behavior and migration have been discussed/implemented; exact ownership and cross-shop visibility rules must be verified from customer repository/service code.

### Invoices and payments
- FR-30: Shopkeeper can create and view invoices.
- FR-31: Invoice records include shop/customer association, invoice number, dates, state, totals, paid amount, and due amount.
- FR-32: Invoice states include draft, paid, partially_paid, and cancelled (as defined in the invoice model).
- FR-33: Payment method values include cash, online, and cheque in the invoice schema.
- FR-34: Online payments integrate with Razorpay.
- FR-35: Invoice PDF generation/download is supported.
- FR-36: Payment records should provide a traceable association to invoices.
- FR-37: Cancellation/stock-restoration behavior must be tested against the current service implementation.

### Inventory
- FR-40: Shopkeeper can inspect inventory movements.
- FR-41: Shopkeeper can inspect movements for a particular product.
- FR-42: Shopkeeper can adjust stock.
- FR-43: Invoice stock effects and cancellations must be reconciled and auditable.

### Warranty
- FR-50: Shopkeeper can create, list, inspect, update, and deactivate warranty records.
- FR-51: Warranties can be queried for expiry windows and invoice association.
- FR-52: A public warranty verification/card route exists under `/api/public`.
- FR-53: Customer portal exposes warranty lists and details.

### OCR/document handling
- FR-60: Authenticated shopkeepers can submit bill/document images to the OCR API for structured extraction.
- FR-61: OCR output must be reviewed before committing financial records.
- FR-62: Extracted invoice date, line items, charges, customer/vendor data, totals, and payment status need validation.
- FR-63: Customer bill upload/review workflows exist in customer routes/pages; their exact behavior must be checked in relevant controller/service files.

### Reporting and notifications
- FR-70: Dashboard and report modules provide operational summaries.
- FR-71: GST/report outputs should be checked for calculation accuracy.
- FR-72: Notifications can be shown to shopkeepers and customers.
- FR-73: Warranty notification scheduler runs at server startup and hourly according to `server.ts`.

## 3. Non-functional requirements
- NFR-01 Security: use Helmet, credentialed CORS configured to the frontend origin, CSRF protection, rate limits, authenticated sessions, and role guards.
- NFR-02 Reliability: backend should start only after database connection and startup index setup succeed.
- NFR-03 Data integrity: invoice, payment, and stock updates should be consistent; use transaction strategy where deployment supports it.
- NFR-04 Maintainability: TypeScript, modular route/controller/service/repository/model organization.
- NFR-05 Usability: responsive shopkeeper and customer interfaces, accessible forms, legible themes.
- NFR-06 Performance: paginate list endpoints; bound payloads and uploads; monitor query indexes and large frontend bundles.
- NFR-07 Observability: structured logging and health endpoint.
- NFR-08 Privacy: limit exposure of customer PII, invoice images, and provider credentials.
- NFR-09 Recoverability: maintain database backup/restore procedure and validate restoration.
- NFR-10 Compatibility: frontend build/typecheck and backend build/typecheck should pass.

## 4. Constraints and assumptions
- Frontend: React 19, TypeScript, Vite, React Router, React Query, Tailwind CSS v4, React Hook Form, Zod.
- Backend: Node.js, Express 5, TypeScript, Mongoose 9, MongoDB.
- Deployment context historically described as Vercel frontend and Render backend; verify current deployed targets.
- Secrets must be supplied through environment variables, never committed.
- Requirement status should be maintained separately from feature wish lists.
