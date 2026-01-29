#!/usr/bin/env node

/**
 * Comprehensive Localization Validation Tests
 *
 * Validates:
 * 1. Every app has exactly 32 in-app translation languages
 * 2. Every app has exactly 39 store metadata locales
 * 3. Every translation key in English exists in all other languages
 * 4. Every translation has real translated values (not mocked/placeholder)
 * 5. Build number auto-increment is enabled for production builds
 *
 * Run: node localization.test.js [app-name]
 */

const fs = require("fs");
const path = require("path");

const APPS_DIR = path.join(__dirname, "../../apps");

// Active apps that require localization validation
const ACTIVE_APPS = [
  "car-value-checker",
  "numy",
  "interval-timer",
  "minday",
  "numy",
  "plant-doctor",
  "rizzman",
  "stone-identifier",
];

// Expected 32 in-app translation languages
const EXPECTED_IN_APP_LANGUAGES = [
  "ar",
  "ca",
  "cs",
  "da",
  "de",
  "el",
  "en",
  "es",
  "fi",
  "fr",
  "he",
  "hi",
  "hr",
  "hu",
  "id",
  "it",
  "ja",
  "ko",
  "ms",
  "nl",
  "no",
  "pl",
  "pt",
  "ro",
  "ru",
  "sk",
  "sv",
  "th",
  "tr",
  "uk",
  "vi",
  "zh",
];

// Expected 39 store metadata locales
const EXPECTED_STORE_LOCALES = [
  "ar-SA",
  "ca",
  "cs",
  "da",
  "de-DE",
  "el",
  "en-AU",
  "en-CA",
  "en-GB",
  "en-US",
  "es-ES",
  "es-MX",
  "fi",
  "fr-CA",
  "fr-FR",
  "he",
  "hi",
  "hr",
  "hu",
  "id",
  "it",
  "ja",
  "ko",
  "ms",
  "nl-NL",
  "no",
  "pl",
  "pt-BR",
  "pt-PT",
  "ro",
  "ru",
  "sk",
  "sv",
  "th",
  "tr",
  "uk",
  "vi",
  "zh-Hans",
  "zh-Hant",
];

// Patterns that indicate mocked/placeholder translations
const MOCK_PATTERNS = [
  /^TODO$/i,
  /^FIXME$/i,
  /^XXX$/i,
  /^\[.*\]$/, // [placeholder]
  /^<.*>$/, // <placeholder>
  /^TRANSLATE$/i,
  /^MISSING$/i,
  /^N\/A$/i,
  /^TBD$/i,
  /^\.\.\.$/,
  /^-+$/,
  /^_+$/,
];

/**
 * Get all directories in apps/ that are active
 */
function getAppDirectories() {
  return fs.readdirSync(APPS_DIR).filter((name) => {
    const appPath = path.join(APPS_DIR, name);
    return fs.statSync(appPath).isDirectory() && ACTIVE_APPS.includes(name);
  });
}

/**
 * Detect the translation structure for an app
 * Returns: 'ts-files' | 'json-locales' | 'none'
 */
function detectTranslationStructure(appName) {
  const tsPath = path.join(APPS_DIR, appName, "src", "translations");
  const jsonPath = path.join(APPS_DIR, appName, "src", "locales");

  if (fs.existsSync(tsPath)) {
    const files = fs.readdirSync(tsPath).filter((f) => f.endsWith(".ts") && f !== "index.ts");
    if (files.length > 0) return "ts-files";
  }

  if (fs.existsSync(jsonPath)) {
    const dirs = fs.readdirSync(jsonPath).filter((d) => {
      const stat = fs.statSync(path.join(jsonPath, d));
      return stat.isDirectory();
    });
    if (dirs.length > 0) return "json-locales";
  }

  return "none";
}

/**
 * Get available languages for ts-files structure
 */
function getTsLanguages(appName) {
  const tsPath = path.join(APPS_DIR, appName, "src", "translations");
  try {
    return fs
      .readdirSync(tsPath)
      .filter((f) => f.endsWith(".ts") && f !== "index.ts")
      .map((f) => f.replace(".ts", ""));
  } catch {
    return [];
  }
}

