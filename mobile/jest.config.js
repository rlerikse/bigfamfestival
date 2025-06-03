/// <reference types="node" />
module.exports = {
  preset: 'react-native',
  transform: {
    '^.+\\.(js|jsx|ts|tsx)$': 'babel-jest',
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],  transformIgnorePatterns: [
    'node_modules/(?!(react-native|@react-native|@react-navigation|expo|@expo|expo-status-bar|expo-font|@expo/vector-icons|@unimodules|unimodules|sentry-expo|native-base|react-native-svg)/)',
  ],
  setupFiles: ['<rootDir>/node_modules/react-native/jest/setup.js'],
};
