/**
 * TIME UTILITY FUNCTIONS
 *
 * Utilities for formatting time, duration, and date strings
 * for the LMS interface.
 *
 * @author Principal Engineer
 * @version 1.0.0
 * @since 2025-09-20
 */

/**
 * Format seconds into human-readable duration
 * @param seconds - Duration in seconds
 * @param format - Output format
 * @returns Formatted duration string
 */
export function formatDuration(
  seconds: number,
  format: "short" | "long" | "minimal" = "short",
): string {
  if (seconds < 0) return "0s";

  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = Math.floor(seconds % 60);

  switch (format) {
    case "minimal":
      if (hours > 0)
        return `${hours}:${minutes.toString().padStart(2, "0")}:${remainingSeconds.toString().padStart(2, "0")}`;
      return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;

    case "long":
      const parts = [];
      if (hours > 0) parts.push(`${hours} hour${hours !== 1 ? "s" : ""}`);
      if (minutes > 0)
        parts.push(`${minutes} minute${minutes !== 1 ? "s" : ""}`);
      if (remainingSeconds > 0 && hours === 0)
        parts.push(
          `${remainingSeconds} second${remainingSeconds !== 1 ? "s" : ""}`,
        );
      return parts.join(", ") || "0 seconds";

    case "short":
    default:
      if (hours > 0) return `${hours}h ${minutes}m`;
      if (minutes > 0) return `${minutes}m`;
      return `${remainingSeconds}s`;
  }
}

/**
 * Format seconds into progress time display
 * @param currentSeconds - Current playback time
 * @param totalSeconds - Total duration
 * @returns Formatted time string like "5:30 / 12:45"
 */
export function formatProgressTime(
  currentSeconds: number,
  totalSeconds: number,
): string {
  return `${formatDuration(currentSeconds, "minimal")} / ${formatDuration(totalSeconds, "minimal")}`;
}

/**
 * Parse duration string into seconds
 * @param duration - Duration string (e.g., "1h 30m", "90m", "5400s")
 * @returns Duration in seconds
 */
export function parseDuration(duration: string): number {
  const hourRegex = /(\d+)h/;
  const minuteRegex = /(\d+)m/;
  const secondRegex = /(\d+)s/;

  const hourMatch = hourRegex.exec(duration);
  const minuteMatch = minuteRegex.exec(duration);
  const secondMatch = secondRegex.exec(duration);

  let seconds = 0;

  if (hourMatch?.[1]) seconds += parseInt(hourMatch[1]) * 3600;
  if (minuteMatch?.[1]) seconds += parseInt(minuteMatch[1]) * 60;
  if (secondMatch?.[1]) seconds += parseInt(secondMatch[1]);

  return seconds;
}

/**
 * Get relative time string (e.g., "2 hours ago", "yesterday")
 * @param date - Date string or Date object
 * @returns Relative time string
 */
export function getRelativeTime(date: string | Date): string {
  const now = new Date();
  const targetDate = typeof date === "string" ? new Date(date) : date;
  const diffMs = now.getTime() - targetDate.getTime();
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);
  const diffWeeks = Math.floor(diffDays / 7);
  const diffMonths = Math.floor(diffDays / 30);
  const diffYears = Math.floor(diffDays / 365);

  if (diffSeconds < 60) return "just now";
  if (diffMinutes < 60)
    return `${diffMinutes} minute${diffMinutes !== 1 ? "s" : ""} ago`;
  if (diffHours < 24)
    return `${diffHours} hour${diffHours !== 1 ? "s" : ""} ago`;
  if (diffDays === 1) return "yesterday";
  if (diffDays < 7) return `${diffDays} day${diffDays !== 1 ? "s" : ""} ago`;
  if (diffWeeks < 4)
    return `${diffWeeks} week${diffWeeks !== 1 ? "s" : ""} ago`;
  if (diffMonths < 12)
    return `${diffMonths} month${diffMonths !== 1 ? "s" : ""} ago`;
  return `${diffYears} year${diffYears !== 1 ? "s" : ""} ago`;
}

/**
 * Format date for display
 * @param date - Date string or Date object
 * @param format - Display format
 * @returns Formatted date string
 */
export function formatDate(
  date: string | Date,
  format: "short" | "medium" | "long" | "relative" = "medium",
): string {
  const targetDate = typeof date === "string" ? new Date(date) : date;

  if (format === "relative") {
    return getRelativeTime(targetDate);
  }

  const options: Intl.DateTimeFormatOptions = {
    short: { month: "short", day: "numeric" },
    medium: { month: "short", day: "numeric", year: "numeric" },
    long: { weekday: "long", month: "long", day: "numeric", year: "numeric" },
  }[format] as Intl.DateTimeFormatOptions;

  return targetDate.toLocaleDateString("en-US", options);
}

/**
 * Calculate estimated reading time for text content
 * @param text - HTML or plain text content
 * @param wordsPerMinute - Reading speed (default: 200 wpm)
 * @returns Estimated reading time in minutes
 */
export function calculateReadingTime(
  text: string,
  wordsPerMinute = 200,
): number {
  // Strip HTML tags and count words
  const plainText = text.replace(/<[^>]*>/g, "");
  const words = plainText.trim().split(/\s+/).length;
  return Math.ceil(words / wordsPerMinute);
}

/**
 * Convert percentage to time remaining
 * @param percentage - Progress percentage (0-100)
 * @param totalDurationSeconds - Total duration in seconds
 * @returns Remaining time in seconds
 */
export function getTimeRemaining(
  percentage: number,
  totalDurationSeconds: number,
): number {
  const remaining = ((100 - percentage) / 100) * totalDurationSeconds;
  return Math.max(0, remaining);
}

/**
 * Calculate completion percentage
 * @param completedItems - Number of completed items
 * @param totalItems - Total number of items
 * @returns Percentage (0-100)
 */
export function calculatePercentage(
  completedItems: number,
  totalItems: number,
): number {
  if (totalItems === 0) return 0;
  return Math.round((completedItems / totalItems) * 100);
}

/**
 * Debounce function for performance optimization
 * @param func - Function to debounce
 * @param wait - Wait time in milliseconds
 * @returns Debounced function
 */
export function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number,
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;

  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => {
      void func(...args);
    }, wait);
  };
}

/**
 * Throttle function for performance optimization
 * @param func - Function to throttle
 * @param limit - Time limit in milliseconds
 * @returns Throttled function
 */
export function throttle<T extends (...args: unknown[]) => unknown>(
  func: T,
  limit: number,
): (...args: Parameters<T>) => void {
  let lastRan = 0;

  return (...args: Parameters<T>) => {
    const now = Date.now();
    if (now - lastRan >= limit) {
      void func(...args);
      lastRan = now;
    }
  };
}
