module.exports = {
  preset: 'react-native',
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
  transform: {
    '^.+\\.(ts|tsx)$': ['ts-jest', { isolatedModules: true }],
  },
  testMatch: ['**/__tests__/**/*.test.[jt]s?(x)', '**/*.test.[jt]s?(x)'],
  setupFiles: ['./jest.setup.js'],
  setupFilesAfterEnv: [],
  transformIgnorePatterns: [
    'node_modules/(?!(react-native|react-native-.*|@react-native|react-native-.*|expo|@expo|react-native-reanimated|@react-native-community|react-native-gesture-handler|react-native-screens|react-native-svg|react-native-safe-area-context|expo-.*))',
  ],
  moduleNameMapper: {
    '^~/(.*)$': '<rootDir>/$1',
  },
};
