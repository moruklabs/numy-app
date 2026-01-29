#!/usr/bin/env node

/**
 * Translate minday app translations and store metadata to all locales
 * Uses Gemini API for high-quality translations
 */

const fs = require("fs");
const path = require("path");
const { APP_TRANSLATION_LOCALES, SUPPORTED_STORE_LOCALES } = require("./lib/constants");

const MINDAY_APP = path.join(__dirname, "../../apps/minday");
const TRANSLATIONS_DIR = path.join(MINDAY_APP, "src/translations");
const STORE_METADATA_DIR = path.join(MINDAY_APP, "store-metadata/locales");

// Locale mapping from app locale codes to language names
const LOCALE_TO_LANGUAGE = {
  ar: "Arabic",
  ca: "Catalan",
  cs: "Czech",
  da: "Danish",
  de: "German",
  el: "Greek",
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
  zh: "Chinese (Simplified)",
};

// Store metadata locale mapping
const STORE_LOCALE_TO_LANGUAGE = {
  "ar-SA": "Arabic (Saudi Arabia)",
  ca: "Catalan",
  cs: "Czech",
  da: "Danish",
  "de-DE": "German",
  el: "Greek",
  "en-AU": "English (Australia)",
  "en-CA": "English (Canada)",
  "en-GB": "English (UK)",
  "en-US": "English (US)",
  "es-ES": "Spanish (Spain)",
  "es-MX": "Spanish (Mexico)",
  fi: "Finnish",
  "fr-CA": "French (Canada)",
  "fr-FR": "French",
  he: "Hebrew",
  hi: "Hindi",
  hr: "Croatian",
  hu: "Hungarian",
  id: "Indonesian",
  it: "Italian",
  ja: "Japanese",
  ko: "Korean",
  ms: "Malay",
  "nl-NL": "Dutch",
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
  "zh-Hans": "Chinese (Simplified)",
  "zh-Hant": "Chinese (Traditional)",
};

// Gemini API client
const GEMINI_API_URL = "https://gemini-api.moruk.workers.dev/api/v1/generate";

async function callGeminiAPI(prompt) {
  return new Promise((resolve, reject) => {
    const https = require("https");
    const url = new URL(GEMINI_API_URL);

    const postData = JSON.stringify({
      contents: [
        {
          parts: [
            {
              text: prompt,
            },
          ],
        },
      ],
    });

    const options = {
      hostname: url.hostname,
      path: url.pathname,
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
          if (res.statusCode !== 200) {
            console.error(`Gemini API error: ${res.statusCode} ${res.statusMessage}`);
            resolve(null);
            return;
          }

          const parsed = JSON.parse(data);
          const text = parsed.candidates?.[0]?.content?.parts?.[0]?.text || "";
          resolve(text);
        } catch (error) {
          console.error("Error parsing Gemini response:", error.message);
          resolve(null);
        }
      });
    });

    req.on("error", (error) => {
      console.error("Error calling Gemini API:", error.message);
      resolve(null);
    });

    req.write(postData);
    req.end();
  });
}

async function translateAppTranslation(locale, language, englishContent) {
  console.log(`\n📝 Translating app translations to ${language} (${locale})...`);

  const prompt = `You are a professional translator specializing in mobile app localization for meditation and mindfulness apps.

Translate the following TypeScript translation object from English to ${language}.

IMPORTANT INSTRUCTIONS:
1. Translate ALL string values to ${language}
2. Keep the exact same structure, keys, and code format
3. Do NOT translate: keys, "export default", curly braces, commas, or TypeScript syntax
4. Maintain cultural appropriateness for ${language} speakers
5. Keep translations concise and natural for UI elements
6. For meditation/mindfulness terms, use culturally appropriate equivalents
7. Return ONLY the complete TypeScript code, no explanations

English source code:
\`\`\`typescript
${englishContent}
\`\`\`

Translated ${language} code (return only the code):`;

  const translated = await callGeminiAPI(prompt);
  if (!translated) {
    console.error(`❌ Failed to translate app translations for ${locale}`);
    return null;
  }

  // Clean up the response - extract code block if wrapped
  let code = translated.trim();
  if (code.startsWith("```typescript") || code.startsWith("```ts")) {
    code = code
      .replace(/```(?:typescript|ts)\n?/, "")
      .replace(/```\s*$/, "")
      .trim();
  } else if (code.startsWith("```")) {
    code = code
      .replace(/```\n?/, "")
      .replace(/```\s*$/, "")
      .trim();
  }

  return code;
}

