/**
 * Password validation utilities
 */

/**
 * Validate password strength
 * @param {string} password - The password to validate
 * @returns {string[]} Array of error messages (empty if valid)
 */
export function validatePasswordStrength(password) {
  const errors = [];
  
  if (!password || password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  if (!/\d/.test(password)) {
    errors.push('Password must contain at least one number');
  }
  
  return errors;
}

/**
 * Validate email format
 * @param {string} email - The email to validate
 * @returns {boolean} True if valid
 */
export function isValidEmail(email) {
  if (!email) return false;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate phone number format
 * @param {string} phone - The phone number to validate
 * @returns {boolean} True if valid
 */
export function isValidPhone(phone) {
  if (!phone) return false;
  const phoneRegex = /^[+]?[\d\s-]{10,15}$/;
  return phoneRegex.test(phone);
}

/**
 * Validate Indian pincode format
 * @param {string} pincode - The pincode to validate
 * @returns {boolean} True if valid
 */
export function isValidPincode(pincode) {
  if (!pincode) return false;
  const pincodeRegex = /^[0-9]{5,6}$/;
  return pincodeRegex.test(pincode);
}

/**
 * Sanitize string input
 * @param {string} input - The input to sanitize
 * @returns {string} Sanitized string
 */
export function sanitizeString(input) {
  if (!input) return '';
  return String(input).trim().replace(/[<>]/g, '');
}

/**
 * Validate URL format
 * @param {string} url - The URL to validate
 * @returns {boolean} True if valid
 */
export function isValidUrl(url) {
  if (!url) return false;
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Validate date is not in the past
 * @param {string|Date} date - The date to validate
 * @returns {boolean} True if valid (not in past)
 */
export function isValidFutureDate(date) {
  if (!date) return false;
  const inputDate = new Date(date);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return inputDate >= today;
}

/**
 * Validate rating value (1-5)
 * @param {number} rating - The rating to validate
 * @returns {boolean} True if valid
 */
export function isValidRating(rating) {
  const parsed = Number(rating);
  return !isNaN(parsed) && parsed >= 1 && parsed <= 5;
}

/**
 * Truncate string to max length
 * @param {string} input - The input to truncate
 * @param {number} maxLength - Maximum length
 * @returns {string} Truncated string
 */
export function truncate(input, maxLength = 100) {
  if (!input) return '';
  const str = String(input);
  return str.length > maxLength ? str.substring(0, maxLength) : str;
}
