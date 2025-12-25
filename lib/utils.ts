/**
 * Formats a date string to a localized date-time string
 * @param dateString - ISO date string
 * @returns Formatted date string (e.g., "12/25/2024, 3:30:00 PM")
 */
export function formatDateTime(dateString: string): string {
  return new Date(dateString).toLocaleString();
}
