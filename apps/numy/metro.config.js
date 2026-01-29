// Learn more https://docs.expo.io/guides/customizing-metro
const { getDefaultConfig } = require("expo/metro-config");
const path = require("path");

// Find the project and workspace directories
const projectRoot = __dirname;
const monorepoRoot = path.resolve(projectRoot, "../..");

module.exports = (() => {
  const config = getDefaultConfig(projectRoot);
  const { resolver } = config;

  // Monorepo support - merge with defaults
  config.watchFolders = [
    ...(config.watchFolders || []),
    monorepoRoot,
  ];

  config.resolver = {
    ...resolver,
    assetExts: resolver.assetExts.filter((ext) => ext !== "svg"),
    sourceExts: [...resolver.sourceExts, "svg"],
    // Let Metro know where to resolve packages
    nodeModulesPaths: [
      path.resolve(projectRoot, "node_modules"),
      path.resolve(monorepoRoot, "node_modules"),
    ],
    // Ensure we can resolve the monorepo packages
    disableHierarchicalLookup: false,
  };

  return config;
})();
