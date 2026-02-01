const path = require("node:path");
const { getSentryExpoConfig } = require("@sentry/react-native/metro");

// Find the project directory
const projectRoot = __dirname;

const config = getSentryExpoConfig(projectRoot);

// SVG Transformer Support
const { resolver } = config;

// Create a new config object with the modified resolver
const newConfig = {
  ...config,
  resolver: {
    ...resolver,
    assetExts: resolver?.assetExts ? resolver.assetExts.filter((ext) => ext !== "svg") : [],
    sourceExts: resolver?.sourceExts ? [...resolver.sourceExts, "svg"] : ["svg"],
  },
};

module.exports = newConfig;
