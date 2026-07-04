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
  - Socket.io is initialized in `server.js` and stored on `app` as `socketio`.

### 1.3 Database (Prisma)
- Location: `backend/prisma/`
- Prisma schema: `backend/prisma/schema.prisma`
- Client: `backend/prisma/client.js`
- Migrations: `backend/prisma/migrations/*`

### 1.4 Service catalog seeding
- `backend/seeders/servicesSeed.js`
- Called during server boot in `backend/server.js` via `seedServicesIfEmpty()`.

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
- Role gating: `req.body.role` or `req.query.role` must be `admin`.
- Fetches `ProviderServiceRequest` where `status = PENDING`.
- Includes provider and provider.user.

#### 3.1.2 Approve request
Controller: `approveService`
- Role gating: `admin` required.
- Loads `ProviderServiceRequest` by id with provider + provider.user.
- Ensures a global `Service` exists using normalized name (`nameNormalized`):
  - If missing, creates it using request’s `requestedServiceName` and request fields.
- Creates/ensures a `ProviderService` link:
  - Associates `providerId` + `serviceId`
  - Copies `description`
  - Stores `providerServiceRequestId`.
- Updates request status → `APPROVED`.
- Triggers reputation refresh via `refreshProviderReputation(request.providerId)`.
- Creates a `Notification` to provider (SERVICE_APPROVAL).

#### 3.1.3 Deny request
Controller: `denyService`
- Role gating: `admin` required.
- Requires `reason` in body.
- Updates request status → `DENIED` and stores `denialReason`.
- Creates `Notification` for provider (SERVICE_DENIAL).

#### 3.1.4 Combined “items” listing (pending + approved)
Controller: `AdminProviderServiceItemsController.getAll`
- Role gating: `admin` required.
- Parallel fetch:
  - pending `ProviderServiceRequest` records
  - approved `ProviderService` links including provider.user and `service`
- Maps them into a unified list with:
  - pending: `{ type: 'PENDING', approvalStatus: r.status, ... }`
  - approved: `{ type: 'APPROVED', approvalStatus: 'APPROVED', id: 'APP-<providerServiceId>' ... }`
- Sorts newest first.

### 3.2 Admin: provider verification refresh
Provider verification endpoint:
- `PATCH /api/providers/:id/verify` → `ProviderController.verify`

Behavior:
- Updates `Provider.isVerified`.
- Calls `refreshProviderReputation(id)` (same reputation engine used elsewhere).

Admin also has manual reputation refresh:
- `POST /api/admin/providers/reputation/refresh` → `refreshAllProviderReputations()`.

---

## 4) Provider architecture & workflows

Provider UI:
- Main page: `frontend/src/pages/ProviderDashboard.jsx`
- Provider pages/components include:
  - `ProviderHeader.jsx`, `ProviderServicesPanel.jsx`, `ProviderReviews.jsx`, `ProviderAvailability.jsx`, `ProviderReferrals.jsx`, etc.

### 4.1 Provider: “My Services” (approved + pending/denied requests)
Backend:
- `GET /api/providers/:id/services` → `ProviderController.getProviderServices`

Controller behavior (high level):
1. Fetches approved links from `ProviderService` (includes `service`).
2. Fetches non-approved requests from `ProviderServiceRequest` (status != APPROVED).
3. Deduplicates approved links by `serviceId`.
4. Filters requests that collide with approved service names to avoid duplicates in UI.
5. Combines and sorts by `createdAt` descending.

Provider submits new service request:
- `POST /api/providers/:id/services/register` → `ProviderController.registerProviderService`

Key behaviors:
- Validates required fields: `serviceName`, `description`, `basePricePerDay` (via request payload checks inside the controller).
- Prevents duplicates:
  - returns 409 if service already approved for that provider
  - returns 409 if pending for same provider + service
  - returns 409 if any request exists and is not `DENIED` (only denied allows resubmission)
- Creates `ProviderServiceRequest` with status `PENDING`.
- Optionally updates provider `experienceYears` if provided.

