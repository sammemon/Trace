import { defineConfig } from 'expo/config';

export default defineConfig({
  name: 'TRACE',
  displayName: 'TRACE - Campus Lost & Found',
  slug: 'trace-campus-lost-found',
  description: 'Verified campus lost-and-found platform for Mehran University students',
  owner: 'sammemon',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/icon.png',
  userInterfaceStyle: 'automatic',
  splash: {
    image: './assets/splash.png',
    resizeMode: 'contain',
    backgroundColor: '#4F46E5',
  },
  assetBundlePatterns: ['**/*'],
  ios: {
    supportsTablet: true,
    bundleIdentifier: 'com.muet.trace',
    backgroundColor: '#4F46E5',
    infoPlist: {
      NSCameraUsageDescription: 'TRACE needs camera access to take photos of items and scan QR codes',
      NSPhotoLibraryUsageDescription: 'TRACE needs photo library access to select item images',
      NSLocationWhenInUseUsageDescription: 'TRACE needs location access to show nearby items and safe handover points',
      NSFaceIDUsageDescription: 'TRACE uses Face ID for app lock security',
    },
  },
  android: {
    package: 'com.muet.trace',
    adaptiveIcon: {
      foregroundImage: './assets/adaptive-icon.png',
      backgroundColor: '#4F46E5',
    },
    edgeToEdgeEnabled: true,
    backgroundColor: '#4F46E5',
    permissions: [
      'CAMERA',
      'READ_EXTERNAL_STORAGE',
      'WRITE_EXTERNAL_STORAGE',
      'ACCESS_FINE_LOCATION',
      'ACCESS_COARSE_LOCATION',
      'USE_BIOMETRIC',
      'USE_FINGERPRINT',
      'VIBRATE',
      'RECEIVE_BOOT_COMPLETED',
    ],
    googleServicesFile: './google-services.json',
  },
  plugins: [
    'expo-router',
    [
      'expo-camera',
      {
        cameraPermission: 'Allow TRACE to access your camera to take photos of items and scan QR codes',
      },
    ],
    [
      'expo-image-picker',
      {
        photosPermission: 'Allow TRACE to access your photos to select item images',
      },
    ],
    [
      'expo-notifications',
      {
        sounds: ['./assets/notification-sound.wav'],
      },
    ],
    [
      'expo-local-authentication',
      {
        faceIDPermission: 'Allow TRACE to use Face ID for app lock',
      },
    ],
  ],
  extra: {
    eas: {
      projectId: 'trace-campus-lost-found',
    },
    API_URL: 'http://localhost:3000',
    UNIVERSITY_NAME: 'Mehran University (MUET)',
    ALLOWED_EMAIL_DOMAINS: ['students.muet.edu.pk', 'faculty.muet.edu.pk', 'admin.muet.edu.pk', 'hod.muet.edu.pk'],
  },
  updates: {
    url: 'https://u.expo.dev/trace-campus-lost-found',
  },
  runtimeVersion: {
    policy: 'appVersion',
  },
});
