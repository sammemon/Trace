# TRACE APK Build - Fallback Instructions

## If Sandbox Cannot Build APKs

This sandbox environment may not have Android SDK, Gradle, or Java installed. If the APK build fails, follow these steps:

## Option 1: Build on Your Local PC

### Prerequisites

```bash
# 1. Install Android Studio
# Download from: https://developer.android.com/studio

# 2. Set ANDROID_HOME
export ANDROID_HOME=$HOME/Android/Sdk
export PATH=$PATH:$ANDROID_HOME/platform-tools
export PATH=$PATH:$ANDROID_HOME/cmdline-tools/latest/bin

# 3. Install SDK components
sdkmanager "platform-tools" "platforms;android-34" "build-tools;34.0.0"
sdkmanager --licenses

# 4. Install Java 17
# Ubuntu: sudo apt-get install openjdk-17-jdk
# macOS: brew install openjdk@17
# Windows: Download from https://adoptium.net/

# 5. Verify
java -version
sdkmanager --version
```

### Build Steps

```bash
# 1. Clone the repository
git clone https://github.com/sammemon/Trace.git
cd Trace/apps/admin

# 2. Install dependencies
pnpm install

# 3. Initialize Capacitor Android
pnpm cap:init
pnpm cap:add android

# 4. Set environment variables
export VITE_API_URL=https://your-api.onrender.com

# 5. Build web app
pnpm build

# 6. Sync to Android
pnpm cap:sync android

# 7. Build APK
# Debug:
cd android && ./gradlew assembleDebug
# Output: app/build/outputs/apk/debug/app-debug.apk

# Release (requires keystore):
./gradlew assembleRelease
# Output: app/build/outputs/apk/release/app-release.apk
```

### Install on Device

```bash
# Enable USB debugging on your Android device
# Connect via USB

# Install debug APK
adb install apps/android/app/build/outputs/apk/debug/app-debug.apk

# Install release APK
adb install apps/android/app/build/outputs/apk/release/app-release.apk
```

## Option 2: Build via GitHub Actions

1. Push code to GitHub
2. Go to the **Actions** tab in your GitHub repo
3. Select the **Build Android APK** workflow
4. Click **Run workflow**
5. Choose build type (debug/release/both)
6. Wait for completion
7. Download APK artifacts from the workflow run

### Required GitHub Secrets

Add these in **Settings → Secrets and variables → Actions**:

| Secret Name | Description | Example |
|-------------|-------------|---------|
| `VITE_API_URL` | Backend API URL | `https://trace-api.onrender.com` |
| `VITE_SUPABASE_URL` | Supabase project URL | `https://xdfeqhuqdqcpntzpmmfh.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | Supabase anon key | `sb_publishable_...` |
| `RELEASE_STORE_PASSWORD` | Keystore store password | `your-password` |
| `RELEASE_KEY_PASSWORD` | Keystore key password | `your-password` |
| `RELEASE_KEYSTORE_BASE64` | Base64-encoded release keystore | `base64 -w0 keystore.jks` |

### Base64-Encode Keystore

```bash
# On macOS/Linux
base64 -i keystore.jks | pbcopy  # macOS
base64 -w0 keystore.jks           # Linux

# On Windows PowerShell
[Convert]::ToBase64String([IO.File]::ReadAllBytes("keystore.jks"))
```

### Download APK from GitHub Actions

1. Go to your GitHub repo
2. Click **Actions** tab
3. Click on the **Build Android APK** workflow run
4. Scroll down to **Artifacts**
5. Click on `trace-debug-apk` or `trace-release-apk`
6. Download the ZIP and extract to get the APK file

## Option 3: EAS Build (Alternative)

If you prefer Expo's EAS build service:

```bash
# Install EAS CLI
npm install -g @expo/eas-cli

# Login to Expo
eas login

# Configure EAS
# Create eas.json with Android build config

# Build
eas build --platform android
```

Note: EAS build uses Expo, not Capacitor. You would need to migrate from Capacitor to Expo modules.

## Troubleshooting Common Build Issues

| Issue | Solution |
|-------|----------|
| `ANDROID_HOME not set` | Set `export ANDROID_HOME=$HOME/Android/Sdk` |
| `SDK component missing` | Run `sdkmanager "platform-tools" "platforms;android-34"` |
| `Gradle memory error` | Add `org.gradle.jvmargs=-Xmx2048m` to gradle.properties |
| `Keystore not found` | Place keystore.jks in android/ directory |
| `Signing failed` | Check keystore.properties has correct passwords |
| `WebView blank` | Ensure VITE_API_URL points to deployed backend, not localhost |

## Known Limitations

1. **Free tier backend cold starts**: Render/Railway free tier may spin down after inactivity, causing 10-30 second delay on first request
2. **Firebase for push**: Push notifications require Firebase project setup and `google-services.json`
3. **No iOS build**: This workflow only builds Android APKs
4. **No real device testing in sandbox**: APKs must be tested on a physical device or emulator
5. **Supabase free tier**: Database may pause after inactivity; resume via Supabase Dashboard

## Next Steps After Build

1. Install APK on test device
2. Test login with admin credentials
3. Test item posting, claiming, chat
4. Test push notifications (requires Firebase)
5. Test image upload/camera
6. Deploy backend to production
7. Update VITE_API_URL to production URL
8. Rebuild APK with production URL
9. Submit to Google Play Store (requires $25 one-time fee)
