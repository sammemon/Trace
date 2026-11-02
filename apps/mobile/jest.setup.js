import '@testing-library/react-native';
import 'react-native-gesture-handler/jestSetup';

jest.mock('expo-notifications', () => ({
  requestPermissionsAsync: jest.fn().mockResolvedValue({ granted: true }),
  getExpoPushTokenAsync: jest.fn().mockResolvedValue({ data: 'mock-token' }),
  addNotificationResponseReceivedListener: jest.fn(),
  addNotificationReceivedListener: jest.fn(),
  scheduleNotificationAsync: jest.fn(),
  cancelAllScheduledNotificationsAsync: jest.fn(),
  setNotificationChannelAsync: jest.fn(),
}));

jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(),
  setItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));

jest.mock('expo-local-authentication', () => ({
  hasHardwareAsync: jest.fn().mockResolvedValue(true),
  isEnrolledAsync: jest.fn().mockResolvedValue(true),
  authenticateAsync: jest.fn().mockResolvedValue({ success: true }),
}));

jest.mock('expo-image-picker', () => ({
  launchImageLibraryAsync: jest.fn().mockResolvedValue({ canceled: false, assets: [] }),
  launchCameraAsync: jest.fn().mockResolvedValue({ canceled: false, assets: [] }),
}));

jest.mock('expo-camera', () => {
  const Camera = jest.fn(() => null);
  Camera.constants = { Type: { back: 'back', front: 'front' }, FlashMode: { off: 'off', on: 'on' } };
  return Camera;
});

jest.mock('expo-linking', () => ({
  createURL: jest.fn(),
}));
