# Testing Strategy and Quality Plan
## Testing layers
- **Unit tests**: money calculations, invoice state transitions, stock calculations, warranty date rules, phone normalization.
- **Service/integration tests**: MongoDB repository behavior, invoice/payment consistency, authorization ownership.
- **API tests**: route validation, status codes, error envelopes, role enforcement, CSRF and rate limits.
- **UI tests**: login/session restore, role-specific route guards, create invoice, customer portal, filters, bill review.
- **End-to-end (Playwright)**: high-value workflows in a controlled environment.
- **Regression tests**: features affected by change.
- **Security tests**: IDOR/tenant isolation, session handling, upload abuse, payment replay.
- **Acceptance tests**: business owner verifies the intended behavior against requirements.

## Core test scenarios
### Auth
- valid login and session restore after reload
- expired/revoked session rejected
- customer cannot open shopkeeper routes
- shopkeeper cannot access another shop's records
- logout invalidates session

### Invoice/payment
- create invoice with one/many line items
- discount/tax calculations and rounding
- cash/online/cheque path
- paid/partial/due transitions
- duplicate payment callback does not double-credit
- overpayment rejected or handled by explicit policy
- cancelled invoice and stock restoration
- PDF data agrees with stored invoice

### Inventory
- adjustment creates movement
- stock cannot become negative unless policy permits
- concurrent invoice creation does not oversell
- movement totals reconcile with stock balance

### Warranty
- create/edit/deactivate warranty
- invoice-linked warranty retrieval
- expiring/expired checks at boundary dates
- customer owner access
- public verification reveals only allowed fields
- hourly scheduler avoids duplicate notifications

### OCR/customer bills
- clear image, low-quality image, rotated image
- missing fields and ambiguous dates
- charges/tax lines not classified as product item
- invoice date preserved rather than replaced with current date
- extracted total reconciles with line items/tax/discount
- user can edit extraction before save
- unsupported type/large file rejected

## Suggested release gates
- Frontend `npm run build` and `npm run lint` pass.
- Backend `npm run build` and `npm run typecheck` pass.
- E2E smoke suite passes against staging.
- No critical/high security findings unresolved.
- Migration tested on backup/staging with rollback instructions.
- Payment sandbox verified.
- Production smoke tests and monitoring checked.

## Test data policy
Use synthetic customers, invoices, phone numbers, and provider test credentials. Do not put real production PII or payment references in tests or screenshots.
