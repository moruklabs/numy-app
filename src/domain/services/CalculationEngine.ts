import { create, all, MathJsInstance } from "mathjs";
import Decimal from "decimal.js";
import {
  CalculationResult,
  FormatOptions,
  createNumericResult,
  createCurrencyResult,
  createUnitResult,
  createPercentageResult,
  createDateResult,
  createErrorResult,
} from "../value-objects/CalculationResult";

// Configure decimal.js for precision
Decimal.set({
  precision: 15,
  rounding: Decimal.ROUND_HALF_UP,
});

// Create math.js instance
const math: MathJsInstance = create(all, {
  number: "number",
  precision: 14,
});

// Unit conversion factors (base units)
const LENGTH_UNITS: Record<string, number> = {
  mm: 0.001,
  cm: 0.01,
  m: 1,
  km: 1000,
  in: 0.0254,
  inch: 0.0254,
  inches: 0.0254,
  ft: 0.3048,
  feet: 0.3048,
  foot: 0.3048,
  yd: 0.9144,
  yard: 0.9144,
  yards: 0.9144,
  mi: 1609.344,
  mile: 1609.344,
  miles: 1609.344,
};

const VOLUME_UNITS: Record<string, number> = {
  ml: 0.001,
  l: 1,
  litre: 1,
  litres: 1,
  liter: 1,
  liters: 1,
  tsp: 0.00492892,
  tbsp: 0.0147868,
  cup: 0.236588,
  cups: 0.236588,
  pt: 0.473176,
  pint: 0.473176,
  pints: 0.473176,
  qt: 0.946353,
  quart: 0.946353,
  quarts: 0.946353,
  gal: 3.78541,
  gallon: 3.78541,
  gallons: 3.78541,
  cbm: 1000,
};

const WEIGHT_UNITS: Record<string, number> = {
  mg: 0.000001,
  g: 0.001,
  kg: 1,
  oz: 0.0283495,
  ounce: 0.0283495,
  ounces: 0.0283495,
  lb: 0.453592,
  lbs: 0.453592,
  pound: 0.453592,
  pounds: 0.453592,
  ton: 1000,
  tons: 1000,
};

const TIME_UNITS: Record<string, number> = {
  ms: 0.001,
  sec: 1,
  second: 1,
  seconds: 1,
  min: 60,
  minute: 60,
  minutes: 60,
  hour: 3600,
  hours: 3600,
  day: 86400,
  days: 86400,
  week: 604800,
  weeks: 604800,
};

const DATA_UNITS: Record<string, number> = {
  b: 1,
  byte: 1,
  bytes: 1,
  kb: 1024,
  mb: 1048576,
  gb: 1073741824,
  tb: 1099511627776,
  pb: 1125899906842624,
};

// Currency exchange rates (relative to USD)
// These are approximate rates and should be updated periodically
// Rates as of December 2025
const CURRENCY_RATES: Record<string, number> = {
  // Major currencies
  usd: 1,
  eur: 0.92,
  gbp: 0.79,
  jpy: 149.5,
  cny: 7.24,
  cad: 1.36,
  aud: 1.53,
  chf: 0.88,
  // Asian currencies
  hkd: 7.82,
  sgd: 1.34,
  krw: 1320,
  twd: 31.5,
  inr: 83.5,
  thb: 34.5,
  myr: 4.45,
  php: 55.8,
  idr: 15700,
  vnd: 24500,
  // European currencies
  sek: 10.5,
  nok: 10.8,
  dkk: 6.9,
  pln: 4.0,
  czk: 23.2,
  huf: 365,
  ron: 4.6,
  bgn: 1.8,
  hrk: 6.95,
  // Americas
  mxn: 17.2,
  brl: 4.95,
  ars: 850,
  clp: 880,
  cop: 4000,
  pen: 3.75,
  // Middle East / Africa
  aed: 3.67,
  sar: 3.75,
  ils: 3.65,
  try: 29.5,
  zar: 18.5,
  egp: 31,
  ngn: 800,
  kes: 155,
  // Oceania
  nzd: 1.65,
  fjd: 2.25,
};

