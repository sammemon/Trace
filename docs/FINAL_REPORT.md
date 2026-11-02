# TRACE - APK Conversion Final Report

## Project: TRACE - Campus Lost & Found
## Conversion: Web App → Android APK via Capacitor
## Date: 2026-11-02

---

## Executive Summary

The TRACE web application (React + Vite + NestJS backend + Supabase) has been converted into an Android APK using Capacitor. The existing web app code was preserved with minimal changes - only modifications required for APK packaging and deployment were made.

**APK Status**: Build configuration complete. APKs must be built via GitHub Actions or locally (Android SDK not available in this sandbox).

**Backend**: Configured for deployment to Render/Railway (not yet deployed - requires manual setup).

---

## Step 1: AUDIT Results

| Category | Finding |
|----------|---------|
| Framework | React 19 + TypeScript |
| Router | Custom state-based page switcher (not React Router) |
| Build tool | Vite ^6.1.0 |
| Build output | `dist` directory |
| Architecture | Frontend → NestJS API → Supabase PostgreSQL |
| API URL source | `import.meta.env.VITE_API_URL ?? 'http://localhost:3000'` |
| Supabase keys | None in frontend (backend handles all Supabase access) |
| Direct Supabase access | No (backend mediates all DB access) |

---

## Step 2: Backend Deployment Configuration

**Status**: Configuration files created. Backend NOT yet deployed.

### Files Created:
- `Dockerfile.api` - Multi-stage Docker build for NestJS backend
- `render.yaml` - Render.com deployment configuration
- `DEPLOY_BACKEND.md` - Railway deployment instructions

### Required Actions:
1. Deploy backend to Render or Railway
2. Set environment variables (see `DEPLOY_BACKEND.md`)
3. Run database migrations against Supabase
4. Verify `/api/v1/health` and `/api/v1/ready` over HTTPS

---

## Step 3: Supabase Settings

**File**: `docs/SUPABASE_SETTINGS.md`

### Key Configuration:
- **Project**: `xdfeqhuqdqcpntzpmmfh`
- **Region**: West EU (eu-west-1)
- **Direct URL**: `postgresql://postgres:<PASSWORD>@db.xdfeqhuqdqcpntzpmmfh.supabase.co:5432/postgres?sslmode=require`
- **Pooler URL**: `postgresql://postgres.xdfeqhuqdqcpntzpmmfh:<PASSWORD>@aws-0-eu-west-1.pooler.supabase.com:6543/postgres?pgbouncer=true&sslmode=require`
- **Network**: All IP addresses allowed (restrict in production)
- **RLS**: Recommend enabling on all tables
- **Storage**: Create `item-images` and `proof-images` buckets

---

## Step 4: Web App Wrap-Ready Changes

### Files Modified:

| File | Change | Reason |
|------|--------|--------|
| `apps/admin/vite.config.ts` | Added `base: './'`, `build.outDir`, `build.sourcemap` | Required for Capacitor WebView |
| `apps/admin/index.html` | Added `viewport-fit=cover` to meta tag | Required for proper mobile rendering |
| `apps/admin/src/api.ts` | Already uses `import.meta.env.VITE_API_URL` | No change needed - already env-based |
| `apps/admin/.env.example` | Created | Template for environment variables |
| `apps/admin/.env.production` | Created | Production environment variables |

### Environment Variables:
- `VITE_API_URL` - Backend API URL (required for production)
- `VITE_SUPABASE_URL` - Supabase project URL (optional)
- `VITE_SUPABASE_ANON_KEY` - Supabase anon key (optional)

---

## Step 5: Capacitor Integration

### Files Created:

| File | Purpose |
|------|---------|
| `apps/admin/capacitor.config.ts` | Capacitor configuration with app ID, plugins, Android settings |
| `apps/admin/package.json` | Updated with Capacitor dependencies and scripts |

### Capacitor Plugins Added:
- `@capacitor/android` - Android platform
- `@capacitor/app` - App lifecycle
- `@capacitor/camera` - Camera access
- `@capacitor/device` - Device info
- `@capacitor/filesystem` - File system access
- `@capacitor/geolocation` - Location services
- `@capacitor/network` - Network status
- `@capacitor/notifications` - Push notifications
- `@capacitor/splash-screen` - Splash screen
- `@capacitor/status-bar` - Status bar styling
- `@capacitor/keyboard` - Keyboard handling

