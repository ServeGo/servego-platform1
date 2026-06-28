# Role-based frontend issues (Provider / Customer / Admin)

This file groups **frontend issues & missing/overlapping behaviors** by role, based on the current codebase structure.

> Scope: Frontend (React) files under `frontend/src/`.
> Roles considered: **admin**, **provider**, **customer**.

---

## Admin (frontend)

### A1) Admin UI + logic mixed inside a single component
- **File**: `frontend/src/pages/AdminPanel.jsx`
- **Issue**: `AdminPanel` contains a large amount of UI + business logic:
  - service CRUD (create/update/delete/hide)
  - provider verification toggles
  - bookings table + status overrides
  - provider service request approvals panel selection
  - ticket resolution responses
  - commission/tax/settings UI
- **Impact**: Hard to maintain; increases regression risk and makes role separation difficult to enforce.
- **Optimization**:
  1. Split tabs into separate components: e.g. `AdminServicesTab`, `AdminProvidersTab`, `AdminBookingsTab`, `AdminServiceRequestsTab`, `AdminTicketsTab`, `AdminSettingsTab`.
  2. Move data actions into small hook/service functions (e.g. `useAdminBookingsActions`) so UI components remain mostly presentational.
  3. Keep tab state and derived lists local to each tab component to reduce cross-tab desync.

### A2) Admin counts rely on potentially inconsistent backend/state fields
- **File**: `AdminPanel.jsx`
- **Issue**: Derived metrics like:
  - pending partners count uses `providers.filter(p => !p.isVerified)`
  - active tickets count uses `tickets.filter(t => t.status === 'open')`
- **Impact**: If backend uses different naming/casing (`verified` vs `isVerified`) or status casing (`OPEN` vs `open`), admin counters become wrong.
- **Optimization**:
  1. Introduce centralized client-side normalization (single place):
     - map provider verification field to a canonical one (e.g. `provider.isVerified ?? provider.verified ?? false`).
     - normalize ticket status casing to a canonical set.
  2. Avoid direct string comparisons scattered across components; use shared constants/enums (e.g. `TICKET_STATUS.OPEN`).

### A3) Tab system is local + prop-driven, leading to possible state desync
- **File**: `AdminPanel.jsx`
- **Issue**: `activeTabProp` / `internalActiveTab` and `setActiveTabExternal` / `setInternalActiveTab`.
- **Impact**: When embedded or controlled externally, state can become inconsistent (UI shows one tab while handlers/data are for another).
- **Optimization**:
  1. Use one source of truth:
     - controlled mode OR uncontrolled mode, not both simultaneously.
  2. If embedding is required, sync via `useEffect` with explicit rules (e.g. prefer prop when provided; otherwise internal state).

### A4) Admin service request tab depends on refresh semantics
- **File**: `AdminPanel.jsx` + `frontend/src/context/AppContext.jsx`
- **Issue**: UI may rely on manual refresh patterns; the context already auto-fetches `providerServiceRequests/providerServiceItems` on role change.
- **Impact**: Confusing “why do I need refresh” behavior.
- **Optimization**:
  1. In `AdminServiceRequestsTab`, trigger refetch only after mutations (approve/deny), not on tab mount.
  2. Remove/avoid extra side-effect “load now” handlers unless they have a deterministic reason.
  3. Ensure mutation handlers call the same refresh functions from context (already present in `AppContext.jsx`).

---

## Provider (frontend)

### P1) Provider identity mapping is ambiguous
- **File**: `frontend/src/pages/ProviderDashboard.jsx` (+ verified via `AppContext.jsx` behavior)
- **Issue**: Provider selection logic tries multiple IDs:
  - `providers.find(p => p.id === currentUser.providerId)`
  - otherwise `providers.find(p => p.userId === currentUser.id)`
- **Impact**: If backend user/provider linkage uses a different field, the wrong provider profile may render, and provider mutations may update the wrong record.
- **Optimization**:
  1. Normalize provider identity once in `AppContext` after login (single canonical `providerId`).
  2. Update provider UI components to consume `activeProvider`/`providerId` from context only (no fallback logic in components).

