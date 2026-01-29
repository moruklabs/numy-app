module.exports = {
  testEnvironment: "node",
  moduleFileExtensions: ["ts", "tsx", "js", "jsx"],
  globals: {
    __DEV__: true,
  },
  transform: {
    "^.+\\.(ts|tsx)$": [
      "ts-jest",
      {
        tsconfig: {
          jsx: "react",
          esModuleInterop: true,
        },
      },
    ],
  },
  testMatch: [
    "**/src/domain/__tests__/**/*.test.(ts|tsx)",
    "**/src/infrastructure/__tests__/**/*.test.(ts|tsx)",
    "**/src/application/__tests__/**/*.test.(ts|tsx)",
  ],
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
    "^@moruk/ai$": "<rootDir>/../../packages/ai/src/index.ts",
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
