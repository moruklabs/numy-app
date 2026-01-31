/**
 * Safely converts human-readable time units to milliseconds.
 */
export const toMs = (
  value: number,
  unit: "minutes" | "hours" | "days" | "m" | "h" | "d"
): number => {
  const MINUTE = 60 * 1000;
  const HOUR = 60 * MINUTE;
  const DAY = 24 * HOUR;

  switch (unit) {
    case "minutes":
    case "m":
      return value * MINUTE;
    case "hours":
    case "h":
      return value * HOUR;
    case "days":
    case "d":
      return value * DAY;
    default:
      return value;
  }
};
