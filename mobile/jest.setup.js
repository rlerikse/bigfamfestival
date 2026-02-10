/* eslint-env jest */
/* eslint-disable @typescript-eslint/no-empty-function, @typescript-eslint/no-var-requires */
/**
 * Jest setup file - runs before all tests
 * Mocks native modules that aren't available in the test environment
 */

// Mock axios before anything else
jest.mock('axios', () => {
  const mockAxiosInstance = {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    patch: jest.fn(),
    delete: jest.fn(),
    request: jest.fn(),
    interceptors: {
      request: {
        use: jest.fn(),
        eject: jest.fn(),
        clear: jest.fn(),
      },
      response: {
        use: jest.fn(),
        eject: jest.fn(),
        clear: jest.fn(),
      },
    },
    defaults: {
      headers: {
        common: {},
      },
    },
  };

  return {
    __esModule: true,
    default: {
      create: jest.fn(() => mockAxiosInstance),
      get: jest.fn(),
      post: jest.fn(),
      put: jest.fn(),
      patch: jest.fn(),
      delete: jest.fn(),
      isAxiosError: jest.fn((error) => error.isAxiosError === true),
    },
    create: jest.fn(() => mockAxiosInstance),
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    patch: jest.fn(),
    delete: jest.fn(),
    isAxiosError: jest.fn((error) => error.isAxiosError === true),
  };
});

// Mock expo-modules-core first (required by expo-constants)
jest.mock('expo-modules-core', () => ({
  EventEmitter: class MockEventEmitter {
    addListener() { return { remove: jest.fn() }; }
    removeListener() {}
    emit() {}
  },
  requireOptionalNativeModule: jest.fn(() => null),
  CodedError: class MockCodedError extends Error {
    constructor(code, message) {
      super(message);
      this.code = code;
    }
  },
  requireNativeModule: jest.fn(() => ({})),
}));

// Mock expo-constants
jest.mock('expo-constants', () => ({
  __esModule: true,
  default: {
    expoConfig: {
      extra: {
        apiUrl: 'http://localhost:3000/api/v1',
      },
    },
    manifest: {
      extra: {
        apiUrl: 'http://localhost:3000/api/v1',
      },
    },
    executionEnvironment: 'standalone',
  },
}));

// Mock @react-native-community/netinfo
jest.mock('@react-native-community/netinfo', () => ({
  addEventListener: jest.fn(() => jest.fn()),
  fetch: jest.fn(() =>
    Promise.resolve({
      isConnected: true,
      isInternetReachable: true,
      type: 'wifi',
      details: null,
    })
  ),
  useNetInfo: jest.fn(() => ({
    isConnected: true,
    isInternetReachable: true,
    type: 'wifi',
    details: null,
  })),
}));

// Mock Firebase
jest.mock('@react-native-firebase/app', () => ({
  __esModule: true,
  default: () => ({
    initializeApp: jest.fn(),
  }),
  getApp: jest.fn(() => ({})),
  getApps: jest.fn(() => []),
  initializeApp: jest.fn(),
}));

jest.mock('@react-native-firebase/auth', () => ({
  __esModule: true,
  default: () => ({
    signInWithEmailAndPassword: jest.fn(),
    createUserWithEmailAndPassword: jest.fn(),
    signOut: jest.fn(),
    onAuthStateChanged: jest.fn(() => jest.fn()),
    currentUser: null,
  }),
  getAuth: jest.fn(() => ({
    currentUser: null,
    signInWithEmailAndPassword: jest.fn(),
    createUserWithEmailAndPassword: jest.fn(),
    signOut: jest.fn(),
    onAuthStateChanged: jest.fn(() => jest.fn()),
  })),
}));

// Mock react-native-safe-area-context
jest.mock('react-native-safe-area-context', () => {
  const React = require('react');
  return {
    SafeAreaProvider: ({ children }) => children,
    SafeAreaView: ({ children }) => children,
    useSafeAreaInsets: () => ({ top: 0, right: 0, bottom: 0, left: 0 }),
    useSafeAreaFrame: () => ({ x: 0, y: 0, width: 375, height: 812 }),
  };
});

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

// Silence console warnings in tests (optional - remove if you want to see warnings)
// global.console.warn = jest.fn();
