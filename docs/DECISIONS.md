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