// Currency symbols to codes mapping
const CURRENCY_SYMBOLS: Record<string, string> = {
  $: "usd",
  "€": "eur",
  "£": "gbp",
  "¥": "jpy",
  "₹": "inr",
  "₩": "krw",
  "₽": "rub",
  "฿": "thb",
  "₫": "vnd",
  "₱": "php",
  "₪": "ils",
  "₺": "try",
  R$: "brl",
  kr: "sek",
  zł: "pln",
  Kč: "czk",
  Ft: "huf",
  lei: "ron",
  R: "zar",
};

// Temperature conversions (special handling required)
type TempConverter = {
  toKelvin: (v: number) => number;
  fromKelvin: (v: number) => number;
};

const TEMP_UNITS: Record<string, TempConverter> = {
  c: {
    toKelvin: (v) => v + 273.15,
    fromKelvin: (v) => v - 273.15,
  },
  celsius: {
    toKelvin: (v) => v + 273.15,
    fromKelvin: (v) => v - 273.15,
  },
  f: {
    toKelvin: (v) => (v - 32) * (5 / 9) + 273.15,
    fromKelvin: (v) => (v - 273.15) * (9 / 5) + 32,
  },
  fahrenheit: {
    toKelvin: (v) => (v - 32) * (5 / 9) + 273.15,
    fromKelvin: (v) => (v - 273.15) * (9 / 5) + 32,
  },
  k: {
    toKelvin: (v) => v,
    fromKelvin: (v) => v,
  },
  kelvin: {
    toKelvin: (v) => v,
    fromKelvin: (v) => v,
  },
};

const CSS_UNITS: Record<
  string,
  {
    toBase: (v: number, em: number, ppi: number) => number;
    fromBase: (v: number, em: number, ppi: number) => number;
  }
> = {
  px: {
    toBase: (v) => v,
    fromBase: (v) => v,
  },
  em: {
    toBase: (v, em) => v * em,
    fromBase: (v, em) => v / em,
  },
  pt: {
    toBase: (v, _, ppi) => v * (ppi / 72),
    fromBase: (v, _, ppi) => v * (72 / ppi),
  },
};

