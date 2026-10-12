module.exports = {
  preset: '@react-native/jest-preset',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  moduleNameMapper: { '\\.svg$': '<rootDir>/__tests__/support/svgMock.js' },
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?|@react-navigation|react-native-safe-area-context|react-native-screens|react-native-svg|react-native-image-picker|react-native-print|@react-native-async-storage|@reduxjs/toolkit|react-redux|redux|immer|reselect|use-sync-external-store|axios)/)',
  ],
  testPathIgnorePatterns: ['/node_modules/', '/__tests__/support/'],
};
