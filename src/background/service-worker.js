/**
 * Background service worker (Manifest V3).
 * Handles keyboard commands, context menus, and cross-script communication.
 *
 * IMPORTANT (MV3 best practice):
 * - All event listeners MUST be registered synchronously at the top level.
 * - The service worker can be terminated after ~30s of inactivity.
 * - Never store state in global variables — use chrome.storage.
 * - Heavy modules (Readability, Turndown) are lazy-imported on first extraction.
 */
import * as storage from '../utils/storage.js';

// Lazy-loaded extraction module (Readability + Turndown = ~36KB)
let _extract = null;
async function getExtractor() {
  if (!_extract) {
    const mod = await import('../core/parser.js');
    _extract = mod.extract;
  }
  return _extract;
}

// ── Keyboard Commands (synchronous registration) ──
chrome.commands.onCommand.addListener(async (command) => {
  const tab = await getActiveTab();
  if (!tab) return;

  const prefs = await storage.getPreferences();

  switch (command) {
    case 'extract-page':
      await handleExtract(tab, prefs);
      break;
    case 'extract-copy':
      await handleExtractAndCopy(tab, prefs);
      break;
    case 'extract-save':
      await handleExtractAndSave(tab, prefs);
      break;
  }
});

// ── Message Router (synchronous registration) ──
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'extractFromPopup') {
    handleExtractFromPopup(message.options)
      .then((result) => sendResponse(result))
      .catch((err) => sendResponse({ success: false, error: err.message }));
    return true; // Async
  }

  if (message.action === 'openSidePanel') {
    chrome.sidePanel.open({ tabId: sender.tab?.id || message.tabId });
    sendResponse({ success: true });
    return true;
  }

  if (message.action === 'selectionComplete') {
    handleSelectionResult(message.data)
      .then((result) => sendResponse(result))
      .catch((err) => sendResponse({ success: false, error: err.message }));
    return true;
  }
});

// ── Side Panel Behavior (synchronous) ──
chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: false }).catch(() => {});

// ── Context Menu (synchronous registration) ──
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  const prefs = await storage.getPreferences();
  switch (info.menuItemId) {
    case 'decant-extract-selection':
      await handleExtractSelection(tab, info.selectionText, prefs);
      break;
    case 'decant-extract-page':
      await handleExtract(tab, prefs);
      break;
    case 'decant-copy-for-ai':
      await handleCopyForAI(tab, info.selectionText, prefs);
      break;
  }
});

// ── Install handler ──
chrome.runtime.onInstalled.addListener((details) => {
  // Create context menu items
  chrome.contextMenus.create({
    id: 'decant-parent',
    title: 'Decant',
    contexts: ['selection', 'page'],
  });
  chrome.contextMenus.create({
    id: 'decant-extract-selection',
    parentId: 'decant-parent',
    title: 'Extract selection as Markdown',
    contexts: ['selection'],
  });
  chrome.contextMenus.create({
    id: 'decant-extract-page',
    parentId: 'decant-parent',
    title: 'Extract full page',
    contexts: ['page', 'selection'],
  });
  chrome.contextMenus.create({
    id: 'decant-copy-for-ai',
    parentId: 'decant-parent',
    title: 'Copy for AI (optimized)',
    contexts: ['page', 'selection'],
  });

  if (details.reason === 'install') {
    // Initialize defaults on first install
    storage.getAll();
    // Open onboarding page
    chrome.tabs.create({ url: chrome.runtime.getURL('src/onboarding/welcome.html') });
  }

  // Set up NPS check alarm (once daily)
  chrome.alarms.create('decant-nps-check', { periodInMinutes: 1440 });
});

// ── Alarms (synchronous registration) ──
chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === 'decant-nps-check') {
    // Badge notification if NPS is due (checked when popup opens)
    const data = await storage.get(['lastNpsDate', 'extractionCount']);
    if (data.extractionCount >= 10) {
      const daysSinceNps = data.lastNpsDate
        ? (Date.now() - data.lastNpsDate) / (1000 * 60 * 60 * 24)
        : 999;
      if (daysSinceNps >= 90) {
        chrome.action.setBadgeText({ text: '1' });
        chrome.action.setBadgeBackgroundColor({ color: '#8B5CF6' });
      }
    }
  }
});

// ── Core Extraction Logic ──
async function handleExtract(tab, prefs) {
  try {
    const extract = await getExtractor();

    const pageData = await sendToContentScript(tab.id, {
      action: 'extract',
      options: prefs,
    });

    if (!pageData.success) throw new Error(pageData.error);

    const result = extract({
      ...pageData.data,
      ...prefs,
    });

    // Track extraction
    await storage.incrementExtractions();
    await storage.addToHistory({
      url: pageData.data.url,
      title: pageData.data.title,
      domain: pageData.data.domain,
      format: prefs.format,
      wordCount: result.metadata.wordCount,
    });

    return result;
  } catch (error) {
    console.error('[Decant] Extraction failed:', error);
    await logError('handleExtract', error);
    chrome.action.setBadgeText({ text: '!' });
    chrome.action.setBadgeBackgroundColor({ color: '#EF4444' });
    throw error;
  }
}

