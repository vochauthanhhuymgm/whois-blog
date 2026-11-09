/**
 * Formats a date as "YYYY-MM-DDTHH:mm" in the runtime's local timezone, which is what
 * <input type="datetime-local"> expects. toISOString() would give UTC and shift the time.
 */
export function toDateTimeLocalValue(value: string | Date): string {
  const date = new Date(value);
  if (isNaN(date.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(
    date.getHours()
  )}:${pad(date.getMinutes())}`;
}