### Capacitor Commands:
```bash
cd apps/admin
pnpm cap:init      # Initialize Capacitor
pnpm cap:add       # Add Android platform
pnpm cap:sync      # Sync web code to Android
pnpm cap:open      # Open in Android Studio
```

---

## Step 6: Native Features

### Android Permissions Added (`AndroidManifest.xml`):
- `INTERNET` - API communication
- `CAMERA` - Item photo capture
- `READ_MEDIA_IMAGES` - Photo gallery access
- `READ_EXTERNAL_STORAGE` / `WRITE_EXTERNAL_STORAGE` - File storage
- `POST_NOTIFICATIONS` - Push notifications
- `ACCESS_FINE_LOCATION` / `ACCESS_COARSE_LOCATION` - Campus location
- `VIBRATE` - Haptic feedback
- `WAKE_LOCK` - Keep screen on during scanning
- `FOREGROUND_SERVICE` - Background operations

### Native Files Created:
- `apps/android/app/src/main/java/com/muet/trace/MainActivity.java` - Capacitor bridge activity
- `apps/android/app/src/main/java/com/muet/trace/MainApplication.java` - Application class
- `apps/android/app/src/main/java/com/muet/trace/PushService.java` - Push notification service
- `apps/android/app/src/main/java/com/muet/trace/PushReceiver.java` - Push notification receiver

---

## Step 7: Icons and Splash Screen

### Files Created:
| File | Description |
|------|-------------|
| `apps/admin/resources/icon.svg` | App icon SVG (1024x1024, indigo/gold gradient) |
| `apps/admin/resources/splash.svg` | Splash screen SVG (2048x2048, indigo/gold gradient) |

### Generation:
Use `@capacitor/assets` to generate all required sizes:
```bash
cd apps/admin
npx @capacitor/assets
```

---

## Step 8: APK Build Configuration

### Files Created:

| File | Purpose |
|------|---------|
| `apps/android/gradle/wrapper/gradle-wrapper.properties` | Gradle 8.4 configuration |
| `apps/android/gradlew` | Gradle wrapper shell script |
| `apps/android/gradlew.bat` | Gradle wrapper batch script |
| `apps/android/gradle.properties` | Gradle JVM settings |
| `apps/android/settings.gradle` | Project settings |
| `apps/android/build.gradle` | Project-level build config |
| `apps/android/app/build.gradle` | App-level build config (minSdk 24, targetSdk 34) |
| `apps/android/app/src/main/AndroidManifest.xml` | Android manifest with permissions |
| `apps/android/app/src/main/res/values/strings.xml` | App strings |
| `apps/android/app/src/main/res/values/colors.xml` | App colors |
| `apps/android/app/src/main/res/values/styles.xml` | App theme |
| `apps/android/app/src/main/res/xml/file_paths.xml` | File provider paths |

### Build Commands:
```bash
# Debug APK
cd apps/android && ./gradlew assembleDebug

# Release APK (requires keystore)
cd android && ./gradlew assembleRelease
```

**Note**: APKs were NOT built in this sandbox (no Android SDK available). Use GitHub Actions or local machine.

---

## Step 9: GitHub Actions Automation

### File: `.github/workflows/build-apk.yml`

**Triggers**: Push to main, PR to main, manual dispatch

**Jobs**:
1. Checkout repository
2. Setup Node.js 20, Java 17, Android SDK
3. Install pnpm dependencies
4. Initialize Capacitor + add Android
5. Build web app (Vite)
6. Sync Capacitor Android
7. Build debug APK (`assembleDebug`)
8. Build release APK (`assembleRelease` - requires secrets)
9. Upload APK artifacts
10. Verify APK signature

### Required GitHub Secrets:
| Secret | Description |
|--------|-------------|
| `VITE_API_URL` | Backend API URL |
| `VITE_SUPABASE_URL` | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Supabase anon key |
| `RELEASE_STORE_PASSWORD` | Keystore store password |
| `RELEASE_KEY_PASSWORD` | Keystore key password |
| `RELEASE_KEYSTORE_BASE64` | Base64-encoded release keystore |

