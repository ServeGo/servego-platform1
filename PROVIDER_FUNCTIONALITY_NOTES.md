# Provider Functionality Notes (Servego Platform 1)

> Scope: This document is generated from the current repo code you have in **servego-platform1**.
> It covers **provider backend + frontend + database (Prisma)**, including every visible provider-related component/controller/endpoints currently implemented.

---

## 1) Provider concepts in this system

A **Provider** is a specialized account created when a user signs up with `role = provider`. Providers:

- Have a **profile** (category, bio, specialties, service areas, photo, hourly rate, experience, availability schedule).
- Maintain a list of **approved services** they can offer (`ProviderService`).
- Can submit **service registration requests** for new services to an admin (`ProviderServiceRequest`).
- Receive **bookings** made by customers (`Booking` where `providerId` matches).
- Receive **reviews** tied to bookings (`Review` where `providerId` matches).
- Have **notifications** created by backend events (e.g., service approved/denied).

Admin approval flow:
- Provider submits: `ProviderController.registerProviderService` → creates a `ProviderServiceRequest` (status `PENDING`).
- Admin approves/denies: `AdminProviderServiceController.approveService` or `denyService`.
- Approve creates an approved record: `ProviderService`.

---

## 2) Database layer (Prisma schema)

File: `backend/prisma/schema.prisma`

### 2.1 `User`
- Key fields used by provider logic:
  - `id` (String, PK, cuid)
  - `role` (enum `UserRole`: `customer | provider | admin`)
  - `status` (enum `AccountStatus`: `ACTIVE | INACTIVE | SUSPENDED`)
  - `email`, `phone`, `name`, `avatar`
  - Relations:
    - `providerProfile: Provider?`
    - `bookingsAsCustomer: Booking[]`
    - `reviews: Review[]` (as reviewer)

Sign-up creates a `User`, and if `role === 'provider'`, the backend also creates a `Provider` profile.

### 2.2 `Provider`
Provider model: `model Provider`

- Key fields:
  - `id` (String, PK, cuid)
  - `userId` (String, unique) → points to `User.id`
  - `category` (String) → provider’s sector/category
  - `rating` (Float, default 0)
  - `reviewCount` (Int, default 0)
  - `experienceYears` (Int, default 3)
  - `jobsCompleted` (Int, default 0)
  - `hourlyRate` (Float, default 300)
  - `bio?` (String?)
  - `specialties` (Json default "[]")
  - `serviceAreas` (Json default "[]")
  - `photo?` (String?)

- Availability / schedule:
  - `availableDays` (Json default "[]")
  - `timeSlots` (Json default "[]")

- Flags:
  - `isVerified` (Boolean default true)
  - `isFeatured` (Boolean default false)
  - `earnings` (Float default 0)

- Relations:
  - `user: User` (relation by `userId`)
  - `reviews: Review[]` (relation name `ProviderReviews`)
  - `bookings: Booking[]`
  - `providerServices: ProviderService[]`
  - `providerServiceRequests: ProviderServiceRequest[]`

### 2.3 `Service` (global service catalog)
Model: `model Service`

- `id` (String, PK)
- `name` (String)
- `nameNormalized` is referenced in code as if it exists, but the schema snippet shown does **not** include it in the pasted output.
  - The admin approve controller calls:
    - `prisma.service.findUnique({ where: { nameNormalized } })`
    - and sets `nameNormalized` when creating service.
  - If your real schema includes `nameNormalized` elsewhere (or in migration), that’s what the code expects.

Important fields:
- `description?`
- `basePrice` (Float default 0)
- `popularIssues` (Json default "[]")
- `isHidden` (Boolean default false)

Relations:
- `providerServices: ProviderService[]`
- `bookings: Booking[]` (serviceId optional)

### 2.4 `ProviderService` (approved services offered by a provider)
Model: `model ProviderService`

Fields:
- `id` (String PK)
- `providerId` (String)
- `serviceId` (String)
- `basePricePerDay` (Float)
- `description?`
- `providerServiceRequestId?` (String?)
- `createdAt`, `updatedAt`

Relations:
- `provider: Provider`
- `service: Service`
- `providerServiceRequests: ProviderServiceRequest[]` (opposite relation)

In practice:
- Created by admin approval.
- Displayed to provider by `/providers/:id/services`.

