# Servego Platform 1 — Project Architecture Report

> Scope: This report documents the current repo’s architecture at a functional level (Admin / Customer / Provider) and traces the key flows to implemented backend endpoints and Prisma models. It is derived from reading the available source files present in this workspace.

---

## 1) High-level architecture

### 1.1 Frontend (React)
- Location: `frontend/src`
- Technology: React + (Tailwind present via `tailwind-dist.css` and `index.css`)
- Main concepts:
  - Pages for roles (Customer / Provider / Admin)
  - Shared app state via `frontend/src/context/AppContext.jsx`
  - Role-specific controllers/hooks (notably `useAdminPanelController.js`)

**Role pages** (entry points):
- Customer: `frontend/src/pages/CustomerDashboard.jsx`
- Provider: `frontend/src/pages/ProviderDashboard.jsx`
- Admin: `frontend/src/pages/AdminPanel.jsx` and tab router `frontend/src/pages/admin/AdminPanelTabsRouter.jsx`

### 1.2 Backend (Express)
- Location: `backend/`
- Entry point: `backend/server.js`
- Routing: `backend/routes/api.js`
- Design style:
  - Express router mounts `/api` (see server.js)
  - Each functional area is handled by a dedicated controller in `backend/controllers/*`
  - Socket.io is initialized in `server.js` and stored on `app` as `socketio`

### 1.3 Database (Prisma)
- Location: `backend/prisma/`
- Prisma schema: `backend/prisma/schema.prisma`
- Client: `backend/prisma/client.js`
- Migrations: `backend/prisma/migrations/*`

### 1.4 Service catalog seeding
- `backend/seeders/servicesSeed.js`
- Called during server boot in `backend/server.js` via `seedServicesIfEmpty()`

---

## 2) Backend API surface (routes → controllers)

Router file: `backend/routes/api.js`

### 2.1 Authentication & user management
- `POST /api/auth/register` → `UserController.register`
- `POST /api/auth/login` → `UserController.login`
- `GET /api/users` → `UserController.getUsers`
- `PATCH /api/users/:id/profile` → `UserController.updateProfile`

### 2.2 Provider (service partner) endpoints
- `GET /api/providers` → `ProviderController.getAll`
- `GET /api/providers/by-approved-service` → `ProviderServiceDiscoveryController.getApprovedProvidersByServiceName`
- `GET /api/providers/:id` → `ProviderController.getById`
- `GET /api/providers/:id/services` → `ProviderController.getProviderServices`
- `POST /api/providers/:id/services/register` → `ProviderController.registerProviderService`
- `PATCH /api/providers/:id/profile` → `ProviderController.updateProfile`
- `PATCH /api/providers/:id/availability` → `ProviderController.updateAvailability`
- `PATCH /api/providers/:id/verify` → `ProviderController.verify`

### 2.3 Bookings
- `GET /api/bookings` → `BookingController.getAll`
- `GET /api/bookings/:id` → `BookingController.getById`
- `POST /api/bookings` → `BookingController.create`
- `PATCH /api/bookings/:id/status` → `BookingController.updateStatus`
- `PATCH /admin/bookings/:id/status` (alias) → wraps `BookingController.updateStatus` with `role=admin`
- `POST /api/bookings/:id/messages` → `BookingController.addMessage`

### 2.4 Notifications
- `GET /api/notifications` → `NotificationController.getAll`
- `POST /api/notifications` → `NotificationController.create`
- `PATCH /api/notifications/:id/read` → `NotificationController.read`
- `DELETE /api/notifications` → `NotificationController.clearAll`

### 2.5 Support tickets
- `GET /api/tickets` → `TicketController.getAll`
- `POST /api/tickets` → `TicketController.create`
- `PATCH /api/tickets/:id/resolve` → `TicketController.resolve`
- Admin aliases:
  - `GET /api/admin/tickets` → `TicketController.getAll` with `role=admin`
  - `PATCH /api/admin/tickets/:id/resolve` → `TicketController.resolve` with `role=admin`

### 2.6 Reviews
- `POST /api/reviews` → `ReviewController.create`

### 2.7 Payments
- `GET /api/payments` → `PaymentController.getAll`
- `POST /api/payments` → `PaymentController.create`

