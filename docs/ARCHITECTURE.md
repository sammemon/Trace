# Architecture

TRACE is a pnpm/Turbo monorepo with a modular NestJS API, Prisma/PostgreSQL persistence, Redis for cache and jobs, and shared Zod contracts in `packages/shared`. The responsive client surfaces are split into `apps/mobile` and `apps/admin`; both consume the versioned API.

Phase 1 runtime: Postgres stores relational data, Redis is reserved for queues and realtime coordination, MinIO provides S3-compatible local storage, and Mailpit catches local mail.

The API uses the envelope `{ data, meta? }` for success and will expose Swagger at `/docs`.
