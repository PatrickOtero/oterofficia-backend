module.exports = {
  clearMocks: true,
  collectCoverageFrom: ["src/**/*.ts", "!src/server.ts", "!src/shared/infra/database/migrations/**/*.ts"],
  moduleFileExtensions: ["ts", "js", "json"],
  roots: ["<rootDir>/tests"],
  setupFilesAfterEnv: ["<rootDir>/tests/setup.ts"],
  testEnvironment: "node",
  testMatch: ["**/*.spec.ts"],
  transform: {
    "^.+\\.ts$": [
      "ts-jest",
      {
        isolatedModules: true,
        tsconfig: "<rootDir>/tsconfig.json",
      },
    ],
  },
};
