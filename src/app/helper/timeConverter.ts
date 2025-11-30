/**
 * Converts time string to milliseconds
 * @param timeString - Time string in format like "1d", "2h", "30m", "45s", "1y", "1M", "1w"
 * @param defaultValue - Default value in milliseconds if conversion fails
 * @returns Time in milliseconds
 */
export const convertToMilliseconds = (
  timeString: string,
  defaultValue: number = 60 * 60 * 1000
): number => {
  if (!timeString || typeof timeString !== "string") {
    return defaultValue;
  }

  // Extract numeric value and unit
  const value = parseInt(timeString.slice(0, -1));
  const unit = timeString.slice(-1).toLowerCase();

  if (isNaN(value) || value <= 0) {
    return defaultValue;
  }

  const conversionRates: { [key: string]: number } = {
    y: 365 * 24 * 60 * 60 * 1000, // years
    M: 30 * 24 * 60 * 60 * 1000, // months
    w: 7 * 24 * 60 * 60 * 1000, // weeks
    d: 24 * 60 * 60 * 1000, // days
    h: 60 * 60 * 1000, // hours
    m: 60 * 1000, // minutes
    s: 1000, // seconds
  };

  const milliseconds = value * (conversionRates[unit] || defaultValue);

  return milliseconds > 0 ? milliseconds : defaultValue;
};
