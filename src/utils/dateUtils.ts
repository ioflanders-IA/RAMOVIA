/**
 * Utility functions for local date formatting without UTC timezone drift.
 * In positive timezones like Europe/Rome (UTC+1/UTC+2), using `new Date().toISOString().split('T')[0]`
 * on midnight dates (00:00:00) converts to UTC and shifts the date to the previous day (e.g., 23:00 on day before).
 * These helpers use the local year, month, and day exclusively.
 */

/**
 * Returns a date formatted as "YYYY-MM-DD" using local calendar date values.
 */
export function formatLocalDate(date: Date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Parses a "YYYY-MM-DD" string into a Date at local noon (12:00:00).
 * Noon avoids any Daylight Saving Time midnight boundary issues.
 */
export function parseLocalDate(dateStr: string): Date {
  if (!dateStr) return new Date();
  const clean = dateStr.split('T')[0];
  const parts = clean.split('-');
  if (parts.length >= 3) {
    const y = parseInt(parts[0], 10);
    const m = parseInt(parts[1], 10) - 1;
    const d = parseInt(parts[2], 10);
    if (!isNaN(y) && !isNaN(m) && !isNaN(d)) {
      return new Date(y, m, d, 12, 0, 0);
    }
  }
  return new Date();
}

/**
 * Formats a Date or "YYYY-MM-DD" string for Italian display.
 */
export function formatItalianDate(
  dateOrStr: Date | string,
  options?: Intl.DateTimeFormatOptions
): string {
  const dateObj = typeof dateOrStr === 'string' ? parseLocalDate(dateOrStr) : dateOrStr;
  return dateObj.toLocaleDateString(
    'it-IT',
    options || {
      weekday: 'short',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }
  );
}
