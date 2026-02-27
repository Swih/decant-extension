/**
 * Check if a URL can be injected with content scripts.
 * Uses a whitelist approach: only http(s) URLs are allowed.
 * Blocks javascript:, data:, blob:, file://, chrome://, about:, etc.
 *
 * @param {string} url
 * @returns {boolean}
 */
export function isInjectableUrl(url) {
  if (!url) return false;
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return false;
    // Chrome Web Store is restricted even on https
    if (parsed.hostname === 'chrome.google.com' && parsed.pathname.startsWith('/webstore')) return false;
    if (parsed.hostname === 'chromewebstore.google.com') return false;
    return true;
  } catch {
    return false;
  }
}