### P2) Provider “settings” actions don’t refresh derived UI consistently
- **File**: `ProviderDashboard.jsx`
- **Issue**: `handleSaveSettings` calls:
  - `updateProviderAvailability`
  - `updateProviderProfile`
  and then shows success toast, but may not re-fetch/normalize the “active provider” view.
- **Impact**: UI can lag or display stale availability/profile until the next global refresh.
- **Optimization**:
  1. After updating provider data in context, update a canonical `activeProvider` in context (or re-derive it from updated `providers`).
  2. Avoid toasts-only success; confirm UI uses updated state from context.
  3. If backend updates nested fields, refetch the provider list after mutations.

### P3) Provider reviews/rating props may mismatch data model
- **File**: `ProviderDashboard.jsx`
- **Issue**: Renders `ProviderReviews` using:
  - `rating={activeProvider?.rating}`
  - `reviews={activeProvider?.reviews}`
- **Impact**: If backend uses different fields (e.g. `averageRating` or `reviewSummary`), provider rating UI breaks.
- **Optimization**:
  1. Add a response adapter/normalizer when setting `providers` in context.
  2. Use a canonical rating field computed from backend payload.

### P4) Provider leads filtering assumes booking status values
- **File**: `ProviderDashboard.jsx`
- **Issue**: Lead statuses are filtered with hard-coded values like `['pending','confirmed','en_route','ongoing']`.
- **Impact**: Any backend status enum/casing change hides leads.
- **Optimization**:
  1. Centralize booking statuses in a shared constants module.
  2. Normalize booking `status` casing on input (e.g. `status.toLowerCase()` once).
  3. If possible, drive “lead” definition from a backend-provided flag or enum.

### P5) Provider support tickets filter depends on `requesterEmail`
- **File**: `ProviderDashboard.jsx`
- **Issue**: Provider filters tickets using:
  - `tickets.filter(t => t.requesterEmail === currentUser?.email)`
- **Impact**: If backend uses different field names (e.g. `email`, `customerEmail`, `requester_user_email`), provider ticket list becomes empty.
- **Optimization**:
  1. Normalize ticket DTO shape once at the context layer.
  2. Create a derived field in context like `ticket.requesterEmailCanonical`.
  3. Then pages should filter with the canonical field only.

---

## Customer (frontend)

### C1) Customer “tickets” filter depends on email matching
- **File**: `frontend/src/pages/CustomerDashboard.jsx`
- **Issue**: `tickets.filter(t => t.email === currentUser?.email)`
- **Impact**: If backend stores requester email as `requesterEmail` (or provider uses `requesterEmail`), customer tickets won’t appear.
- **Optimization**:
  1. Normalize ticket fields in context (single canonical email field).
  2. Prefer derived selectors in context (e.g. `getMyTickets()`), rather than filtering ad-hoc per page.

### C2) Customer “notifications” filtering is broad and may leak messages
- **File**: `CustomerDashboard.jsx`
- **Issue**: `notifications.filter(n => n.userId === currentUser?.id || n.role === 'customer')`
- **Impact**: Broadcast notifications may be intended, but it can also introduce privacy issues if role-based means something else.
- **Optimization**:
  1. Distinguish explicitly between **targeted** vs **broadcast** notifications in payload.
  2. Filter by `targetType` or `audienceRole` consistently.

### C3) Customer booking filtering duplicates context responsibility
- **File**: `CustomerDashboard.jsx`
- **Issue**: `userBookings` computed with `bookings.filter(b => b.customerId === currentUser?.id)`.
- **Impact**: Context already filters bookings by role in `AppContext.jsx`.
  - If booking payload or schema differs (`customerId` vs another field), page duplication increases bug risk.
- **Optimization**:
  1. Trust context-provided `bookings` already scoped per role.
  2. If you need different subsets (e.g., by status), filter only by subset criteria—not ownership.

### C4) Customer “settings” is empty / likely placeholder
- **File**: `CustomerDashboard.jsx`
- **Issue**: `activeTab === 'settings' && <SettingsView />` but it passes no props.
- **Impact**: If `SettingsView` expects user data/actions, it will rely on implicit context assumptions or be incomplete.
- **Optimization**:
  1. Ensure `SettingsView` uses a dedicated context selector or props for required user fields/actions.
  2. Keep settings actions customer-only in UI and in context.

