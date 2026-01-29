// https://docs.expo.dev/guides/using-eslint/
// Note: Global ignores are defined in root eslint.config.js
const { defineConfig } = require("eslint/config");
const expoConfig = require("eslint-config-expo/flat");

module.exports = defineConfig([
  expoConfig,
  {
    settings: {
      "import/ignore": ["@moruk/", "react-native", "expo-"],
    },
    rules: {
      "import/no-unresolved": ["error", { ignore: ["^@moruk/", "^react-native", "^expo-", "^@/"] }],
      "import/namespace": "off",
    },
  },
]);
