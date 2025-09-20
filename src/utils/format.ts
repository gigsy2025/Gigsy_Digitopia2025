/**
 * FORMATTING UTILITIES
 *
 * General purpose formatting functions for text, numbers, and display values.
 *
 * @author Principal Engineer
 * @version 1.0.0
 * @since 2025-09-20
 */

/**
 * Format price with currency symbol
 * @param price - Price amount
 * @param currency - Currency code (default: 'USD')
 * @param locale - Locale for formatting (default: 'en-US')
 * @returns Formatted price string
 */
export function formatPrice(
  price: number,
  currency = "USD",
  locale = "en-US",
): string {
  if (price === 0) return "Free";

  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    minimumFractionDigits: price % 1 === 0 ? 0 : 2,
  }).format(price);
}

/**
 * Format number with proper locale formatting
 * @param num - Number to format
 * @param locale - Locale for formatting (default: 'en-US')
 * @returns Formatted number string
 */
export function formatNumber(num: number, locale = "en-US"): string {
  return new Intl.NumberFormat(locale).format(num);
}

/**
 * Truncate text to specified length with ellipsis
 * @param text - Text to truncate
 * @param maxLength - Maximum length
 * @param suffix - Suffix to add (default: '...')
 * @returns Truncated text
 */
export function truncateText(
  text: string,
  maxLength: number,
  suffix = "...",
): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - suffix.length) + suffix;
}

/**
 * Convert text to slug format
 * @param text - Text to convert
 * @returns Slug string
 */
export function textToSlug(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "") // Remove special characters
    .replace(/\s+/g, "-") // Replace spaces with hyphens
    .replace(/--+/g, "-") // Replace multiple hyphens with single
    .trim()
    .replace(/^-+|-+$/g, ""); // Remove leading/trailing hyphens
}

/**
 * Extract initials from a name
 * @param name - Full name
 * @param maxInitials - Maximum number of initials (default: 2)
 * @returns Initials string
 */
export function getInitials(name: string, maxInitials = 2): string {
  return name
    .split(" ")
    .slice(0, maxInitials)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
}

/**
 * Format file size in human-readable format
 * @param bytes - File size in bytes
 * @param decimals - Number of decimal places (default: 1)
 * @returns Formatted file size
 */
export function formatFileSize(bytes: number, decimals = 1): string {
  if (bytes === 0) return "0 B";

  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(decimals))} ${sizes[i]}`;
}

/**
 * Format rating as stars
 * @param rating - Rating value (0-5)
 * @param showText - Whether to show text (default: false)
 * @returns Formatted rating string
 */
export function formatRating(rating: number, showText = false): string {
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 >= 0.5;
  const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

  const stars =
    "★".repeat(fullStars) + (hasHalfStar ? "☆" : "") + "☆".repeat(emptyStars);

  return showText ? `${stars} (${rating.toFixed(1)})` : stars;
}

/**
 * Capitalize first letter of each word
 * @param text - Text to capitalize
 * @returns Capitalized text
 */
export function capitalizeWords(text: string): string {
  return text.replace(
    /\w\S*/g,
    (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase(),
  );
}

/**
 * Format percentage with optional decimal places
 * @param value - Percentage value (0-100)
 * @param decimals - Number of decimal places (default: 0)
 * @returns Formatted percentage string
 */
export function formatPercentage(value: number, decimals = 0): string {
  return `${value.toFixed(decimals)}%`;
}

/**
 * Generate a color from string (useful for avatars)
 * @param str - Input string
 * @returns HSL color string
 */
export function stringToColor(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }

  const hue = Math.abs(hash) % 360;
  return `hsl(${hue}, 65%, 50%)`;
}

/**
 * Clean HTML content and extract plain text
 * @param html - HTML content
 * @returns Plain text
 */
export function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, "").trim();
}

/**
 * Format learning outcome or skill as badge text
 * @param skill - Skill or outcome text
 * @returns Formatted badge text
 */
export function formatSkillBadge(skill: string): string {
  return skill
    .split(/[,;]/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0)
    .map((s) => capitalizeWords(s))
    .join(", ");
}

/**
 * Generate excerpt from HTML content
 * @param html - HTML content
 * @param maxLength - Maximum length of excerpt
 * @returns Plain text excerpt
 */
export function generateExcerpt(html: string, maxLength = 150): string {
  const plainText = stripHtml(html);
  return truncateText(plainText, maxLength);
}

/**
 * Format difficulty level with emoji
 * @param difficulty - Difficulty level
 * @returns Formatted difficulty string
 */
export function formatDifficulty(
  difficulty: "beginner" | "intermediate" | "advanced" | "expert",
): string {
  const difficultyMap = {
    beginner: "🌱 Beginner",
    intermediate: "⚡ Intermediate",
    advanced: "🔥 Advanced",
    expert: "💎 Expert",
  };

  return difficultyMap[difficulty] || difficulty;
}

/**
 * Format course category with emoji
 * @param category - Course category
 * @returns Formatted category string
 */
export function formatCategory(category: string): string {
  const categoryMap: Record<string, string> = {
    development: "💻 Development",
    design: "🎨 Design",
    marketing: "📈 Marketing",
    business: "💼 Business",
    technology: "⚡ Technology",
    "data-science": "📊 Data Science",
    creative: "🎭 Creative",
    language: "🗣️ Language",
    music: "🎵 Music",
    photography: "📸 Photography",
    writing: "✍️ Writing",
  };

  return categoryMap[category.toLowerCase()] ?? capitalizeWords(category);
}
