#!/usr/bin/env node
/**
 * Localization Translation Script with Ollama Fallback
 *
 * Uses Ollama (gpt-oss:20b) as a fallback when Gemini API hits rate limits.
 * Faster translation with no rate limit concerns.
 *
 * Usage:
 *   node translate-with-ollama.js [app-name] [language]
 *   node translate-with-ollama.js --all
 */

const fs = require("fs");
const path = require("path");
const { exec } = require("child_process");
const util = require("util");

const execPromise = util.promisify(exec);

// Language names for better translation context
const LANGUAGE_NAMES = {
  ar: "Arabic",
  ca: "Catalan",
  cs: "Czech",
  da: "Danish",
  de: "German",
  el: "Greek",
  en: "English",
  es: "Spanish",
  fi: "Finnish",
  fr: "French",
  he: "Hebrew",
  hi: "Hindi",
  hr: "Croatian",
  hu: "Hungarian",
  id: "Indonesian",
  it: "Italian",
  ja: "Japanese",
  ko: "Korean",
  ms: "Malay",
  nl: "Dutch",
  no: "Norwegian",
  pl: "Polish",
  pt: "Portuguese",
  ro: "Romanian",
  ru: "Russian",
  sk: "Slovak",
  sv: "Swedish",
  th: "Thai",
  tr: "Turkish",
  uk: "Ukrainian",
  vi: "Vietnamese",
  zh: "Chinese Simplified",
};

const MONOREPO_ROOT = __dirname;

// Mock translations from validation test
const MOCK_TRANSLATIONS = {
  numy: {
    "in-app": [
      "ar",
      "ca",
      "cs",
      "da",
      "el",
      "fi",
      "he",
      "hi",
      "hr",
      "hu",
      "id",
      "ms",
      "nl",
      "no",
      "pl",
      "ro",
      "ru",
      "sk",
      "sv",
      "th",
      "tr",
      "uk",
      "vi",
    ],
  },
  "plant-doctor": {
    "in-app": [
      "ar",
      "ca",
      "cs",
      "da",
      "el",
      "fi",
      "he",
      "hi",
      "hr",
      "hu",
      "id",
      "ms",
      "nl",
      "no",
      "pl",
      "ro",
      "sk",
      "sv",
      "th",
      "uk",
      "vi",
    ],
  },
  rizzman: {
    "in-app": [
      "ar",
      "ca",
      "cs",
      "da",
      "el",
      "fi",
      "he",
      "hi",
      "hr",
      "hu",
      "id",
      "it",
      "ja",
      "ko",
      "ro",
      "ru",
      "sk",
      "sv",
      "th",
      "uk",
      "vi",
      "zh",
    ],
  },
};

// Helper to call Ollama
async function callOllama(prompt) {
  try {
    const { stdout } = await execPromise(`ollama run gpt-oss:20b "${prompt.replace(/"/g, '\\"')}"`);
    return stdout.trim();
  } catch (error) {
    throw new Error(`Ollama error: ${error.message}`);
  }
}

// Translate TypeScript translation file
async function translateTSFile(appDir, lang) {
  const enFile = path.join(appDir, "src/translations/en.ts");
  const langFile = path.join(appDir, "src/translations", `${lang}.ts`);

  if (!fs.existsSync(enFile)) {
    console.log(`  ❌ English file not found: ${enFile}`);
    return false;
  }

  console.log(`  📖 Reading English source...`);
  const enContent = fs.readFileSync(enFile, "utf8");

  // Extract all text content
  const textContent = enContent.replace(/export default \{/, "").replace(/\};?\s*$/, "");

  const languageName = LANGUAGE_NAMES[lang] || lang;
  console.log(`  🌐 Translating to ${languageName} using Ollama...`);

  const prompt = `You are a professional translator. Translate the following React Native app strings from English to ${languageName}.

CRITICAL RULES:
1. Preserve the EXACT structure and formatting
2. Keep all variable placeholders like {{count}}, {{current}}, {{max}}, {{appName}} UNCHANGED
3. Do NOT translate technical terms: "AI", technical error codes
4. Maintain line breaks (\\n) in their original positions
5. Keep quotes as double quotes
6. Preserve commas and semicolons
7. Return ONLY the translated content, no explanations

Source (English):
\`\`\`typescript
export default {
${textContent}
};
\`\`\`

Translate to ${languageName} maintaining the EXACT same structure:`;

  try {
    const translated = await callOllama(prompt);

    // Clean up response
    let cleanedTranslation = translated
      .replace(/```typescript\s*/g, "")
      .replace(/```\s*/g, "")
      .trim();

    // Ensure it starts with export default
    if (!cleanedTranslation.startsWith("export default")) {
      cleanedTranslation = `export default ${cleanedTranslation}`;
    }

    // Ensure it ends with semicolon
    if (!cleanedTranslation.endsWith(";")) {
      cleanedTranslation += ";";
    }

    // Add newline at end
    cleanedTranslation += "\n";

    console.log(`  💾 Writing translation to ${path.basename(langFile)}...`);
    fs.writeFileSync(langFile, cleanedTranslation, "utf8");

    console.log(`  ✅ Successfully translated to ${languageName}\n`);
    return true;
  } catch (error) {
    console.log(`  ❌ Translation failed: ${error.message}\n`);
    return false;
  }
}

