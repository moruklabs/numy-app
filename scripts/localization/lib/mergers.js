/**
 * Metadata merging utilities
 */

/**
 * Merge base config with locale files into final store.config.json
 * @param {Object} baseConfig - Base configuration object
 * @param {Object} locales - Object with locale codes as keys and metadata as values
 * @returns {Object} Merged configuration
 */
function mergeMetadata(baseConfig, locales) {
  return {
    ...baseConfig,
    apple: {
      ...baseConfig.apple,
      info: locales,
    },
  };
}

module.exports = {
  mergeMetadata,
};