// Natural language patterns
const NATURAL_LANGUAGE_PATTERNS: { pattern: RegExp; replacement: string }[] = [
  // Basic operations
  { pattern: /\btimes\b/gi, replacement: "*" },
  { pattern: /\bmultiplied\s+by\b/gi, replacement: "*" },
  { pattern: /\bx\b(?!\d)/gi, replacement: "*" },
  { pattern: /\bplus\b/gi, replacement: "+" },
  { pattern: /\band\b/gi, replacement: "+" },
  { pattern: /\bminus\b/gi, replacement: "-" },
  { pattern: /\bdivided\s+by\b/gi, replacement: "/" },
  { pattern: /\bover\b/gi, replacement: "/" },
  { pattern: /\bsquared\b/gi, replacement: "^2" },
  { pattern: /\bcubed\b/gi, replacement: "^3" },
  { pattern: /\bto\s+the\s+power\s+of\b/gi, replacement: "^" },
  { pattern: /\bpow\b/gi, replacement: "^" },
  // Math functions
  { pattern: /\bsquare\s+root\s+of\b/gi, replacement: "sqrt(" },
  { pattern: /\bsqrt\s+of\b/gi, replacement: "sqrt(" },
  { pattern: /\bcube\s+root\s+of\b/gi, replacement: "cbrt(" },
  { pattern: /\babs\s+of\b/gi, replacement: "abs(" },
  { pattern: /\bsin\b/gi, replacement: "sin(" },
  { pattern: /\bcos\b/gi, replacement: "cos(" },
  { pattern: /\btan\b/gi, replacement: "tan(" },
  { pattern: /\basin\b/gi, replacement: "asin(" },
  { pattern: /\bacos\b/gi, replacement: "acos(" },
  { pattern: /\batan\b/gi, replacement: "atan(" },
  { pattern: /\blog\s*(\d+)\s*\(/gi, replacement: "log($1, " },
  { pattern: /\bln\s*\(/gi, replacement: "log(" },
  { pattern: /\bfloor\s*\(/gi, replacement: "floor(" },
  { pattern: /\bceil\s*\(/gi, replacement: "ceil(" },
  { pattern: /\bround\s*\(/gi, replacement: "round(" },
];

interface EvaluationContext {
  variables: Map<string, CalculationResult>;
  emBase: number;
  ppiBase: number;
  decimalPlaces?: number;
}

// Magic date variables - returns days from epoch for calculations
function getMagicDateVariables(): Map<string, number> {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const todayMs = today.getTime();
  const dayMs = 24 * 60 * 60 * 1000;

  const nextWeekDays = Math.floor((todayMs + 7 * dayMs) / dayMs);
  const lastWeekDays = Math.floor((todayMs - 7 * dayMs) / dayMs);
  const nextMonthDays = Math.floor(
    new Date(now.getFullYear(), now.getMonth() + 1, now.getDate()).getTime() / dayMs
  );
  const lastMonthDays = Math.floor(
    new Date(now.getFullYear(), now.getMonth() - 1, now.getDate()).getTime() / dayMs
  );

  return new Map([
    ["today", Math.floor(todayMs / dayMs)],
    ["tomorrow", Math.floor((todayMs + dayMs) / dayMs)],
    ["yesterday", Math.floor((todayMs - dayMs) / dayMs)],
    // Support both "nextweek" and "next week"
    ["nextweek", nextWeekDays],
    ["next week", nextWeekDays],
    ["lastweek", lastWeekDays],
    ["last week", lastWeekDays],
    ["nextmonth", nextMonthDays],
    ["next month", nextMonthDays],
    ["lastmonth", lastMonthDays],
    ["last month", lastMonthDays],
  ]);
}

// Get days until a date variable
function getDaysUntil(targetDays: number): number {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const todayDays = Math.floor(today.getTime() / (24 * 60 * 60 * 1000));
  return targetDays - todayDays;
}

// Month name to number mapping
const MONTH_NAMES: Record<string, number> = {
  january: 0,
  jan: 0,
  february: 1,
  feb: 1,
  march: 2,
  mar: 2,
  april: 3,
  apr: 3,
  may: 4,
  june: 5,
  jun: 5,
  july: 6,
  jul: 6,
  august: 7,
  aug: 7,
  september: 8,
  sep: 8,
  sept: 8,
  october: 9,
  oct: 9,
  november: 10,
  nov: 10,
  december: 11,
  dec: 11,
};

// Parse a date string and return days from epoch
// preferPast: if true, prefer the most recent past occurrence (for "days since")
function parseDateString(dateStr: string, preferPast = false): number | null {
  const now = new Date();
  const currentYear = now.getFullYear();
  const dayMs = 24 * 60 * 60 * 1000;

  // Helper to adjust date based on preference
  const adjustDate = (targetDate: Date, month: number, day: number): Date => {
    if (preferPast) {
      // For "days since", prefer past dates
      if (targetDate > now) {
        return new Date(currentYear - 1, month, day);
      }
    } else {
      // For "days until", prefer future dates
      if (targetDate < now) {
        return new Date(currentYear + 1, month, day);
      }
    }
    return targetDate;
  };

  // Try "19 march" or "19 mar" format
  const dayMonthMatch = dateStr.match(/^(\d{1,2})\s+([a-z]+)$/i);
  if (dayMonthMatch) {
    const day = parseInt(dayMonthMatch[1], 10);
    const monthName = dayMonthMatch[2].toLowerCase();
    const month = MONTH_NAMES[monthName];
    if (month !== undefined && day >= 1 && day <= 31) {
      let targetDate = new Date(currentYear, month, day);
      targetDate = adjustDate(targetDate, month, day);
      return Math.floor(targetDate.getTime() / dayMs);
    }
  }

  // Try "march 19" or "mar 19" format
  const monthDayMatch = dateStr.match(/^([a-z]+)\s+(\d{1,2})$/i);
  if (monthDayMatch) {
    const monthName = monthDayMatch[1].toLowerCase();
    const day = parseInt(monthDayMatch[2], 10);
    const month = MONTH_NAMES[monthName];
    if (month !== undefined && day >= 1 && day <= 31) {
      let targetDate = new Date(currentYear, month, day);
      targetDate = adjustDate(targetDate, month, day);
      return Math.floor(targetDate.getTime() / dayMs);
    }
  }

  // Try "19/3" or "19/03" or "3/19" format (assume day/month for non-US)
  const slashMatch = dateStr.match(/^(\d{1,2})\/(\d{1,2})$/);
  if (slashMatch) {
    const first = parseInt(slashMatch[1], 10);
    const second = parseInt(slashMatch[2], 10);
    // Assume day/month format (European)
    let day = first;
    let month = second - 1;
    // If day > 12, might be month/day (US format)
    if (first > 12 && second <= 12) {
      day = first;
      month = second - 1;
    } else if (second > 12 && first <= 12) {
      day = second;
      month = first - 1;
    }
    if (month >= 0 && month <= 11 && day >= 1 && day <= 31) {
      let targetDate = new Date(currentYear, month, day);
      targetDate = adjustDate(targetDate, month, day);
      return Math.floor(targetDate.getTime() / dayMs);
    }
  }

  return null;
}

export function evaluate(input: string, context: EvaluationContext): CalculationResult {
  const trimmedInput = input.trim();

  if (!trimmedInput) {
    return createErrorResult("");
  }

  // Skip comments (lines starting with // or #)
  if (trimmedInput.startsWith("//") || trimmedInput.startsWith("#")) {
    return createErrorResult("");
  }

  try {
    // Check for variable assignment
    const assignmentMatch = trimmedInput.match(/^(\w+)\s*=\s*(.+)$/i);
    if (assignmentMatch) {
      const [, varName, expression] = assignmentMatch;
      return evaluateAssignment(varName, expression, context);
    }

    // Check for unit conversion: "X unit in target_unit"
    const conversionMatch = trimmedInput.match(/^(.+?)\s+in\s+(\w+)$/i);
    if (conversionMatch) {
      const [, valueExpr, targetUnit] = conversionMatch;
      return evaluateConversion(valueExpr, targetUnit, context);
    }

    // Check for percentage operations
    const percentResult = evaluatePercentage(trimmedInput, context);
    if (percentResult) {
      return percentResult;
    }

    // Standard expression evaluation
    return evaluateExpression(trimmedInput, context);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Calculation error";
    return createErrorResult(message);
  }
}

function evaluateAssignment(
  varName: string,
  expression: string,
  context: EvaluationContext
): CalculationResult {
  const result = evaluateExpression(expression, context);
  // Store variable for future reference (handled by caller)
  return result;
}

function evaluateConversion(
  valueExpr: string,
  targetUnit: string,
  context: EvaluationContext
): CalculationResult {
  const targetLower = targetUnit.toLowerCase();
  const formatOpts: FormatOptions = { decimalPlaces: context.decimalPlaces };

  // Parse value and source unit
  const valueMatch = valueExpr.match(/^([\d.]+)\s*(\w+)?$/);
  if (!valueMatch) {
    // Try evaluating as expression first
    const exprResult = evaluateExpression(valueExpr, context);
    if (exprResult.type === "error") {
      return exprResult;
    }
    return createUnitResult(exprResult.value, targetUnit, formatOpts);
  }

  const [, numStr, sourceUnit] = valueMatch;
  const value = new Decimal(numStr);
  const sourceLower = sourceUnit?.toLowerCase() || "";

  // Length conversion
  if (LENGTH_UNITS[sourceLower] && LENGTH_UNITS[targetLower]) {
    const baseValue = value.times(LENGTH_UNITS[sourceLower]);
    const converted = baseValue.div(LENGTH_UNITS[targetLower]);
    return createUnitResult(converted, getUnitDisplay(targetLower, "length"), formatOpts);
  }

  // Volume conversion
  if (VOLUME_UNITS[sourceLower] && VOLUME_UNITS[targetLower]) {
    const baseValue = value.times(VOLUME_UNITS[sourceLower]);
    const converted = baseValue.div(VOLUME_UNITS[targetLower]);
    return createUnitResult(converted, getUnitDisplay(targetLower, "volume"), formatOpts);
  }

  // Weight conversion
  if (WEIGHT_UNITS[sourceLower] && WEIGHT_UNITS[targetLower]) {
    const baseValue = value.times(WEIGHT_UNITS[sourceLower]);
    const converted = baseValue.div(WEIGHT_UNITS[targetLower]);
    return createUnitResult(converted, getUnitDisplay(targetLower, "weight"), formatOpts);
  }

  // Time conversion
  if (TIME_UNITS[sourceLower] && TIME_UNITS[targetLower]) {
    const baseValue = value.times(TIME_UNITS[sourceLower]);
    const converted = baseValue.div(TIME_UNITS[targetLower]);
    return createUnitResult(converted, getUnitDisplay(targetLower, "time"), formatOpts);
  }

  // Data conversion
  if (DATA_UNITS[sourceLower] && DATA_UNITS[targetLower]) {
    const baseValue = value.times(DATA_UNITS[sourceLower]);
    const converted = baseValue.div(DATA_UNITS[targetLower]);
    return createUnitResult(converted, targetLower.toUpperCase(), formatOpts);
  }

  // CSS units conversion
  if (CSS_UNITS[sourceLower] && CSS_UNITS[targetLower]) {
    const baseValue = CSS_UNITS[sourceLower].toBase(
      value.toNumber(),
      context.emBase,
      context.ppiBase
    );
    const converted = CSS_UNITS[targetLower].fromBase(baseValue, context.emBase, context.ppiBase);
    return createUnitResult(new Decimal(converted), targetLower, formatOpts);
  }

  // Cross-category: physical length to CSS px (using PPI)
  if (LENGTH_UNITS[sourceLower] && targetLower === "px") {
    // Convert source unit to meters, then to inches, then to pixels
    const meters = value.times(LENGTH_UNITS[sourceLower]);
    const inches = meters.div(0.0254); // 0.0254 meters per inch
    const pixels = inches.times(context.ppiBase);
    return createUnitResult(pixels, "px", formatOpts);
  }

  // Cross-category: CSS px to physical length (using PPI)
  if (sourceLower === "px" && LENGTH_UNITS[targetLower]) {
    // Convert pixels to inches, then to meters, then to target unit
    const inches = value.div(context.ppiBase);
    const meters = inches.times(0.0254);
    const converted = meters.div(LENGTH_UNITS[targetLower]);
    return createUnitResult(converted, getUnitDisplay(targetLower, "length"), formatOpts);
  }

  // Temperature conversion
  if (TEMP_UNITS[sourceLower] && TEMP_UNITS[targetLower]) {
    const kelvin = TEMP_UNITS[sourceLower].toKelvin(value.toNumber());
    const converted = TEMP_UNITS[targetLower].fromKelvin(kelvin);
    return createUnitResult(new Decimal(converted), getTempUnitDisplay(targetLower), formatOpts);
  }

  // Currency conversion
  if (CURRENCY_RATES[sourceLower] && CURRENCY_RATES[targetLower]) {
    // Convert source to USD, then to target
    const usdValue = value.div(CURRENCY_RATES[sourceLower]);
    const converted = usdValue.times(CURRENCY_RATES[targetLower]);
    return createCurrencyResult(converted, targetLower.toUpperCase(), formatOpts);
  }

  return createErrorResult(`Cannot convert ${sourceLower || "value"} to ${targetLower}`);
}

function evaluatePercentage(input: string, context: EvaluationContext): CalculationResult | null {
  const formatOpts: FormatOptions = { decimalPlaces: context.decimalPlaces };

  // "X% of what is Y" - reverse percentage (must check BEFORE "X% of Y")
  const reversePercentMatch = input.match(/^([\d.]+)\s*%\s*of\s+what\s+is\s+(.+)$/i);
  if (reversePercentMatch) {
    const [, percentStr, valueExpr] = reversePercentMatch;
    const percent = new Decimal(percentStr);
    const valueResult = evaluateExpression(valueExpr, context);
    if (valueResult.type === "error") return valueResult;
    const result = valueResult.value.div(percent).times(100);
    if (valueResult.unit) {
      return createUnitResult(result, valueResult.unit, formatOpts);
    }
    return createNumericResult(result, formatOpts);
  }

  // "X% of Y" - percentage of value
  const percentOfMatch = input.match(/^([\d.]+)\s*%\s*of\s+(.+)$/i);
  if (percentOfMatch) {
    const [, percentStr, valueExpr] = percentOfMatch;
    const percent = new Decimal(percentStr);
    const valueResult = evaluateExpression(valueExpr, context);
    if (valueResult.type === "error") return valueResult;
    const result = valueResult.value.times(percent).div(100);
    return createNumericResult(result, formatOpts);
  }

  // "X% off Y" - discount
  const percentOffMatch = input.match(/^([\d.]+)\s*%\s*off\s+(.+)$/i);
  if (percentOffMatch) {
    const [, percentStr, valueExpr] = percentOffMatch;
    const percent = new Decimal(percentStr);
    const valueResult = evaluateExpression(valueExpr, context);
    if (valueResult.type === "error") return valueResult;
    const discount = valueResult.value.times(percent).div(100);
    const result = valueResult.value.minus(discount);
    if (valueResult.type === "currency") {
      return createCurrencyResult(result, valueResult.currency || "USD", formatOpts);
    }
    return createNumericResult(result, formatOpts);
  }

  // "X as a % of Y" - what percentage
  const asPercentMatch = input.match(/^(.+?)\s+as\s+a?\s*%\s*of\s+(.+)$/i);
  if (asPercentMatch) {
    const [, xExpr, yExpr] = asPercentMatch;
    const xResult = evaluateExpression(xExpr, context);
    const yResult = evaluateExpression(yExpr, context);
    if (xResult.type === "error") return xResult;
    if (yResult.type === "error") return yResult;
    const result = xResult.value.div(yResult.value).times(100);
    return createPercentageResult(result, formatOpts);
  }

  return null;
}

function evaluateExpression(input: string, context: EvaluationContext): CalculationResult {
  let processed = input;
  const formatOpts: FormatOptions = { decimalPlaces: context.decimalPlaces };

  // Handle "days until X" pattern for date calculations
  const daysUntilMatch = processed.match(/^days?\s+(?:until|to|till)\s+(.+)$/i);
  if (daysUntilMatch) {
    const targetExpr = daysUntilMatch[1].trim().toLowerCase();

    // First check magic date variables
    const magicDates = getMagicDateVariables();
    if (magicDates.has(targetExpr)) {
      const days = getDaysUntil(magicDates.get(targetExpr)!);
      return createUnitResult(new Decimal(Math.round(days)), "days", formatOpts);
    }

    // Try parsing as actual date
    const parsedDate = parseDateString(targetExpr);
    if (parsedDate !== null) {
      const days = getDaysUntil(parsedDate);
      return createUnitResult(new Decimal(Math.round(days)), "days", formatOpts);
    }
  }

  // Handle "days since X" pattern
  const daysSinceMatch = processed.match(/^days?\s+(?:since|from)\s+(.+)$/i);
  if (daysSinceMatch) {
    const targetExpr = daysSinceMatch[1].trim().toLowerCase();

    // First check magic date variables
    const magicDates = getMagicDateVariables();
    if (magicDates.has(targetExpr)) {
      const days = -getDaysUntil(magicDates.get(targetExpr)!);
      return createUnitResult(new Decimal(Math.round(days)), "days", formatOpts);
    }

    // Try parsing as actual date (preferPast = true for "days since")
    const parsedDate = parseDateString(targetExpr, true);
    if (parsedDate !== null) {
      const days = -getDaysUntil(parsedDate);
      return createUnitResult(new Decimal(Math.round(days)), "days", formatOpts);
    }
  }

  // Replace magic date variables with their day values
  // Sort by length (longest first) so "next week" matches before "next"
  const magicDates = getMagicDateVariables();
  const sortedDateEntries = Array.from(magicDates.entries()).sort(
    (a, b) => b[0].length - a[0].length
  );
  let dateVariableCount = 0;
  for (const [name, value] of sortedDateEntries) {
    // Escape special regex chars and use word boundaries
    const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = new RegExp(`\\b${escaped}\\b`, "gi");
    const matches = processed.match(regex);
    if (matches) {
      dateVariableCount += matches.length;
    }
    processed = processed.replace(new RegExp(`\\b${escaped}\\b`, "gi"), value.toString());
  }
  // If multiple date variables are used with subtraction, result is days difference, not a date
  const hasDateSubtraction = dateVariableCount >= 2 && input.includes("-");
  const usesDateVariable = dateVariableCount > 0 && !hasDateSubtraction;

  // Extract currency symbol if present
  // Supports both prefix styles ("$100") and suffix styles ("100$")
  let currency: string | null = null;

  // Prefix currency: $100, €50, etc.
  const prefixCurrencyMatch = processed.match(/^([£$€¥])\s*([\d.]+)/);
  if (prefixCurrencyMatch) {
    currency = getCurrencyCode(prefixCurrencyMatch[1]);
    // Drop the leading symbol so math.js only sees the numeric part / expression
    processed = processed.replace(/^[£$€¥]\s*/, "");
  } else {
    // Suffix currency: 100$, 50€, etc. (common when typing after the amount)
    const suffixCurrencyMatch = processed.match(/([\d.]+)\s*([£$€¥])$/);
    if (suffixCurrencyMatch) {
      currency = getCurrencyCode(suffixCurrencyMatch[2]);
      // Remove the trailing currency symbol, keep the numeric part
      processed = processed.replace(/([\d.]+)\s*[£$€¥]$/, "$1");
    }
  }

  // Handle inline percentage patterns: "X% of Y" -> "((X/100)*Y)"
  // This handles cases like "$100 + 8% of $50" where percentage is not at the start
  // Must process before natural language patterns
  // Capture currency symbol separately (group 2) so we only use the number (group 3) in replacement
  processed = processed.replace(
    /(\d+(?:\.\d+)?)\s*%\s*of\s+[£$€¥]?(\d+(?:\.\d+)?)/gi,
    "(($1/100)*$2)"
  );

  // Handle inline discount patterns: "X% off Y" -> "(Y - (Y * X/100))" = "Y * (1 - X/100)"
  // Capture currency symbol separately so we only use the number in replacement
  processed = processed.replace(
    /(\d+(?:\.\d+)?)\s*%\s*off\s+[£$€¥]?(\d+(?:\.\d+)?)/gi,
    "($2*(1-$1/100))"
  );

  // Handle incomplete "X% of" or "X% off" at end of expression (show clearer error)
  if (/\d+\s*%\s*of\s*$/i.test(processed)) {
    return createErrorResult("Incomplete expression: missing value after 'of'");
  }
  if (/\d+\s*%\s*off\s*$/i.test(processed)) {
    return createErrorResult("Incomplete expression: missing value after 'off'");
  }

  // Check if this is a simple value with unit (e.g., "30 cm", "100 kg")
  const unitValueMatch = processed.match(/^([\d.]+)\s*([a-zA-Z]+)$/);
  if (unitValueMatch) {
    const [, numStr, unit] = unitValueMatch;
    const value = new Decimal(numStr);
    const unitLower = unit.toLowerCase();

    // Check which unit category this belongs to
    if (LENGTH_UNITS[unitLower]) {
      return createUnitResult(value, getUnitDisplay(unitLower, "length"), formatOpts);
    }
    if (VOLUME_UNITS[unitLower]) {
      return createUnitResult(value, getUnitDisplay(unitLower, "volume"), formatOpts);
    }
    if (WEIGHT_UNITS[unitLower]) {
      return createUnitResult(value, getUnitDisplay(unitLower, "weight"), formatOpts);
    }
    if (TIME_UNITS[unitLower]) {
      return createUnitResult(value, getUnitDisplay(unitLower, "time"), formatOpts);
    }
    if (DATA_UNITS[unitLower]) {
      return createUnitResult(value, unitLower.toUpperCase(), formatOpts);
    }
    if (CSS_UNITS[unitLower]) {
      return createUnitResult(value, unitLower, formatOpts);
    }
    // If unit not recognized, try to evaluate as expression
  }

  // Apply natural language transformations
  for (const { pattern, replacement } of NATURAL_LANGUAGE_PATTERNS) {
    processed = processed.replace(pattern, replacement);
  }

  // Handle degree symbol for trig functions
  processed = processed.replace(/(\d+)\s*°/g, "($1 * pi / 180)");

  // Close unclosed parentheses from sqrt, sin, cos, tan transformations
  const openCount = (processed.match(/\(/g) || []).length;
  const closeCount = (processed.match(/\)/g) || []).length;
  processed += ")".repeat(Math.max(0, openCount - closeCount));

  // Replace variable references
  for (const [varName, varValue] of context.variables) {
    const varRegex = new RegExp(`\\b${varName}\\b`, "gi");
    processed = processed.replace(varRegex, `(${varValue.value.toString()})`);
  }

  // Handle remaining "% of" patterns after variable substitution
  // This handles cases like "(8)% of (100)" from "tax% of price"
  // Transform: "X% of Y" -> "((X)/100*(Y))" where X and Y can be any expression
  processed = processed.replace(
    /(\([^)]+\)|\d+(?:\.\d+)?)\s*%\s*of\s+(\([^)]+\)|\d+(?:\.\d+)?)/gi,
    "(($1)/100*($2))"
  );

  // Handle remaining "% off" patterns (discount) after variable substitution
  // Transform: "X% off Y" -> "(Y)*(1-X/100)"
  processed = processed.replace(
    /(\([^)]+\)|\d+(?:\.\d+)?)\s*%\s*off\s+(\([^)]+\)|\d+(?:\.\d+)?)/gi,
    "(($2)*(1-($1)/100))"
  );

  // Evaluate using math.js
  const result = math.evaluate(processed);
  const decimal = new Decimal(result);

  if (currency) {
    return createCurrencyResult(decimal, currency, formatOpts);
  }

  // Check if result looks like a percentage
  if (input.includes("%") && !input.includes("of") && !input.includes("off")) {
    return createPercentageResult(decimal, formatOpts);
  }

  // If date variables were used, return as date
  if (usesDateVariable) {
    return createDateResult(decimal);
  }

  // If subtracting dates, return as days
  if (hasDateSubtraction) {
    return createUnitResult(new Decimal(Math.round(decimal.toNumber())), "days", formatOpts);
  }

  return createNumericResult(decimal, formatOpts);
}

function getCurrencyCode(symbol: string): string {
  const codes: Record<string, string> = {
    $: "USD",
    "€": "EUR",
    "£": "GBP",
    "¥": "JPY",
  };
  return codes[symbol] || "USD";
}

function getTempUnitDisplay(unit: string): string {
  const displays: Record<string, string> = {
    c: "°C",
    celsius: "°C",
    f: "°F",
    fahrenheit: "°F",
    k: "K",
    kelvin: "K",
  };
  return displays[unit] || unit;
}

function getUnitDisplay(unit: string, category: string): string {
  const displays: Record<string, Record<string, string>> = {
    length: {
      mm: "mm",
      cm: "cm",
      m: "m",
      km: "km",
      in: '"',
      inch: '"',
      inches: '"',
      ft: "ft",
      feet: "ft",
      foot: "ft",
      yd: "yd",
      mi: "mi",
      mile: "mi",
      miles: "mi",
    },
    volume: {
      ml: "ml",
      l: "L",
      litre: "L",
      litres: "L",
      tsp: "tsp.",
      tbsp: "tbsp",
      cup: "cup",
      cups: "cups",
      gal: "gal",
      gallon: "gal",
      cbm: "cbm",
    },
    weight: {
      mg: "mg",
      g: "g",
      kg: "kg",
      oz: "oz",
      lb: "lb",
      lbs: "lb",
      pound: "lb",
      pounds: "lb",
      ton: "ton",
    },
    time: {
      ms: "ms",
      sec: "sec",
      second: "sec",
      seconds: "sec",
      min: "min",
      minute: "min",
      minutes: "min",
      hour: "hours",
      hours: "hours",
      day: "days",
      days: "days",
      week: "weeks",
      weeks: "weeks",
    },
  };
  return displays[category]?.[unit] || unit;
}

// Extract variable name from assignment
export function extractVariableName(input: string): string | null {
  const match = input.trim().match(/^(\w+)\s*=/);
  return match ? match[1].toLowerCase() : null;
}

// Detect category of calculation for color coding
export type CalculationCategory =
  | "myCalculations"
  | "unitConversion"
  | "functions"
  | "variables"
  | "cssCalculations"
  | "comment";

export function detectCategory(input: string): CalculationCategory {
  const trimmed = input.trim().toLowerCase();

  // Comments
  if (trimmed.startsWith("//") || trimmed.startsWith("#")) {
    return "comment";
  }

  // Variables (assignments or references to existing vars)
  if (/^\w+\s*=/.test(trimmed)) {
    return "variables";
  }

  // CSS units
  if (/\b(px|em|pt|rem)\b/i.test(input) || /\bppi\b/i.test(input)) {
    return "cssCalculations";
  }

  // Unit conversions
  if (/\s+in\s+\w+$/i.test(input) || /\s+to\s+\w+$/i.test(input)) {
    return "unitConversion";
  }

  // Functions (math functions, percentages, etc.)
  const functionPatterns = [
    /\bsqrt\b/i,
    /\bsin\b/i,
    /\bcos\b/i,
    /\btan\b/i,
    /\blog\b/i,
    /\bln\b/i,
    /\babs\b/i,
    /\bcbrt\b/i,
    /\bfloor\b/i,
    /\bceil\b/i,
    /\bround\b/i,
    /\bpow\b/i,
    /\bsquared\b/i,
    /\bcubed\b/i,
    /%\s*(of|off)/i,
    /as\s+a?\s*%\s*of/i,
  ];

  for (const pattern of functionPatterns) {
    if (pattern.test(input)) {
      return "functions";
    }
  }

  // Default: basic calculations
  return "myCalculations";
}
