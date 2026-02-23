/**
 * Time utility functions — shared across popup and side panel.
 */

/**
 * Format a timestamp as a relative time string (e.g., "5m", "2h", "3d").
 */
export function timeAgo(timestamp) {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  if (seconds < 60) return chrome.i18n?.getMessage('timeJustNow') || 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return chrome.i18n?.getMessage('timeMinAgo', [String(minutes)]) || `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return chrome.i18n?.getMessage('timeHourAgo', [String(hours)]) || `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return chrome.i18n?.getMessage('timeDayAgo', [String(days)]) || `${days}d ago`;
}
