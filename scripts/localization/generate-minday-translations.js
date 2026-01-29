#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

const MINDAY_TRANSLATIONS_DIR = path.join(
  __dirname,
  "..",
  "..",
  "apps",
  "minday",
  "src",
  "translations"
);
const ENGLISH_FILE = path.join(MINDAY_TRANSLATIONS_DIR, "en.ts");

// 32 app translation locales (excluding "en" which already exists)
const LOCALES = [
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

console.log("🚀 Generating minday translation files...\n");

// Read the English template
const englishContent = fs.readFileSync(ENGLISH_FILE, "utf-8");

// Generate translation file for each locale
LOCALES.forEach((locale) => {
  const outputPath = path.join(MINDAY_TRANSLATIONS_DIR, `${locale}.ts`);

  // Create a copy with TODO comments
  const localeContent = englishContent.replace(
    /export default/,
    `// TODO: Translate all strings to ${locale.toUpperCase()}\nexport default`
  );

  fs.writeFileSync(outputPath, localeContent, "utf-8");
  console.log(`✅ Created ${locale}.ts`);
});

console.log(`\n✨ Successfully created ${LOCALES.length} translation files!`);
console.log(`📁 Location: ${MINDAY_TRANSLATIONS_DIR}`);
console.log(`\n💡 Next steps:`);
console.log(`   1. Translate the strings in each file`);
console.log(`   2. Remove the TODO comments after translation`);
console.log(`   3. Run: node scripts/localization/validate-app-translations.js minday`);
