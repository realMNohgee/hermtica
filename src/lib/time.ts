/**
 * Formats a date string or timestamp as a relative time string.
 * e.g. "2m ago", "3h ago", "2d ago"
 */
export function relativeTime(dateInput: string | Date | number): string {
  const date = typeof dateInput === "string" ? new Date(dateInput) : new Date(dateInput);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();

  // If date is in the future or invalid, return as-is
  if (diffMs < 0 || isNaN(diffMs)) {
    if (typeof dateInput === "string" && !dateInput.includes("T")) return dateInput;
    return "just now";
  }

  const seconds = Math.floor(diffMs / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  const weeks = Math.floor(days / 7);

  if (seconds < 60) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  if (weeks < 4) return `${weeks}w ago`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}