### C5) Referral flow may not fully refresh dependent UI state
- **File**: `CustomerDashboard.jsx` + `AppContext.jsx`
- **Issue**: `applyReferralCode` updates `setCurrentUser(prev => ({...prev, referredBy: data.referredBy}))`, but does not necessarily refresh all customer-facing metrics.
- **Impact**: Some UI elements may not update (earnings, counts, derived loyalty tier, etc.) until later.
- **Optimization**:
  1. Have backend return the updated full customer object, then `setCurrentUser(data.user)`.
  2. Or add explicit state updates for all impacted fields based on the apply-referral response.

---

## Cross-role / architectural frontend issues (affect all roles)

### X1) `AppContext` mixes all role data + all role actions
- **File**: `frontend/src/context/AppContext.jsx`
- **Issue**: One context provides admin-only actions (service request approvals), provider actions, customer actions, and also fetches all role datasets.
- **Impact**: Hard to reason about, encourages cross-role coupling, and makes separation hard.
- **Optimization**:
  1. Split contexts:
     - `AdminContext` (admin datasets/actions)
     - `ProviderContext`
     - `CustomerContext`
  2. Alternatively, keep one auth context but move role-specific actions into role-scoped modules (e.g. `adminActions.js`, `providerActions.js`, `customerActions.js`).

### X2) Role-specific fetch behavior is partially implemented (tickets are not scoped in context)
- **File**: `frontend/src/context/AppContext.jsx`
- **Issue**:
  - `fetchBookings()` scopes data by role (admin/provider/customer) ✅
  - `fetchTickets()` fetches **all tickets** (no scoping) ❌
- **Impact**:
  - Pages then filter in UI (inconsistent ticket schema fields across pages).
  - Payload is larger than necessary.
  - Separation is weak because the “wrong role” dataset still lives in shared state.
- **Optimization**:
  1. Scope tickets in `fetchTickets()` based on `currentUser.role`.
  2. Best: create role-scoped endpoints on backend; but on frontend side, ensure you filter in context using canonical ticket fields.

### X3) Inconsistent ticket schema fields across UIs
- **Files**:
  - `ProviderDashboard.jsx` uses `t.requesterEmail`
  - `CustomerDashboard.jsx` uses `t.email`
  - `AdminPanel.jsx` uses `t.email` in the display
- **Impact**: Ticket lists can become empty or inconsistent depending on which page’s field assumptions match backend response.
- **Optimization**:
  1. Introduce a ticket DTO adapter in `AppContext` when setting `tickets`.
  2. Produce a canonical shape, e.g.:
     - `ticket.requesterEmailCanonical`
     - `ticket.statusCanonical`
  3. Ensure all pages consume canonical fields only.

### X4) Status value assumptions scattered across UI
- **Files**: `AdminPanel.jsx`, `ProviderDashboard.jsx`, `CustomerDashboard.jsx`, and booking/modals elsewhere
- **Issue**: Hard-coded status strings like:
  - `pending/confirmed/ongoing/completed/cancelled/en_route/...`
  - tickets filtering uses `status === 'open'` (but API may return `OPEN`) 
- **Impact**: Breaks easily when backend enums/casing change.
- **Optimization**:
  1. Add centralized constants:
     - `BOOKING_STATUSES`
     - `TICKET_STATUSES`
  2. Normalize casing once in context adapters.
  3. Use helper selectors like `isActiveBooking(status)` rather than repeated arrays.

---

## What “separate for provider and customer and admin” should mean in code terms

To separate frontend issues/flows cleanly, implement these separations:
1. **Context separation** (Admin vs Provider vs Customer) OR action-module separation while keeping a small auth context.
2. **Ticket schema normalization**: define one canonical ticket interface + adapt backend mapping once (in `AppContext` for now).
3. **Booking status constants** + **normalization** in a single adapter.
4. **Tab components**: `AdminPanel` delegates each tab to a component.
5. **Provider identity normalization**: compute `activeProvider` (or canonical `providerId`) consistently after login in context.

---

## Files most relevant to this separation right now
- `frontend/src/context/AppContext.jsx`
- `frontend/src/pages/AdminPanel.jsx`
- `frontend/src/pages/ProviderDashboard.jsx`
- `frontend/src/pages/CustomerDashboard.jsx`

