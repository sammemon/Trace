# TRACE

TRACE is a university-only lost-and-found product for Mehran University (MUET), designed for a responsive web experience and a mobile-style client.

## Phase 1 quickstart

Prerequisites: Node.js 20+, pnpm 9+, and Docker Desktop.

```powershell
Copy-Item .env.example .env
pnpm install
docker compose up -d
pnpm db:generate
pnpm db:migrate
pnpm db:seed
pnpm dev
```

The API is available at `http://localhost:3000/api/v1/health`; Swagger is at `http://localhost:3000/docs`. Readiness checks Postgres at `http://localhost:3000/api/v1/ready`.

## Workspace

- `apps/api`: NestJS API and Prisma schema
- `apps/mobile`: Expo client workspace reserved for Phase 2+
- `apps/admin`: responsive admin workspace reserved for Phase 7+
- `packages/shared`: shared Zod schemas and API types
- `docs`: architecture, security, and decision records
