/**
 * Localization Consistency Tests
 *
 * These tests ensure all apps in the monorepo have consistent localization:
 * - 32 in-app translation files (32 languages)
 * - 39 store metadata locale files (39 locales)
 * - Consistent translation paths (src/translations/)
 * - Consistent store metadata paths (store-metadata/locales/)
 *
 * Standard languages (32 in-app):
 * ar, ca, cs, da, de, el, en, es, fi, fr, he, hi, hr, hu, id, it,
 * ja, ko, ms, nl, no, pl, pt, ro, ru, sk, sv, th, tr, uk, vi, zh
 *
 * Standard store metadata locales (39):
 * ar-SA, ca, cs, da, de-DE, el, en-AU, en-CA, en-GB, en-US, es-ES, es-MX,
 * fi, fr-CA, fr-FR, he, hi, hr, hu, id, it, ja, ko, ms, nl-NL, no, pl,
 * pt-BR, pt-PT, ro, ru, sk, sv, th, tr, uk, vi, zh-Hans, zh-Hant
 *
 * Run: node localization-consistency.test.js
 */

const fs = require("fs");
const path = require("path");

// All active apps in the monorepo
const ACTIVE_APPS = [
  "numy",
  "interval-timer",
  "minday",
  "numy",
  "plant-doctor",
  "rizzman",
  "stone-identifier",
];

