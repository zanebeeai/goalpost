/**
 * When a week's questions open, in the space timezone: "Friday" when that is
 * local midnight, otherwise "Friday at 6:00 AM".
 */
export function formatReveal(
  revealsAt: string | null | undefined,
  timezone: string,
): string {
  const date = revealsAt ? new Date(revealsAt) : null;
  if (!date || Number.isNaN(date.getTime())) return "Friday";
  let parts: Intl.DateTimeFormatPart[];
  try {
    parts = new Intl.DateTimeFormat("en-US", {
      timeZone: timezone,
      weekday: "long",
      hour: "numeric",
      minute: "2-digit",
      hourCycle: "h23",
    }).formatToParts(date);
  } catch {
    return "Friday";
  }
  const get = (type: string) =>
    parts.find((part) => part.type === type)?.value ?? "";
  const weekday = get("weekday");
  const hour = Number(get("hour"));
  const minute = Number(get("minute"));
  if (hour === 0 && minute === 0) return weekday;
  const time = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
  return `${weekday} at ${time}`;
}
