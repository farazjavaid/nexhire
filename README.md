# Nexyre

An Nx monorepo containing a Next.js frontend (BFF client) and a NestJS backend (BFF), backed by PostgreSQL via Prisma and Supabase.

---

## Architecture

```
┌─────────────────────┐     HTTP /api/*      ┌──────────────────────┐     Prisma     ┌────────────────┐
│  Frontend (Next.js) │ ──────────────────►  │  Backend (NestJS)    │ ─────────────► │  packages/db   │
│  Vercel             │                      │  Render              │                │  Prisma + PG   │
└─────────────────────┘                      └──────────────────────┘                └────────────────┘
        port 3000                                    port 4000                         Supabase (PG)
```

- **Frontend** is a pure UI layer. It calls the backend API and never touches the database directly.
- **Backend** is the BFF (Backend For Frontend). It owns all business logic, data access, and exposes REST endpoints under `/api`.
- **packages/db** is a shared Prisma library. Only the backend imports it — this is enforced by Nx module boundary rules at lint time.

---

## Monorepo structure

```
nexyre/
├── apps/
│   ├── frontend/               Next.js 15 app (App Router)
│   │   ├── src/app/            Pages, layouts, API route handlers
│   │   └── .env.example        Required env vars
│   └── backend/                NestJS app (webpack-bundled)
│       ├── src/
│       │   ├── app/            AppModule, controllers, services
│       │   └── main.ts         Entry point — port 4000, CORS, global prefix /api
│       └── .env.example        Required env vars
├── packages/
│   └── db/                     Shared Prisma library (@nexyre/db)
│       ├── prisma/
│       │   └── schema.prisma   Database schema — edit this to add models
│       └── src/
│           ├── index.ts        Public exports
│           └── lib/prisma.ts   PrismaClient singleton
├── .github/workflows/          CI/CD pipelines (ci, deploy-dev, deploy-uat, deploy-prod)
├── eslint.config.mjs           Module boundary rules
├── nx.json                     Nx plugin configuration
├── tsconfig.base.json          Root TypeScript config (strict, nodenext)
└── package.json                Root scripts and workspace dependencies
```

---

## Prerequisites

