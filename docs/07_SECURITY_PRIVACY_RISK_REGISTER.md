# Security, Privacy, and Risk Register
## Existing security controls evidenced in `backend/src/server.ts`
- Helmet security headers.
- Credentialed CORS using configured frontend origin.
- Request body size caps: JSON 3 MB; URL-encoded 1 MB.
- Cookie parsing followed by CSRF protection.
- General rate limit: 200 requests per 15 minutes.
- Authentication session lookup with hashed session token.
- Account active-state check.
- Global error middleware.
- Environment validation using Zod; session secret minimum length 32.
- Proxy trust configured for one hop.

## Risk register
| Risk | Impact | Recommended control / verification |
|---|---|---|
| Cross-tenant record access | Critical | Verify every service query scopes records by shopId/customer ownership; add negative tests |
| Session cookie theft/CSRF | High | Secure, HttpOnly, SameSite cookie flags; CSRF token behavior; TLS; session expiry/revocation |
| Razorpay spoof/replay | Critical | Server signature validation, webhook secret, idempotency, amount/currency/order match |
| Invoice/stock mismatch | High | Transaction strategy, atomic stock update, invariant checks, reconciliation report |
| OCR hallucinated amounts | High | User review, schema validation, confidence signals, totals consistency checks |
| Sensitive public warranty data | High | Minimal fields, unguessable identifiers, rate limiting, privacy review |
| Upload malware/oversize | High | MIME and content validation, size limits, storage isolation, malware scanning where feasible |
| API abuse | Medium/High | Per-route rate limit, auth-specific throttles, monitoring |
| Secrets committed | Critical | Secret scanning, rotate keys, environment-only values |
| Customer phone globally unique collision | High | Normalize phone (country code), uniqueness policy, migration backups and conflict report |
| Duplicate warranty notifications | Medium | Idempotent notification keys, scheduler coordination across instances |
| MongoDB backup restore failure | Critical | Routine restore drills, documented RPO/RTO |
| Logging PII/payment data | High | Redaction, avoid request-body secrets, retention limits |

## Privacy principles
- Minimize collection and display.
- Keep customers’ invoices and uploaded bills private by default.
- Avoid logging passwords, session tokens, OTPs, API keys, card data, or full document OCR payloads.
- Define customer data retention and account deletion behavior.
- Review public warranty verification data against intended purpose.

## Security review gates
1. Authentication and role authorization tests.
2. Tenant isolation tests for every object endpoint.
3. CSRF/CORS/session-cookie tests.
4. Payment verification and replay tests.
5. Upload validation tests.
6. Dependency vulnerability and secret scans.
7. Production configuration checklist and backup restore drill.
