/**
 * Background service worker (Manifest V3).
 * Handles keyboard commands, context menus, and cross-script communication.
 *
 * IMPORTANT (MV3 best practice):
 * - All event listeners MUST be registered synchronously at the top level.
 * - The service worker can be terminated after ~30s of inactivity.
 * - Never store state in global variables — use chrome.storage.
 * - Service workers have NO DOM access — parsing is delegated to an
 *   offscreen document (per Chrome docs: chrome.offscreen with DOM_PARSER).
 */
import * as storage from '../utils/storage.js';
import { isInjectableUrl } from '../utils/url.js';

// ── MCP Bridge State ──
/** @type {WebSocket | null} */
let mcpSocket = null;

// ── Offscreen Document Helper ──
const OFFSCREEN_URL = chrome.runtime.getURL('src/offscreen/offscreen.html');
/** @type {Promise<void> | null} */
let offscreenCreating = null;

/**
 * Ensure the offscreen document exists before sending messages.
 * Only one offscreen document per extension (Chrome restriction).
 */
async function ensureOffscreen() {
  const contexts = await chrome.runtime.getContexts({
    contextTypes: ['OFFSCREEN_DOCUMENT'],
    documentUrls: [OFFSCREEN_URL],
  });
  if (contexts.length > 0) return;

  // Prevent concurrent creation (two callers could both see 0 contexts)
  if (offscreenCreating) return offscreenCreating;
  offscreenCreating = chrome.offscreen.createDocument({
    url: OFFSCREEN_URL,
    reasons: ['DOM_PARSER'],
    justification: 'Parse HTML with DOMParser + Readability (unavailable in service worker)',
  }).finally(() => { offscreenCreating = null; });
  return offscreenCreating;
}

/**
 * Send extraction request to the offscreen document (which has DOM access).
 */
async function extractViaOffscreen(extractionOptions) {
  await ensureOffscreen();
  const response = await chrome.runtime.sendMessage({
    target: 'offscreen',
    action: 'extract',
    options: extractionOptions,
  });
  if (!response?.success) {
    throw new Error(response?.error || 'Offscreen extraction failed');
  }
  return response.result;
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
    case 'dom-picker':
      await handleStartDomPicker(tab);
      break;
  }
});

// ── Message Router (synchronous registration) ──
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  // Ignore messages meant for offscreen document
  if (message.target === 'offscreen') return;

  if (message.action === 'extractFromPopup') {
    handleExtractFromPopup(message.options)
      .then((result) => sendResponse(result))
      .catch((err) => sendResponse({ success: false, error: err.message }));
    return true; // Async
  }

  if (message.action === 'extractionResult') {
    // Relay extraction result to the side panel (it listens for this message)
    // No sendResponse needed — fire and forget
    return;
  }

  if (message.action === 'openSidePanel') {
    chrome.sidePanel.open({ tabId: sender.tab?.id || message.tabId });
    sendResponse({ success: true });
    return true;
  }

  if (message.action === 'pickerResult') {
    // DOM Picker captured an element — extract it
    handlePickerResult(message.data)
      .then((result) => sendResponse(result))
      .catch((err) => sendResponse({ success: false, error: err.message }));
    return true;
  }

  if (message.action === 'pickerCancelled') {
    // DOM Picker was cancelled — no action needed
    return;
  }

  // ── MCP Bridge Messages ──
  if (message.action === 'enableMcpBridge') {
    storage.set({ mcpBridgeEnabled: true })
      .then(() => {
        chrome.alarms.create('mcp-reconnect', { periodInMinutes: 0.5 });
        return connectMcpBridge();
      })
      .then(() => sendResponse({ success: true }))
      .catch((err) => sendResponse({ success: false, error: err.message }));
    return true;
  }

  if (message.action === 'disableMcpBridge') {
    storage.set({ mcpBridgeEnabled: false })
      .then(() => {
        disconnectMcpBridge();
        chrome.alarms.clear('mcp-reconnect');
        sendResponse({ success: true });
      })
      .catch((err) => sendResponse({ success: false, error: err.message }));
    return true;
  }

  if (message.action === 'getMcpStatus') {
    sendResponse({ connected: mcpSocket?.readyState === WebSocket.OPEN });
    return;
  }

});

// ── Side Panel Behavior (synchronous) ──
chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: false }).catch(() => { });

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
    case 'decant-dom-picker':
      await handleStartDomPicker(tab);
      break;
  }
});