async function translateStoreMetadata(locale, language, englishContent) {
  console.log(`\n📝 Translating store metadata to ${language} (${locale})...`);

  const englishData = JSON.parse(englishContent);

  const prompt = `You are a professional App Store Optimization (ASO) specialist and translator.

Translate the following iOS App Store metadata from English to ${language}.

IMPORTANT INSTRUCTIONS:
1. Translate title, subtitle, description, and keywords to ${language}
2. Keep URLs unchanged (marketingUrl, supportUrl, privacyPolicyUrl)
3. For title: Keep concise (max 30 characters)
4. For subtitle: Keep concise (max 30 characters)
5. For description: Maintain persuasive marketing tone in ${language}
6. For keywords: Translate to relevant ${language} search terms (comma-separated)
7. Maintain meditation/mindfulness terminology appropriate for ${language} culture
8. Return ONLY valid JSON, no explanations

English metadata:
\`\`\`json
${JSON.stringify(englishData, null, 2)}
\`\`\`

Translated ${language} metadata (return only valid JSON):`;

  const translated = await callGeminiAPI(prompt);
  if (!translated) {
    console.error(`❌ Failed to translate store metadata for ${locale}`);
    return null;
  }

  // Clean up the response - extract JSON if wrapped
  let json = translated.trim();
  if (json.startsWith("```json")) {
    json = json
      .replace(/```json\n?/, "")
      .replace(/```\s*$/, "")
      .trim();
  } else if (json.startsWith("```")) {
    json = json
      .replace(/```\n?/, "")
      .replace(/```\s*$/, "")
      .trim();
  }

  // Validate JSON
  try {
    const parsed = JSON.parse(json);
    // Ensure URLs are preserved from original
    parsed.marketingUrl = englishData.marketingUrl;
    parsed.supportUrl = englishData.supportUrl;
    parsed.privacyPolicyUrl = englishData.privacyPolicyUrl;
    return JSON.stringify(parsed, null, 2);
  } catch (error) {
    console.error(`❌ Invalid JSON for ${locale}:`, error.message);
    return null;
  }
}

async function translateAllAppTranslations() {
  console.log("🌍 Starting app translations...\n");

  // Read English reference
  const enPath = path.join(TRANSLATIONS_DIR, "en.ts");
  const englishContent = fs.readFileSync(enPath, "utf-8");

  let successCount = 0;
  let failCount = 0;

  for (const locale of APP_TRANSLATION_LOCALES) {
    if (locale === "en") continue; // Skip English

    const language = LOCALE_TO_LANGUAGE[locale];
    if (!language) {
      console.warn(`⚠️  Unknown language for locale: ${locale}`);
      continue;
    }

    const translated = await translateAppTranslation(locale, language, englishContent);
    if (translated) {
      const filePath = path.join(TRANSLATIONS_DIR, `${locale}.ts`);
      fs.writeFileSync(filePath, translated, "utf-8");
      console.log(`✅ Saved translation for ${locale}`);
      successCount++;
    } else {
      failCount++;
    }

    // Add delay to avoid rate limiting
    await new Promise((resolve) => setTimeout(resolve, 2000));
  }

  console.log(`\n✅ App translations complete: ${successCount} succeeded, ${failCount} failed\n`);
}

async function translateAllStoreMetadata() {
  console.log("🌍 Starting store metadata translations...\n");

  // Read English reference
  const enPath = path.join(STORE_METADATA_DIR, "en-US.json");
  const englishContent = fs.readFileSync(enPath, "utf-8");

  let successCount = 0;
  let failCount = 0;

  for (const locale of SUPPORTED_STORE_LOCALES) {
    if (locale === "en-US") continue; // Skip English

    const language = STORE_LOCALE_TO_LANGUAGE[locale];
    if (!language) {
      console.warn(`⚠️  Unknown language for locale: ${locale}`);
      continue;
    }

    const translated = await translateStoreMetadata(locale, language, englishContent);
    if (translated) {
      const filePath = path.join(STORE_METADATA_DIR, `${locale}.json`);
      fs.writeFileSync(filePath, translated, "utf-8");
      console.log(`✅ Saved metadata for ${locale}`);
      successCount++;
    } else {
      failCount++;
    }

    // Add delay to avoid rate limiting
    await new Promise((resolve) => setTimeout(resolve, 2000));
  }

  console.log(
    `\n✅ Store metadata translations complete: ${successCount} succeeded, ${failCount} failed\n`
  );
}

async function main() {
  console.log("🚀 Minday Translation Service\n");
  console.log("This will translate all minday app translations and store metadata.");
  console.log("Using Gemini API for high-quality translations.\n");

  const args = process.argv.slice(2);
  const mode = args[0] || "all";

  if (mode === "app" || mode === "all") {
    await translateAllAppTranslations();
  }

  if (mode === "store" || mode === "all") {
    await translateAllStoreMetadata();
  }

  console.log("🎉 Translation complete!\n");
}

// Only run if called directly
if (require.main === module) {
  main().catch(console.error);
}

module.exports = {
  translateAppTranslation,
  translateStoreMetadata,
};
