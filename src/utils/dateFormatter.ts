/**
 * Format date to dd/mm/yyyy
 * @param date - Date object, string, or timestamp
 * @returns Formatted date string in dd/mm/yyyy format
 */
export function formatDate(date: Date | string | number): string {
  const d = new Date(date);

  if (isNaN(d.getTime())) {
    return "Invalid Date";
  }

  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();

  return `${day}/${month}/${year}`;
}

/**
 * Get current date in yyyy-mm-dd format for input fields
 * @returns Date string in yyyy-mm-dd format
 */
export function getCurrentDateForInput(): string {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}