### 4.2 Provider: profile update
- `PATCH /api/providers/:id/profile` → `ProviderController.updateProfile`

Updates:
- `bio`, `specialties` (Json array), `serviceAreas` (Json array)
- numeric fields such as `experienceYears`
- `isVerified` can also be passed through this controller based on current code.

### 4.3 Provider: availability schedule
- `PATCH /api/providers/:id/availability` → `ProviderController.updateAvailability`

Updates:
- `availableDays` (Json array)
- `timeSlots` (Json array)

### 4.4 Provider: verification toggle (admin/ops)
- `PATCH /api/providers/:id/verify` → `ProviderController.verify`

Behavior:
- Sets `Provider.isVerified`.
- Recomputes reputation with `refreshProviderReputation`.

### 4.5 Provider reputation engine impact (trust + badges)
Reputation module:
- `backend/services/providerReputationService.js`

Triggers (from analyzed controllers):
- after booking status changes (BookingController)
- after review creation (ReviewController)
- after provider verification changes (ProviderController.verify)
- after admin service approval (AdminProviderServiceController.approveService)

The engine recomputes:
- trust/verification level (`Provider.verificationLevel`)
- badge set (`ProviderBadge` rows)

Provider views:
- `frontend/src/components/ProviderReputation.jsx`
- `frontend/src/components/ProviderHeader.jsx` (shows trust level and badges)

---

## 5) Customer architecture & workflows

Customer UI (pages/components):
- `frontend/src/pages/CustomerDashboard.jsx`
- Components such as:
  - `BookingCard.jsx`, `BookingModal.jsx`, `BookingSuccess.jsx`
  - `NotificationsView.jsx`
  - `TicketsView.jsx`
  - `ReferralsView.jsx`, `FavoritesView.jsx`
  - `LiveTrackingMap.jsx`

Customer-facing architecture is implemented via `frontend/src/context/AppContext.jsx` (single app data/store + API actions).

### 5.1 Shared data orchestration: `frontend/src/context/AppContext.jsx`
Key state slices:
- `providers`, `services`, `providersByApprovedService`
- `bookings`, `notifications`, `tickets`
- `favoriteProviders` (persisted to `localStorage`)
- UI filters: city/area/search/category

Core customer data retrieval:
- Providers list: `GET /api/providers`
- Services catalog: `GET /api/services`
- Notifications (scoped):
  - if logged in: `GET /api/notifications?userId=<currentUser.id>`
  - fallback: `GET /api/notifications`
- Tickets (role-aware):
  - admin: `GET /api/admin/tickets?role=admin`
  - non-admin: `GET /api/tickets?requesterEmail=<currentUser.email>`

Bookings retrieval is role-aware:
- admin: loads all bookings from `GET /api/bookings`
- provider: filters bookings by providerId/userId
- customer: filters bookings by `customerId === currentUser.id`

### 5.2 Customer actions (API actions invoked by AppContext)
Provider discovery:
- `fetchProvidersByApprovedServiceName(serviceName)`
  - `GET /api/providers/by-approved-service?serviceName=...`

Booking creation & lifecycle:
- Create booking: `POST /api/bookings`
- Update booking status: `PATCH /api/bookings/:id/status`
  - sends `{ role, requesterId, status, note }` in body
- Booking messaging (chat): `POST /api/bookings/:id/messages`

Reviews:
- Submit review: `POST /api/reviews`
  - payload includes `{ bookingId, providerId, reviewerId, reviewerName, rating, comment }`
  - on success: refresh providers + bookings

Support tickets:
- Submit ticket: `POST /api/tickets`
- Admin resolution: `PATCH /api/admin/tickets/:id/resolve`

Referrals / ambassador:
- Apply referral: `POST /api/referrals/apply`

Favorites:
- Local-only toggle backed by `favoriteProviders` state (not an API call)

### 5.3 Loyalty tier (customer logic)
`getCustomerLoyaltyTier(completedCount)` computes discount tiers in the frontend (no backend endpoint in this repo snapshot).



