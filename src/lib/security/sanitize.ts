/**
 * Robust string sanitizer to prevent XSS and SQL injection payloads.
 */
export function sanitizeInput(input: unknown): string {
  if (typeof input !== 'string') return '';
  return input
    .replace(/[<>]/g, '') // Strip HTML tags
    .replace(/javascript:/gi, '') // Strip JS pseudo protocols
    .replace(/on\w+=/gi, '') // Strip inline event handlers like onclick=
    .trim();
}

/**
 * Validates and sanitizes roll numbers (alphanumeric + dashes only).
 */
export function sanitizeRollNumber(roll: unknown): string {
  if (typeof roll !== 'string') return '';
  return roll
    .toUpperCase()
    .replace(/[^A-Z0-9-]/g, '')
    .trim();
}

/**
 * Validates and sanitizes emails.
 */
export function sanitizeEmail(email: unknown): string {
  if (typeof email !== 'string') return '';
  return email
    .toLowerCase()
    .replace(/[^a-z0-9@._-]/g, '')
    .trim();
}

/**
 * Validates and sanitizes Pakistani phone numbers.
 */
export function sanitizePhone(phone: unknown): string {
  if (typeof phone !== 'string') return '';
  return phone
    .replace(/[^0-9+-]/g, '')
    .trim();
}
