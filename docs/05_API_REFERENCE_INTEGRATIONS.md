# API and Integration Reference
## API conventions
- API prefix: `/api`.
- JSON request/response convention commonly uses `{ success, message?, data? }`.
- Authenticated browser calls use cookies with `credentials: include`.
- Request validation is performed through Zod schemas in validators.
- Invalid IDs and domain errors use structured `ApiError` values and global error middleware.

## Route mount index
Refer to Architecture document for all server mounts. A mount is a prefix, not a complete endpoint contract. Endpoint method/path details must be confirmed in each `*.routes.ts` file.

## Auth
- `/api/auth` — auth routes and password reset routes.
- Session middleware reads `SESSION_COOKIE_NAME`, hashes token with `hashSessionToken`, queries session repository, then resolves active user.
- `GET /api/auth/me` is called by frontend to restore auth state.
- Logout is an explicit POST action in the frontend context.

## Invoice / payments
- `/api/invoices` — invoice CRUD/list/detail domain.
- `/api` payment controller families include invoice-payment and Razorpay payment controllers.
- Razorpay key ID and secret are optional environment schema fields; use test credentials in non-production.
- Payment flow should verify provider signature on server, reconcile payment against invoice, and guard duplicate webhook/callback execution. Verify actual implementation before asserting exact callback endpoint.

## OCR
- `/api/ocr` — route source comments identify `POST /api/ocr/process`.
- Server config has `GEMINI_API_KEY` optional and `GEMINI_OCR_MODEL` default `gemini-3.5-flash-lite`.
- OCR provider key is backend-only. Treat model output as untrusted, validate fields, and require human review for amounts/line items.

## Inventory
- `/api/inventory` — server comments identify:
  - `GET /api/inventory/movements`
  - `GET /api/inventory/products/:productId/movements`
  - `POST /api/inventory/products/:productId/adjust`

## Warranty
- `/api/warranties` — shopkeeper warranty operations.
- `/api/public` — public warranty verification/card endpoint family.
- Warranty scheduler runs immediately on server startup and hourly thereafter; scheduler results are logged.

## Integrations
| Integration | Purpose | Config variables evidenced |
|---|---|---|
| MongoDB/Mongoose | persistence | `MONGODB_URI` |
| Frontend origin/CORS | browser access | `FRONTEND_URL`, optional `COOKIE_DOMAIN` |
| Session/auth | secure session secret | `SESSION_SECRET` |
| Cloudinary | images/documents | `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` |
| Razorpay | payment collection | `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET` |
| Gemini | image OCR/extraction | `GEMINI_API_KEY`, `GEMINI_OCR_MODEL` |
| Resend | email delivery | `RESEND_API_KEY`, `EMAIL_FROM` |

## API contract checklist for maintainers
For each endpoint document method, URL, authentication role, request params/query/body, response example, error codes, side effects, idempotency behavior, and pagination. Never put secrets or real customer records in examples.
