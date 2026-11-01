# Decisions

## 2026-10-30: Product name and web-first foundation
The configured product name is TRACE, while the domain model and documentation retain CampusFind terminology where it improves clarity. Phase 1 establishes a shared backend foundation that can serve a responsive web experience and a later Expo client.

## 2026-10-30: API validation boundary
Shared Zod schemas define request contracts. NestJS controllers will use explicit response DTOs rather than returning Prisma records directly. This keeps the API contract portable across the web and mobile clients.

## 2026-10-30: Local infrastructure
Docker Compose provides Postgres, Redis, MinIO, and Mailpit for local development. External deployment targets remain documented as deployment choices after the core product flows exist.

## 2026-10-31: Workspace toolchain compatibility
The repository pins pnpm 9.15.0 and TypeScript 5.9-compatible settings. The editor reported a TypeScript 6 deprecation for `moduleResolution: node`, but adding `ignoreDeprecations: "6.0"` breaks the pinned compiler, so the project keeps the compatible setting until the TypeScript major version is intentionally upgraded.

## 2026-10-31: Responsive web-first clients
The mobile-style and moderation surfaces remain separate workspace applications so the API contract can support both responsive web delivery and a future Expo client without coupling their build systems.

## 2026-10-31: Phase 2 authentication defaults
Passwords use Argon2id, access tokens expire after 15 minutes, refresh tokens are hashed and rotated for 30 days, and verification/reset codes are hashed with a ten-minute lifetime and five-attempt limit. Development exposes generated OTPs only through the local API response; production requires the email delivery worker.

## 2026-10-31: Seed and local runtime readiness
The admin seed account uses an Argon2id hash and campus locations use a compound unique key so repeated seeds are safe. The API explicitly loads `.env`; live migration and seed verification remain pending until Docker Desktop is installed on the development machine.

## 2026-11-01: Initial rate limiting storage
The first rate-limit implementation uses process-local buckets so auth, OTP, posts, claims, messages, and upload abuse controls work without Redis. A production deployment must move the same policy keys to Redis before horizontal scaling.

## 2026-11-01: Docker-free local runtime
Docker is optional for local development. The API runs directly with Node.js through NestJS, whose HTTP adapter is Express, so replacing the backend with a separate Express application would duplicate the existing API work without solving the database requirement. PostgreSQL remains required by the Prisma schema; Redis, S3-compatible storage, and SMTP are optional until their related features are used.

## 2026-11-01: Supabase database hosting
Supabase is the hosted PostgreSQL provider for the Docker-free setup. Prisma continues to own the schema and migrations through Supabase's PostgreSQL connection string. Supabase REST/API keys are reserved for optional Supabase services and are never substituted for `DATABASE_URL` or exposed in the web client.

## 2026-11-01: Multi-theme UI system
The web app ships with four user-selectable themes: Night Gold, Ivory Gold, White & Gold, and Forest. Theme preference is persisted in `localStorage` under `trace_theme` and applied via `data-theme` on `<html>`. The `ThemeToggle` component renders in both the post-login page header and on all auth screens (login, register, verify OTP, forgot password). All theme-dependent colors use CSS custom properties so the brand panel, form inputs, and error states adapt automatically to each theme.

## 2026-11-01: SQLite for local development
Supabase PostgreSQL connections failed due to network restrictions. Switched to SQLite for local development (no external database required). Prisma schema uses `String` types instead of `Json` for SQLite compatibility, with `JSON.stringify()`/`JSON.parse()` in service layer for JSON fields. The admin seed account and categories/locations are seeded on first run. Production deployments should migrate to PostgreSQL or another supported provider.

## 2026-11-01: Web-first responsive mobile-style UI
The admin web app is built as a responsive, mobile-first single-page application using React + Vite + Tailwind-inspired CSS custom properties. It uses a bottom navigation bar on mobile and a sidebar on desktop, matching the mobile app navigation map from the product spec. The Expo mobile client remains a future phase; all API contracts are shared through `packages/shared` so both clients consume the same backend.
