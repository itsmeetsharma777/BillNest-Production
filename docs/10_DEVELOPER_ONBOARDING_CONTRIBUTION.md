# Developer Onboarding and Contribution Guide
## Repository map
```text
BillNest-Production/
├── backend/
│   ├── src/
│   │   ├── config/       # database, environment, Cloudinary
│   │   ├── controllers/  # HTTP request handlers
│   │   ├── middleware/   # auth, CSRF, role, upload, rate limit, errors
│   │   ├── migrations/  # data migrations
│   │   ├── models/       # Mongoose schemas
│   │   ├── repositories/ # persistence operations
│   │   ├── routes/       # endpoint registration
│   │   ├── services/    # business logic
│   │   ├── validators/  # Zod input schemas
│   │   └── server.ts
│   └── package.json
└── frontend/
    └── src/
        ├── components/
        ├── context/
        ├── layout/
        ├── pages/
        │   ├── customer/
        │   └── shopkeeper/
        ├── router/
        ├── lib/
        └── utils/
```

## How to implement a feature
1. Clarify actor, business rules, edge cases, and acceptance criteria.
2. Inspect existing model, repository, service, validator, controller, route, and frontend usage.
3. Define/modify Zod validator and schema carefully.
4. Implement domain behavior in service; controller should remain HTTP-focused.
5. Enforce ownership and role checks at server side.
6. Add route with correct middleware and role.
7. Build frontend page/API calls with loading, empty, success, and error states.
8. Add unit/API/E2E coverage and update docs.
9. Run build, typecheck, lint, and test suite.
10. Verify staging and document migration/release implications.

## Coding principles
- Keep financial arithmetic consistent; define rounding and currency policy.
- Avoid trusting client totals; calculate/verify server-side.
- Use database-level constraints/indexes when appropriate.
- Prefer explicit service method names and typed input/output.
- Avoid side effects from React rendering.
- Make provider calls resilient and observable.
- Never log secrets or sensitive document content.
- Avoid modifying the same file concurrently across changes.
- Document API behavior changes and migration requirements.

## Debugging checklist
- Confirm environment variables and API base URL.
- Check CORS and cookie domain/secure/sameSite settings.
- Inspect backend logs and structured error code.
- Verify MongoDB connectivity/indexes.
- Confirm frontend route guard and user role.
- Inspect network request method, URL, status, cookie inclusion, and response.
- Check that record query includes correct shop/customer owner.
