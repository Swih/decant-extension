/**
 * Local-only usage analytics.
 * Privacy-first: all data stays in chrome.storage.local.
 */
import * as storage from '../utils/storage.js';

/**
 * Track an extraction event.
 */
export async function trackExtraction(metadata) {
  const {
    analyticsData = { totalExtractions: 0, formatUsage: {}, domainUsage: {}, dailyUsage: {} },
  } = await storage.get('analyticsData');

  // Total count
  analyticsData.totalExtractions++;

  // Format usage
  const fmt = metadata.format || 'markdown';
  analyticsData.formatUsage[fmt] = (analyticsData.formatUsage[fmt] || 0) + 1;

  // Domain usage
  const domain = metadata.domain || 'unknown';
  analyticsData.domainUsage[domain] = (analyticsData.domainUsage[domain] || 0) + 1;

  // Daily usage
  const today = new Date().toISOString().split('T')[0];
  analyticsData.dailyUsage[today] = (analyticsData.dailyUsage[today] || 0) + 1;

  // Keep only last 90 days
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 90);
  const cutoffStr = cutoff.toISOString().split('T')[0];
  for (const date in analyticsData.dailyUsage) {
    if (date < cutoffStr) delete analyticsData.dailyUsage[date];
  }

  await storage.set({ analyticsData });
}

/**
 * Get usage summary.
 */
export async function getUsageSummary() {
  const { analyticsData } = await storage.get('analyticsData');
  if (!analyticsData) return null;

  return {
    totalExtractions: analyticsData.totalExtractions,
    topFormats: Object.entries(analyticsData.formatUsage).sort((a, b) => b[1] - a[1]),
    topDomains: Object.entries(analyticsData.domainUsage)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10),
    last7Days: getLast7Days(analyticsData.dailyUsage),
  };
}

function getLast7Days(daily) {
  const result = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toISOString().split('T')[0];
    result.push({ date: key, count: daily[key] || 0 });
  }
  return result;
}
