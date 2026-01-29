/**
 * Code generation utilities
 */

const fs = require("fs");
const path = require("path");

/**
 * Generate CFBundleLocalizations array from available translation files
 * @param {string} translationsPath - Path to translations directory
 * @returns {string[]} Array of locale codes
 */
function generateCFBundleLocalizations(translationsPath) {
  if (!fs.existsSync(translationsPath)) {
    return [];
  }

  const files = fs.readdirSync(translationsPath);
  const locales = files
    .filter((file) => file.endsWith(".ts") && file !== "index.ts")
    .map((file) => path.basename(file, ".ts"))
    .sort();

  return locales;
}

/**
 * Generate permission localizations from translation files
 * @param {Object} translations - Object with locale codes as keys
 * @returns {Object} Object with locale codes and permission strings
 */
function generatePermissionLocalizations(translations) {
  const result = {};

  for (const [locale, trans] of Object.entries(translations)) {
    if (locale === "index") continue;

    // Extract permission strings if available
    if (trans.common?.photoLibraryPermission) {
      result[locale] = trans.common.photoLibraryPermission;
    } else if (trans.common?.cameraPermission) {
      result[locale] = trans.common.cameraPermission;
    }
  }

  return result;
}

module.exports = {
  generateCFBundleLocalizations,
  generatePermissionLocalizations,
};