/**
 * Get available languages for json-locales structure (like numy)
 */
function getJsonLocaleLanguages(appName) {
  const localesPath = path.join(APPS_DIR, appName, "src", "locales");
  try {
    return fs.readdirSync(localesPath).filter((d) => {
      const stat = fs.statSync(path.join(localesPath, d));
      return stat.isDirectory();
    });
  } catch {
    return [];
  }
}

/**
 * Get store metadata locale files
 */
function getStoreMetadataLocales(appName) {
  const localesPath = path.join(APPS_DIR, appName, "store-metadata", "locales");
  try {
    return fs
      .readdirSync(localesPath)
      .filter((f) => f.endsWith(".json"))
      .map((f) => f.replace(".json", ""));
  } catch {
    return [];
  }
}

/**
 * Parse TypeScript translation file and extract the exported object
 */
function parseTypeScriptTranslation(filePath) {
  try {
    const content = fs.readFileSync(filePath, "utf-8");

    // Find the start of "export default {"
    const startMatch = content.match(/export\s+default\s+\{/);
    if (!startMatch) return null;

    const startIndex = startMatch.index + startMatch[0].length - 1; // Position of first {

    // Find the matching closing brace
    let braceCount = 0;
    let endIndex = -1;
    for (let i = startIndex; i < content.length; i++) {
      if (content[i] === "{") braceCount++;
      else if (content[i] === "}") {
        braceCount--;
        if (braceCount === 0) {
          endIndex = i;
          break;
        }
      }
    }

    if (endIndex === -1) return null;

    let objString = content.substring(startIndex, endIndex + 1);

    // Handle template literals and string concatenation
    objString = objString.replace(/`([^`]*)`/g, '"$1"');

    // Remove trailing commas before closing braces/brackets
    objString = objString.replace(/,(\s*[}\]])/g, "$1");

    // Handle function-style strings (arrow functions returning strings)
    objString = objString.replace(/:\s*\([^)]*\)\s*=>\s*/g, ": ");

    // Try to evaluate as JavaScript object (safe since we control the files)
    try {
      // eslint-disable-next-line no-eval
      return eval("(" + objString + ")");
    } catch {
      return null;
    }
  } catch {
    return null;
  }
}

/**
 * Flatten nested object keys for comparison
 */
function flattenKeys(obj, prefix = "") {
  const keys = [];
  for (const [key, value] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    if (typeof value === "object" && value !== null && !Array.isArray(value)) {
      keys.push(...flattenKeys(value, fullKey));
    } else {
      keys.push(fullKey);
    }
  }
  return keys;
}

/**
 * Get value at a nested key path
 */
function getNestedValue(obj, keyPath) {
  const keys = keyPath.split(".");
  let current = obj;
  for (const key of keys) {
    if (current === undefined || current === null || !(key in current)) {
      return undefined;
    }
    current = current[key];
  }
  return current;
}

/**
 * Check if a value is a mock/placeholder
 */
function isMockedValue(value) {
  if (typeof value !== "string") return false;
  if (value.trim() === "") return true;
  return MOCK_PATTERNS.some((pattern) => pattern.test(value.trim()));
}

/**
 * Validate translation keys consistency for ts-files apps
 */
function validateTranslationKeys(appName) {
  const errors = [];
  const tsPath = path.join(APPS_DIR, appName, "src", "translations");

  // Load English as the reference
  const enPath = path.join(tsPath, "en.ts");
  if (!fs.existsSync(enPath)) {
    return ["English translation file (en.ts) not found"];
  }

  const enTranslation = parseTypeScriptTranslation(enPath);
  if (!enTranslation) {
    return ["Failed to parse English translation file"];
  }

  const enKeys = flattenKeys(enTranslation);
  const languages = getTsLanguages(appName).filter((l) => l !== "en");

  for (const lang of languages) {
    const langPath = path.join(tsPath, `${lang}.ts`);
    const translation = parseTypeScriptTranslation(langPath);

    if (!translation) {
      errors.push(`${lang}: Failed to parse translation file`);
      continue;
    }

    const langKeys = flattenKeys(translation);

    // Check for missing keys
    for (const key of enKeys) {
      if (!langKeys.includes(key)) {
        errors.push(`${lang}: Missing key "${key}"`);
      } else {
        // Check if value is mocked
        const value = getNestedValue(translation, key);
        if (isMockedValue(value)) {
          errors.push(`${lang}: Mocked/placeholder value for key "${key}"`);
        }
      }
    }
  }

  return errors;
}

/**
 * Validate translation keys for json-locales apps (like numy)
 */
function validateJsonTranslationKeys(appName) {
  const errors = [];
  const localesPath = path.join(APPS_DIR, appName, "src", "locales");

  // Find all namespaces from English
  const enPath = path.join(localesPath, "en");
  if (!fs.existsSync(enPath)) {
    return ["English locale directory (en/) not found"];
  }

  const namespaces = fs.readdirSync(enPath).filter((f) => f.endsWith(".json"));
  const languages = getJsonLocaleLanguages(appName).filter((l) => l !== "en");

  for (const namespace of namespaces) {
    const enFilePath = path.join(enPath, namespace);
    let enTranslation;
    try {
      enTranslation = JSON.parse(fs.readFileSync(enFilePath, "utf-8"));
    } catch {
      errors.push(`en/${namespace}: Failed to parse JSON`);
      continue;
    }

    const enKeys = flattenKeys(enTranslation);

    for (const lang of languages) {
      const langFilePath = path.join(localesPath, lang, namespace);
      if (!fs.existsSync(langFilePath)) {
        errors.push(`${lang}/${namespace}: File not found`);
        continue;
      }

      let translation;
      try {
        translation = JSON.parse(fs.readFileSync(langFilePath, "utf-8"));
      } catch {
        errors.push(`${lang}/${namespace}: Failed to parse JSON`);
        continue;
      }

      const langKeys = flattenKeys(translation);

      for (const key of enKeys) {
        if (!langKeys.includes(key)) {
          errors.push(`${lang}/${namespace}: Missing key "${key}"`);
        } else {
          const value = getNestedValue(translation, key);
          if (isMockedValue(value)) {
            errors.push(`${lang}/${namespace}: Mocked/placeholder value for key "${key}"`);
          }
        }
      }
    }
  }

  return errors;
}

/**
 * Check if eas.json has autoIncrement enabled for production iOS builds
 */
function validateAutoIncrement(appName) {
  const easPath = path.join(APPS_DIR, appName, "eas.json");
  const errors = [];

  if (!fs.existsSync(easPath)) {
    return ["eas.json not found"];
  }

  try {
    const easConfig = JSON.parse(fs.readFileSync(easPath, "utf-8"));

    if (!easConfig.build?.production?.ios?.autoIncrement) {
      errors.push("autoIncrement not enabled for production iOS builds");
    }
  } catch (err) {
    errors.push(`Failed to parse eas.json: ${err.message}`);
  }

  return errors;
}

/**
 * Main test runner
 */
function main() {
  const targetApp = process.argv[2];
  let apps = getAppDirectories();

  if (targetApp) {
    if (apps.includes(targetApp)) {
      apps = [targetApp];
    } else if (ACTIVE_APPS.includes(targetApp)) {
      console.error(`Error: App '${targetApp}' not found in apps directory`);
      process.exit(1);
    } else {
      console.error(`Error: App '${targetApp}' is not an active app`);
      console.error(`Active apps: ${ACTIVE_APPS.join(", ")}`);
      process.exit(1);
    }
  }

  let hasErrors = false;
  let totalTests = 0;
  let passedTests = 0;

  console.log("Localization Validation Tests");
  console.log("==============================\n");

  for (const appName of apps) {
    console.log(`${appName}/`);

    // Test 1: In-app translation language count
    totalTests++;
    const translationStructure = detectTranslationStructure(appName);
    let availableLanguages = [];

    if (translationStructure === "ts-files") {
      availableLanguages = getTsLanguages(appName);
    } else if (translationStructure === "json-locales") {
      availableLanguages = getJsonLocaleLanguages(appName);
    }

    const missingLanguages = EXPECTED_IN_APP_LANGUAGES.filter(
      (l) => !availableLanguages.includes(l)
    );
    const extraLanguages = availableLanguages.filter((l) => !EXPECTED_IN_APP_LANGUAGES.includes(l));

    if (translationStructure === "none") {
      hasErrors = true;
      console.log(`  FAIL In-app translations: No translation structure found`);
    } else if (missingLanguages.length > 0 || extraLanguages.length > 0) {
      hasErrors = true;
      console.log(`  FAIL In-app translations: ${availableLanguages.length}/32 languages`);
      if (missingLanguages.length > 0) {
        console.log(`    - Missing: ${missingLanguages.join(", ")}`);
      }
      if (extraLanguages.length > 0) {
        console.log(`    - Unexpected: ${extraLanguages.join(", ")}`);
      }
    } else {
      passedTests++;
      console.log(`  PASS In-app translations: 32/32 languages`);
    }

    // Test 2: Translation key consistency
    totalTests++;
    let keyErrors = [];

    if (translationStructure === "ts-files") {
      keyErrors = validateTranslationKeys(appName);
    } else if (translationStructure === "json-locales") {
      keyErrors = validateJsonTranslationKeys(appName);
    }

    if (keyErrors.length > 0) {
      hasErrors = true;
      console.log(`  FAIL Translation key consistency: ${keyErrors.length} issues`);
      // Show first 5 errors
      keyErrors.slice(0, 5).forEach((err) => console.log(`    - ${err}`));
      if (keyErrors.length > 5) {
        console.log(`    - ... and ${keyErrors.length - 5} more`);
      }
    } else if (translationStructure !== "none") {
      passedTests++;
      console.log(`  PASS Translation key consistency`);
    } else {
      console.log(`  SKIP Translation key consistency (no translations)`);
    }

    // Test 3: Store metadata locale count
    totalTests++;
    const storeLocales = getStoreMetadataLocales(appName);
    const missingStoreLocales = EXPECTED_STORE_LOCALES.filter((l) => !storeLocales.includes(l));
    const extraStoreLocales = storeLocales.filter((l) => !EXPECTED_STORE_LOCALES.includes(l));

    if (storeLocales.length === 0) {
      hasErrors = true;
      console.log(`  FAIL Store metadata locales: No locales found`);
    } else if (missingStoreLocales.length > 0 || extraStoreLocales.length > 0) {
      hasErrors = true;
      console.log(`  FAIL Store metadata locales: ${storeLocales.length}/39 locales`);
      if (missingStoreLocales.length > 0) {
        console.log(`    - Missing: ${missingStoreLocales.join(", ")}`);
      }
      if (extraStoreLocales.length > 0) {
        console.log(`    - Unexpected: ${extraStoreLocales.join(", ")}`);
      }
    } else {
      passedTests++;
      console.log(`  PASS Store metadata locales: 39/39 locales`);
    }

    // Test 4: Auto-increment validation
    totalTests++;
    const autoIncrementErrors = validateAutoIncrement(appName);

    if (autoIncrementErrors.length > 0) {
      hasErrors = true;
      console.log(`  FAIL Build auto-increment`);
      autoIncrementErrors.forEach((err) => console.log(`    - ${err}`));
    } else {
      passedTests++;
      console.log(`  PASS Build auto-increment enabled`);
    }

    console.log("");
  }

  console.log(`Tests: ${passedTests}/${totalTests} passed`);

  if (hasErrors) {
    console.log("\nLocalization validation FAILED!");
    process.exit(1);
  } else {
    console.log("\nAll localization tests passed!");
    process.exit(0);
  }
}

main();
