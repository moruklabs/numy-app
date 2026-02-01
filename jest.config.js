module.exports = {
  testEnvironment: "node",
  moduleFileExtensions: ["ts", "tsx", "js", "jsx"],
  globals: {
    __DEV__: true,
  },
  setupFilesAfterEnv: ["<rootDir>/jest.setup.js"],
  transform: {
    "^.+\\.(js|jsx|ts|tsx)$": "babel-jest",
  },
  transformIgnorePatterns: [
    "node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules|sentry-expo|native-base|react-native-svg|@moruk/.*|@testing-library/react-native|expo-tracking-transparency|react-native-google-mobile-ads)",
  ],
  testMatch: [
    "**/src/domain/__tests__/**/*.test.(ts|tsx)",
    "**/src/infrastructure/__tests__/**/*.test.(ts|tsx)",
    "**/src/application/__tests__/**/*.test.(ts|tsx)",
    "**/src/features/**/__tests__/**/*.test.(ts|tsx)",
    "**/src/shared/**/__tests__/**/*.test.(ts|tsx)",
  ],
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
    "^@moruk/ai$": "<rootDir>/../../packages/ai/src/index.ts",
    "^expo-tracking-transparency$": "<rootDir>/__mocks__/expo-tracking-transparency.js",
    "^react-native-google-mobile-ads$": "<rootDir>/__mocks__/react-native-google-mobile-ads.js",
  },
  collectCoverageFrom: [
    "src/domain/**/*.{ts,tsx}",
    "src/infrastructure/**/*.{ts,tsx}",
    "src/application/**/*.{ts,tsx}",
    "!src/domain/**/*.d.ts",
    "!src/infrastructure/**/*.d.ts",
    "!src/application/**/*.d.ts",
    "!src/domain/__tests__/**",
    "!src/infrastructure/__tests__/**",
    "!src/application/__tests__/**",
  ],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
  testPathIgnorePatterns: ["/node_modules/", "/app/"],
};
