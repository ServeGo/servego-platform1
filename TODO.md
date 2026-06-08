# TODO - Postgres-only cleanup & verification

## Step 1: Confirm backend uses Postgres-only
- [ ] Search repo for sqlite usage (sqlite3/better-sqlite3/database.sqlite/initDB sqlite)
- [ ] Confirm no SQLite wrapper remains in backend/config/db.js

## Step 2: Create/verify backend environment file
- [ ] Ensure `backend/.env` exists with correct Postgres variables (`DATABASE_URL` or `PGHOST/PGPORT/PGUSER/PGPASSWORD/PGDATABASE`)

## Step 3: Clean leftover SQLite artifacts
- [ ] Remove `backend/database.sqlite` (optional: keep a backup copy if needed)

## Step 4: Smoke test backend
- [ ] Start backend server
- [ ] Call at least: `/api/health`, `/api/auth/register`, `/api/auth/login`
- [ ] Confirm seeding works (`services` seeded from frontend categories)

## Step 5: Confirm JSONB fields
- [ ] Create a provider update with specialties/serviceAreas
- [ ] Create a booking with messages/statusHistory
- [ ] Verify read endpoints return properly parsed arrays

