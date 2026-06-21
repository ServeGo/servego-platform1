# TODO

## Active Specialist (Approved services) - Hyderabad Node

### Step 1 (Backend)
- Add endpoint to fetch providers who have **APPROVED** service registration for a given service category.
- Include provider data needed by UI (id, name, avatar, category/serviceAreas, rating, reviewCount, bio, isVerified, specialties, serviceAreas, reviews).
- Filter by requested service name (e.g., "Plumber") case-insensitively.

### Step 2 (Backend)
- Wire new endpoint into `backend/routes/api.js`.

### Step 3 (Frontend)
- Add new state/action in `frontend/src/context/AppContext.jsx` to fetch providers-by-service.

### Step 4 (Frontend)
- Update `frontend/src/components/ServiceCard.jsx` to compute `categoryProviders` from the new providers-by-service list (instead of `providers.filter(p => p.category === category.name)`).
- Update the “Verified Pros” count accordingly.

### Step 5 (Frontend)
- Update `frontend/src/pages/ServiceDetails.jsx` to list providers using the approved-service list for the selected category (then apply `filterArea` and sorting).

### Step 6 (Validation)
- Verify:
  - Electrician-registered provider with approved Plumber service appears in Plumber sector.
  - Pending/Denied services do not appear.
  - Hyderabad area filter still works.

