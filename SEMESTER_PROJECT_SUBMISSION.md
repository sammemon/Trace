# TRACE — Campus Lost & Found
## Semester Project Submission Report

---

## Title Page

| Field | Details |
|-------|---------|
| **Project Title** | TRACE — Campus Lost & Found |
| **Submitted by** | [Student Name] |
| **University** | Mehran University of Engineering & Technology (MUET) |
| **Department** | Computer Systems Engineering |
| **Batch / Year** | 2022 |
| **Project Supervisor** | [Supervisor Name] |
| **Academic Year** | 2026-2027 |
| **Date** | November 2026 |

---

## Abstract

TRACE (Campus Lost & Found) is a university-only web application designed to help students at Mehran University of Engineering & Technology (MUET) report, search, and recover lost belongings. The platform replaces scattered WhatsApp groups and physical notice boards with a secure, verified, and searchable system where ownership is verified before any contact or handover occurs.

Key features include user registration with university email verification, item posting (lost/found) with photo uploads and blur tools for sensitive items, full-text search with filters, claim verification with state machine (PENDING → APPROVED → COMPLETED), secure in-app messaging via Socket.IO, handover with 6-digit QR codes, admin moderation panel with reports queue, audit logging, announcements, and analytics.

The system is built as a monorepo using pnpm workspaces and Turborepo, with a NestJS + Prisma + PostgreSQL backend, React + Vite frontend for the admin web panel, and TypeScript strict mode throughout. The database is SQLite for local development with a migration path to PostgreSQL/Supabase for production.

---

## Table of Contents