// Translate JSON file for i18next pattern
async function translateJSONFile(appDir, lang, namespace) {
  const enFile = path.join(appDir, "src/locales/en", `${namespace}.json`);
  const langDir = path.join(appDir, "src/locales", lang);
  const langFile = path.join(langDir, `${namespace}.json`);

  if (!fs.existsSync(enFile)) {
    console.log(`  ❌ English file not found: ${enFile}`);
    return false;
  }

  console.log(`  📖 Reading ${namespace}.json (English)...`);
  const enContent = fs.readFileSync(enFile, "utf8");
  const enData = JSON.parse(enContent);

  const languageName = LANGUAGE_NAMES[lang] || lang;
  console.log(`  🌐 Translating ${namespace}.json to ${languageName} using Ollama...`);

  const prompt = `You are a professional translator. Translate the following JSON strings from English to ${languageName}.

CRITICAL RULES:
1. Preserve the EXACT JSON structure
2. Keep all object keys in English
3. Translate ONLY the values
4. Keep variable placeholders like {{count}}, {{value}} UNCHANGED
5. Do NOT translate technical terms: "AI"
6. Return ONLY valid JSON, no explanations

Source (English):
\`\`\`json
${enContent}
\`\`\`

Translate to ${languageName}:`;

  try {
    const translated = await callOllama(prompt);

    // Extract JSON from response
    let cleanedJSON = translated
      .replace(/```json\s*/g, "")
      .replace(/```\s*/g, "")
      .trim();

    // Validate JSON
    const translatedData = JSON.parse(cleanedJSON);

    console.log(`  💾 Writing translation to ${namespace}.json...`);
    fs.writeFileSync(langFile, JSON.stringify(translatedData, null, 2) + "\n", "utf8");

    console.log(`  ✅ Successfully translated ${namespace}.json to ${languageName}`);
    return true;
  } catch (error) {
    console.log(`  ❌ Translation failed for ${namespace}.json: ${error.message}`);
    return false;
  }
}

// Translate i18next app (numy)
async function translateI18NextApp(appDir, lang) {
  const namespaces = ["common", "calculator", "settings", "history", "tabs", "errors"];

  console.log(`\n📦 Translating numy/${lang} (i18next pattern)`);

  let allSuccess = true;
  for (const namespace of namespaces) {
    const success = await translateJSONFile(appDir, lang, namespace);
    if (!success) allSuccess = false;
  }

  return allSuccess;
}

// Translate standard app (TypeScript pattern)
async function translateStandardApp(app, lang) {
  const appDir = path.join(MONOREPO_ROOT, "apps", app);

  console.log(`\n📦 Translating ${app}/${lang}`);
  return await translateTSFile(appDir, lang);
}

// Main execution
async function main() {
  const args = process.argv.slice(2);

  console.log("\n🦙 Ollama Localization Translation");
  console.log("===================================\n");

  // Check if ollama is available
  try {
    await execPromise("which ollama");
  } catch (error) {
    console.log("❌ Ollama not found. Please install: https://ollama.ai");
    process.exit(1);
  }

  if (args.includes("--all")) {
    console.log("🔄 Translating all mock translations with Ollama...\n");

    let totalSuccess = 0;
    let totalFailed = 0;

    for (const [app, data] of Object.entries(MOCK_TRANSLATIONS)) {
      if (!data["in-app"] || data["in-app"].length === 0) continue;

      console.log(`\n📱 App: ${app}`);
      console.log(`   Languages: ${data["in-app"].length}`);

      for (const lang of data["in-app"]) {
        let success;

        if (app === "numy") {
          const appDir = path.join(MONOREPO_ROOT, "apps", app);
          success = await translateI18NextApp(appDir, lang);
        } else {
          success = await translateStandardApp(app, lang);
        }

        if (success) {
          totalSuccess++;
        } else {
          totalFailed++;
        }
      }
    }

    console.log("\n===================================");
    console.log(`✅ Successfully translated: ${totalSuccess}`);
    console.log(`❌ Failed: ${totalFailed}`);
    console.log(`📊 Total: ${totalSuccess + totalFailed}`);
  } else if (args.length === 2) {
    const [app, lang] = args;

    let success;
    if (app === "numy") {
      const appDir = path.join(MONOREPO_ROOT, "apps", app);
      success = await translateI18NextApp(appDir, lang);
    } else {
      success = await translateStandardApp(app, lang);
    }

    process.exit(success ? 0 : 1);
  } else {
    console.log("Usage:");
    console.log("  node translate-with-ollama.js <app-name> <language>");
    console.log("  node translate-with-ollama.js plant-doctor ar");
    console.log("  node translate-with-ollama.js --all\n");
    console.log("Mock translations to fix:");
    console.log("--------------------------");

    for (const [app, data] of Object.entries(MOCK_TRANSLATIONS)) {
      if (data["in-app"] && data["in-app"].length > 0) {
        console.log(`  ${app}: ${data["in-app"].length} languages`);
        console.log(`    ${data["in-app"].join(", ")}`);
      }
    }

    process.exit(1);
  }
}

main().catch(console.error);
