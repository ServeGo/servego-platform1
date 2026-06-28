# Role-based backend issues & optimizations (Admin / Provider / Customer)

> Scope: Backend (Node/Express + Prisma) controllers/routes under `backend/`.
> Roles considered: **admin**, **provider**, **customer**.

This doc highlights role-coupling, missing role-based filtering/authorization, schema mismatches observed from controller logic, and concrete optimizations.

---

## Admin (backend)

### B-A1) Ticket retrieval is unfiltered (admin role needs scoped access)
- **Files**: `backend/controllers/ticketController.js`
- **Issue**: `getAll()` returns **all tickets**: `prisma.ticket.findMany(...)`.
- **Impact**:
  - Admin UI can be correct, but role separation is weak.
  - Any future consumer (provider/customer) calling `/tickets` will leak tickets unless they filter client-side.
- **Optimization**:
  1. Add a dedicated endpoint for admin, e.g. `GET /admin/tickets`.
  2. Apply server-side filters and require admin authorization middleware.

### B-A2) No explicit admin authorization in ticket resolve path
- **Files**: `backend/controllers/ticketController.js`
- **Issue**: `resolve()` updates ticket and sets `adminResponse` but does not verify admin identity/role.
- **Impact**: Anyone who can call the endpoint could resolve tickets.
- **Optimization**:
  - Enforce auth middleware and check `req.user.role === 'admin'` (or equivalent).
  - Record `resolvedByAdminId` and `resolvedByAdminName`.

### B-A3) Admin booking status overrides likely need authorization
- **Files**: `backend/controllers/bookingController.js` (not yet inspected in this run)
- **Issue (inferred)**: Frontend calls `PATCH /bookings/:id/status` with override note.
- **Impact**: If backend allows this without checking role, status can be tampered.
- **Optimization**:
  - Require admin role (or allow only with policy) for cancelling/overruling.

---

## Provider (backend)

### B-P1) Provider identity / linkage needs consistent rules across providers endpoints
- **Files** (likely):
  - `backend/controllers/providerController.js`
  - `backend/controllers/providerServiceDiscoveryController.js`
  - `backend/controllers/adminProviderServiceController.js`
- **Issue (observed from frontend)**: Provider selection sometimes relies on `provider.id` vs `provider.userId`.
- **Impact**: Provider APIs can update the wrong provider record if ids are inconsistent.
- **Optimization**:
  - In login, generate a canonical mapping (e.g., `req.user.providerId`).
  - In all provider mutations, require `providerId` to match the authenticated user.

### B-P2) Provider service approval/visibility coupling
- **Files**:
  - `backend/controllers/adminProviderServiceController.js`
  - `backend/controllers/adminProviderServiceItemsController.js`
- **Issue (inferred)**: Approvals likely toggle provider verification or service catalog items.
- **Impact**: Mixed responsibilities between admin and provider flows can cause inconsistent UI states.
- **Optimization**:
  - Keep provider endpoints read-only for providers; approval mutations exclusively under `/admin/...`.
  - Use explicit status fields like `verificationStatus` with enums.

### B-P3) Booking lead statuses need enum validation at API layer
- **Files**: `backend/controllers/bookingController.js`
- **Issue**: Frontend assumes statuses like `pending|confirmed|en_route|ongoing|completed|cancelled`.
- **Impact**: API can accept arbitrary status strings leading to broken state machines.
- **Optimization**:
  - Validate `status` against an enum server-side.
  - Restrict allowed transitions based on role and current status.

---

## Customer (backend)

### B-C1) Ticket creation is not linked to an authenticated customer
- **Files**: `backend/controllers/ticketController.js`
- **Issue**:
  - `create()` takes `{ name, email, subject, message }` from body.
  - No use of `req.user.id` / authenticated customer.
- **Impact**:
  - Users can spoof ticket requester identity.
  - Harder to enforce customer-specific access.
- **Optimization**:
  - Change payload to only accept `{ subject, message }`.
  - Derive `requesterName`, `requesterEmail` from authenticated user.
  - Store `requesterUserId`.

### B-C2) Ticket status literals are inconsistent with frontend casing
- **Files**: `backend/controllers/ticketController.js`
- **Issue**:
  - Creates ticket with `status: 'OPEN'`.
  - Resolves sets `status: 'RESOLVED'`.
- **Impact**: Frontend compares `t.status === 'open'`.
- **Optimization**:
  - Normalize status to lowercase in API output OR update frontend comparisons.
  - Prefer enum + consistent casing end-to-end.

---

## Cross-role backend issues (affect all roles)

### B-X1) Missing/weak role-based authorization on critical mutation endpoints
- **Observed in ticket controller**: `resolve()` lacks role checks.
- **Likely elsewhere**: booking status updates, provider availability/profile mutations, admin approval endpoints.
- **Optimization**:
  - Add centralized authorization middleware:
    - `requireAuth`
    - `requireRole('admin'|'provider'|'customer')`
    - optionally policy checks per resource ownership.

### B-X2) Lack of server-side scoping causes client-side filtering and privacy risk
- **Observed in ticket controller**: `getAll()` returns every ticket.
- **Optimization**:
  - Provide role-scoped endpoints:
    - `GET /customer/tickets`
    - `GET /provider/tickets`
    - `GET /admin/tickets`
  - Ensure Prisma queries include `where: { requesterUserId: ... }`.

### B-X3) Inconsistent schema field naming across frontend roles indicates backend mapping issues
- **Observed**:
  - Backend ticket model uses `requesterEmail`.
  - Frontend uses different fields: customer side uses `t.email`, provider uses `t.requesterEmail`, admin uses `t.email`.
- **Optimization**:
  - Standardize ticket response DTO shape (send `email` or always `requesterEmail`, not both).

### B-X4) Status machine should be enforced with validation + transitions
- **Observed**: frontend depends on string statuses.
- **Optimization**:
  - Enforce transition rules server-side.
  - Use Prisma enums if possible.

---

## Recommended backend structure changes (low-risk)

1. **DTO layer** for consistent response shapes:
   - e.g., `TicketDTO` with `status`, `requesterEmail`, `subject`, `message`, `adminResponse`, timestamps.
2. **Resource scoping**:
   - Ticket routes should be scoped by requester or admin.
3. **Authorization middleware**:
   - Apply to every mutation route.
4. **Enums/validation**:
   - Booking status and ticket status should be validated at the server.

---

## Files fully/partially inspected in this run
- ✅ Fully/strongly validated from code:
  - `backend/controllers/ticketController.js`
  - `backend/controllers/bookingController.js`
  - `backend/controllers/providerController.js`
  - `backend/controllers/adminProviderServiceController.js`
  - `backend/controllers/notificationController.js`
  - `backend/controllers/paymentController.js`
  - `backend/controllers/userController.js`

> Note: `backend/controllers/adminProviderServiceItemsController.js` and `backend/controllers/providerServiceDiscoveryController.js` were not inspected in this run; any remaining items in other sections should be treated as needing verification.