async function handleExtractAndCopy(tab, prefs) {
  const result = await handleExtract(tab, prefs);
  await sendToContentScript(tab.id, {
    action: 'copyToClipboard',
    text: result.output,
  });
  return result;
}

async function handleExtractAndSave(tab, prefs) {
  const result = await handleExtract(tab, prefs);
  await sendToContentScript(tab.id, {
    action: 'downloadFile',
    content: result.output,
    filename: result.metadata.title,
    format: prefs.format,
  });
  return result;
}

async function handleExtractFromPopup(options) {
  const tab = await getActiveTab();
  if (!tab) throw new Error('No active tab');

  const extract = await getExtractor();

  const pageData = await sendToContentScript(tab.id, {
    action: 'extract',
    options,
  });

  if (!pageData.success) throw new Error(pageData.error);

  const result = extract({
    ...pageData.data,
    ...options,
  });

  // Track
  await storage.incrementExtractions();
  await storage.addToHistory({
    url: pageData.data.url,
    title: pageData.data.title,
    domain: pageData.data.domain,
    format: options.format,
    wordCount: result.metadata.wordCount,
  });

  return { success: true, result };
}

/**
 * Sanitize untrusted text for safe HTML embedding.
 * Escapes all HTML special characters to prevent XSS.
 */
function sanitizeHTML(text) {
  if (!text) return '';
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

async function handleExtractSelection(tab, selectionText, prefs) {
  try {
    const extract = await getExtractor();
    // Sanitize selection to prevent XSS before wrapping in HTML
    const safe = sanitizeHTML(selectionText);
    const html = `<html><body><article>${safe}</article></body></html>`;
    const result = extract({
      html,
      url: tab.url,
      title: tab.title,
      format: 'markdown',
      includeImages: prefs.includeImages,
      detectTables: prefs.detectTables,
      smartExtract: prefs.smartExtract,
      fullPage: true,
    });
    await sendToContentScript(tab.id, {
      action: 'copyToClipboard',
      text: result.output,
    });
  } catch (error) {
    logError('Context menu extract selection failed', error);
  }
}

async function handleCopyForAI(tab, selectionText, prefs) {
  try {
    const extract = await getExtractor();
    if (selectionText) {
      // Sanitize selection to prevent XSS before wrapping in HTML
      const safe = sanitizeHTML(selectionText);
      const html = `<html><body><article>${safe}</article></body></html>`;
      const result = extract({
        html,
        url: tab.url,
        title: tab.title,
        format: 'mcp',
        includeImages: false,
        detectTables: true,
        smartExtract: true,
        fullPage: true,
      });
      await sendToContentScript(tab.id, { action: 'copyToClipboard', text: result.output });
    } else {
      await handleExtractAndCopy(tab, { ...prefs, format: 'mcp' });
    }
  } catch (error) {
    logError('Context menu copy for AI failed', error);
  }
}

async function handleSelectionResult(data) {
  const extract = await getExtractor();
  const prefs = await storage.getPreferences();
  const result = extract({
    ...data,
    ...prefs,
  });
  return { success: true, result };
}

// ── Error Logging ──
async function logError(context, error) {
  try {
    const { errorLog = [] } = await chrome.storage.local.get('errorLog');
    errorLog.push({
      context,
      message: error?.message || String(error),
      stack: error?.stack || '',
      timestamp: Date.now(),
      version: chrome.runtime.getManifest().version,
    });
    // Keep max 50 errors
    if (errorLog.length > 50) errorLog.splice(0, errorLog.length - 50);
    await chrome.storage.local.set({ errorLog });
  } catch {
    /* don't recurse on storage errors */
  }
}

// ── Retry with Exponential Backoff ──
async function withRetry(fn, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (e) {
      if (i === maxRetries - 1) throw e;
      await new Promise((r) => setTimeout(r, Math.pow(2, i) * 500));
    }
  }
}

// ── Helpers ──
async function getActiveTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  return tab;
}

async function sendToContentScript(tabId, message) {
  return withRetry(async () => {
    try {
      return await chrome.tabs.sendMessage(tabId, message);
    } catch {
      // Content script may not be injected yet — inject it
      await chrome.scripting.executeScript({
        target: { tabId },
        files: ['src/content/extractor.js'],
      });
      return await chrome.tabs.sendMessage(tabId, message);
    }
  }, 2);
}
