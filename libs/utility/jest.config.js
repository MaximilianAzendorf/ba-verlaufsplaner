module.exports = {
  displayName: "utility",
  preset: "../../jest.preset.js",
  setupFilesAfterEnv: ["<rootDir>/src/test-setup.ts"],
  globals: {
    "ts-jest": {

      stringifyContentPathRegex: "\\.(html|svg)$",
      "tsconfig": "<rootDir>/tsconfig.spec.json"
    },
  },
  coverageDirectory: "../../coverage/libs/utility",
  snapshotSerializers: [
    'jest-preset-angular/build/serializers/no-ng-attributes.js',
    'jest-preset-angular/build/serializers/ng-snapshot.js',
    'jest-preset-angular/build/serializers/html-comment.js',
  ],"transform": {"^.+\\.(ts|js|html)$":"jest-preset-angular"}
};