### To Download APK from GitHub Actions:
1. Go to **Actions** tab in GitHub repo
2. Select **Build Android APK** workflow run
3. Scroll to **Artifacts** section
4. Download `trace-debug-apk` or `trace-release-apk`

---

## Step 10: Fallback Instructions

**File**: `docs/APK_BUILD.md`

If the sandbox cannot build APKs:

1. **Local Build**: Install Android Studio, Java 17, Android SDK, then run build commands locally
2. **GitHub Actions**: Push code, run workflow from Actions tab, download artifacts
3. **EAS Build**: Alternative using Expo (requires migration from Capacitor)

### Exact Steps for Local Build:
```bash
git clone https://github.com/sammemon/Trace.git
cd Trace/apps/admin
pnpm install
pnpm cap:init && pnpm cap:add android
export VITE_API_URL=https://your-api.onrender.com
pnpm build && pnpm cap:sync android
cd android && ./gradlew assembleDebug
```

---

## Known Limitations

| Limitation | Impact | Mitigation |
|------------|--------|------------|
| No Android SDK in sandbox | Cannot build APKs here | Use GitHub Actions or local PC |
| No Firebase configured | Push notifications won't work | Add `google-services.json` and Firebase config |
| Free tier backend cold starts | 10-30s delay on first request | Upgrade to paid tier or accept delay |
| Supabase free tier pauses | Database unavailable after 1 week | Resume via Supabase Dashboard |
| No iOS build | Only Android APKs | iOS requires macOS + Xcode |
| No real device testing | Cannot verify on actual device | Test on physical Android device |
| Keystore not in git | Must be generated separately | Store securely, back up |

---

## Files Modified (Existing)

| File | Change | Reason |
|------|--------|--------|
| `apps/admin/vite.config.ts` | Added `base: './'`, build config | Capacitor WebView compatibility |
| `apps/admin/index.html` | Added `viewport-fit=cover` | Mobile viewport |
| `apps/admin/package.json` | Added Capacitor deps, scripts | Capacitor integration |
| `apps/admin/.env.example` | Created (new file) | Environment variable template |
| `apps/admin/.env.production` | Created (new file) | Production env vars |
| `apps/admin/src/api.ts` | No change | Already used `VITE_API_URL` env var |
| `apps/admin/src/App.tsx` | No change | Custom state routing works in WebView |

---

## Files Created (New)

| File | Purpose |
|------|---------|
| `apps/admin/capacitor.config.ts` | Capacitor configuration |
| `apps/admin/.env.example` | Environment template |
| `apps/admin/.env.production` | Production env vars |
| `apps/android/` (full project) | Android native project |
| `apps/admin/resources/icon.svg` | App icon source |
| `apps/admin/resources/splash.svg` | Splash screen source |
| `Dockerfile.api` | Backend Docker build |
| `render.yaml` | Render.com deployment config |
| `.github/workflows/build-apk.yml` | GitHub Actions CI/CD |
| `docs/APK_BUILD.md` | APK build instructions |
| `docs/DEPLOY.md` | Deployment guide |
| `docs/SUPABASE_SETTINGS.md` | Supabase configuration |

---

## Verification Checklist

- [ ] Backend `/api/v1/health` returns `{"status":"ok"}` (after deployment)
- [ ] Backend `/api/v1/ready` returns database ok (after deployment)
- [ ] Frontend builds successfully (`pnpm --filter @trace/admin build`)
- [ ] Capacitor sync completes (`pnpm cap:sync android`)
- [ ] Debug APK builds (`./gradlew assembleDebug`)
- [ ] Release APK builds (`./gradlew assembleRelease`)
- [ ] APK installs on Android device (`adb install`)
- [ ] Login works on device
- [ ] Item posting works on device
- [ ] Push notifications work (requires Firebase)

---

## Next Steps

1. **Deploy backend** to Render/Railway using `Dockerfile.api` or `render.yaml`
2. **Configure Supabase** per `docs/SUPABASE_SETTINGS.md`
3. **Set GitHub secrets** for APK building
4. **Run GitHub Actions** to build APKs
5. **Test APK** on physical Android device
6. **Configure Firebase** for push notifications (optional)
7. **Submit to Google Play Store** (requires $25 one-time fee)

---

**End of Report**
