---
name: Mock DB layer
description: How the in-memory mock store activates and what it covers
---

`backend/prisma/client.js` probes the real DB with `$queryRaw` on startup.
If the probe throws (schema absent / DB unreachable), it imports and exports
`backend/prisma/mockClient.js` instead of the real Prisma client.

`backend/data/mockStore.js` holds the in-memory arrays (users, providers,
services, bookings, payments, notifications, tickets, reviews, etc.).
`genId()` generates unique IDs. All arrays are mutated in place by the mock client.

**Why:** The Replit-provisioned PostgreSQL exists but Prisma migrations have
never been run, so all tables are absent. Mock-first lets the app run fully
without any DB setup.

**How to apply:** Any controller that imports `prisma` from `../prisma/client.js`
automatically gets mock behavior when the schema is absent. No code changes
needed per-controller.

Demo credentials (password Demo@1234, admin Admin@1234):
- admin@servego.com — admin
- priya@example.com / rajan@example.com — customers
- srinivas.ksr@servego.com / ravi.plumber@servego.com / arjun.ac@servego.com — providers
