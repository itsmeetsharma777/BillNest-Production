# Project Overview — BillNest
## Product summary
BillNest is a web-based billing, inventory, invoice, warranty, and customer-account management system intended for shopkeepers and their customers. It combines shop operations with a customer-facing portal that provides visibility into invoices, payments, warranties, uploaded bills, and notifications.

## Primary actors
- **Shopkeeper**: manages shop profile, catalog, customers, invoices, inventory, warranties, reports, notifications, and settings.
- **Customer**: accesses their portal to review invoices/bills, payment history, warranties, notifications, and account settings.
- **Public visitor**: can access public pages and public warranty verification routes.
- **External services**: MongoDB Atlas, Cloudinary, Razorpay, Gemini/OCR, and potentially Resend/email delivery.

## Business objectives
- Reduce manual invoice generation and shop recordkeeping.
- Maintain product stock and movement history.
- Associate invoices and warranty records with customers.
- Support full and partial payment states and payment traceability.
- Provide customers a self-service portal.
- Extract invoice information from uploaded document images with AI-assisted OCR.
- Improve operational visibility through reports, dashboards, and notifications.

## Major capabilities evidenced by source tree and server mounts
Authentication/password reset; shop management; customers and customer portal; products, variants, categories, brands/catalog; invoices, invoice PDF and payment; warranties and public warranty verification; reports/GST reporting; dashboards; documents; OCR; inventory movements and stock adjustment; shopkeeper/customer notifications; customer bills/accounts/ledger.

## Non-goals / boundaries
The application is not documented here as a full accounting ERP, tax filing platform, or guaranteed compliant payment processor. GST calculations/reporting must be validated with qualified accounting requirements. Subscription/staff features should not be represented as implemented unless verified in current source.
