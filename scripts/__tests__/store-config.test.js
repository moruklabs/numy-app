#!/usr/bin/env node

/**
 * Validates all store configuration files for all apps.
 *
 * Files validated:
 * - store.config.json - Main store configuration
 * - store-metadata/base-config.json - Base metadata configuration
 * - store-metadata/locales/*.json - Locale-specific metadata
 *
 * Checks:
 * - Valid JSON structure
 * - Required fields: configVersion, apple.version, apple.copyright, apple.release, apple.categories, apple.review
 * - apple.categories must be an array with valid App Store categories
 * - apple.review must have firstName, lastName, email, phone
 * - Locale files must have: title, subtitle, description, keywords
 * - App Store character limits: title (30), subtitle (30), description (4000), keywords (100)
 * - URL format validation
 */

const fs = require("fs");
const path = require("path");

const APPS_DIR = path.join(__dirname, "../../apps");

const VALID_CATEGORIES = [
  "BOOKS",
  "BUSINESS",
  "DEVELOPER_TOOLS",
  "EDUCATION",
  "ENTERTAINMENT",
  "FINANCE",
  "FOOD_AND_DRINK",
  "GAMES",
  "GRAPHICS_AND_DESIGN",
  "HEALTH_AND_FITNESS",
  "LIFESTYLE",
  "MAGAZINES_AND_NEWSPAPERS",
  "MEDICAL",
  "MUSIC",
  "NAVIGATION",
  "NEWS",
  "PHOTO_AND_VIDEO",
  "PRODUCTIVITY",
  "REFERENCE",
  "SHOPPING",
  "SOCIAL_NETWORKING",
  "SPORTS",
  "TRAVEL",
  "UTILITIES",
  "WEATHER",
];

const TITLE_MAX_LENGTH = 30;
const SUBTITLE_MAX_LENGTH = 30;
const DESCRIPTION_MAX_LENGTH = 4000;
const KEYWORDS_MAX_LENGTH = 100;

function getAppDirectories() {
  return fs.readdirSync(APPS_DIR).filter((name) => {
    const appPath = path.join(APPS_DIR, name);
    return (
      fs.statSync(appPath).isDirectory() && fs.existsSync(path.join(appPath, "store.config.json"))
    );
  });
}

function getLocaleFiles(appName) {
  const localesPath = path.join(APPS_DIR, appName, "store-metadata", "locales");
  try {
    return fs.readdirSync(localesPath).filter((f) => f.endsWith(".json"));
  } catch {
    return [];
  }
}

