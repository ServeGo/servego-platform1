## Project Architecture & File Flow (overview)

This document maps major frontend and backend files to their purpose and shows the high-level runtime/data flow and how the database is accessed. It is intentionally an overview — it does not explain code logic.

### Quick flow summary
- User -> Frontend pages/components -> HTTP requests to backend -> `routes/api.js` -> controller -> service/DB layer -> Prisma client -> database
- Frontend build served from `frontend/build` or `public`

### Frontend (what the files/directories do)
- **App entry:** [frontend/src/index.js](frontend/src/index.js#L1) — app boot, ReactDOM render, global providers.
- **Main app shell:** [frontend/src/App.jsx](frontend/src/App.jsx#L1) — top-level routes, layout and global state providers.
- **Pages:** [frontend/src/pages/ServiceDetails.jsx](frontend/src/pages/ServiceDetails.jsx#L1) (current file) and other files under [frontend/src/pages](frontend/src/pages#L1) — represent route screens and orchestrate components.
- **Components:** [frontend/src/components](frontend/src/components#L1) — reusable UI and small feature units (e.g., `BookingModal.jsx`, `ProviderProfileView.jsx`).
- **Assets & static:** [frontend/public/index.html](frontend/public/index.html#L1) and [frontend/build/index.html](frontend/build/index.html#L1) — static HTML used for production builds.
- **Styles:** `index.css`, `tailwind-dist.css`, and `cursor.css` under [frontend/src](frontend/src#L1) — global and utility styles.
- **Data helpers / context:** [frontend/src/data.js](frontend/src/data.js#L1) and context folders under [frontend/src/context](frontend/src/context#L1) — light-weight client-side data utilities and React contexts.

Typical frontend usage: pages call API endpoints (fetch/XHR) to the server routes defined in the backend; responses are used to render or update UI.

### Backend (what the files/directories do)
- **Server entry:** [backend/server.js](backend/server.js#L1) — starts the Express server, middleware, CORS, body-parsing, and mounts routes.
- **API routes:** [backend/routes/api.js](backend/routes/api.js#L1) — maps HTTP endpoints to controller functions (e.g., `/api/providers`, `/api/bookings`).
- **Controllers:** [backend/controllers](backend/controllers#L1) — one file per domain action. Examples:
  - [backend/controllers/providerController.js](backend/controllers/providerController.js#L1) — provider-related endpoints.
  - [backend/controllers/serviceController.js](backend/controllers/serviceController.js#L1) — service listing, creation, updates.
  - [backend/controllers/bookingController.js](backend/controllers/bookingController.js#L1) — booking flow handlers.
  - [backend/controllers/userController.js](backend/controllers/userController.js#L1) — user-related endpoints.
- **Services & utilities:** [backend/services](backend/services#L1) and helpers such as `providerReputationService.js` — encapsulate business logic reused by controllers.
- **Notifications/payments/referrals/reviews/tickets:** dedicated controllers exist (e.g., `notificationController.js`, `paymentController.js`, `referralsController.js`, `reviewController.js`, `ticketController.js`) to separate concerns.

Typical backend usage: `routes/api.js` receives a request, calls a controller which may call services or directly use Prisma client to read/write DB, and responds to the frontend.

### Database & Prisma (how DB connects)
- **Prisma client:** [backend/prisma/client.js](backend/prisma/client.js#L1) — creates and exports the Prisma client instance used by controllers/services to query the database.
- **Prisma schema:** [backend/prisma/schema.prisma](backend/prisma/schema.prisma#L1) — defines models/tables and relations.
- **Migrations:** [backend/prisma/migrations](backend/prisma/migrations#L1) — migration history for schema changes.
- **Seeders:** [backend/prisma/seed.js](backend/prisma/seed.js#L1) and [backend/scripts/seeders/servicesSeed.js](backend/scripts/seeders/servicesSeed.js#L1) — initial data population scripts.

Connection pattern: server code imports the Prisma client (`backend/prisma/client.js`) and uses it in controllers/services to perform queries/transactions against the configured database (as defined in `.env` or `schema.prisma`). Migrations and seeds prepare and populate the DB.

### Other useful files
- [package.json](package.json#L1) — workspace scripts and dependencies.
- [backend/package.json](backend/package.json#L1) — backend-specific scripts (start, migrate, seed).
- [frontend/package.json](frontend/package.json#L1) — frontend build and dev scripts.
- [LICENSE](LICENSE#L1) and [metadata.json](metadata.json#L1) for project metadata.

### High-level sequences (short)
1. Developer runs backend (e.g., `node backend/server.js`) — Express server starts and initializes Prisma client.
2. Developer runs frontend (dev server or serves `frontend/build`) — React app served to the browser.
3. User interacts with pages (e.g., opens `ServiceDetails.jsx`) which call API endpoints under `/api`.
4. Requests hit `routes/api.js`, routed to controllers (e.g., `serviceController.js`) which call Prisma via `backend/prisma/client.js`.
5. Prisma executes SQL against the DB; results return to controller → backend response → frontend updates UI.

### How to use this doc
- Use this as a navigation map to find where to look for relevant behaviour. Open the linked files to inspect details when you need to read implementation.
- If you want, I can expand this to include a full dependency graph (call graph) or generate per-file inbound/outbound references.

---
If you want the expanded per-file reference list (which file calls which file), say "generate per-file call graph" and I will produce it next.
