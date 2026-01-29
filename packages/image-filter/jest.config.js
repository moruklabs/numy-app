module.exports = {
  testEnvironment: "node",
  transform: {
    "^.+\\.(js|jsx|ts|tsx)$": ["babel-jest", { configFile: "./babel.config.js" }],
  },
  transformIgnorePatterns: ["node_modules/(?!(expo-image-manipulator)/)"],
  moduleNameMapper: {
    "^@moruk/logger$": "<rootDir>/__mocks__/@moruk/logger.ts",
    "^expo-image-manipulator$": "<rootDir>/__mocks__/expo-image-manipulator.ts",
  },
  testMatch: ["**/__tests__/**/*.test.ts"],
  collectCoverageFrom: ["src/**/*.ts", "!src/**/*.d.ts", "!src/**/__tests__/**"],
};
