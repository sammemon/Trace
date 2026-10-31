# TRACE

TRACE is a university-only lost-and-found product for Mehran University (MUET), designed for a responsive web experience and a mobile-style client.

## Quickstart

Prerequisites: Node.js 20+, pnpm 9+, and Docker Desktop.

```powershell
Copy-Item .env.example .env
corepack pnpm install
docker compose up -d
corepack pnpm db:generate
corepack pnpm db:migrate
corepack pnpm db:seed
corepack pnpm dev
```

The API is available at `http://localhost:3000/api/v1/health`; Swagger is at `http://localhost:3000/docs`. Readiness checks Postgres at `http://localhost:3000/api/v1/ready`.

## Workspace

- `apps/api`: NestJS API and Prisma schema
- `apps/mobile`: Expo client workspace and future native client surface
- `apps/admin`: responsive React/Vite web client
- `packages/shared`: shared Zod schemas and API types
- `docs`: architecture, security, and decision records

## Verification

Use the repository-pinned pnpm executable on Windows if a global pnpm version overrides Corepack:

```powershell
corepack pnpm typecheck
corepack pnpm build
corepack pnpm test
```

The API uses `/api/v1`, Swagger is available at `/docs`, and the realtime namespace is `/realtime`. Docker is required for PostgreSQL, Redis, MinIO, and Mailpit.
