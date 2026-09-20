# BillNest — Project Memory

## 1. Project Identity

**Project:** BillNest

**Tagline:**

> Every bill. One organized home.

BillNest is a billing and warranty management platform designed around two user roles: Shopkeeper and Customer.

---

## 2. Product Concept

### Shopkeeper

The shopkeeper manages:

- Business information
- Customers
- Products
- Invoices
- Warranties

### Customer

The customer manages/accesses:

- Purchases
- Digital invoices
- Warranty information
- Warranty expiry information

---

## 3. Technology

### Frontend

- React
- TypeScript
- Vite
- Tailwind CSS 4
- React Router
- Lucide React icons

### Backend

- Node.js
- TypeScript
- Express
- Mongoose

### Database

- MongoDB Atlas

---

## 4. Important Existing Behaviors

Authentication includes:

- Register
- Login
- Logout
- Current session/user check

The application uses protected role-specific areas.

The landing page supports:

- Light
- Dark
- System

theme modes.

---

## 5. UI Memory

The preferred BillNest visual style is:

- Premium SaaS
- Dark black/navy base
- Electric blue accents
- Violet customer accents
- Rounded cards
- Subtle glow
- Clean typography
- Minimal clutter
- Desktop/laptop-first presentation
- Responsive mobile behavior

The landing page contains:

1. Navbar
2. Hero
3. Shopkeeper/Customer role cards
4. Feature strip
5. How it works
6. Shopkeeper showcase
7. Customer showcase
8. Why BillNest
9. CTA
10. Footer

---

## 6. Development Preferences

When changing BillNest:

- Inspect the existing implementation first.
- Avoid breaking working flows.
- Prefer complete file replacements when a file is heavily changed.
- Keep frontend and backend concerns separate.
- Run builds after significant changes.
- Fix TypeScript errors before moving forward.
- Preserve existing routes unless the desired behavior explicitly changes.

---

## 7. Current Known Technical State

The frontend currently uses Tailwind CSS 4.3.3.

The production frontend build has successfully completed with Vite.

A Vite warning about a JavaScript chunk exceeding 500 kB is an optimization warning rather than a build failure.

---

## 8. Future Improvements

Potential future work:

- Automated testing.
- Better code splitting.
- Performance optimization.
- Stronger accessibility coverage.
- Advanced reporting.
- Email notifications.
- Warranty expiry reminders.
- PDF invoice generation.
- Analytics.
- Audit logging.
