# ServeGo Platform

A full-stack home services marketplace where customers book verified local service providers. Includes multi-role dashboards for customers, providers, and administrators.

## Stack

- **Frontend**: React 19 + Vite + Tailwind CSS v4 + Socket.io-client (port 5000)
- **Backend**: Node.js + Express + Socket.io + Prisma ORM + PostgreSQL (port 4000)
- **AI**: Google Gemini via `@google/genai`

## Project structure

```
frontend/   React app (Vite, port 5000)
backend/    Express API + Socket.io (port 4000)
  prisma/   Schema + migrations + seed
  controllers/
  routes/
  services/
  utils/
```

## Running locally on Replit

Two workflows are configured:
- **Frontend** — `cd frontend && npm run dev` (port 5000, shown in preview)
- **Backend** — `cd backend && npm run dev` (port 4000, console output)

## Required secrets / env vars

| Variable | Where used | Notes |
|---|---|---|
| `DATABASE_URL` | Backend (Prisma) | PostgreSQL connection string |
| `JWT_SECRET` | Backend (auth) | Any long random string |
| `ALLOWED_ORIGINS` | Backend (CORS) | Comma-separated origins, or `*` |
| `PORT` | Backend | Defaults to `4000` |
| `REACT_APP_API_BASE_URL` | Frontend | Base URL for REST calls, e.g. `http://localhost:4000` |
| `REACT_APP_SOCKET_URL` | Frontend | Socket.io server URL, e.g. `http://localhost:4000` |

Add secrets via the Replit Secrets panel. For `DATABASE_URL`, use Replit's built-in PostgreSQL or your own instance.

## Database setup

```bash
cd backend
npx prisma migrate dev --name init   # apply migrations
npm run prisma:seed                   # seed initial data (optional)
```

## Pushing to GitHub

The remote `origin` points to `https://github.com/ServeGo/servego-platform1`. Use the git-remote skill or standard git commands to push branches and open PRs.

## User preferences

- Keep existing project structure and stack — do not restructure or migrate.