1. [Introduction](#introduction)
2. [Problem Statement](#problem-statement)
3. [Project Objectives](#project-objectives)
4. [Project Scope](#project-scope)
5. [Requirements](#requirements)
6. [Design and Methodology](#design-and-methodology)
7. [Tools and Technologies Used](#tools-and-technologies-used)
8. [Implementation](#implementation)
9. [Testing and Results](#testing-and-results)
10. [Screenshots](#screenshots)
11. [Conclusion](#conclusion)
12. [Future Enhancements](#future-enhancements)
13. [References](#references)
14. [Appendix](#appendix)
15. [Project Attachments](#project-attachments)

---

## 1. Introduction

TRACE is a campus-focused lost-and-found platform that enables verified students to report lost or found items, search and filter them through a unified interface, and securely coordinate returns. The system addresses the inefficiency of traditional notice boards and informal messaging groups by providing a centralized, moderated, and privacy-preserving platform.

The application is designed as a responsive web-first interface that can later be extended to a mobile application (Expo/React Native). All API contracts are shared through a common packages/shared library to ensure consistency between web and mobile clients.

---

## 2. Problem Statement

Students frequently lose ID cards, wallets, keys, books, phones, earphones, water bottles, and other belongings around campus. Existing solutions rely on:

- **Scattered WhatsApp groups** — difficult to search, unmoderated, and unsafe (anyone can claim anything without verification)
- **Physical notice boards** — limited visibility, no photos, no search, no verification mechanism
- **No ownership verification** — items can be falsely claimed, leading to disputes and theft
- **No centralized record** — no history, no analytics, no way to track return rates

These problems result in low item recovery rates, student frustration, and potential safety risks.

---

## 3. Project Objectives

1. **Centralized Platform** — Provide a single, searchable platform for reporting lost and found items across the campus.
2. **Ownership Verification** — Verify item ownership before any contact or handover occurs through a claim verification state machine.
3. **Privacy Protection** — Never expose phone numbers, emails, or student IDs publicly; use HMAC hashing for ID card matching.
4. **Moderation** — Allow admins and moderators to review reports, hide/remove items, suspend/ban users, and maintain audit logs.
5. **Secure Handover** — Enable safe campus handovers using 6-digit QR codes with validity windows.
6. **Real-time Communication** — Provide Socket.IO-based chat only after claim approval, with safety banners and message masking.
7. **Notifications** — Push and in-app notifications for claim status, matches, and system updates.
8. **Analytics** — Provide admin dashboard with KPIs, charts, and activity tracking.

---

## 4. Project Scope

### In Scope
- User registration with university email domain allow-list (@students.muet.edu.pk, @faculty.muet.edu.pk, @admin.muet.edu.pk, @hod.muet.edu.pk)
- Email OTP verification (6 digits, 10-minute expiry)
- JWT authentication with refresh token rotation and reuse detection
- Item posting (Lost/Found) with photo uploads, category selection, location picker, verification details
- Full-text search (PostgreSQL tsvector + pg_trgm) with filters and cursor pagination
- Claim verification wizard with state machine (PENDING → APPROVED → COMPLETED)
- Secure messaging via Socket.IO (only after claim approval)
- Handover with 6-digit QR codes (24-hour validity)
- Admin moderation panel (reports queue, items management, users management, handover desk, audit logs)
- Saved searches with alerts and bookmarks
- Item expiry (60 days) with renewal and reminders
- Dark/light mode theme system (Night Gold, Ivory Gold, White & Gold, Forest)
- Responsive web-first interface with bottom navigation on mobile

### Out of Scope
- Mobile application (Expo/React Native) — planned for future phase
- Real email/SMS delivery — development mode displays codes on screen; production requires SMTP/Expo Push integration
- Payment processing
- Biometric app-lock (planned for mobile phase)

---

## 5. Requirements

### Functional Requirements

| ID | Requirement | Priority |
|----|-------------|----------|
| FR1 | Register with university email only | High |
| FR2 | Email OTP verification | High |
| FR3 | Login, logout, logout all devices | High |
| FR4 | Post lost/found items with photos | High |
| FR5 | Search and filter items | High |
| FR6 | Claim items with verification Q&A | High |
| FR7 | Approve/reject claims (finder only) | High |
| FR8 | Secure chat after claim approval | High |
| FR9 | Handover with 6-digit QR code | High |
| FR10 | Item expiry and renewal | Medium |
| FR11 | Bookmarks and saved searches | Medium |
| FR12 | Admin moderation panel | High |
| FR13 | Audit logging | High |
| FR14 | Notifications (push + in-app) | Medium |
| FR15 | Theme switching (light/dark/themes) | Low |

### Non-Functional Requirements

| ID | Requirement | Priority |
|----|-------------|----------|
| NFR1 | TypeScript strict mode | High |
| NFR2 | All screens: loading, empty, error, success states | High |
| NFR3 | No phone numbers/emails in public responses | High |
| NFR4 | Passwords hashed with argon2id | High |
| NFR5 | JWT access token 15 min, refresh token 30 days | High |
| NFR6 | Rate limiting (auth, posts, claims, messages) | Medium |
| NFR7 | WCAG AA contrast compliance | Medium |
| NFR8 | Accessibility labels on all interactive elements | Medium |
| NFR9 | API ≥ 80% service coverage | Medium |

---

## 6. Design and Methodology

### Architecture

The system follows a modular monolith architecture:

```
Mobile/Web Client → NestJS API (stateless) → PostgreSQL (Prisma)
                              ↳ Redis (cache, pubsub, BullMQ)
                              ↳ S3/R2 (image storage)
                              ↳ Socket.IO (realtime)
```

### Database Schema

Key entities: Users, Items, Claims, Conversations, Messages, Reports, Categories, Campus Locations, Notifications, Audit Logs, Matches, Saved Searches, Bookmarks.

### Security Design

- Passwords: argon2id with strength policy
- JWT: short-lived access (15 min) + rotating refresh (30 days)
- Refresh token reuse detection revokes entire token family
- Private details encrypted with AES-256-GCM
- Student ID stored as HMAC-SHA256 hash
- Chat masking: phone/email patterns replaced with "[hidden for safety]"
- RBAC guards on all admin endpoints

### State Machines

```
Item: ACTIVE → CLAIM_PENDING → RETURNED
              ↘ EXPIRED ↘ REMOVED ↘ RESOLVED

Claim: PENDING → APPROVED → COMPLETED
             ↘ REJECTED ↘ CANCELLED ↘ EXPIRED
```

---

## 7. Tools and Technologies Used

| Layer | Technology | Version |
|-------|-----------|---------|
| Monorepo | pnpm workspaces + Turborepo | Latest |
| Backend | Node.js + NestJS + TypeScript | Node 20 |
| ORM/DB | Prisma + SQLite (dev) / PostgreSQL (prod) | Prisma 6.19.3 |
| Cache/Queue | Redis + BullMQ | Latest |
| Realtime | Socket.IO (NestJS gateway, Redis adapter) | Latest |
| Storage | S3-compatible (Cloudflare R2 / AWS S3) | — |
| Email | Nodemailer (SMTP / Resend) | — |
| Push | Expo Push API | — |
| Frontend | React + Vite + TypeScript | React 18 |
| UI Styling | Tailwind CSS (custom design system) | Latest |
| State | TanStack Query + Zustand | Latest |
| Forms | React Hook Form + Zod | Latest |
| Testing | Jest + Supertest + Vitest | Latest |
| E2E | Maestro (mobile) | Latest |
| Linting | ESLint + Prettier + Husky | Latest |
| API Docs | OpenAPI/Swagger (auto-generated) | — |
| Observability | Pino logs + Sentry + /health + /ready | — |

---

## 8. Implementation

### Project Structure

```
campusfind/
├── apps/
│   ├── api/              # NestJS backend
│   ├── admin/            # React + Vite admin web panel
│   └── mobile/           # Expo mobile app (future phase)
├── packages/
│   └── shared/           # Zod schemas, DTO types, enums
├── docs/                 # Architecture, Security, Deployment, etc.
├── docker-compose.yml    # Local development services
└── package.json          # Root workspace config
```

### Key Implementation Details

1. **Authentication**: Register → OTP Verify → Login → JWT access/refresh tokens
2. **Item Posting**: 6-step wizard (Type → Category → Photos → Details → Location → Verification → Review)
3. **Claim Flow**: Claim wizard → Finder review → Approve/Reject → Chat → Handover code → Returned
4. **Admin Panel**: Dashboard KPIs, reports queue, item moderation, user management, handover desk, audit logs
5. **Theme System**: 4 user-selectable themes persisted in localStorage

---

## 9. Testing and Results

### Test Coverage Target
- API service coverage: ≥ 80%
- Mobile component tests for design-system and key forms

### Test Suites
- **Auth**: OTP flow, refresh token rotation, reuse detection
- **Claims**: State machine transitions, concurrency-safe approvals
- **Privacy**: Private details never leak in public responses
- **Rate Limits**: Auth (5/min/IP), posts (10/day), claims (3/day pending)
- **Moderation**: Report → action → audit log → reporter notification

### Manual Testing Checklist
- [ ] Register → verify OTP → login
- [ ] Post found item → second user claims → approve → chat → handover → returned
- [ ] Lost item match notification
- [ ] Admin: report → resolve → audit log
- [ ] Theme switching (all 4 themes)
- [ ] Error/empty/offline states on all screens

---

## 10. Screenshots

*Screenshots of the running application would be inserted here showing:*
- Login/Register screens with theme toggle
- Home feed with items
- Item details page
- Claim verification flow
- Admin dashboard with KPIs
- Reports queue
- Dark mode / White & Gold theme

---

## 11. Conclusion

TRACE successfully addresses the campus lost-and-found problem by providing a secure, verified, and searchable platform. The modular monolith architecture allows for future expansion to a mobile application while maintaining a single API contract. The system demonstrates strong security practices (argon2id hashing, JWT rotation, HMAC for student IDs, chat masking) and comprehensive moderation capabilities.

The web-based responsive interface provides full functionality for students and administrators, with plans to extend to a native mobile app in a future phase.

---

## 12. Future Enhancements

1. **Mobile Application** — Expo/React Native client with biometric app-lock
2. **Real Email/SMS** — SMTP/Resend integration for production OTP delivery
3. **Push Notifications** — Expo Push Notifications with deep links
4. **Image Processing** — sharp worker for thumbnails and EXIF stripping
5. **Duplicate Detection** — Perceptual hash for duplicate image warnings
6. **Auto-moderation** — Keyword/profanity filtering with pending review queue
7. **Load Testing** — k6/autocannon smoke tests documented
8. **CI/CD** — GitHub Actions pipeline with lint, typecheck, test, build

---

## 13. References

1. NestJS Documentation — https://docs.nestjs.com
2. Prisma ORM Documentation — https://www.prisma.io/docs
3. React Documentation — https://react.dev
4. Vite Documentation — https://vitejs.dev
5. Socket.IO Documentation — https://socket.io/docs
6. Tailwind CSS Documentation — https://tailwindcss.com
7. Supabase Documentation — https://supabase.com/docs
8. Zod Validation — https://zod.dev

---

## 14. Appendix

### API Endpoints Summary

| Endpoint | Method | Description | Auth |
|----------|--------|-------------|------|
| /api/v1/auth/register | POST | Register new user | No |
| /api/v1/auth/verify-email | POST | Verify OTP code | No |
| /api/v1/auth/login | POST | Login | No |
| /api/v1/auth/refresh | POST | Refresh access token | No |
| /api/v1/auth/logout | POST | Logout | Yes |
| /api/v1/auth/forgot-password | POST | Send reset code | No |
| /api/v1/auth/reset-password | POST | Reset password | No |
| /api/v1/items | GET | Feed + search + filters | No |
| /api/v1/items | POST | Create item | Yes |
| /api/v1/items/:id | GET | Item details | No |
| /api/v1/items/:id | PATCH | Edit item | Owner |
| /api/v1/items/:id/claims | POST | Create claim | Yes |
| /api/v1/claims/:id/approve | POST | Approve claim | Finder |
| /api/v1/claims/:id/reject | POST | Reject claim | Finder |
| /api/v1/conversations | GET | List conversations | Yes |
| /api/v1/notifications | GET | List notifications | Yes |
| /api/v1/admin/dashboard | GET | Admin KPIs | Admin/Mod |
| /api/v1/admin/reports | GET | Reports queue | Admin/Mod |
| /api/v1/admin/users | GET | User management | Admin/Mod |

### Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| DATABASE_URL | Database connection string | file:./dev.db |
| JWT_ACCESS_SECRET | JWT signing secret (32+ chars) | trace-local-secret-2026 |
| ALLOWED_EMAIL_DOMAINS | Comma-separated email domains | students.muet.edu.pk |
| STUDENT_ID_HMAC_SECRET | HMAC secret for ID hashing | random-secret |
| NEXT_PUBLIC_SUPABASE_URL | Supabase project URL | https://xxx.supabase.co |

---

## 15. Project Attachments

### Attachment List

| Attachment | Description | Location |
|------------|-------------|----------|
| Complete Source Code | Full monorepo (api, admin, shared packages) | apps/api/, apps/admin/, packages/shared/ |
| Database Schema | Prisma schema with all entities | apps/api/prisma/schema.prisma |
| Seed Script | Demo data (admin, categories, locations, items) | apps/api/prisma/seed.ts |
| API Documentation | Swagger/OpenAPI at /docs | http://localhost:3000/docs |
| Installation Guide | README with setup instructions | README.md |
| Environment Template | .env.example with all config | .env.example |
| Docker Compose | Local services (Postgres, Redis, MinIO, Mailpit) | docker-compose.yml |

### Source Code Location

```
D:\Downloads\magd-project\
├── apps/api/          # NestJS backend source
├── apps/admin/        # React + Vite admin frontend
├── packages/shared/   # Shared types and schemas
├── docs/              # Architecture, Security, Deployment docs
├── .env               # Environment configuration
├── .env.example       # Environment template
├── package.json       # Root workspace config
├── pnpm-workspace.yaml # pnpm workspace config
├── turbo.json         # Turborepo config
└── README.md          # Installation and usage guide
```

### Demo Credentials

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@admin.muet.edu.pk | TraceAdmin!2026 |

### Installation Steps

1. `pnpm install` — Install dependencies
2. `pnpm --filter @trace/api prisma db push` — Create database tables
3. `pnpm --filter @trace/api prisma db seed` — Seed demo data
4. `pnpm dev` — Start backend (port 3000) and frontend (port 5173)
5. Open `http://localhost:5173` in browser
6. Login with admin credentials or register new account