- **Node.js** 20+
- **npm** 10+ (comes with Node 20)
- A **Supabase** project (PostgreSQL) — [supabase.com](https://supabase.com)

---

## Initial setup

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment variables

Copy the example files and fill in your values:

```bash
cp apps/frontend/.env.example apps/frontend/.env.local
cp apps/backend/.env.example  apps/backend/.env
```

**`apps/frontend/.env.local`**

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_API_URL` | URL of the NestJS backend. Use `http://localhost:4000/api` locally. |

**`apps/backend/.env`**

| Variable | Description |
|---|---|
| `PORT` | Port the backend listens on. Default: `4000`. |
| `FRONTEND_URL` | Frontend origin for CORS. Use `http://localhost:3000` locally. |
| `DATABASE_URL` | PostgreSQL connection string from Supabase. |

### 3. Generate the Prisma client

```bash
npm run db:generate
```

### 4. Run database migrations

```bash
npm run db:migrate
```

> For the first run this will create the tables defined in `packages/db/prisma/schema.prisma`.

---

## Running locally

### Both apps together

```bash
npm run dev:all
```

### Individually

```bash
# Frontend only — http://localhost:3000
npm run dev

# Backend only — http://localhost:4000/api
npm run dev:backend
```

---

## Common commands

| Command | What it does |
|---|---|
| `npm run dev` | Start the Next.js dev server |
| `npm run dev:backend` | Start the NestJS dev server |
| `npm run dev:all` | Start both in parallel |
| `npm run build` | Production build of the frontend |
| `npm run build:backend` | Production build of the backend |
| `npm run build:all` | Build everything |
| `npm run lint` | ESLint across all projects |
| `npm run test` | Jest across all projects |
| `npm run typecheck` | TypeScript check across all projects |
| `npm run db:generate` | Regenerate Prisma client after schema changes |
| `npm run db:migrate` | Create and apply a new migration (dev only) |
| `npm run db:migrate:deploy` | Apply existing migrations (CI/production) |
| `npm run db:studio` | Open Prisma Studio to browse the database |

You can also run Nx targets directly:

```bash
npx nx dev frontend
npx nx serve backend
npx nx build frontend
npx nx build backend
npx nx lint frontend
npx nx test backend
```

---

## Writing code

### Adding a new API endpoint (backend)

1. Create a new module in `apps/backend/src/`:

```bash
# Example: a users module
mkdir -p apps/backend/src/users
```

2. Create `users.module.ts`, `users.controller.ts`, `users.service.ts`.
3. Inject `PrismaService` (or import `prisma` from `@nexyre/db`) in your service.
4. Register the module in `apps/backend/src/app/app.module.ts`.

The endpoint will be available at `http://localhost:4000/api/users`.

### Adding a database model

1. Edit `packages/db/prisma/schema.prisma` and add your model.
2. Run `npm run db:migrate` — give the migration a descriptive name when prompted.
3. Run `npm run db:generate` to regenerate the Prisma client.
4. Import and use from the backend: `import { prisma } from '@nexyre/db'`.

### Calling the backend from the frontend

The backend URL is available via `process.env.NEXT_PUBLIC_API_URL`. Example:

```typescript
// apps/frontend/src/app/some-page/page.tsx
const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users`);
const users = await res.json();
```

> Never import `@nexyre/db` or `prisma` in the frontend. The ESLint module boundary rule will catch this and throw an error.

---

## Module boundary rules

Nx enforces these dependency constraints at lint time:

| Project | Can depend on |
|---|---|
| `scope:frontend` | Other `scope:frontend` libs |
| `scope:backend` | `scope:backend` libs + `scope:db` |
| `scope:db` | Nothing else |

If a developer accidentally imports `@nexyre/db` in the frontend, `npm run lint` will error with a module boundary violation.

---

## CI/CD

GitHub Actions workflows in `.github/workflows/`:

| Workflow | Trigger | What it does |
|---|---|---|
| `ci.yml` | All PRs + pushes | Lint, test, build (affected projects only) |
| `deploy-dev.yml` | Push to `develop` | DB migrate → build → deploy to dev |
| `deploy-uat.yml` | Push to `staging` | DB migrate → build → deploy to UAT |
| `deploy-prod.yml` | Push to `main` | DB migrate → build → deploy to prod |

### Branch strategy

```
feature/* ──► develop ──► staging ──► main
                │              │          │
               dev env       UAT env    prod env
```

Feature branches are cut from `develop` and merged back into `develop`. From there, changes are promoted to `staging` then `main`.

### Required GitHub Secrets

Add these in your repo under **Settings → Secrets and variables → Actions**:

| Secret | Where to get it |
|---|---|
| `VERCEL_TOKEN` | Vercel → Account Settings → Tokens |
| `VERCEL_ORG_ID` | Vercel → Account Settings |
| `VERCEL_PROJECT_ID_DEV` | Vercel project (dev) → Settings → General |
| `VERCEL_PROJECT_ID_UAT` | Vercel project (UAT) → Settings → General |
| `VERCEL_PROJECT_ID_PROD` | Vercel project (prod) → Settings → General |
| `RENDER_DEPLOY_HOOK_DEV` | Render service (dev) → Settings → Deploy Hook |
| `RENDER_DEPLOY_HOOK_UAT` | Render service (UAT) → Settings → Deploy Hook |
| `RENDER_DEPLOY_HOOK_PROD` | Render service (prod) → Settings → Deploy Hook |
| `DATABASE_URL_DEV` | Supabase project (dev) → Settings → Database |
| `DATABASE_URL_UAT` | Supabase project (UAT) → Settings → Database |
| `DATABASE_URL_PROD` | Supabase project (prod) → Settings → Database |

---

## Tech stack

| Layer | Technology | Hosting |
|---|---|---|
| Frontend | Next.js 15 + React 19, Tailwind CSS | Vercel |
| Backend | NestJS 11, webpack | Render |
| Database | PostgreSQL | Supabase |
| ORM | Prisma | — |
| Monorepo | Nx 21 | — |
| Language | TypeScript 5.9 (strict) | — |
| CI/CD | GitHub Actions | — |