// Standard 32 in-app translation languages
const STANDARD_LANGUAGES = [
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

// Standard 39 store metadata locales
const STANDARD_STORE_LOCALES = [
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

const EXPECTED_TRANSLATION_COUNT = STANDARD_LANGUAGES.length; // 32
const EXPECTED_STORE_METADATA_COUNT = STANDARD_STORE_LOCALES.length; // 39

// Standard paths
const STANDARD_TRANSLATION_PATH = "src/translations";
const STANDARD_STORE_METADATA_PATH = "store-metadata/locales";

// Apps with valid alternate translation patterns
// These apps use i18next or other valid patterns but still require 32 languages
const ALTERNATE_TRANSLATION_PATHS = {
  numy: "src/locales", // Uses i18next with directory-per-language pattern
};

// Get the monorepo root (directory where this script is located)
const MONOREPO_ROOT = __dirname;

// ANSI color codes for terminal output
const RED = "\x1b[31m";
const GREEN = "\x1b[32m";
const YELLOW = "\x1b[33m";
const RESET = "\x1b[0m";

// Counters for test results
let passed = 0;
let failed = 0;

// Helper to get app directory
const getAppDir = (app) => path.join(MONOREPO_ROOT, "apps", app);

// Helper to check if path exists
const pathExists = (p) => fs.existsSync(p);

// Helper to get files in directory
const getFilesInDir = (dir, extension) => {
  if (!pathExists(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((file) => file.endsWith(extension) && file !== "index.ts")
    .map((file) => file.replace(extension, ""));
};

// Helper to get translation files (excluding index.ts)
const getTranslationFiles = (appDir) => {
  const translationsDir = path.join(appDir, STANDARD_TRANSLATION_PATH);
  return getFilesInDir(translationsDir, ".ts");
};

// Helper to get store metadata files
const getStoreMetadataFiles = (appDir) => {
  const metadataDir = path.join(appDir, STANDARD_STORE_METADATA_PATH);
  return getFilesInDir(metadataDir, ".json");
};

// Check if app uses standard translation path
const usesStandardTranslationPath = (appDir) => {
  const standardPath = path.join(appDir, STANDARD_TRANSLATION_PATH);
  if (!pathExists(standardPath)) return false;
  const files = fs.readdirSync(standardPath);
  return files.length > 0;
};

// Check if app uses standard store metadata path
const usesStandardStoreMetadataPath = (appDir) => {
  const standardPath = path.join(appDir, STANDARD_STORE_METADATA_PATH);
  if (!pathExists(standardPath)) return false;
  const files = fs.readdirSync(standardPath);
  return files.length > 0;
};

// Find what translation path the app actually uses
const findActualTranslationPath = (appDir) => {
  const possiblePaths = ["src/translations", "src/shared/i18n", "src/locales", "src/i18n"];

  for (const p of possiblePaths) {
    const fullPath = path.join(appDir, p);
    if (pathExists(fullPath)) {
      const files = fs.readdirSync(fullPath);
      // Check if it contains translation files (.ts or directories for i18next)
      const hasTranslations = files.some((f) => {
        const fp = path.join(fullPath, f);
        return f.endsWith(".ts") || (fs.statSync(fp).isDirectory() && f !== "__tests__");
      });
      if (hasTranslations) {
        return p;
      }
    }
  }
  return null;
};

// Get translation count from any path
const getTranslationCount = (appDir) => {
  const actualPath = findActualTranslationPath(appDir);
  if (!actualPath) {
    return { count: 0, path: null, pattern: null };
  }

  const fullPath = path.join(appDir, actualPath);
  const files = fs.readdirSync(fullPath);

  // Handle standard .ts files pattern (i18n-js)
  const tsFiles = files.filter((f) => f.endsWith(".ts") && f !== "index.ts");
  if (tsFiles.length > 0) {
    return { count: tsFiles.length, path: actualPath, pattern: "ts-files" };
  }

  // Handle i18next directory pattern (like numy with src/locales/en/, src/locales/es/)
  const dirs = files.filter((f) => {
    const fp = path.join(fullPath, f);
    return fs.statSync(fp).isDirectory() && f !== "__tests__";
  });
  if (dirs.length > 0) {
    return { count: dirs.length, path: actualPath, pattern: "i18next-dirs" };
  }

  return { count: 0, path: actualPath, pattern: null };
};

// Test helper functions
function assert(condition, message) {
  if (condition) {
    passed++;
    console.log(`  ${GREEN}PASS${RESET} ${message}`);
    return true;
  } else {
    failed++;
    console.log(`  ${RED}FAIL${RESET} ${message}`);
    return false;
  }
}

function warn(message) {
  console.log(`  ${YELLOW}WARN${RESET} ${message}`);
}

// Run tests
console.log("\nLocalization Consistency Tests");
console.log("================================\n");

console.log(`Expected in-app translations: ${EXPECTED_TRANSLATION_COUNT}`);
console.log(`Expected store metadata locales: ${EXPECTED_STORE_METADATA_COUNT}\n`);

// Test each app
for (const app of ACTIVE_APPS) {
  console.log(`\n${app}/`);
  const appDir = getAppDir(app);

  // Check if app has valid alternate path
  const hasAlternatePath = ALTERNATE_TRANSLATION_PATHS.hasOwnProperty(app);
  const expectedPath = hasAlternatePath
    ? ALTERNATE_TRANSLATION_PATHS[app]
    : STANDARD_TRANSLATION_PATH;

  // Test 1: Translation count
  const { count: translationCount, path: translationPath } = getTranslationCount(appDir);
  const translationResult = assert(
    translationCount === EXPECTED_TRANSLATION_COUNT,
    `In-app translations: ${translationCount} (expected ${EXPECTED_TRANSLATION_COUNT})`
  );
  if (!translationResult && translationPath) {
    warn(`Using path: ${translationPath}`);
  }

  // Test 2: Translation path (standard or approved alternate)
  const usesStdPath = usesStandardTranslationPath(appDir);
  const actualPath = findActualTranslationPath(appDir);

  if (hasAlternatePath) {
    // App uses approved alternate path
    const usesExpectedPath = actualPath === expectedPath;
    assert(usesExpectedPath, `Uses approved path: ${expectedPath} (i18next pattern)`);
    if (!usesExpectedPath && actualPath) {
      warn(`Actual path: ${actualPath}`);
    }
  } else {
    // App should use standard path
    const pathResult = assert(usesStdPath, `Uses standard path: ${STANDARD_TRANSLATION_PATH}`);
    if (!pathResult && actualPath) {
      warn(`Actual path: ${actualPath}`);
    }
  }

  // Test 3: All standard languages present (for standard path apps)
  if (usesStdPath && !hasAlternatePath) {
    const translations = getTranslationFiles(appDir);
    const missing = STANDARD_LANGUAGES.filter((lang) => !translations.includes(lang));
    const extra = translations.filter((lang) => !STANDARD_LANGUAGES.includes(lang));

    const hasAllLangs = missing.length === 0 && extra.length === 0;
    assert(hasAllLangs, `Has all standard languages`);
    if (missing.length > 0) {
      warn(`Missing: ${missing.join(", ")}`);
    }
    if (extra.length > 0) {
      warn(`Extra: ${extra.join(", ")}`);
    }
  }

  // Test 4: Store metadata count
  const metadataFiles = getStoreMetadataFiles(appDir);
  const metadataResult = assert(
    metadataFiles.length === EXPECTED_STORE_METADATA_COUNT,
    `Store metadata locales: ${metadataFiles.length} (expected ${EXPECTED_STORE_METADATA_COUNT})`
  );

  // Test 5: All standard store locales present
  if (metadataFiles.length > 0) {
    const missingLocales = STANDARD_STORE_LOCALES.filter(
      (locale) => !metadataFiles.includes(locale)
    );
    const extraLocales = metadataFiles.filter((locale) => !STANDARD_STORE_LOCALES.includes(locale));

    const hasAllLocales = missingLocales.length === 0 && extraLocales.length === 0;
    assert(hasAllLocales, `Has all standard store locales`);
    if (missingLocales.length > 0) {
      warn(`Missing: ${missingLocales.join(", ")}`);
    }
    if (extraLocales.length > 0) {
      warn(`Extra: ${extraLocales.join(", ")}`);
    }
  }

  // Test 6: index.ts exists (only for standard path apps)
  if (usesStdPath && !hasAlternatePath) {
    const indexPath = path.join(appDir, STANDARD_TRANSLATION_PATH, "index.ts");
    assert(pathExists(indexPath), `Has translations/index.ts`);
  }
}

// Summary
console.log("\n================================");
console.log(`\nTests: ${passed}/${passed + failed} passed`);
if (failed > 0) {
  console.log(`${RED}${failed} tests failed${RESET}\n`);

  // Print summary of issues
  console.log("Summary of Issues:");
  console.log("------------------");

  for (const app of ACTIVE_APPS) {
    const appDir = getAppDir(app);
    const issues = [];

    const { count: tc, path: tp } = getTranslationCount(appDir);
    if (tc !== EXPECTED_TRANSLATION_COUNT) {
      issues.push(`translations: ${tc}/${EXPECTED_TRANSLATION_COUNT}`);
    }
    if (tp !== STANDARD_TRANSLATION_PATH) {
      issues.push(`path: ${tp || "none"}`);
    }

    const mc = getStoreMetadataFiles(appDir).length;
    if (mc !== EXPECTED_STORE_METADATA_COUNT) {
      issues.push(`store metadata: ${mc}/${EXPECTED_STORE_METADATA_COUNT}`);
    }

    if (issues.length > 0) {
      console.log(`  ${app}: ${issues.join(", ")}`);
    }
  }

  process.exit(1);
} else {
  console.log(`${GREEN}All localization consistency tests passed!${RESET}\n`);
  process.exit(0);
}
