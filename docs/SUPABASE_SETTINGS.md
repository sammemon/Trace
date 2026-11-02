# TRACE Supabase Configuration Guide

## Project: TRACE Campus Lost & Found
## Supabase Project: xdfeqhuqdqcpntzpmmfh

## 1. Network Restrictions
**Path:** Supabase Dashboard → Settings → Network

Current status: **All IP addresses allowed** (per dashboard)

For production, restrict to your deployed backend IP addresses only.

## 2. Database Configuration
**Path:** Supabase Dashboard → Database

| Setting | Value |
|---------|-------|
| Host | db.xdfeqhuqdqcpntzpmmfh.supabase.co |
| Port | 5432 (direct), 6543 (pooler) |
| Region | West EU (eu-west-1) |
| Database | postgres |
| User | postgres |
| Password | [Set in Supabase Dashboard] |

### Connection Strings
- **Direct URL (migrations):** `postgresql://postgres:<PASSWORD>@db.xdfeqhuqdqcpntzpmmfh.supabase.co:5432/postgres?sslmode=require`
- **Pooler URL (app):** `postgresql://postgres.xdfeqhuqdqcpntzpmmfh:<PASSWORD>@aws-0-eu-west-1.pooler.supabase.com:6543/postgres?pgbouncer=true&sslmode=require`

## 3. Row Level Security (RLS)
**Path:** Supabase Dashboard → Database → Tables → [each table] → RLS

The backend (NestJS) handles all database access via service role key, so frontend does NOT connect to Supabase directly. RLS policies on tables are not strictly required for this architecture, but recommended for defense-in-depth.

Tables in schema:
- users, otp_codes, refresh_tokens, device_tokens
- categories, campus_locations, items, item_images
- claims, claim_answers, conversations, messages
- matches, notifications, saved_searches, bookmarks
- reports, blocks, announcements, audit_logs

**Recommendation:** Enable RLS on all tables and create policies that allow service role full access, deny public access.

## 4. Storage
**Path:** Supabase Dashboard → Storage

The backend handles image uploads via pre-signed URLs. Storage buckets needed:
- `item-images` - Public read, service role write
- `proof-images` - Private, service role read/write

## 5. Auth Configuration
**Path:** Supabase Dashboard → Authentication

The backend handles auth (JWT, OTP, passwords). Supabase Auth is NOT used by the frontend. Supabase Auth settings are not required for this architecture.

## 6. Redirect URLs (if using Supabase Auth directly)
**Path:** Settings → Authentication → URL Configuration

Add these redirect URLs (if enabling Supabase Auth later):
- `https://localhost`
- `capacitor://localhost`
- `http://localhost`
- Your deployed web URL (e.g., `https://trace-app.vercel.app`)
