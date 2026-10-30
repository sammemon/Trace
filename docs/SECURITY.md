# Security

Phase 1 establishes strict TypeScript, Helmet, explicit CORS configuration, environment-based secrets, Prisma parameterized queries, and a private-data model for item verification details. Later phases add Argon2id credentials, rotating refresh tokens, RBAC, rate limiting, encrypted private fields, signed uploads, audit logging, and threat-model verification.

Secrets must be supplied through environment variables. `.env.example` contains placeholders only.
