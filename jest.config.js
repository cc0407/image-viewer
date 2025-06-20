module.exports = {
  testEnvironment: "jsdom",
  roots: ["<rootDir>/tests"],
  moduleNameMapper: {
    // Mocks file imports for testing
    "\\.(jpg|jpeg|png|gif|webp|svg|css)$": "<rootDir>/__mocks__/fileMock.js",
  },
  setupFilesAfterEnv: ["<rootDir>/jest.setup.js"],
};
