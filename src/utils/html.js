/**
 * HTML utility functions — shared across popup, side panel, and components.
 */

/**
 * Escape HTML entities using DOM (safe, handles all edge cases).
 */
export function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

/**
 * Escape attribute values for safe HTML insertion.
 */
export function escapeAttr(text) {
  return text.replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}
