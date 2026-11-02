import { defineConfig } from '@capacitor/cli';

export default defineConfig({
  appId: 'com.muet.trace',
  appName: 'TRACE',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
    allowNavigation: ['*'],
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#4F46E5',
      androidSplashResourceName: 'splash',
      androidScaleType: 'CENTER_CROP',
      showSpinner: false,
    },
    StatusBar: {
      backgroundColor: '#4F46E5',
      style: 'LIGHT',
    },
    Keyboard: {
      resize: 'body',
      style: 'DARK',
    },
    Camera: {
      presentationStyle: 'DEFAULT',
      allowEditing: false,
    },
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert'],
    },
    Geolocation: {
      enabled: true,
    },
  },
  android: {
    buildOptions: {
      keystorePath: '../keystore.jks',
      keystorePassword: 'trace-keystore',
      keyAlias: 'trace-key',
      keyPassword: 'trace-key',
    },
    allowMixedContent: false,
    captureInput: true,
    overrideUserAgent: 'Mozilla/5.0 (Linux; Android 14) TRACE/1.0.0',
    appendUserAgent: 'TRACE/1.0.0',
    webContentsDebuggingEnabled: true,
  },
});
