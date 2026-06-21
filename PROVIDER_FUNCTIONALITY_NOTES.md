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
- Have automatic **reputation data**:
  - `verificationLevel` is the trust rank (`BRONZE`, `SILVER`, `GOLD`, `ELITE`).
  - `ProviderBadge` records are achievement badges (`TOP_RATED`, `FAST_RESPONSE`, `JOBS_100`, etc.).
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
  - `verificationLevel` (enum `VerificationLevel`, default `BRONZE`)
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
  - `badges: ProviderBadge[]`
  - `bookings: Booking[]`
  - `providerServices: ProviderService[]`
  - `providerServiceRequests: ProviderServiceRequest[]`

### 2.3 `ProviderBadge` (achievement badges)
Model: `model ProviderBadge`

Badges are earned achievements. They are separate from approved services and separate from verification level.

Fields:
- `id` (String, PK)
- `providerId` (String)
- `badgeType` (enum `BadgeType`)
- `awardedAt` (DateTime default now)

Rules:
- A provider can have many badges.
- A provider can only have one row for the same badge type:
  - `@@unique([providerId, badgeType])`
- Badges are recalculated automatically by `backend/services/providerReputationService.js`.
- Admins do not manually assign badges.

Current badge types:
- `TOP_RATED`: high rating and enough reviews
- `FAST_RESPONSE`: confirms bookings quickly on average
- `JOBS_100`: 100+ completed jobs
- `RELIABLE_PROVIDER`: no cancellations in the last 30 bookings
- `MULTI_SERVICE_EXPERT`: 5+ approved services
- `CUSTOMER_FAVORITE`: many repeat customers
- `ELITE_PROVIDER`: provider has Elite trust level

### 2.4 `Service` (global service catalog)
Model: `model Service`

- `id` (String, PK)
- `name` (String)
- `nameNormalized` (String?, unique)
  - Used by admin approval logic to find/create service names consistently.
  - Created from service name using lowercase + trim.

Important fields:
- `description?`
- `basePrice` (Float default 0)
- `popularIssues` (Json default "[]")
- `isHidden` (Boolean default false)

Relations:
- `providerServices: ProviderService[]`
- `bookings: Booking[]` (serviceId optional)

### 2.5 `ProviderService` (approved services offered by a provider)
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

### 2.6 `ProviderServiceRequest` (pending/denied submissions)
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

### 2.7 `Booking`, `Review`, `Payment` (provider-facing relations)

`Booking`:
- `providerId` (String)
- `serviceId?` (String?) and `serviceCategory` (String)
- status fields: `status`, `paymentStatus`
- `messages: Json default "[]"`
- `reviewed` (Boolean default false)

`Review`:
- `reviewerId`, `providerId`
- `reviewerName?`
- `rating` (Float)
- `comment?`
- `bookingId?`
- relation names: `ProviderReviews` and `ReviewerReviews`

### 2.8 Reputation enums

`VerificationLevel`:
- `BRONZE`
- `SILVER`
- `GOLD`
- `ELITE`

`BadgeType`:
- `TOP_RATED`
- `FAST_RESPONSE`
- `JOBS_100`
- `RELIABLE_PROVIDER`
- `MULTI_SERVICE_EXPERT`
- `CUSTOMER_FAVORITE`
- `ELITE_PROVIDER`

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
- Calls `refreshProviderReputation(id)` so the trust level is recalculated after verification changes.

### 3.2 Provider reputation engine

Main file:
- `backend/services/providerReputationService.js`

Purpose:
- Keeps provider trust level and badges automatic.
- Recomputes cached provider stats from source records:
  - `rating`
  - `reviewCount`
  - `jobsCompleted`
  - `verificationLevel`
  - `ProviderBadge` rows

Important rule:
- Admins should not manually assign `verificationLevel` or badges.
- The backend calculates them from reviews, completed bookings, approved services, and booking history.

#### Verification level thresholds

`calculateVerificationLevel(provider)`:

- `ELITE`
  - `isVerified = true`
  - `jobsCompleted >= 100`
  - `rating >= 4.8`
  - `reviewCount >= 50`

- `GOLD`
  - `isVerified = true`
  - `jobsCompleted >= 50`
  - `rating >= 4.5`
  - `reviewCount >= 20`

- `SILVER`
  - `isVerified = true`
  - `jobsCompleted >= 10`
  - `rating >= 4.0`

- `BRONZE`
  - fallback/default level
  - also used when provider is not verified

#### Badge thresholds

Current badge rules:
- `TOP_RATED`
  - `rating >= 4.8`
  - `reviewCount >= 20`
- `FAST_RESPONSE`
  - average time from booking creation to `CONFIRMED` status is under 5 minutes
- `JOBS_100`
  - `jobsCompleted >= 100`
- `RELIABLE_PROVIDER`
  - last 30 bookings contain no `CANCELLED` status
- `MULTI_SERVICE_EXPERT`
  - provider has 5+ approved `ProviderService` records
