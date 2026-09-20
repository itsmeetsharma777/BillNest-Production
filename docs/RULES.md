# BillNest — Engineering Rules

## 1. General Rule

Prefer simple, maintainable solutions over unnecessary complexity.

Every change should preserve existing working functionality unless the change explicitly requires modifying it.

---

## 2. Frontend Rules

- Use TypeScript.
- Avoid unnecessary `any`.
- Reuse existing components before creating duplicates.
- Keep UI components focused.
- Use the existing theme system.
- Support Light, Dark, and System themes.
- Keep responsive behavior in mind.
- Use accessible buttons and labels.
- Do not hardcode sensitive configuration.
- Do not duplicate route definitions.

### Navigation

Use React Router for application navigation.

For same-page sections, use smooth scrolling where appropriate.

Do not replace an existing route with a scroll action unless that is explicitly the desired behavior.

---

## 3. Backend Rules

- Keep controllers thin.
- Put business logic in services.
- Put database access in repositories.
- Use typed request/response data.
- Validate incoming data.
- Authenticate protected routes.
- Authorize role-specific operations.
- Use centralized error handling.

---

## 4. Database Rules

- Use Mongoose models consistently.
- Do not bypass repositories without a clear reason.
- Use MongoDB ObjectId types correctly.
- Avoid storing duplicate information when a relationship/reference is more appropriate.
- Add indexes where justified by query patterns.

---

## 5. Security Rules

Never commit:

- Passwords
- JWT/session secrets
- MongoDB credentials
- API keys
- Private tokens

Use environment variables.

Authentication and authorization must be enforced by the backend, not only by frontend route guards.

---

## 6. Code Change Rules

Before changing code:

1. Understand the existing implementation.
2. Identify affected routes/components/services.
3. Make the smallest safe change.
4. Run TypeScript checks.
5. Run the production build.
6. Test the affected user flow.

Do not rewrite unrelated files just to implement a small feature.

---

## 7. UI Rules

BillNest's visual identity:

- Dark navy/black base
- Electric blue primary accent
- Violet customer accent
- Rounded cards
- Subtle borders
- Soft glow effects
- Clean typography
- Clear hierarchy
- Minimal clutter

Maintain visual consistency across pages.

---

## 8. Git Rules

Use focused commits.

Example:

```text
feat: add warranty serial generation
fix: redirect after logout
fix: protect customer purchases
style: improve landing page CTA
refactor: simplify invoice repository
```

Avoid large commits that mix unrelated features, styling, and refactoring.
