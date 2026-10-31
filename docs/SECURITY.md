# Security

TRACE uses strict TypeScript, Helmet, explicit CORS configuration, environment-based secrets, Prisma parameterized queries, Argon2id passwords, short-lived JWT access tokens, hashed rotating refresh tokens, RBAC, signed uploads, participant-only chat, message masking, and append-only moderation audit records.

## STRIDE-lite threat model

| Threat | Control |
| --- | --- |
| Spoofing | University-domain registration, OTP verification, Argon2id, JWT validation, refresh rotation |
| Tampering | Zod input validation, Prisma queries, ownership checks, transactional claim/handover transitions |
| Repudiation | Moderator and admin audit records with actor, target, action, and timestamp |
| Information disclosure | Explicit public DTOs, no contact details, hashed student IDs and handover codes, private chat membership |
| Denial of service | Planned throttling boundary, bounded uploads/messages, expiry jobs, cursor pagination |
| Elevation of privilege | Deny-by-default auth guards and ranked role guard |

## Operational requirements

Secrets must be supplied through environment variables. `.env.example` contains placeholders only.
