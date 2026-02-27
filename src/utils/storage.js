/**
 * Wrapper around chrome.storage.local for type-safe, promise-based access.
 */

const DEFAULTS = {
  // User preferences
  format: 'markdown',
  theme: 'light',
  includeImages: true,
  detectTables: true,
  smartExtract: true,
  fullPage: false,

  // Usage tracking
  extractionCount: 0,
  firstUseDate: null,
  lastUseDate: null,

  // Feedback state
  feedbackGiven: false,
  feedbackDismissed: false,
  ratingGiven: false,
  ratingDismissed: false,
  lastNpsDate: null,

  // History
  history: [],

  // MCP Bridge
  mcpBridgeEnabled: false,
};

const MAX_HISTORY = 50;

export async function get(keys) {
  const keyList = Array.isArray(keys) ? keys : [keys];
  const defaults = {};
  for (const k of keyList) {
    if (k in DEFAULTS) defaults[k] = DEFAULTS[k];
  }
  return chrome.storage.local.get(defaults);
}

export async function set(data) {
  return chrome.storage.local.set(data);
}

export async function getAll() {
  return chrome.storage.local.get(DEFAULTS);
}

export async function incrementExtractions() {
  const { extractionCount, firstUseDate } = await get(['extractionCount', 'firstUseDate']);
  const now = Date.now();
  const updates = {
    extractionCount: extractionCount + 1,
    lastUseDate: now,
  };
  if (!firstUseDate) {
    updates.firstUseDate = now;
  }
  await set(updates);
  return updates.extractionCount;
}

export async function addToHistory(entry) {
  const { history } = await get('history');
  const newEntry = {
    id: crypto.randomUUID(),
    url: entry.url,
    title: entry.title,
    domain: entry.domain,
    format: entry.format,
    wordCount: entry.wordCount,
    timestamp: Date.now(),
  };
  const updated = [newEntry, ...history].slice(0, MAX_HISTORY);
  await set({ history: updated });
  return newEntry;
}

export async function getHistory() {
  const { history } = await get('history');
  return history;
}

export async function clearHistory() {
  await set({ history: [] });
}

export async function getPreferences() {
  return get(['format', 'theme', 'includeImages', 'detectTables', 'smartExtract', 'fullPage']);
}

export async function setPreference(key, value) {
  if (key in DEFAULTS) {
    await set({ [key]: value });
  }
}

// ── RGPD / GDPR Compliance ──

/**
 * Delete all user data (GDPR "right to be forgotten").
 */
export async function deleteAllUserData() {
  await chrome.storage.local.clear();
}

/**
 * Export all user data as JSON (GDPR "right of access").
 */
export async function exportUserData() {
  const localData = await chrome.storage.local.get(null);
  return JSON.stringify(
    {
      exportedAt: new Date().toISOString(),
      extension: 'Decant',
      version: chrome.runtime.getManifest().version,
      data: localData,
    },
    null,
    2,
  );
}