// ── Install handler ──
chrome.runtime.onInstalled.addListener((details) => {
  // Remove existing menus first to avoid duplicate-id errors on update/reload
  chrome.contextMenus.removeAll(() => {
    // Create context menu items
    chrome.contextMenus.create({
      id: 'decant-parent',
      title: 'Decant',
      contexts: ['selection', 'page'],
    });
    chrome.contextMenus.create({
      id: 'decant-extract-selection',
      parentId: 'decant-parent',
      title: chrome.i18n.getMessage('ctxExtractSelection'),
      contexts: ['selection'],
    });
    chrome.contextMenus.create({
      id: 'decant-extract-page',
      parentId: 'decant-parent',
      title: chrome.i18n.getMessage('ctxExtractPage'),
      contexts: ['page', 'selection'],
    });
    chrome.contextMenus.create({
      id: 'decant-copy-for-ai',
      parentId: 'decant-parent',
      title: chrome.i18n.getMessage('ctxCopyForAI'),
      contexts: ['page', 'selection'],
    });
    chrome.contextMenus.create({
      id: 'decant-dom-picker',
      parentId: 'decant-parent',
      title: chrome.i18n.getMessage('ctxDomPicker'),
      contexts: ['page', 'selection'],
    });
  }); // end removeAll callback

  if (details.reason === 'install') {
    // Initialize defaults on first install
    storage.getAll();
    // Open onboarding page
    chrome.tabs.create({ url: chrome.runtime.getURL('src/onboarding/welcome.html') });
  }

  // Set up NPS check alarm (once daily)
  chrome.alarms.create('decant-nps-check', { periodInMinutes: 1440 });

  // MCP Bridge reconnect (every 30s)
  chrome.alarms.create('mcp-reconnect', { periodInMinutes: 0.5 });
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

  if (alarm.name === 'mcp-reconnect') {
    if (!mcpSocket || mcpSocket.readyState !== WebSocket.OPEN) {
      connectMcpBridge();
    }
  }
});

