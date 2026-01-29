/**
 * Shared constants for localization scripts
 */

module.exports = {
  /**
   * Supported locales for store metadata (App Store / Play Store)
   * Total: 39 locales
   */
  SUPPORTED_STORE_LOCALES: [
    "en-US", // English (United States)
    "ar-SA", // Arabic (Saudi Arabia)
    "ca", // Catalan
    "cs", // Czech
    "da", // Danish
    "de-DE", // German (Germany)
    "el", // Greek
    "en-AU", // English (Australia)
    "en-CA", // English (Canada)
    "en-GB", // English (United Kingdom)
    "es-ES", // Spanish (Spain)
    "es-MX", // Spanish (Mexico)
    "fi", // Finnish
    "fr-CA", // French (Canada)
    "fr-FR", // French (France)
    "he", // Hebrew
    "hi", // Hindi
    "hr", // Croatian
    "hu", // Hungarian
    "id", // Indonesian
    "it", // Italian
    "ja", // Japanese
    "ko", // Korean
    "ms", // Malay
    "nl-NL", // Dutch (Netherlands)
    "no", // Norwegian
    "pl", // Polish
    "pt-BR", // Portuguese (Brazil)
    "pt-PT", // Portuguese (Portugal)
    "ro", // Romanian
    "ru", // Russian
    "sk", // Slovak
    "sv", // Swedish
    "th", // Thai
    "tr", // Turkish
    "uk", // Ukrainian
    "vi", // Vietnamese
    "zh-Hans", // Chinese (Simplified)
    "zh-Hant", // Chinese (Traditional)
  ],

  /**
   * Supported locales for in-app translations
   * Total: 32 locales
   */
  APP_TRANSLATION_LOCALES: [
    "en",
    "es",
    "de",
    "fr",
    "it",
    "pt",
    "ru",
    "ja",
    "ko",
    "zh",
    "ar",
    "hi",
    "nl",
    "sv",
    "no",
    "da",
    "fi",
    "pl",
    "cs",
    "sk",
    "hu",
    "ro",
    "el",
    "tr",
    "he",
    "th",
    "vi",
    "id",
    "ms",
    "ca",
    "hr",
    "uk",
  ],

  /**
   * Validation rules for store metadata fields
   */
  VALIDATION_RULES: {
    title: {
      maxLength: 30,
      required: true,
    },
    subtitle: {
      maxLength: 30,
      required: true,
    },
    description: {
      maxLength: 4000,
      required: true,
    },
    keywords: {
      maxLength: 100, // Total comma-separated length
      required: true,
    },
    promotionalText: {
      maxLength: 170,
      required: false,
    },
    whatsNew: {
      maxLength: 4000,
      required: false,
    },
  },
};
