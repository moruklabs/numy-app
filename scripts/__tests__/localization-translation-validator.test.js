/**
 * Localization Translation Validator
 *
 * Validates that translations are not just English copies (mocks).
 * Checks both in-app translations and store metadata.
 *
 * Run: node localization-translation-validator.test.js
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

// Standard 32 in-app translation languages (non-English)
const NON_ENGLISH_LANGUAGES = [
  "ar",
  "ca",
  "cs",
  "da",
  "de",
  "el",
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

// Standard 39 store metadata locales (non-English US)
const NON_ENGLISH_STORE_LOCALES = [
  "ar-SA",
  "ca",
  "cs",
  "da",
  "de-DE",
  "el",
  "en-AU",
  "en-CA",
  "en-GB",
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

// Apps with alternate translation patterns
const ALTERNATE_TRANSLATION_PATHS = {
  numy: "src/locales", // Uses i18next with directory-per-language pattern
};

// Get the monorepo root
const MONOREPO_ROOT = __dirname;

// ANSI color codes
const RED = "\x1b[31m";
const GREEN = "\x1b[32m";
const YELLOW = "\x1b[33m";
const RESET = "\x1b[0m";

// Counters
let passed = 0;
let failed = 0;
let mockTranslations = [];

// Helper to get app directory
const getAppDir = (app) => path.join(MONOREPO_ROOT, "apps", app);

// Helper to check if path exists
const pathExists = (p) => fs.existsSync(p);

// Helper to read JSON file
const readJSON = (filePath) => {
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch (error) {
    return null;
  }
};

// Helper to read TypeScript translation file (basic parsing)
const readTSTranslation = (filePath) => {
  try {
    let content = fs.readFileSync(filePath, "utf8");
    // Remove comments first
    content = content.replace(/\/\/.*$/gm, ""); // Single-line comments
    content = content.replace(/\/\*[\s\S]*?\*\//g, ""); // Multi-line comments
    // Extract string values using regex (simplified)
    const strings = [];
    const regex = /["']([^"']+)["']/g;
    let match;
    while ((match = regex.exec(content)) !== null) {
      strings.push(match[1]);
    }
    return strings.join(" ");
  } catch (error) {
    return null;
  }
};

// Helper to extract all text from nested JSON
const extractTextFromJSON = (obj, texts = []) => {
  if (typeof obj === "string") {
    texts.push(obj);
  } else if (Array.isArray(obj)) {
    obj.forEach((item) => extractTextFromJSON(item, texts));
  } else if (typeof obj === "object" && obj !== null) {
    Object.values(obj).forEach((value) => extractTextFromJSON(value, texts));
  }
  return texts;
};

// Check if translation is a mock (English copy)
// Compares similarity to English source - if >80% similar, likely a mock
const isMockTranslation = (translatedText, englishText, language) => {
  if (!translatedText || translatedText.trim().length === 0) return true;
  if (!englishText || englishText.trim().length === 0) return false;

  // If texts are identical, it's definitely a mock
  if (translatedText === englishText) return true;

  // Calculate simple similarity: count matching characters
  const minLength = Math.min(translatedText.length, englishText.length);
  const maxLength = Math.max(translatedText.length, englishText.length);

  let matchingChars = 0;
  for (let i = 0; i < minLength; i++) {
    if (translatedText[i] === englishText[i]) {
      matchingChars++;
    }
  }

  const similarity = matchingChars / maxLength;

  // If more than 80% similar character-by-character, likely a mock
  return similarity > 0.8;
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
console.log("\nLocalization Translation Validator");
console.log("==================================\n");

// Test each app
for (const app of ACTIVE_APPS) {
  console.log(`\n${app}/`);
  const appDir = getAppDir(app);

  const usesAlternatePath = ALTERNATE_TRANSLATION_PATHS.hasOwnProperty(app);
  const translationPath = usesAlternatePath ? ALTERNATE_TRANSLATION_PATHS[app] : "src/translations";

  // Test 1: Check in-app translations for mocks
  if (usesAlternatePath && app === "numy") {
    // i18next pattern: src/locales/{lang}/
    const localesDir = path.join(appDir, translationPath);

    for (const lang of NON_ENGLISH_LANGUAGES) {
      const langDir = path.join(localesDir, lang);
      const enDir = path.join(localesDir, "en");

      if (!pathExists(langDir)) continue;

      const files = fs.readdirSync(langDir).filter((f) => f.endsWith(".json"));
      let isMock = false;

      for (const file of files) {
        const langFile = path.join(langDir, file);
        const enFile = path.join(enDir, file);

        if (!pathExists(enFile)) continue;

        const langData = readJSON(langFile);
        const enData = readJSON(enFile);

        if (!langData || !enData) continue;

        const langText = extractTextFromJSON(langData).join(" ");
        const enText = extractTextFromJSON(enData).join(" ");

        // Check if identical or mock
        if (isMockTranslation(langText, enText, lang)) {
          isMock = true;
          break;
        }
      }

      if (isMock) {
        assert(false, `${lang}: Contains actual translations (not English copy)`);
        mockTranslations.push({ app, type: "in-app", lang, path: translationPath });
      } else {
        assert(true, `${lang}: Contains actual translations (not English copy)`);
      }
    }
  } else {
    // Standard pattern: src/translations/{lang}.ts
    const translationsDir = path.join(appDir, translationPath);

    if (pathExists(translationsDir)) {
      const enFile = path.join(translationsDir, "en.ts");
      const enContent = readTSTranslation(enFile);

      for (const lang of NON_ENGLISH_LANGUAGES) {
        const langFile = path.join(translationsDir, `${lang}.ts`);

        if (!pathExists(langFile)) continue;

        const langContent = readTSTranslation(langFile);

        if (!langContent) continue;

        // Check if identical or mock
        if (isMockTranslation(langContent, enContent, lang)) {
          assert(false, `${lang}: Contains actual translations (not English copy)`);
          mockTranslations.push({
            app,
            type: "in-app",
            lang,
            path: `${translationPath}/${lang}.ts`,
          });
        } else {
          assert(true, `${lang}: Contains actual translations (not English copy)`);
        }
      }
    }
  }

  // Test 2: Check store metadata for mocks
  const metadataDir = path.join(appDir, "store-metadata/locales");

  if (pathExists(metadataDir)) {
    const enUSFile = path.join(metadataDir, "en-US.json");
    const enUSData = readJSON(enUSFile);

    if (enUSData) {
      const enUSText = extractTextFromJSON(enUSData).join(" ");

      for (const locale of NON_ENGLISH_STORE_LOCALES) {
        const localeFile = path.join(metadataDir, `${locale}.json`);

        if (!pathExists(localeFile)) continue;

        const localeData = readJSON(localeFile);

        if (!localeData) continue;

        const localeText = extractTextFromJSON(localeData).join(" ");

        // For English variants (en-AU, en-CA, en-GB), they should be similar to en-US
        // For other languages, they should be different
        const isEnglishVariant = locale.startsWith("en-");

        if (isEnglishVariant) {
          // English variants can be similar or identical to en-US
          assert(true, `${locale}: Store metadata (English variant, similar to en-US is OK)`);
        } else {
          // Non-English should be translated
          const baseLang = locale.split("-")[0];

          if (isMockTranslation(localeText, enUSText, baseLang)) {
            assert(false, `${locale}: Store metadata contains actual translations`);
            mockTranslations.push({
              app,
              type: "store-metadata",
              lang: locale,
              path: `store-metadata/locales/${locale}.json`,
            });
          } else {
            assert(true, `${locale}: Store metadata contains actual translations`);
          }
        }
      }
    }
  }
}

// Summary
console.log("\n==================================");
console.log(`\nTests: ${passed}/${passed + failed} passed`);

if (failed > 0) {
  console.log(`${RED}${failed} tests failed${RESET}\n`);

  console.log("Mock Translations Found:");
  console.log("------------------------");

  // Group by app
  const byApp = {};
  mockTranslations.forEach(({ app, type, lang }) => {
    if (!byApp[app]) byApp[app] = { "in-app": [], "store-metadata": [] };
    byApp[app][type].push(lang);
  });

  for (const app of Object.keys(byApp).sort()) {
    console.log(`\n${app}:`);
    if (byApp[app]["in-app"].length > 0) {
      console.log(`  In-app (${byApp[app]["in-app"].length}): ${byApp[app]["in-app"].join(", ")}`);
    }
    if (byApp[app]["store-metadata"].length > 0) {
      console.log(
        `  Store metadata (${byApp[app]["store-metadata"].length}): ${byApp[app]["store-metadata"].join(", ")}`
      );
    }
  }

  console.log(`\n${YELLOW}Total mock translations to fix: ${mockTranslations.length}${RESET}\n`);

  process.exit(1);
} else {
  console.log(`${GREEN}All translations are properly translated (not English copies)!${RESET}\n`);
  process.exit(0);
}