// ── Core Extraction Logic ──
async function handleExtract(tab, prefs) {
  try {
    const pageData = await sendToContentScript(tab.id, {
      action: 'extract',
      options: prefs,
    }, tab.url);

    if (!pageData.success) throw new Error(pageData.error);

    // Delegate parsing to offscreen document (has DOM access)
    const result = await extractViaOffscreen({
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

  const pageData = await sendToContentScript(tab.id, {
    action: 'extract',
    options,
  }, tab.url);

  if (!pageData.success) throw new Error(pageData.error);

  // Delegate parsing to offscreen document (has DOM access)
  const result = await extractViaOffscreen({
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
    // Sanitize selection to prevent XSS before wrapping in HTML
    const safe = sanitizeHTML(selectionText);
    const html = `<html><body><article>${safe}</article></body></html>`;
    const result = await extractViaOffscreen({
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
    if (selectionText) {
      // Sanitize selection to prevent XSS before wrapping in HTML
      const safe = sanitizeHTML(selectionText);
      const html = `<html><body><article>${safe}</article></body></html>`;
      const result = await extractViaOffscreen({
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

// ── DOM Picker ──
async function handleStartDomPicker(tab) {
  try {
    if (!isInjectableUrl(tab.url)) {
      throw new Error('PAGE_NOT_EXTRACTABLE');
    }
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ['src/content/dom-picker.js'],
    });
  } catch (error) {
    console.error('[Decant] DOM Picker injection failed:', error);
    await logError('handleStartDomPicker', error);
  }
}

async function handlePickerResult(data) {
  if (!data?.html) throw new Error('No HTML captured by picker');

  const prefs = await storage.getPreferences();

  // Extract the captured element using the offscreen document
  const result = await extractViaOffscreen({
    html: data.html,
    url: data.url,
    title: data.title,
    format: prefs.format,
    includeImages: prefs.includeImages,
    detectTables: prefs.detectTables,
    smartExtract: prefs.smartExtract,
    fullPage: true, // Skip Readability — we already have the targeted element
  });

  // Track extraction
  await storage.incrementExtractions();
  await storage.addToHistory({
    url: data.url,
    title: `[Picked] ${data.title}`,
    domain: data.domain,
    format: prefs.format,
    wordCount: result.metadata.wordCount,
  });

  // Copy result to clipboard via the content script on the active tab
  const tab = await getActiveTab();
  if (tab) {
    try {
      await sendToContentScript(tab.id, {
        action: 'copyToClipboard',
        text: result.output,
      });
    } catch {
      // Clipboard copy failed silently — user can still use the result from side panel
    }

    // Auto-open the side panel so the user can see the extraction result
    try {
      await chrome.sidePanel.open({ tabId: tab.id });
    } catch {
      // Side panel API may not be available or may fail — non-critical
    }
  }

  // Relay result to side panel (with a small delay to let it initialize if just opened)
  setTimeout(() => {
    chrome.runtime.sendMessage({
      action: 'extractionResult',
      result,
    }).catch(() => { /* side panel may not be open */ });
  }, 300);

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

async function sendToContentScript(tabId, message, tabUrl) {
  return withRetry(async () => {
    try {
      return await chrome.tabs.sendMessage(tabId, message);
    } catch (err) {
      if (tabUrl && !isInjectableUrl(tabUrl)) {
        throw new Error('PAGE_NOT_EXTRACTABLE');
      }
      // Content script may not be injected yet — inject it
      await chrome.scripting.executeScript({
        target: { tabId },
        files: ['src/content/extractor.js'],
      });
      // Small delay to let the content script register its listeners
      await new Promise((r) => setTimeout(r, 150));
      return await chrome.tabs.sendMessage(tabId, message);
    }
  }, 2);
}

// ── MCP Bridge ──
const MCP_WS_URL = 'ws://localhost:22816';

async function connectMcpBridge() {
  // Guard: skip if already connected or connecting
  if (mcpSocket?.readyState === WebSocket.OPEN) return;
  if (mcpSocket?.readyState === WebSocket.CONNECTING) return;

  // Guard: skip if not enabled
  const { mcpBridgeEnabled } = await storage.get('mcpBridgeEnabled');
  if (!mcpBridgeEnabled) return;

  try {
    const ws = new WebSocket(MCP_WS_URL + '?decantId=' + chrome.runtime.id);
    mcpSocket = ws;

    ws.addEventListener('open', () => {
      console.log('[Decant] MCP bridge connected');
    });

    ws.addEventListener('message', (event) => {
      let msg;
      try {
        msg = JSON.parse(event.data);
      } catch {
        console.warn('[Decant] Invalid JSON from MCP bridge');
        return;
      }
      handleMcpMessage(msg, ws);
    });

    ws.addEventListener('close', () => {
      if (mcpSocket === ws) mcpSocket = null;
      console.log('[Decant] MCP bridge disconnected');
    });

    ws.addEventListener('error', () => {
      if (mcpSocket === ws) mcpSocket = null;
      // Connection refused is expected when MCP server isn't running — silent
    });
  } catch (err) {
    console.warn('[Decant] MCP bridge connection failed:', err.message);
    mcpSocket = null;
  }
}

function disconnectMcpBridge() {
  if (mcpSocket) {
    mcpSocket.close(1000, 'Bridge disabled');
    mcpSocket = null;
  }
}

function handleMcpMessage(msg, ws) {
  switch (msg.type) {
    case 'ping':
      ws.send(JSON.stringify({ type: 'pong' }));
      break;

    case 'welcome':
      console.log(`[Decant] MCP server v${msg.version}, tools: ${msg.tools?.join(', ')}`);
      break;

    case 'command':
      handleMcpCommand(msg)
        .then((result) => {
          ws.send(JSON.stringify({ id: msg.id, result }));
        })
        .catch((err) => {
          ws.send(JSON.stringify({ id: msg.id, error: err.message }));
        });
      break;

    default:
      console.warn('[Decant] Unknown MCP message type:', msg.type);
  }
}

async function handleMcpCommand(msg) {
  const params = msg.params || {};

  switch (msg.action) {
    case 'listTabs': {
      const tabs = await chrome.tabs.query({ currentWindow: true });
      return tabs
        .filter((t) => isInjectableUrl(t.url))
        .map((t) => ({ id: t.id, title: t.title, url: t.url, active: t.active }));
    }

    case 'extractActiveTab': {
      const tab = await getActiveTab();
      if (!tab) return { success: false, error: 'No active tab found' };
      return mcpExtractTab(tab, params);
    }

    case 'extractTab': {
      if (params.tabId == null) return { success: false, error: 'tabId is required' };
      let tab;
      try {
        tab = await chrome.tabs.get(params.tabId);
      } catch {
        return { success: false, error: `Tab ${params.tabId} not found` };
      }
      if (!tab) return { success: false, error: `Tab ${params.tabId} not found` };
      return mcpExtractTab(tab, params);
    }

    case 'extractUrl': {
      if (!params.url) return { success: false, error: 'url is required' };
      return mcpExtractUrl(params);
    }

    default:
      return { success: false, error: `Unknown action: ${msg.action}` };
  }
}

/**
 * Shared extraction logic for MCP commands.
 * Injects content script, grabs raw HTML, parses via offscreen doc.
 */
async function mcpExtractTab(tab, params) {
  if (!isInjectableUrl(tab.url)) {
    return { success: false, error: `Page not extractable: ${tab.url}` };
  }

  const format = params.format || 'markdown';
  const fullPage = params.fullPage ?? false;

  try {
    // 1. Get raw HTML from the content script
    const pageData = await sendToContentScript(tab.id, {
      action: 'extract',
      options: { format, fullPage, includeImages: true, detectTables: true, smartExtract: true },
    }, tab.url);

    if (!pageData?.success) {
      return { success: false, error: pageData?.error || 'Content script extraction failed' };
    }

    // 2. Parse via offscreen document (Readability + Turndown)
    const result = await extractViaOffscreen({
      ...pageData.data,
      format,
      fullPage,
      includeImages: true,
      detectTables: true,
      smartExtract: !fullPage,
    });

    // 3. Track extraction
    await storage.incrementExtractions();
    await storage.addToHistory({
      url: pageData.data.url,
      title: pageData.data.title,
      domain: pageData.data.domain,
      format,
      wordCount: result.metadata.wordCount,
    });

    return { success: true, data: result };
  } catch (err) {
    console.error('[Decant] MCP extraction failed:', err);
    await logError('mcpExtractTab', err);
    return { success: false, error: err.message };
  }
}

/**
 * Open a URL in a background tab, wait for load, extract, then close the tab.
 * Full lifecycle: create → wait for complete → extract → destroy.
 */
async function mcpExtractUrl(params) {
  const { url, format = 'markdown', fullPage = false } = params;

  // Security: block non-injectable URLs
  if (!isInjectableUrl(url)) {
    return {
      success: false,
      error: `This URL cannot be accessed by Chrome extensions: ${url}`,
    };
  }

  let tabId = null;
  try {
    // 1. Open tab in background
    const tab = await chrome.tabs.create({ url, active: false });
    tabId = tab.id;

    // 2. Wait for the page to finish loading (complete status)
    await waitForTabLoad(tabId, 30_000);

    // 3. Small settle delay for JS-heavy pages to finish rendering
    await new Promise((r) => setTimeout(r, 500));

    // 4. Extract using existing pipeline
    const result = await mcpExtractTab({ id: tabId, url }, { format, fullPage });

    // 5. Close the tab (always, even on extraction failure)
    try { await chrome.tabs.remove(tabId); } catch { /* tab may already be closed */ }
    tabId = null;

    return result;
  } catch (err) {
    // Cleanup: close tab if still open
    if (tabId) {
      try { await chrome.tabs.remove(tabId); } catch { /* ignore */ }
    }
    console.error('[Decant] MCP extractUrl failed:', err);
    await logError('mcpExtractUrl', err);
    return { success: false, error: err.message };
  }
}

/**
 * Wait for a tab to reach 'complete' loading status.
 * Resolves when the tab fires onUpdated with status === 'complete'.
 * Rejects on timeout or if the tab is closed before loading.
 */
function waitForTabLoad(tabId, timeoutMs) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      chrome.tabs.onUpdated.removeListener(onUpdated);
      chrome.tabs.onRemoved.removeListener(onRemoved);
      reject(new Error('Page load timed out'));
    }, timeoutMs);

    function onUpdated(updatedTabId, changeInfo) {
      if (updatedTabId === tabId && changeInfo.status === 'complete') {
        clearTimeout(timer);
        chrome.tabs.onUpdated.removeListener(onUpdated);
        chrome.tabs.onRemoved.removeListener(onRemoved);
        resolve();
      }
    }

    function onRemoved(removedTabId) {
      if (removedTabId === tabId) {
        clearTimeout(timer);
        chrome.tabs.onUpdated.removeListener(onUpdated);
        chrome.tabs.onRemoved.removeListener(onRemoved);
        reject(new Error('Tab was closed before loading completed'));
      }
    }

    chrome.tabs.onUpdated.addListener(onUpdated);
    chrome.tabs.onRemoved.addListener(onRemoved);

    // Check if already loaded (race condition: tab may have loaded instantly)
    chrome.tabs.get(tabId).then((tab) => {
      if (tab.status === 'complete') {
        clearTimeout(timer);
        chrome.tabs.onUpdated.removeListener(onUpdated);
        chrome.tabs.onRemoved.removeListener(onRemoved);
        resolve();
      }
    }).catch(() => {
      // Tab gone already
      clearTimeout(timer);
      chrome.tabs.onUpdated.removeListener(onUpdated);
      chrome.tabs.onRemoved.removeListener(onRemoved);
      reject(new Error('Tab not found'));
    });
  });
}

// ── Auto-connect on service worker startup ──
(async () => {
  const { mcpBridgeEnabled } = await storage.get('mcpBridgeEnabled');
  if (mcpBridgeEnabled) {
    connectMcpBridge();
  }
})();
