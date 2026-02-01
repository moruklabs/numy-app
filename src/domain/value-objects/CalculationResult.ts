import Decimal from "decimal.js";

export type ResultType = "number" | "currency" | "unit" | "percentage" | "date" | "error";

export interface CalculationResult {
  type: ResultType;
  value: Decimal;
  formatted: string;
  unit?: string;
  currency?: string;
  error?: string;
}

export interface FormatOptions {
  decimalPlaces?: number;
}

export function createNumericResult(
  value: Decimal | number | string,
  options?: FormatOptions
): CalculationResult {
  const decimal = new Decimal(value);
  return {
    type: "number",
    value: decimal,
    formatted: formatNumber(decimal, options?.decimalPlaces),
  };
}

export function createCurrencyResult(
  value: Decimal | number | string,
  currency: string,
  options?: FormatOptions
): CalculationResult {
  const decimal = new Decimal(value);
  const symbol = getCurrencySymbol(currency);
  // Currency always uses 2 decimal places unless overridden
  const decimals = options?.decimalPlaces ?? 2;
  return {
    type: "currency",
    value: decimal,
    formatted: `${symbol}${formatNumber(decimal, decimals)}`,
    currency,
  };
}

export function createUnitResult(
  value: Decimal | number | string,
  unit: string,
  options?: FormatOptions
): CalculationResult {
  const decimal = new Decimal(value);
  return {
    type: "unit",
    value: decimal,
    formatted: `${formatNumber(decimal, options?.decimalPlaces)} ${unit}`,
    unit,
  };
}

export function createPercentageResult(
  value: Decimal | number | string,
  options?: FormatOptions
): CalculationResult {
  const decimal = new Decimal(value);
  return {
    type: "percentage",
    value: decimal,
    formatted: `${formatNumber(decimal, options?.decimalPlaces)} %`,
  };
}

export function createDateResult(daysSinceEpoch: Decimal | number | string): CalculationResult {
  const decimal = new Decimal(daysSinceEpoch);
  const ms = decimal.toNumber() * 24 * 60 * 60 * 1000;
  const date = new Date(ms);
  const formatted = date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  return {
    type: "date",
    value: decimal,
    formatted,
  };
}

export function createErrorResult(error: string): CalculationResult {
  return {
    type: "error",
    value: new Decimal(0),
    formatted: error,
    error,
  };
}

function formatNumber(value: Decimal, decimalPlaces?: number): string {
  let formatted: string;

  if (typeof decimalPlaces === "number") {
    // Use fixed decimal places
    formatted = value.toFixed(decimalPlaces);
  } else {
    // Default: 2 decimal places for non-integers, 0 for integers
    const isInteger = value.isInteger();
    formatted = isInteger ? value.toFixed(0) : value.toFixed(2);
  }

  // Parse and format with commas for large numbers
  const num = parseFloat(formatted);
  if (Math.abs(num) >= 1000) {
    return num.toLocaleString("en-US", {
      minimumFractionDigits: decimalPlaces ?? 0,
      maximumFractionDigits: decimalPlaces ?? 10,
    });
  }
  return formatted;
}

function getCurrencySymbol(currency: string): string {
  const symbols: Record<string, string> = {
    USD: "$",
    EUR: "€",
    GBP: "£",
    JPY: "¥",
    CHF: "CHF ",
    CAD: "C$",
    AUD: "A$",
  };
  return symbols[currency.toUpperCase()] || `${currency} `;
}