### 2.5 `ProviderServiceRequest` (pending/denied submissions)
Model: `model ProviderServiceRequest`

Fields:
- `id` (String PK)
- `providerId` (String)
- `requestedServiceName` (String)
- `basePricePerDay` (Float)
- `description` (String)
- `popularIssues` (Json default "[]")
- `experienceYears?` (Int?)
- `status` (enum `ApprovalStatus`: `PENDING | APPROVED | DENIED`, default PENDING)
- `denialReason?` (String?)
- `createdAt`, `updatedAt`

Relations:
- `provider: Provider`
- `providerServices: ProviderService[]` (opposite relation)

### 2.6 `Booking`, `Review`, `Payment` (provider-facing relations)

`Booking`:
- `providerId` (String)
- `serviceId?` (String?) and `serviceCategory` (String)
- status fields: `status`, `paymentStatus`
- `messages: Json default "[]"`
- `reviewed` (Boolean default false)

`Review`:
- `reviewerId`, `providerId`
- `rating` (Float)
- `comment?`
- `bookingId?`
- relation names: `ProviderReviews` and `ReviewerReviews`

---

## 3) Backend: Provider APIs & controller behavior

Router file: `backend/routes/api.js`

### 3.1 Provider endpoints

#### A) List provider services (approved + requests)
`GET /api/providers/:id/services`

Controller: `backend/controllers/providerController.js` → `getProviderServices`

Behavior:
1. Loads approved links:
   - `prisma.providerService.findMany({ where: { providerId: id }, include: { service: true }, orderBy: { createdAt: 'desc' } })`
2. Loads provider’s pending/denied requests:
   - `prisma.providerServiceRequest.findMany({ where: { providerId: id }, orderBy: { createdAt: 'desc' } })`
3. Formats combined response items with:
   - For approved links: `{ approvalStatus: 'APPROVED', name: link.service.name, basePricePerDay, description, createdAt }`
   - For requests: `{ approvalStatus: r.status, name: r.requestedServiceName, basePricePerDay, description, createdAt }`
4. Sorts by `createdAt` descending across both arrays.

Response:
- Array of objects. Example shape:
```json
[
  {
    "id": "<ProviderService.id>",
    "name": "AC Repair",
    "approvalStatus": "APPROVED",
    "basePricePerDay": 799,
    "description": "...",
    "createdAt": "2026-..."
  }
]
```

#### B) Register a provider service request (pending approval)
`POST /api/providers/:id/services/register`

Controller: `backend/controllers/providerController.js` → `registerProviderService`

Request body (frontend sends):
- `serviceName` (required)
- `description` (required)
- `popularIssues` (optional; frontend sends `[]`)
- `experienceYears` (optional)
- `basePricePerDay` (required)

Key validations:
- Missing `serviceName` → 400
- Missing `basePricePerDay` → 400
- Missing `description` → 400
- Provider not found → 404

Duplicate prevention logic (important):
1. If already approved for provider+service → 409
2. If already pending for provider+service → 409
3. If any prior request exists AND it is NOT `DENIED` → 409
   - Only `DENIED` allows resubmission.

Side effects:
- Creates `ProviderServiceRequest` with `status = PENDING`.
- Optionally updates `Provider.experienceYears` if `experienceYears` is provided and numeric.

Success:
- `201` with created request record JSON.

#### C) Provider profile update
`PATCH /api/providers/:id/profile`

Controller: `updateProfile`

Request body:
- `bio`
- `hourlyRate`
- `specialties`
- `serviceAreas`

Behavior:
- 404 if provider missing.
- Converts `hourlyRate` to Number (keeps existing if field is undefined).
- Uses arrays only if provided as array.

#### D) Provider availability update
`PATCH /api/providers/:id/availability`

Request body:
- `availableDays` (array)
- `timeSlots` (array)

Behavior:
- Updates `Provider.availableDays` and `Provider.timeSlots`.

#### E) Provider verify toggle (admin/ops action)
`PATCH /api/providers/:id/verify`

Request body:
- `isVerified` (boolean)

Behavior:
- Updates `Provider.isVerified`.

---

## 4) Backend: Admin provider service approval flow