- `CUSTOMER_FAVORITE`
  - 50+ repeat customers based on completed bookings
- `ELITE_PROVIDER`
  - `verificationLevel === ELITE`

#### When reputation refresh runs

`refreshProviderReputation(providerId)` is called after:
- Booking status update:
  - `BookingController.updateStatus`
  - updates jobs completed, fast response, reliability badges
- Review submission:
  - `ReviewController.create`
  - updates rating, review count, trust level, review-based badges
- Admin verification:
  - `ProviderController.verify`
  - updates trust level after `isVerified` changes
- Admin service approval:
  - `AdminProviderServiceController.approveService`
  - updates `MULTI_SERVICE_EXPERT`

#### Review submission flow

Endpoint:
- `POST /api/reviews`

Behavior:
1. Validates required fields:
   - `reviewerId`
   - `reviewerName`
   - `rating`
   - `providerId`
2. Validates rating is between 1 and 5.
3. If `bookingId` is provided:
   - verifies booking exists
   - verifies booking belongs to the same provider
4. Creates `Review`.
5. Marks booking as `reviewed = true` when `bookingId` exists.
6. Calls `refreshProviderReputation(providerId)`.
7. Returns:
```json
{
  "success": true,
  "review": {
    "id": "...",
    "providerId": "...",
    "rating": 5
  }
}
```

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
6. Calls `refreshProviderReputation(request.providerId)`.
   - This can award or remove the `MULTI_SERVICE_EXPERT` badge.

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
- **Active Specialist**:
  - Shows provider/service status only.
  - This is not a badge.
- **Approved Services**:
  - Fetches `GET /api/providers/:providerId/services`
  - Filters items where `approvalStatus === 'APPROVED'`
  - Displays approved service names as service chips
  - Shows loading state and “No approved services yet” when empty
- **Trust Level**:
  - Displays `VerificationLevelPill`
  - Shows `BRONZE`, `SILVER`, `GOLD`, or `ELITE`
  - This is separate from badges.
- **Badges**:
  - Displays `ReputationBadgeStrip`
  - Shows earned achievement badges only.
  - Examples: `Top Rated`, `Fast Response`, `100 Jobs`, `Reliable`, `Multi-Service Expert`.


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

Review impact:
- Reviews are not just display data.
- After a customer submits a review, backend recalculates provider `rating` and `reviewCount`.
- Those values can upgrade the provider trust level and can award `TOP_RATED`.

### 5.5 Provider listings (public browsing)
Component: `frontend/src/components/ProviderListItem.jsx`

Used to display provider card with:
- avatar
- trust level pill when provider is verified
- reputation badges, limited to the first 2 badges on the card
- rating and reviewCount
- bio, specialties, service areas
- booking action and favorite toggle

Important UI distinction:
- Approved services show what the provider can offer.
- Trust level shows how trustworthy the provider is.
- Badges show achievements earned by performance.

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
- Backend then calls `refreshProviderReputation(providerId)`.
- This recalculates:
  - average rating
  - review count
  - verification level
  - review-related badges

### 6.7 Reputation refresh

Reputation refresh is automatic and event-driven.

Events that trigger it:
- booking status changes
- customer review submission
- admin provider verification toggle
- admin service approval

What gets recalculated:
- `Provider.rating`
- `Provider.reviewCount`
- `Provider.jobsCompleted`
- `Provider.verificationLevel`
- `ProviderBadge` rows

The provider should understand these as separate concepts:
- **Approved Services**: what services they are allowed to offer.
- **Trust Level**: Bronze/Silver/Gold/Elite rank.
- **Badges**: achievement labels earned from performance.

---

## 7) Current gaps / code caveats found while documenting

1. `ProviderServicesPanel` defines `availableServices` as empty and instead relies on `allServices` fetched from `/api/services`.
2. `AppContext.applyReferralCode` is explicitly “not implemented yet”; provider referral UI calls a local stub.
3. `prisma generate` may fail on Windows if a running Node/backend process has the Prisma query engine DLL locked.
   - Stop running Node/backend processes, then rerun Prisma migration/generate.

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
- rating, reviewCount, verificationLevel
- experienceYears, jobsCompleted, hourlyRate, earnings
- bio
- specialties (Json), serviceAreas (Json)
- photo
- isVerified, isFeatured
- availableDays, timeSlots
- badges relation (`ProviderBadge[]`)

### 8.3 Provider service offerings
- Approved: `ProviderService` (providerId + serviceId + basePricePerDay + description)
- Pending/Denied: `ProviderServiceRequest` (requestedServiceName + status + denialReason + description)

### 8.4 Provider feedback
- `Review` records tied by providerId and optionally bookingId
- Reviews update reputation automatically after submission.

### 8.5 Provider badges
- Stored in `ProviderBadge`.
- Awarded/removed automatically by `refreshProviderReputation`.
- Displayed separately from approved services in provider UI.

### 8.6 Provider notifications
- Notification rows created by admin approval/deny

