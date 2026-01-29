/**
 * Validation utilities for localization
 */

const { VALIDATION_RULES } = require("./constants");

class ValidationError extends Error {
  constructor(locale, field, message) {
    super(`[${locale}] ${field}: ${message}`);
    this.locale = locale;
    this.field = field;
  }
}

/**
 * Validate a single locale metadata object
 * @param {string} locale - Locale code (e.g., 'en-US')
 * @param {Object} data - Locale metadata object
 * @returns {ValidationError[]} Array of validation errors
 */
function validateLocaleMetadata(locale, data) {
  const errors = [];

  // Validate required fields
  for (const [field, rules] of Object.entries(VALIDATION_RULES)) {
    if (rules.required && !data[field]) {
      errors.push(new ValidationError(locale, field, "Field is required"));
      continue;
    }

    const value = data[field];
    if (!value) continue;

    // Validate string length
    if (typeof value === "string" && rules.maxLength) {
      if (value.length > rules.maxLength) {
        errors.push(
          new ValidationError(
            locale,
            field,
            `Exceeds maximum length of ${rules.maxLength} (current: ${value.length})`
          )
        );
      }
    }

    // Validate keywords array
    if (field === "keywords" && Array.isArray(value)) {
      // Check if it's an array
      if (rules.minItems && value.length < rules.minItems) {
        errors.push(
          new ValidationError(locale, field, `Must have at least ${rules.minItems} items`)
        );
      }
      if (rules.maxItems && value.length > rules.maxItems) {
        errors.push(
          new ValidationError(locale, field, `Must have at most ${rules.maxItems} items`)
        );
      }

      // Apple Store Connect specific validation:
      // Keywords are comma-separated with 100 character total limit
      const keywordsString = value.join(",");
      if (keywordsString.length > rules.maxLength) {
        errors.push(
          new ValidationError(
            locale,
            field,
            `Comma-separated keywords exceed ${rules.maxLength} characters (current: ${keywordsString.length})`
          )
        );
      }
    } else if (field === "keywords" && !Array.isArray(value)) {
      errors.push(new ValidationError(locale, field, "Must be an array"));
    }
  }

  return errors;
}

/**
 * Validate character limit for a string
 * @param {string} text - Text to validate
 * @param {number} limit - Maximum allowed length
 * @returns {boolean} True if within limit
 */
function validateCharacterLimit(text, limit) {
  return text.length <= limit;
}

/**
 * Validate URL format
 * @param {string} url - URL to validate
 * @returns {boolean} True if valid URL
 */
function validateUrl(url) {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

module.exports = {
  ValidationError,
  validateLocaleMetadata,
  validateCharacterLimit,
  validateUrl,
};