function isValidUrl(url) {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

function validateRequiredField(obj, field) {
  const parts = field.split(".");
  let current = obj;
  for (const part of parts) {
    if (current === undefined || current === null || !(part in current)) {
      return `Missing required field: ${field}`;
    }
    current = current[part];
  }
  return null;
}

function validateCategories(categories) {
  const errors = [];

  if (!Array.isArray(categories)) {
    return ["apple.categories must be an array"];
  }

  if (categories.length === 0) {
    errors.push("apple.categories must have at least one category");
  }

  if (categories.length > 2) {
    errors.push("apple.categories can have at most 2 categories");
  }

  for (const category of categories) {
    if (!VALID_CATEGORIES.includes(category)) {
      errors.push(`Invalid category: ${category}`);
    }
  }

  return errors;
}

function validateReview(review) {
  const errors = [];
  const requiredFields = ["firstName", "lastName", "email", "phone"];

  for (const field of requiredFields) {
    if (!review[field]) {
      errors.push(`Missing required review field: ${field}`);
    }
  }

  if (review.email && !review.email.includes("@")) {
    errors.push("Invalid email format in review");
  }

  return errors;
}

function validateLocaleData(data, locale) {
  const errors = [];
  const requiredFields = ["title", "subtitle", "description", "keywords"];

  for (const field of requiredFields) {
    if (!data[field]) {
      errors.push(`Missing required field: ${field}`);
    }
  }

  // Validate title
  if (data.title) {
    if (typeof data.title !== "string") {
      errors.push("title must be a string");
    } else if (data.title.length > TITLE_MAX_LENGTH) {
      errors.push(`title exceeds ${TITLE_MAX_LENGTH} chars (${data.title.length})`);
    } else if (data.title.trim().length === 0) {
      errors.push("title cannot be empty");
    }
  }

  // Validate subtitle
  if (data.subtitle) {
    if (typeof data.subtitle !== "string") {
      errors.push("subtitle must be a string");
    } else if (data.subtitle.length > SUBTITLE_MAX_LENGTH) {
      errors.push(`subtitle exceeds ${SUBTITLE_MAX_LENGTH} chars (${data.subtitle.length})`);
    }
  }

  // Validate description
  if (data.description) {
    if (typeof data.description !== "string") {
      errors.push("description must be a string");
    } else if (data.description.length > DESCRIPTION_MAX_LENGTH) {
      errors.push(
        `description exceeds ${DESCRIPTION_MAX_LENGTH} chars (${data.description.length})`
      );
    } else if (data.description.trim().length === 0) {
      errors.push("description cannot be empty");
    } else {
      // Check for emojis
      const emojiRegex = /[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/u;
      if (emojiRegex.test(data.description)) {
        errors.push("description cannot contain emojis (✨, 🎯, etc.)");
      }
    }
  }

  // Validate keywords
  if (data.keywords) {
    if (!Array.isArray(data.keywords)) {
      errors.push("keywords must be an array");
    } else {
      const keywordsString = data.keywords.join(", ");
      if (keywordsString.length > KEYWORDS_MAX_LENGTH) {
        errors.push(
          `keywords string exceeds ${KEYWORDS_MAX_LENGTH} chars (${keywordsString.length})`
        );
      }
      for (let i = 0; i < data.keywords.length; i++) {
        if (typeof data.keywords[i] !== "string") {
          errors.push(`keywords[${i}] must be a string`);
        }
      }
    }
  }

  // Validate URLs if present
  const urlFields = ["marketingUrl", "supportUrl", "privacyPolicyUrl"];
  for (const urlField of urlFields) {
    if (data[urlField] && !isValidUrl(data[urlField])) {
      errors.push(`Invalid URL format for ${urlField}`);
    }
  }

  return errors;
}

function validateStoreConfig(appName) {
  const configPath = path.join(APPS_DIR, appName, "store.config.json");
  const errors = [];

  try {
    const content = fs.readFileSync(configPath, "utf-8");
    const config = JSON.parse(content);

    // Check required top-level fields
    const requiredFields = [
      "configVersion",
      "apple.version",
      "apple.copyright",
      "apple.release",
      "apple.categories",
      "apple.review",
    ];

    for (const field of requiredFields) {
      const error = validateRequiredField(config, field);
      if (error) errors.push(error);
    }

    // Validate categories
    if (config.apple?.categories) {
      errors.push(...validateCategories(config.apple.categories));
    }

    // Validate review
    if (config.apple?.review) {
      errors.push(...validateReview(config.apple.review));
    }

    // Validate locale info if present in store.config.json
    if (config.apple?.info) {
      for (const [locale, info] of Object.entries(config.apple.info)) {
        const localeErrors = validateLocaleData(info, locale);
        errors.push(...localeErrors.map((e) => `${locale}: ${e}`));
      }
    }
  } catch (err) {
    if (err instanceof SyntaxError) {
      errors.push(`Invalid JSON: ${err.message}`);
    } else {
      errors.push(`Failed to read file: ${err.message}`);
    }
  }

  return errors;
}

function validateBaseConfig(appName) {
  const configPath = path.join(APPS_DIR, appName, "store-metadata", "base-config.json");
  const errors = [];

  if (!fs.existsSync(configPath)) {
    return ["File not found"];
  }

  try {
    const content = fs.readFileSync(configPath, "utf-8");
    const config = JSON.parse(content);

    if (config.configVersion === undefined) {
      errors.push("Missing configVersion");
    }

    if (!config.apple) {
      errors.push("Missing apple configuration");
    } else {
      if (!config.apple.version) {
        errors.push("Missing apple.version");
      }
      if (!config.apple.copyright) {
        errors.push("Missing apple.copyright");
      }
    }
  } catch (err) {
    if (err instanceof SyntaxError) {
      errors.push(`Invalid JSON: ${err.message}`);
    } else {
      errors.push(`Failed to read file: ${err.message}`);
    }
  }

  return errors;
}

function validateLocaleFile(appName, localeFile) {
  const filePath = path.join(APPS_DIR, appName, "store-metadata", "locales", localeFile);
  const errors = [];

  try {
    const content = fs.readFileSync(filePath, "utf-8");
    const data = JSON.parse(content);
    errors.push(...validateLocaleData(data, localeFile));
  } catch (err) {
    if (err instanceof SyntaxError) {
      errors.push(`Invalid JSON: ${err.message}`);
    } else {
      errors.push(`Failed to read file: ${err.message}`);
    }
  }

  return errors;
}

function main() {
  const targetApp = process.argv[2];
  let apps = getAppDirectories();

  if (targetApp) {
    if (apps.includes(targetApp)) {
      apps = [targetApp];
    } else {
      console.error(`Error: App '${targetApp}' not found or has no store.config.json`);
      process.exit(1);
    }
  }

  let hasErrors = false;
  let totalTests = 0;
  let passedTests = 0;

  console.log("Store Config Tests");
  console.log("==================\n");

  for (const appName of apps) {
    console.log(`${appName}/`);

    // Test store.config.json
    totalTests++;
    const storeConfigErrors = validateStoreConfig(appName);
    if (storeConfigErrors.length > 0) {
      hasErrors = true;
      console.log(`  FAIL store.config.json`);
      storeConfigErrors.forEach((err) => console.log(`    - ${err}`));
    } else {
      passedTests++;
      console.log(`  PASS store.config.json`);
    }

    // Test store-metadata/base-config.json
    totalTests++;
    const baseConfigErrors = validateBaseConfig(appName);
    if (baseConfigErrors.length > 0) {
      hasErrors = true;
      console.log(`  FAIL store-metadata/base-config.json`);
      baseConfigErrors.forEach((err) => console.log(`    - ${err}`));
    } else {
      passedTests++;
      console.log(`  PASS store-metadata/base-config.json`);
    }

    // Test store-metadata/locales/*.json
    const localeFiles = getLocaleFiles(appName);
    for (const localeFile of localeFiles) {
      totalTests++;
      const localeErrors = validateLocaleFile(appName, localeFile);

      if (localeErrors.length > 0) {
        hasErrors = true;
        console.log(`  FAIL store-metadata/locales/${localeFile}`);
        localeErrors.forEach((err) => console.log(`    - ${err}`));
      } else {
        passedTests++;
        console.log(`  PASS store-metadata/locales/${localeFile}`);
      }
    }

    console.log("");
  }

  console.log(`Tests: ${passedTests}/${totalTests} passed`);

  if (hasErrors) {
    process.exit(1);
  } else {
    console.log("\nAll store config tests passed!");
    process.exit(0);
  }
}

main();
