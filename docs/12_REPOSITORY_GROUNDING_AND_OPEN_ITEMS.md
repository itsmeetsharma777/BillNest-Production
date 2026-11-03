# Repository Grounding and Open Verification Items
## Source inspected
Repository: `https://github.com/itsmeetsharma777/BillNest-Production`
Default branch: `main`
Tree snapshot SHA observed: `2ebef3dff6f49da9147f5e73b035e988e2865f33`

Files directly inspected in this documentation preparation included:
- `backend/package.json`
- `frontend/package.json`
- `backend/src/server.ts`
- `backend/src/config/env.ts`
- `backend/src/models/invoice.model.ts` (partial schema content)
- `backend/src/controllers/warranty.controller.ts`
- `backend/src/middleware/auth.middleware.ts`
- `frontend/src/router/index.tsx`
- `frontend/src/router/protected-routes.tsx`
- `frontend/src/context/AuthContext.tsx`
- repository tree and module file inventory

## Repository observations
- Backend package uses Express 5, Mongoose 9, Zod 4, Argon2, JWT package, Cloudinary, OpenAI package, PDFKit, Resend, Pino, Helmet, express-rate-limit.
- Frontend package uses React 19, TypeScript, Vite 8, React Router 7, React Query 5, Axios, React Hook Form, Zod, Tailwind 4, and QR code library.
- Server mounts distinct domain route groups for shop, customers, products, catalog, categories, brands, invoices, warranties, reports, dashboard, documents, OCR, customer bills, notifications, inventory, customer portal, public warranty, customer account, and customer notifications.
- Auth middleware reads cookie, hashes its token, resolves session, then loads active user.
- Startup server applies security middleware and runs a warranty notification check immediately and hourly.
- Invoice schema status enum includes draft, paid, partially_paid, cancelled; payment method enum cash, online, cheque.
- Frontend routes split shopkeeper and customer roles and route guard is applied.
- AuthContext fetches `/auth/me` with credentialed cookies.

## Items requiring deeper file-by-file verification before claiming exact contract
- Full API method/path inventory from every route file.
- Complete schema field definitions, indexes, and relationship constraints for all models.
- Full business logic for invoice create/cancel/stock restoration and payment confirmation.
- Razorpay signature verification, callback/webhook route, idempotency and reconciliation.
- Exact customer phone normalization/global visibility and migration rollback procedure.
- Exact OCR prompt/response schema, supported file formats, confidence/error behavior.
- Full customer bill OCR review acceptance path.
- Cloudinary upload lifecycle and document retention.
- Subscription/staff features, if intended, are not confirmed by the inspected route mounts.
- CI workflow details and Playwright repository's actual test coverage should be reviewed separately.
- Deployment configuration, hosting logs, and current live environment settings are not included in repository review.

## Maintenance
Update this pack when routes, schemas, environment variables, integrations, or business rules change. Mark items implemented/planned/removed in the SRS or a release traceability matrix. Do not treat inferred diagrams as exact schema declarations without verification.