Router endpoints (in `backend/routes/api.js`):
- `GET  /api/admin/provider-service-requests`
- `PATCH /api/admin/provider-service-requests/:id/approve`
- `PATCH /api/admin/provider-service-requests/:id/deny`
- `GET  /api/admin/provider-service-items`

Implementation:

### 4.1 Fetch pending requests + approve/deny UI data
Admin controller: `backend/controllers/adminProviderServiceItemsController.js`

`GET /api/admin/provider-service-items?role=admin`

Behavior:
- Requires role check if `role` is provided in body/query.
- Fetches in parallel:
  1. `ProviderServiceRequest` where `status = PENDING`, including provider + provider.user
  2. `ProviderService` (approved links), including provider + provider.user + service
- Maps into combined list items with:
  - pending items: `{ type: 'PENDING', id, provider, name, description, basePricePerDay, experienceYears, createdAt, approvalStatus }`
  - approved items: `{ type: 'APPROVED', id: 'APP-<id>', provider, name, description, basePricePerDay, experienceYears: null, createdAt, approvalStatus: 'APPROVED' }`

Returns a single combined sorted list (newest first).

### 4.2 Approve a pending provider service request
Admin controller: `backend/controllers/adminProviderServiceController.js` → `approveService`

`PATCH /api/admin/provider-service-requests/:id/approve`

Admin access:
- If `role` is present and not `admin` → 403.

Request body:
- frontend/context sends `{ role: 'admin' }`

Behavior:
1. Load `ProviderServiceRequest` including `provider.user`.
2. Set `ProviderServiceRequest.status = 'APPROVED'`.
3. Ensure global `Service` exists:
   - normalize requested name and check `service.findUnique({ where: { nameNormalized }})`
   - if not found, create it.
4. Create `ProviderService` linking provider + service:
   - `providerServiceRequestId` is set to request.id
   - copies `basePricePerDay` and `description`
5. Create a `Notification` for the provider user:
   - title: `Service approved`
   - message includes request name
   - type: `SERVICE_APPROVAL`

Response:
- `{ success: true, requestId: ..., serviceId: ... }`

### 4.3 Deny a pending provider service request
Admin controller: `denyService`

`PATCH /api/admin/provider-service-requests/:id/deny`

Request body:
- requires `reason` (string)
- role check like above

Behavior:
- Sets request status to `DENIED` and stores `denialReason`.
- Creates a `Notification` to provider user:
  - type: `SERVICE_DENIAL`
  - message includes denial reason.

Response:
- `{ success: true, requestId: ... }`

---

## 5) Provider frontend functionality (UI components/pages)

Primary page:
- `frontend/src/pages/ProviderDashboard.jsx`

### 5.1 Provider dashboard tabs
Tabs:
- Leads (`leads`)
- Earnings (`earnings`)
- My Services (`services`)
- Reviews (`reviews`)
- Support (`support`)
- Referrals/Ambassador (`referrals`)

Pending gating:
- `isPending = currentUser?.status === 'pending' || !activeProvider?.isVerified`
- If pending → shows `PendingBanner` and hides main header.

Booking/lead queue:
- ProviderDashboard filters `bookings` from context by `providerId === activeProvider.id`.

### 5.2 Provider header (profile summary)
Component: `frontend/src/components/ProviderHeader.jsx`

Renders:
- avatar from `provider.avatar` or `provider.photo`
- category + name + phone
- rating, jobs completed, lifetime net earnings
- **Active Specialist (approved services chips)**:
  - Fetches `GET /api/providers/:providerId/services`
  - Filters items where `approvalStatus === 'APPROVED'`
  - Displays the approved `name` values as chips under the “Active Specialist” label
  - Shows loading state and “No approved services yet” when empty


### 5.3 Provider services registration + listing
Component: `frontend/src/components/ProviderServicesPanel.jsx`

Data flow in this component:
- It fetches:
  - `GET /api/providers/:providerId/services` (provider services + requests)
  - `GET /api/services` (global catalog) to populate dropdown

My Services list:
- Each item shows:
  - `sv.name`
  - `sv.approvalStatus` visual pill:
    - APPROVED: “Approved”
    - PENDING: “Pending Approval”
    - otherwise: “Denied”
  - experience display: `provider?.experienceYears ?? experienceYears`
  - base price per day
  - description + requested timestamp

