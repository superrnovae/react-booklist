// Extends Jest with Testing Library native matchers and silences noisy logs in tests.
require('@testing-library/jest-native/extend-expect');

// AsyncStorage in-memory mock (used by theme/i18n persistence).
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);