### 2.8 Referrals / ambassador
- `POST /api/referrals/apply` → `ReferralsController.applyReferral`
- `GET /api/referrals/me` → `ReferralsController.getMeReferral`

### 2.9 Services (global service catalog)
- `GET /api/services` → `ServiceController.getAll`
- `POST /api/services` → `ServiceController.create`
- `DELETE /api/services/:id` → `ServiceController.deleteOne`
- `PATCH /api/services/:id` → `ServiceController.updateOne`
- `PATCH /api/services/:id/hide` → `ServiceController.hideOne`

### 2.10 Admin: dashboard
- `GET /api/admin/dashboard` → `AdminDashboardController.getSummary`

---

## 3) Admin architecture & workflows

Admin UI is composed of tabbed panels:
- `frontend/src/pages/AdminPanel.jsx`
- `frontend/src/pages/admin/AdminPanelTabsRouter.jsx`
- Tabs under `frontend/src/pages/admin/Tabs/`:
  - Analytics, Dashboard, Services, Service Requests, Providers, Customers, Bookings, Payments, Reviews, Tickets, Reports, Settings

Admin panel controller:
- `frontend/src/hooks/useAdminPanelController.js`

### 3.1 Admin: provider service approvals (core)

Admin router endpoints:
- `GET /api/admin/provider-service-requests` → `AdminProviderServiceController.getPendingRequests`
- `PATCH /api/admin/provider-service-requests/:id/approve` → `AdminProviderServiceController.approveService`
- `PATCH /api/admin/provider-service-requests/:id/deny` → `AdminProviderServiceController.denyService`
- `GET /api/admin/provider-service-items` → `AdminProviderServiceItemsController.getAll`
- `POST /api/admin/providers/reputation/refresh` → `AdminProviderServiceController.refreshReputation`

#### 3.1.1 Pending requests listing
Controller: `backend/controllers/adminProviderServiceController.js` → `getPendingRequests`
- Route protection: `requireAuth` / `requireRole('admin')` (JWT Bearer token via `Authorization: Bearer <token>`)
- Role gating inside controller: `req.body.role` or `req.query.role` is also referenced
- Fetches `ProviderServiceRequest` where `status = PENDING`
- Includes provider and provider.user


#### 3.1.2 Approve request
Controller: `approveService`
- Role gating: `admin` required
- Ensures a global `Service` exists using normalized name (`nameNormalized`)
- Creates/ensures a `ProviderService` link:
  - Associates `providerId` + `serviceId`
  - Copies `description`
  - Stores `providerServiceRequestId`
- Updates request status → `APPROVED`
- Triggers reputation refresh via `refreshProviderReputation(request.providerId)`
- Creates a `Notification` to provider (SERVICE_APPROVAL)

#### 3.1.3 Deny request
Controller: `denyService`
- Role gating: `admin` required
- Requires `reason` in body
- Updates request status → `DENIED` and stores `denialReason`
- Creates `Notification` for provider (SERVICE_DENIAL)

#### 3.1.4 Combined “items” listing (pending + approved)
Controller: `AdminProviderServiceItemsController.getAll`
- Role gating: `admin` required
- Parallel fetch:
  - pending `ProviderServiceRequest` records
  - approved `ProviderService` links including provider.user and `service`
- Maps them into a unified list:
  - pending: `{ type: 'PENDING', approvalStatus: r.status, ... }`
  - approved: `{ type: 'APPROVED', approvalStatus: 'APPROVED', ... }`
- Sorts newest first

### 3.2 Admin: provider verification refresh
Provider verification endpoint:
- `PATCH /api/providers/:id/verify` → `ProviderController.verify`

Behavior:
- Updates `Provider.isVerified`
- Calls `refreshProviderReputation(id)`

Admin also has manual reputation refresh:
- `POST /api/admin/providers/reputation/refresh` → `refreshAllProviderReputations()`

---

## 4) Provider architecture & workflows

Provider UI:
- Main page: `frontend/src/pages/ProviderDashboard.jsx`

### 4.1 Provider: “My Services” (approved + pending/denied requests)
Backend:
- `GET /api/providers/:id/services` → `ProviderController.getProviderServices`

