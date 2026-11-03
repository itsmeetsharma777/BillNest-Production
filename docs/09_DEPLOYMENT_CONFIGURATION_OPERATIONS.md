# Deployment, Configuration, and Operations
## Runtime layout (historical project context; verify live)
- Frontend: Vercel deployment.
- Backend: Render deployment.
- Database: MongoDB Atlas.
- Images/documents: Cloudinary.
- Payment: Razorpay.
- OCR: Gemini API.

## Local setup
### Prerequisites
- Node.js version compatible with project lockfiles and Vite/TypeScript versions.
- npm.
- MongoDB connection string (local or Atlas).
- Provider keys only for integrations you intend to test.

### Backend
```bash
cd backend
npm install
cp .env.example .env
# Fill required local values securely
npm run dev
```
Backend scripts evidenced: `dev` runs `tsx watch src/server.ts`; `build` runs `tsc`; `start` runs `node dist/server.js`; `typecheck` runs `tsc --noEmit`; `migrate:customers` runs customer migration.

### Frontend
```bash
cd frontend
npm install
npm run dev
```
Frontend scripts evidenced: `dev` Vite; `build` `tsc -b && vite build`; `lint` ESLint; `preview` Vite preview.

## Environment variable inventory (names only)
Backend env schema:
- Required: `MONGODB_URI`, `SESSION_SECRET` (at least 32 characters).
- Defaults: `NODE_ENV=development`, `PORT=5000`, `FRONTEND_URL=http://localhost:5173`, `GEMINI_OCR_MODEL=gemini-3.5-flash-lite`.
- Optional: `COOKIE_DOMAIN`, `RESEND_API_KEY`, `EMAIL_FROM`, `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`, `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `GEMINI_API_KEY`.
Frontend API URL context: production code uses `/api`; development uses `VITE_API_URL` or default `http://localhost:5001/api` in AuthContext. Align this with backend actual port.

## Production operations
- Ensure frontend origin exactly matches `FRONTEND_URL` for credentialed CORS.
- Set secure cookie domain/attributes for deployment domains.
- Validate health endpoint `/health`.
- Configure database network access and least-privilege credentials.
- Store keys in hosting secrets manager; rotate when compromised.
- Monitor Render cold starts/availability and Vercel build output.
- Verify database backups and restore.
- Review log redaction and scheduler behavior with more than one backend replica.

## Release procedure
1. Create release branch/tag.
2. Run frontend and backend build/typecheck/lint.
3. Run E2E on staging.
4. Review migrations and backup.
5. Deploy backend and frontend in compatible order.
6. Smoke test login, invoice, payment sandbox, PDF, customer portal, warranty, OCR.
7. Monitor logs/errors and rollback if necessary.
