# TRACE Deployment Guide

## Overview

TRACE is a campus lost-and-found platform with:
- **Backend**: NestJS + PostgreSQL (Supabase)
- **Frontend**: React + Vite (Capacitor-wrapped for Android)
- **Admin Panel**: Same React + Vite web app (serves both mobile and web)

## Deployment Architecture

```
┌─────────────────┐     HTTPS      ┌──────────────────┐
│  Android APK    │ ◄─────────────▶ │  NestJS API      │
│  (Capacitor)    │                 │  (Render/Railway)│
└─────────────────┘                 └────────┬─────────┘
                                             │ HTTPS
                                             ▼
                                    ┌──────────────────┐
                                    │  Supabase        │
                                    │  PostgreSQL      │
                                    │  (Supabase Cloud)│
                                    └──────────────────┘
```

## Deployment Steps

### 1. Deploy Backend (NestJS)

**Option A: Render**

1. Create account at [render.com](https://render.com)
2. Click **New +** → **Web Service**
3. Connect your GitHub repo: `sammemon/Trace`
4. Select the `Trace` repository
5. Configure:
   - **Runtime**: Docker
   - **Dockerfile**: `Dockerfile.api`
   - **Docker Context**: `.`
   - **Branch**: `main`
6. Add environment variables (see table below)
7. Click **Create Web Service**
8. Wait for build, then visit `https://trace-api.onrender.com/api/v1/health`

**Option B: Railway**

1. Create account at [railway.app](https://railway.app)
2. Click **New Project** → **Deploy from GitHub repo**
3. Select `sammemon/Trace`
4. Add Dockerfile deployment
5. Add environment variables
6. Deploy

### 2. Environment Variables (Backend)

| Variable | Required | Example Value | Notes |
|----------|----------|---------------|-------|
| `NODE_ENV` | Yes | `production` | |
| `PORT` | Yes | `3000` | |
| `DATABASE_URL` | Yes | `postgresql://...` | Supabase pooler (port 6543) |
| `DIRECT_URL` | Yes | `postgresql://...` | Supabase direct (port 5432) |
| `JWT_ACCESS_SECRET` | Yes | `your-secret` | 32+ char random string |
| `PRIVATE_DATA_KEY` | Yes | `your-hex-key` | 32-byte hex key |
| `STUDENT_ID_HMAC_SECRET` | Yes | `your-secret` | HMAC secret for student IDs |
| `ALLOWED_EMAIL_DOMAINS` | No | `students.muet.edu.pk,faculty.muet.edu.pk,admin.muet.edu.pk,hod.muet.edu.pk` | Comma-separated |
| `UNIVERSITY_NAME` | No | `Mehran University (MUET)` | |
| `UNIVERSITY_TIMEZONE` | No | `Asia/Karachi` | |
| `CAMPUS_CENTER_LAT` | No | `24.8607` | |
| `CAMPUS_CENTER_LNG` | No | `67.0011` | |
| `REDIS_URL` | No | `redis://localhost:6379` | Optional for rate limiting |

### 3. Deploy Frontend (Optional - Web Version)

**Option A: Vercel**

1. Create account at [vercel.com](https://vercel.com)
2. Import `sammemon/Trace`
3. Set root directory to `apps/admin`
4. Add environment variables:
   - `VITE_API_URL=https://your-api.onrender.com`
   - `VITE_SUPABASE_URL=https://xdfeqhuqdqcpntzpmmfh.supabase.co`
   - `VITE_SUPABASE_ANON_KEY=your-anon-key`
5. Deploy

**Option B: Netlify**

1. Create account at [netlify.com](https://netlify.com)
2. Connect GitHub repo
3. Set build command: `pnpm --filter @trace/admin build`
4. Set publish directory: `apps/admin/dist`
5. Add environment variables
6. Deploy

### 4. Supabase Configuration

See `docs/SUPABASE_SETTINGS.md` for detailed Supabase configuration.

Key settings:
- **Network**: All IP addresses allowed (or restrict to your backend IP)
- **Database**: Use pooler URI (port 6543) for app, direct URI (port 5432) for migrations
- **RLS**: Enable on all tables, allow service role full access
- **Storage**: Create `item-images` and `proof-images` buckets

### 5. Build Android APK

See `docs/APK_BUILD.md` for complete build instructions.

Quick summary:
```bash
cd apps/admin
pnpm install
pnpm cap:init
pnpm cap:add android
export VITE_API_URL=https://your-api.onrender.com
pnpm build
pnpm cap:sync android
cd android
./gradlew assembleDebug
```

### 6. Environment Variable Summary (Frontend)

Create `apps/admin/.env.production`:

```
VITE_API_URL=https://your-api.onrender.com
VITE_SUPABASE_URL=https://xdfeqhuqdqcpntzpmmfh.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_UNIVERSITY_NAME=Mehran University (MUET)
VITE_UNIVERSITY_TIMEZONE=Asia/Karachi
```

**Never commit real values to git.** Use `.env.example` as template.

## Verification Checklist

- [ ] Backend `/api/v1/health` returns `{"status":"ok"}`
- [ ] Backend `/api/v1/ready` returns `{"status":"ready","database":"ok"}`
- [ ] Frontend loads at deployed URL
- [ ] Register new account works
- + Verify OTP code works
- [ ] Login works
- [ ] Post lost/found item works
- [ ] Search and filter works
- [ ] Admin dashboard loads
- [ ] Admin can resolve reports
- [ ] Android APK installs on device
- [ ] APK can connect to backend over HTTPS

## Known Limitations

1. **Free tier backend cold starts**: Render/Railway free tier spins down after ~15 min inactivity. First request takes 10-30 seconds.
2. **Supabase free tier**: Database pauses after 1 week of inactivity. Resume via Supabase Dashboard.
3. **Push notifications**: Requires Firebase project and `google-services.json`. Not configured by default.
4. **No iOS build**: Only Android APKs are built.
5. **No real device testing in sandbox**: APKs must be tested on physical device.

## Rollback

If deployment fails:
1. Revert to previous git commit
2. Redeploy to Render/Railway
3. Verify health endpoint
4. Rebuild APK if frontend changed
