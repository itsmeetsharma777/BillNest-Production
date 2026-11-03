# Glossary and Viva Reference
- **SPA**: Single Page Application; React client navigates without full page reload.
- **REST API**: HTTP interface exposing resources and operations.
- **Express**: Node.js web framework used to register middleware and routes.
- **TypeScript**: JavaScript with static typing.
- **Mongoose**: ODM that maps application models to MongoDB documents.
- **MongoDB Atlas**: managed cloud MongoDB service.
- **Middleware**: request-processing function executed before or after route handlers.
- **Controller**: translates HTTP request to application/service call and response.
- **Service layer**: owns business rules and workflows.
- **Repository**: persistence abstraction/query operations.
- **Zod**: schema validation library.
- **Session cookie**: browser cookie that identifies a server-side session.
- **CSRF**: Cross-Site Request Forgery; unwanted authenticated request initiated by another site.
- **CORS**: browser policy controlling cross-origin resource access.
- **RBAC**: Role-Based Access Control; route/data access based on user role.
- **IDOR**: Insecure Direct Object Reference; object access without ownership authorization.
- **OCR**: Optical Character Recognition; extraction of text from image/document.
- **LLM**: Large Language Model; used here for structured interpretation of OCR output.
- **Razorpay**: payment gateway used for online payments.
- **Cloudinary**: cloud media storage/delivery integration.
- **Inventory movement**: recorded event changing stock quantity.
- **Partial payment**: invoice has some amount paid while a balance remains due.
- **Idempotency**: repeating a request/event does not duplicate its effect.
- **Migration**: controlled transformation of existing database data/schema.
- **CI**: Continuous Integration; automated checks on repository changes.
- **E2E**: End-to-End testing of a user flow across frontend/backend.

## Quick viva framing
BillNest is a full-stack shop billing and warranty management system. React and TypeScript provide role-specific shopkeeper/customer portals. Express and TypeScript expose APIs; Mongoose persists domain entities in MongoDB. Backend modularity uses routes, controllers, services, repositories, models, validators, and middleware. Cookie-based sessions and role/ownership checks protect routes. The system handles invoices, inventory, payment records, warranties, reports, customer bills, and AI-assisted OCR. Integrations include Razorpay, Cloudinary, and Gemini; deployments historically use Vercel and Render with MongoDB Atlas.
