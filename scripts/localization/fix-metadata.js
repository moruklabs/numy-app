#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

/**
 * Truncate keywords array to be under maxLength when joined as comma-separated string
 * @param {string[]} keywords - Array of keywords
 * @param {number} maxLength - Maximum allowed length (default 100)
 * @returns {string[]} - Truncated keywords array
 */
function truncateKeywordsArray(keywords, maxLength = 100) {
  if (!Array.isArray(keywords)) {
    return keywords;
  }

  // Join to check current length
  const currentString = keywords.join(", ");
  if (currentString.length <= maxLength) {
    return keywords;
  }

  let result = [];
  let currentLength = 0;

  for (let i = 0; i < keywords.length; i++) {
    const keyword = keywords[i];
    // Account for comma and space (except for first keyword)
    const addition = i === 0 ? keyword.length : keyword.length + 2;

    if (currentLength + addition <= maxLength) {
      result.push(keyword);
      currentLength += addition;
    } else {
      break;
    }
  }

  return result;
}

/**
 * Truncate subtitle to be under maxLength
 * @param {string} subtitle - Subtitle string
 * @param {number} maxLength - Maximum allowed length (default 30)
 * @returns {string} - Truncated subtitle
 */
function truncateSubtitle(subtitle, maxLength = 30) {
  if (subtitle.length <= maxLength) {
    return subtitle;
  }

  // Try to truncate at word boundary
  let truncated = subtitle.substring(0, maxLength);
  const lastSpace = truncated.lastIndexOf(" ");

  if (lastSpace > maxLength * 0.6) {
    // If we can find a space in the last 40% of the string, use it
    return truncated.substring(0, lastSpace).trim();
  }

  // Otherwise just hard truncate
  return truncated.trim();
}

/**
 * Fix a single metadata file
 * @param {string} filePath - Path to the metadata JSON file
 * @returns {boolean} - True if file was modified
 */
function fixMetadataFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, "utf8");
    const data = JSON.parse(content);

    let modified = false;

    // Fix subtitle if present and too long
    if (data.subtitle && data.subtitle.length > 30) {
      const oldLength = data.subtitle.length;
      data.subtitle = truncateSubtitle(data.subtitle, 30);
      console.log(
        `  Fixing subtitle in ${path.basename(filePath)}: ${oldLength} -> ${data.subtitle.length}`
      );
      modified = true;
    }

    // Fix keywords if present and too long (keywords is an array)
    if (data.keywords && Array.isArray(data.keywords)) {
      const currentString = data.keywords.join(", ");
      if (currentString.length > 100) {
        const oldLength = currentString.length;
        data.keywords = truncateKeywordsArray(data.keywords, 100);
        const newLength = data.keywords.join(", ").length;
        console.log(
          `  Fixing keywords in ${path.basename(filePath)}: ${oldLength} -> ${newLength}`
        );
        modified = true;
      }
    }

    if (modified) {
      // Write back with proper formatting
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + "\n", "utf8");
      return true;
    }

    return false;
  } catch (error) {
    console.error(`Error processing ${filePath}:`, error.message);
    return false;
  }
}

/**
 * Fix store.config.json file with nested locale objects
 * @param {string} filePath - Path to store.config.json
 * @returns {boolean} - True if file was modified
 */
function fixStoreConfig(filePath) {
  try {
    const content = fs.readFileSync(filePath, "utf8");
    const data = JSON.parse(content);

    let modified = false;

    // Check apple.info object for locale-specific metadata
    if (data.apple && data.apple.info) {
      for (const [locale, localeData] of Object.entries(data.apple.info)) {
        // Fix subtitle if present and too long
        if (localeData.subtitle && localeData.subtitle.length > 30) {
          const oldLength = localeData.subtitle.length;
          localeData.subtitle = truncateSubtitle(localeData.subtitle, 30);
          console.log(
            `  Fixing subtitle for ${locale}: ${oldLength} -> ${localeData.subtitle.length}`
          );
          modified = true;
        }

        // Fix keywords if present and too long
        if (localeData.keywords && Array.isArray(localeData.keywords)) {
          const currentString = localeData.keywords.join(", ");
          if (currentString.length > 100) {
            const oldLength = currentString.length;
            localeData.keywords = truncateKeywordsArray(localeData.keywords, 100);
            const newLength = localeData.keywords.join(", ").length;
            console.log(`  Fixing keywords for ${locale}: ${oldLength} -> ${newLength}`);
            modified = true;
          }
        }
      }
    }

    if (modified) {
      // Write back with proper formatting
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + "\n", "utf8");
      return true;
    }

    return false;
  } catch (error) {
    console.error(`Error processing ${filePath}:`, error.message);
    return false;
  }
}

/**
 * Fix all metadata files in a directory
 * @param {string} appPath - Path to the app directory
 */
function fixAppMetadata(appPath) {
  const appName = path.basename(appPath);
  console.log(`\nProcessing ${appName}...`);

  let totalFixed = 0;

  // Fix store.config.json
  const storeConfigPath = path.join(appPath, "store.config.json");
  if (fs.existsSync(storeConfigPath)) {
    console.log(`  Checking store.config.json...`);
    if (fixStoreConfig(storeConfigPath)) {
      totalFixed++;
    }
  }

  // Fix locale files in store-metadata/locales/
  const localesDir = path.join(appPath, "store-metadata", "locales");
  if (fs.existsSync(localesDir)) {
    const files = fs.readdirSync(localesDir).filter((f) => f.endsWith(".json"));
    console.log(`  Checking ${files.length} locale files...`);

    files.forEach((file) => {
      const filePath = path.join(localesDir, file);
      if (fixMetadataFile(filePath)) {
        totalFixed++;
      }
    });
  }

  console.log(`Fixed ${totalFixed} files in ${appName}`);
}

// Main execution
const monorepoRoot = path.resolve(__dirname, "..");
const appsToFix = ["numy", "stone-identifier", "rizzman", "plant-doctor"];

console.log("Starting metadata fix...\n");

appsToFix.forEach((appName) => {
  const appPath = path.join(monorepoRoot, "apps", appName);
  fixAppMetadata(appPath);
});

console.log("\nMetadata fix complete!");