---

## 6) Data model architecture (Prisma)

Prisma schema: `backend/prisma/schema.prisma`

This workspace contains many migrations; the report is intended to reflect the active schema relationships used by controllers (not every field’s semantics is documented in this report due to schema-reading not performed line-by-line).

### 6.1 Core models used by the provider service workflow
- `Provider`
  - has provider profile fields (rating, verificationLevel, experienceYears, availability schedule, etc.)
- `ProviderService`
  - approved service mapping: provider ↔ service
- `ProviderServiceRequest`
  - pending/denied requests: provider ↔ requestedServiceName (+ request metadata)
- `Service`
  - global catalog entries (nameNormalized for normalization)

### 6.2 Provider reputation models
- `ProviderBadge`
  - earned achievements

### 6.3 Other models linked to provider performance
- `Booking`
- `Review`
- `Payment`
- `Notification`

---

## 7) Reputation refresh & badge/verification concept model

Implementation locations:
- `backend/services/providerReputationService.js`

The system conceptually separates:
- **Approved Services**: what a provider is allowed to offer (ProviderService)
- **Trust / Verification Level**: rank assigned by reputation engine (Provider.verificationLevel)
- **Badges**: achievements earned by reputation engine (ProviderBadge rows)

Refresh runs after key business events, ensuring UI stays consistent.

---

## 8) Runtime behavior (server boot & realtime)

Backend boot:
- `backend/server.js`
  - sets up Express app
  - initializes socket.io with CORS all origins
  - registers JSON parser
  - mounts API router under `/api`
  - health endpoint: `/api/health`
  - seeds service catalog on boot with `seedServicesIfEmpty()`

Realtime:
- socket.io `io.on('connection')` logs connect/disconnect (actual event handlers are not shown in the reviewed snippet).

---

## 9) Known implementation caveats (from the examined code)

1. Admin role gating in some controllers relies on `req.body.role` or `req.query.role`.
2. Provider service registration prevents resubmission unless prior request status is `DENIED`.
3. Admin service approval ensures a global Service exists using `nameNormalized` normalization.
4. Provider “My Services” list performs both:
   - dedupe for approved items by serviceId
   - collision filtering by normalized service names between approved and requests

---

## 10) Files index (key architecture components)

### Backend
- `backend/server.js`
- `backend/routes/api.js`
- `backend/controllers/userController.js`
- `backend/controllers/providerController.js`
- `backend/controllers/adminProviderServiceController.js`
- `backend/controllers/adminProviderServiceItemsController.js`
- `backend/controllers/bookingController.js`
- `backend/controllers/reviewController.js`
- `backend/controllers/paymentController.js`
- `backend/controllers/referralsController.js`
- `backend/controllers/serviceController.js`
- `backend/controllers/ticketController.js`
- `backend/controllers/notificationController.js`
- `backend/controllers/providerServiceDiscoveryController.js`
- `backend/services/providerReputationService.js`

### Frontend
- `frontend/src/pages/CustomerDashboard.jsx`
- `frontend/src/pages/ProviderDashboard.jsx`
- `frontend/src/pages/AdminPanel.jsx`
- `frontend/src/pages/admin/AdminPanelTabsRouter.jsx`
- `frontend/src/hooks/useAdminPanelController.js`
- `frontend/src/context/AppContext.jsx`
- `frontend/src/components/*` (role panels and cards)

---

## Notes on completeness
Some parts of the repository (notably the full Prisma schema details and all frontend components’ internal API calls) were not line-by-line extracted during the automated generation step, so the report is accurate for the routes/controllers and the provider service approval flow, and high-level for remaining UI modules.

If you want the report to be fully exhaustive down to every frontend component’s exact API calls and every Prisma field/enum, the next pass is to read:
- `backend/prisma/schema.prisma`
- all admin/customers/provider components (and any axios/fetch calls)
- remaining controllers (booking, review, payment, tickets, notifications, referrals, service discovery)

