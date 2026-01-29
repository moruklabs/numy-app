#!/usr/bin/env node
/**
 * Localization Translation Script
 *
 * Translates mock translations (English copies) to actual translations using Gemini API.
 * Handles both in-app translations (.ts files) and store metadata (.json files).
 *
 * Usage:
 *   node translate-localization.js [app-name] [language]
 *   node translate-localization.js numy ca    # Translate specific app/lang
 *   node translate-localization.js --all                 # Translate all mocks
 */

const fs = require("fs");
const path = require("path");
const https = require("https");

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

// Locale to language mapping for store metadata
const LOCALE_TO_LANGUAGE = {
  "ar-SA": "Arabic (Saudi Arabia)",
  ca: "Catalan",
  cs: "Czech",
  da: "Danish",
  "de-DE": "German (Germany)",
  el: "Greek",
  "es-ES": "Spanish (Spain)",
  "es-MX": "Spanish (Mexico)",
  fi: "Finnish",
  "fr-CA": "French (Canada)",
  "fr-FR": "French (France)",
  he: "Hebrew",
  hi: "Hindi",
  hr: "Croatian",
  hu: "Hungarian",
  id: "Indonesian",
  it: "Italian",
  ja: "Japanese",
  ko: "Korean",
  ms: "Malay",
  "nl-NL": "Dutch (Netherlands)",
  no: "Norwegian",
  pl: "Polish",
  "pt-BR": "Portuguese (Brazil)",
  "pt-PT": "Portuguese (Portugal)",
  ro: "Romanian",
  ru: "Russian",
  sk: "Slovak",
  sv: "Swedish",
  th: "Thai",
  tr: "Turkish",
  uk: "Ukrainian",
  vi: "Vietnamese",
  "zh-Hans": "Chinese Simplified",
  "zh-Hant": "Chinese Traditional",
};

const MONOREPO_ROOT = __dirname;

// Mock translations from validation test
const MOCK_TRANSLATIONS = {
  "numy": { "in-app": ["ca", "fr", "it", "nl", "tr"] },
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
      "uk",
      "vi",
      "zh",
    ],
  },
};

// Gemini API configuration
const GEMINI_API_URL = "https://gemini-api.moruk.workers.dev/api/v1/generate";

// Rate limiting
const BASE_DELAY = 5000; // 5 seconds between requests

// Helper to make API request with retry on rate limit
async function callGeminiAPI(prompt, retryCount = 0) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({
      contents: [
        {
          role: "user",
          parts: [{ text: prompt }],
        },
      ],
      generationConfig: {
        temperature: 0.3, // Lower temperature for more consistent translations
        maxOutputTokens: 8000,
      },
    });

    const options = {
      hostname: "gemini-api.moruk.workers.dev",
      port: 443,
      path: "/api/v1/generate",
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(postData),
      },
    };

    const req = https.request(options, (res) => {
      let data = "";

      res.on("data", (chunk) => {
        data += chunk;
      });

      res.on("end", () => {
        try {
          const response = JSON.parse(data);

          // Check for rate limit error
          if (response.error && response.error.code === "RATE_LIMIT_EXCEEDED") {
            const retryAfter = response.error.retryAfter || 30;
            if (retryCount < 3) {
              console.log(`  ⏳ Rate limited, waiting ${retryAfter} seconds before retry...`);
              setTimeout(
                async () => {
                  try {
                    const result = await callGeminiAPI(prompt, retryCount + 1);
                    resolve(result);
                  } catch (error) {
                    reject(error);
                  }
                },
                (retryAfter + 2) * 1000
              ); // Add 2 extra seconds buffer
            } else {
              reject(new Error(`Rate limit exceeded after ${retryCount} retries`));
            }
            return;
          }

          if (response.candidates && response.candidates[0]?.content?.parts[0]?.text) {
            resolve(response.candidates[0].content.parts[0].text);
          } else {
            reject(new Error(`No text in response. Response: ${JSON.stringify(response)}`));
          }
        } catch (error) {
          reject(error);
        }
      });
    });

    req.on("error", (error) => {
      reject(error);
    });

    req.write(postData);
    req.end();
  });
}

// Rate-limited API call
async function translateWithRateLimit(prompt) {
  // Always wait base delay between requests
  await new Promise((resolve) => setTimeout(resolve, BASE_DELAY));
  return await callGeminiAPI(prompt);
}

// Extract strings from TypeScript translation file
function extractStringsFromTS(content) {
  const strings = [];
  const lines = content.split("\n");

  for (const line of lines) {
    // Match patterns like: key: "value",
    const match = line.match(/^\s*(\w+):\s*"([^"]+)",?\s*$/);
    if (match) {
      strings.push({ key: match[1], value: match[2] });
    }
  }

  return strings;
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
  console.log(`  🌐 Translating to ${languageName}...`);

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
    const translated = await translateWithRateLimit(prompt);

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
  console.log(`  🌐 Translating ${namespace}.json to ${languageName}...`);

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
    const translated = await translateWithRateLimit(prompt);

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

    // Brief pause between files
    await new Promise((resolve) => setTimeout(resolve, 500));
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

  console.log("\n🌍 Localization Translation Script");
  console.log("===================================\n");

  if (args.includes("--all")) {
    console.log("🔄 Translating all mock translations...\n");

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

        // Pause between translations
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }

    console.log("\n===================================");
    console.log(`✅ Successfully translated: ${totalSuccess}`);
    console.log(`❌ Failed: ${totalFailed}`);
    console.log(`📊 Total: ${totalSuccess + totalFailed}`);
  } else if (args.length === 2) {
    const [app, lang] = args;

    if (!MOCK_TRANSLATIONS[app] || !MOCK_TRANSLATIONS[app]["in-app"].includes(lang)) {
      console.log(`⚠️  ${app}/${lang} is not in the mock translations list`);
      console.log(`   Translating anyway...\n`);
    }

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
    console.log("  node translate-localization.js <app-name> <language>");
    console.log("  node translate-localization.js numy ca");
    console.log("  node translate-localization.js --all\n");
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