Controller behavior (high level):
1. Fetches approved links from `ProviderService` (includes `service`)
2. Fetches non-approved requests from `ProviderServiceRequest` (status != APPROVED)
3. Deduplicates approved links by `serviceId`
4. Filters requests that collide with approved service names to avoid duplicates in UI
5. Combines and sorts by `createdAt` descending

### 4.2 Provider: profile update
- `PATCH /api/providers/:id/profile` → `ProviderController.updateProfile`

Updates:
- `bio`, `specialties` (Json array), `serviceAreas` (Json array)
- numeric fields such as `experienceYears`

### 4.3 Provider: availability schedule
- `PATCH /api/providers/:id/availability` → `ProviderController.updateAvailability`

Updates:
- `availableDays` (Json array)
- `timeSlots` (Json array)

### 4.4 Provider: verification toggle
- `PATCH /api/providers/:id/verify` → `ProviderController.verify`

Behavior:
- Sets `Provider.isVerified`
- Recomputes reputation with `refreshProviderReputation`

---

## 5) Customer architecture & workflows

Customer UI (pages/components):
- `frontend/src/pages/CustomerDashboard.jsx`

Customer-facing architecture is implemented via:
- `frontend/src/context/AppContext.jsx` (single app data/store + API actions)

### 5.1 Shared data orchestration: `AppContext.jsx`
Key state slices:
- `providers`, `services`, `providersByApprovedService`
- `bookings`, `notifications`, `tickets`
- `favoriteProviders` (persisted to `localStorage`)

### 5.2 Customer booking lifecycle
Backend endpoints:
- Create booking: `POST /api/bookings`
- Update booking status: `PATCH /api/bookings/:id/status`
- Booking messaging (chat): `POST /api/bookings/:id/messages`

### 5.3 Updated booking rule: same provider + same service only
In `backend/controllers/bookingController.js` (`BookingController.create`):
- Availability conflict still blocks double-booking the same **provider + date/time slot**.
- Additional “active booking” rule is now:
  - Block only when an existing booking is **PENDING**
  - AND matches **same providerId + same service**
  - Matching prefers `serviceId` when present; otherwise falls back to `serviceCategory`.
- This allows booking the **same provider** for a **different service**, even if there is another pending booking.

---

## 6) Data model architecture (Prisma)

Prisma schema: `backend/prisma/schema.prisma`

### 6.1 Core models used by the provider service workflow
- `Provider`
- `ProviderService` (approved provider ↔ service mapping)
- `ProviderServiceRequest` (pending/denied provider service requests)
- `Service` (global catalog)

### 6.2 Provider reputation
- `ProviderBadge`

### 6.3 Other models linked to provider performance
- `Booking`
- `Review`
- `Payment`
- `Notification`

---

## 7) Reputation refresh & badge/verification concept model

Implementation locations:
- `backend/services/providerReputationService.js`

Conceptual separation:
- Approved services: `ProviderService`
- Trust/verification: `Provider.verificationLevel`
- Badges: `ProviderBadge`

Refresh triggers are invoked from controllers/services after key business events.

---

## 8) Runtime behavior (server boot & realtime)

Backend boot:
- `backend/server.js`
  - Express + JSON parser
  - Socket.io initialization (CORS all origins)
  - Mounts API router under `/api`
  - Health endpoint: `/api/health`
  - seeds service catalog on boot with `seedServicesIfEmpty()`

Realtime:
- Socket.io `io.on('connection')` logs connect/disconnect (handlers exist for chat/notifications in controllers/services that emit events).

---

## 9) Known implementation caveats (from the examined code)

1. Admin role gating in some controllers relies on `req.body.role` or `req.query.role`.
2. Provider service registration prevents resubmission unless prior request status is `DENIED`.
3. Admin service approval ensures a global Service exists using `nameNormalized`.

---

## 10) Files index (key architecture components)

### Backend
- `backend/server.js`
- `backend/routes/api.js`
- `backend/controllers/*`
- `backend/services/providerReputationService.js`
- `backend/services/notificationService.js`
- `backend/services/bookingAvailabilityService.js`
- `backend/prisma/schema.prisma`

### Frontend
- `frontend/src/context/AppContext.jsx`
- `frontend/src/pages/*`
- `frontend/src/pages/admin/*`
- `frontend/src/components/*`