Register modal:
- Opens modal with inputs:
  - service interested (dropdown)
  - if “OTHER” selected → manual service name
  - experience years
  - base price per day (required)
  - service description (required)

Submit:
- `POST /api/providers/:providerId/services/register`
- payload:
  - `serviceName`, `description`, `popularIssues: []`, `experienceYears`, `basePricePerDay`

On success:
- closes modal and refreshes provider services list.

### 5.4 Provider reviews page
Component: `frontend/src/components/ProviderReviews.jsx`

Renders:
- Feedback Score card: `rating` formatted to 1 decimal
- “No feedback found” if `reviews` empty/undefined
- Otherwise renders cards for each review: reviewerName, rating, comment, date

ProviderDashboard passes:
- `rating={activeProvider?.rating}`
- `reviews={activeProvider?.reviews}`

### 5.5 Provider listings (public browsing)
Component: `frontend/src/components/ProviderListItem.jsx`

Used to display provider card with:
- avatar
- verified badge (`provider.isVerified`)
- rating and reviewCount
- bio, specialties, service areas
- booking action and favorite toggle

### 5.6 Admin “other services requests” UI
Component: `frontend/src/components/AdminOtherServicesRequestsPanel.jsx`

(This component is referenced by Admin UI. If you want full details of this admin panel’s exact behavior, tell me and I’ll extract its internal calls and rendering exactly—currently we have only seen it listed in tabs, not its full file contents.)

---

## 6) Provider lifecycle: end-to-end flow summary

### 6.1 Provider signup
1. Frontend sends provider signup with `role='provider'`.
2. Backend `UserController.register`:
   - creates `User` (status `ACTIVE`)
   - creates `Provider` profile with defaults and `serviceInterested` as `category`.
3. Provider can login normally unless `user.status` is blocked in login.

### 6.2 Provider updates profile/availability
- `PATCH /api/providers/:id/profile`
- `PATCH /api/providers/:id/availability`

### 6.3 Provider registers a new service (requires admin approval)
- UI: `ProviderServicesPanel`
- Backend:
  - `POST /api/providers/:id/services/register`
  - creates `ProviderServiceRequest (PENDING)`

### 6.4 Admin approves/denies
- Approve:
  - request status → `APPROVED`
  - ensures global `Service` exists (by normalized name)
  - creates `ProviderService`
  - creates `Notification`
- Deny:
  - request status → `DENIED` and stores reason
  - creates `Notification`

### 6.5 Provider sees services in “My Services”
- UI fetches `GET /api/providers/:id/services`
- Backend combines approved ProviderService + all ProviderServiceRequest records.

### 6.6 Reviews
- Customers can create reviews via `POST /api/reviews`.
- Backend `ReviewController.create` stores `Review` and marks the booking `reviewed=true` when `bookingId` is provided.

---

## 7) Current gaps / code caveats found while documenting

1. `ProviderController.getAll/getById` uses `provider.reviews` and Provider schema includes `reviews` relation, but provider rating/reviewCount recomputation is not shown in current controllers.
2. `ProviderServicesPanel` defines `availableServices` as empty and instead relies on `allServices` fetched from `/api/services`.
3. `AppContext.applyReferralCode` is explicitly “not implemented yet”; provider referral UI calls a local stub.
4. Prisma schema snippet you showed does not display `nameNormalized` field, but admin controller expects it.
   - If it’s missing in your real DB schema, admin service approval may fail.

---

## 8) Provider account: what fields exist (quick checklist)

### 8.1 User-level account fields (provider user)
From `User` model:
- id, name, email, phone, role
- status (ACTIVE/INACTIVE/SUSPENDED)
- avatar
- createdAt/updatedAt

### 8.2 Provider-profile fields
From `Provider` model:
- id, userId
- category
- rating, reviewCount
- experienceYears, jobsCompleted, hourlyRate, earnings
- bio
- specialties (Json), serviceAreas (Json)
- photo
- isVerified, isFeatured
- availableDays, timeSlots

### 8.3 Provider service offerings
- Approved: `ProviderService` (providerId + serviceId + basePricePerDay + description)
- Pending/Denied: `ProviderServiceRequest` (requestedServiceName + status + denialReason + description)

### 8.4 Provider feedback
- `Review` records tied by providerId and optionally bookingId

### 8.5 Provider notifications
- Notification rows created by admin approval/deny

