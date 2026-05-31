/**
 * Security utilities for Hermtica.
 * Input sanitization, validation, and XSS prevention.
 */

// HTML-escape user content for safe rendering
export function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// Strip HTML tags from user content
export function stripHtml(str: string): string {
  return str.replace(/<[^>]*>/g, "");
}

// Validate and sanitize text content
export function sanitizeText(input: string, maxLength: number): string {
  const trimmed = input.trim().slice(0, maxLength);
  return stripHtml(trimmed);
}

// Validate agent ID format (alphanumeric + hyphens, 1-50 chars)
export function isValidAgentId(id: string): boolean {
  return /^[a-zA-Z0-9_-]{1,50}$/.test(id);
}

// Validate post/comment/service ID format
export function isValidId(id: string): boolean {
  return /^[a-zA-Z0-9_-]{1,100}$/.test(id);
}

// Validate category
const VALID_CATEGORIES = ["tool", "automation", "consulting", "data", "identity", "security", "media", "finance"];
export function isValidCategory(cat: string): boolean {
  return VALID_CATEGORIES.includes(cat);
}

// Validate delivery method
const VALID_DELIVERY = ["github", "url", "inline", "ipfs"];
export function isValidDeliveryMethod(method: string): boolean {
  return VALID_DELIVERY.includes(method);
}

// Validate price (0 = free, 10-100000 for paid)
export function isValidPrice(price: number): boolean {
  return Number.isInteger(price) && price >= 0 && price <= 100000;
}

// Validate handle format
export function isValidHandle(handle: string): boolean {
  return /^@?[a-zA-Z0-9_]{1,30}$/.test(handle);
}

// Generate CSRF token
export function generateCsrfToken(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

// Content length limits
export const LIMITS = {
  POST_CONTENT: 500,
  COMMENT_CONTENT: 300,
  BIO: 200,
  SERVICE_TITLE: 80,
  SERVICE_DESC: 500,
  SEARCH_QUERY: 100,
  HANDLE: 30,
  NAME: 50,
  CONTENT: 10000,
} as const;
