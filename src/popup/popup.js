/**
 * Popup main logic — orchestrates UI, extraction, and user interactions.
 */
import '../components/toast.js';
import '../components/format-toggle.js';
import '../components/preview-card.js';
import '../components/feedback-widget.js';
import '../components/rating-prompt.js';
import '../feedback/nps.js';
import { copyToClipboard } from '../utils/clipboard.js';
import { downloadFile, sanitizeFilename } from '../utils/download.js';
import * as storage from '../utils/storage.js';
import { escapeHtml, escapeAttr } from '../utils/html.js';
import { timeAgo } from '../utils/time.js';
import { extract } from '../core/parser.js';
import {
  shouldShowFeedback,
  shouldShowRating,
  shouldShowNPS,
  saveFeedback,
  saveRatingResponse,
  saveNPS,
} from '../feedback/collector.js';
import { trackExtraction } from '../feedback/analytics.js';
import { applyI18n } from '../utils/i18n-apply.js';
import { STORE_URL, SITE_URL, isPublished } from '../utils/config.js';
import { isInjectableUrl } from '../utils/url.js';

// ── i18n helper ──
const msg = (key) => chrome.i18n?.getMessage(key) || key;

// ── DOM References ──
const $ = (id) => document.getElementById(id);

const toast = $('toast');
const extractBtn = $('extractBtn');
const extractText = $('extractText');
const extractIcon = $('extractIcon');
const progressBar = $('progressBar');
const progressFill = $('progressFill');
const formatToggle = $('formatToggle');
const preview = $('preview');
const previewSection = $('previewSection');
const actionRow = $('actionRow');
const copyBtn = $('copyBtn');
const saveBtn = $('saveBtn');
const pageTitle = $('pageTitle');
const wordCount = $('wordCount');
const imageCount = $('imageCount');
const historyList = $('historyList');
const themeToggle = $('themeToggle');
const helpLink = $('helpLink');
const feedbackArea = $('feedbackArea');
const feedbackLink = $('feedbackLink');
const rateLink = $('rateLink');
const optImages = $('optImages');
const optTables = $('optTables');
const optSmartExtract = $('optSmartExtract');
const optFullPage = $('optFullPage');
const pickerBtn = $('pickerBtn');
const batchToggle = $('batchToggle');
const batchPanel = $('batchPanel');
const batchAllBtn = $('batchAllBtn');
const batchDownloadBtn = $('batchDownloadBtn');
const batchProgress = $('batchProgress');
const batchProgressText = $('batchProgressText');
const batchProgressFill = $('batchProgressFill');
const mcpToggle = $('mcpToggle');
const mcpStatus = $('mcpStatus');

// ── State ──
let currentResult = null;
let currentFormat = 'markdown';
let cachedPageData = null;
let batchResults = [];

// ── Init ──
async function init() {
  // Translate static DOM strings
  applyI18n();

  // Clear any error/notification badge
  chrome.action?.setBadgeText?.({ text: '' });

  // Load preferences
  const prefs = await storage.getPreferences();
  currentFormat = prefs.format;
  formatToggle.value = currentFormat;
  optImages.checked = prefs.includeImages;
  optTables.checked = prefs.detectTables;
  optSmartExtract.checked = prefs.smartExtract;
  optFullPage.checked = prefs.fullPage;

  // RTL detection
  const lang = chrome.i18n?.getUILanguage?.() || '';
  if (lang.startsWith('ar')) {
    document.documentElement.dir = 'rtl';
  }

  // Apply theme
  document.documentElement.dataset.theme = prefs.theme;
  updateThemeIcon(prefs.theme);

  // MCP Bridge status
  await initMcpBridge();

  // Get current page info
  await loadPageInfo();

  // Load history
  await loadHistory();

  // Check feedback triggers
  await checkFeedbackTriggers();

  // Setup event listeners
  setupEvents();
}

async function loadPageInfo() {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab) return;

    if (!isInjectableUrl(tab.url)) {
      setFavicon(tab.url);
      pageTitle.textContent = msg('pageNotExtractable');
      pageTitle.title = tab.url;
      wordCount.textContent = `-- ${msg('words')}`;
      imageCount.textContent = `-- ${msg('images')}`;
      return;
    }

    // Set favicon
    setFavicon(tab.url);

    // Try to get info from content script
    try {
      const response = await chrome.tabs.sendMessage(tab.id, { action: 'getPageInfo' });
      if (response?.success) {
        pageTitle.textContent = response.data.title || msg('untitled');
        pageTitle.title = response.data.title || '';
        wordCount.textContent = `${formatNumber(response.data.wordCount)} ${msg('words')}`;
        imageCount.textContent = `${response.data.imageCount} ${msg('images')}`;
        return;
      }
    } catch {
      // Content script not yet injected
    }

    // Fallback: use tab info
    pageTitle.textContent = tab.title || msg('untitled');
    pageTitle.title = tab.title || '';
    wordCount.textContent = `-- ${msg('words')}`;
    imageCount.textContent = `-- ${msg('images')}`;
  } catch {
    pageTitle.textContent = msg('pageReadError');
  }
}

async function loadHistory() {
  const history = await storage.getHistory();
  if (history.length === 0) {
    historyList.innerHTML = `<div class="history-empty">${msg('historyEmpty')}</div>`;
    return;
  }

  historyList.innerHTML = history
    .slice(0, 5)
    .map(
      (item, i) => `
    <div class="history-item animate-slide-up stagger-${i + 1}" data-url="${escapeAttr(item.url)}" title="${escapeAttr(item.title)}">
      <img class="history-favicon" src="${faviconUrl(item.domain)}" width="14" height="14" alt="" />
      <span class="history-domain">${escapeHtml(item.domain)}</span>
      <span class="history-time">${timeAgo(item.timestamp)}</span>
    </div>
  `,
    )
    .join('');
}

function setupEvents() {
  // Extract button
  extractBtn.addEventListener('click', handleExtract);

  // Format change — re-parse locally without adding to history
  formatToggle.addEventListener('format-change', (e) => {
    currentFormat = e.detail.format;
    storage.setPreference('format', currentFormat);
    if (cachedPageData) {
      const options = {
        format: currentFormat,
        includeImages: optImages.checked,
        detectTables: optTables.checked,
        smartExtract: optSmartExtract.checked,
        fullPage: optFullPage.checked,
      };
      currentResult = extract({ ...cachedPageData, ...options });
      preview.setAttribute('format', currentFormat);
      preview.content = currentResult.output;
    }
  });

  // Copy
  copyBtn.addEventListener('click', async () => {
    if (!currentResult) return;
    const ok = await copyToClipboard(currentResult.output);
    toast.show(
      ok ? msg('toastCopied') : msg('copyFailed'),
      ok ? 'success' : 'error',
    );
  });

  // Save
  saveBtn.addEventListener('click', () => {
    if (!currentResult) return;
    const filename = sanitizeFilename(currentResult.metadata.title || 'decant-export');
    downloadFile(currentResult.output, filename, currentFormat);
    toast.show(msg('toastSaved'), 'success');
  });

  // Help link
  helpLink.addEventListener('click', () => {
    chrome.tabs.create({ url: SITE_URL + '/help' });
  });

  // Theme toggle
  themeToggle.addEventListener('click', async () => {
    const current = document.documentElement.dataset.theme;
    const next = current === 'dark' ? 'light' : 'dark';
    document.documentElement.dataset.theme = next;
    updateThemeIcon(next);
    await storage.setPreference('theme', next);
  });

  // Options — save on change
  optImages.addEventListener('change', () =>
    storage.setPreference('includeImages', optImages.checked),
  );
  optTables.addEventListener('change', () =>
    storage.setPreference('detectTables', optTables.checked),
  );
  optSmartExtract.addEventListener('change', () =>
    storage.setPreference('smartExtract', optSmartExtract.checked),
  );
  optFullPage.addEventListener('change', () =>
    storage.setPreference('fullPage', optFullPage.checked),
  );

  // MCP Bridge toggle
  mcpToggle.addEventListener('change', handleMcpToggle);

  // DOM Picker button
  pickerBtn.addEventListener('click', handleStartPicker);

  // Batch Extract toggle
  const toggleBatch = () => {
    const expanded = batchToggle.getAttribute('aria-expanded') === 'true';
    batchToggle.setAttribute('aria-expanded', String(!expanded));
    batchPanel.hidden = expanded;
  };
  batchToggle.addEventListener('click', toggleBatch);
  batchToggle.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleBatch(); }
  });

  // Batch Extract All
  batchAllBtn.addEventListener('click', handleBatchExtract);

  // Batch Download All
  batchDownloadBtn.addEventListener('click', handleBatchDownload);

  // History item click
  historyList.addEventListener('click', (e) => {
    const item = e.target.closest('.history-item');
    if (item?.dataset.url) {
      chrome.tabs.create({ url: item.dataset.url });
    }
  });

  // Feedback
  feedbackLink.addEventListener('click', () => showFeedbackWidget());

  // Rate link
  rateLink.addEventListener('click', () => {
    if (isPublished()) {
      chrome.tabs.create({ url: STORE_URL });
    } else {
      toast.show(msg('rateNotYet'), 'info');
    }
  });

  // Feedback events
  feedbackArea.addEventListener('feedback-submit', async (e) => {
    await saveFeedback(e.detail.rating, e.detail.comment);
    toast.show(msg('feedbackThanks'), 'success');
  });

  feedbackArea.addEventListener('feedback-dismiss', async () => {
    await storage.set({ feedbackDismissed: true });
  });

  feedbackArea.addEventListener('rating-accept', async () => {
    await saveRatingResponse(true);
  });

  feedbackArea.addEventListener('rating-dismiss', async () => {
    await saveRatingResponse(false);
  });

  feedbackArea.addEventListener('nps-submit', async (e) => {
    await saveNPS(e.detail.score);
  });
}

// ── Extraction ──
async function handleExtract() {
  // UI: loading state
  setButtonState('loading');
  showProgress();

  try {
    const options = {
      format: currentFormat,
      includeImages: optImages.checked,
      detectTables: optTables.checked,
      smartExtract: optSmartExtract.checked,
      fullPage: optFullPage.checked,
    };

    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab) throw new Error('No active tab');
    if (!isInjectableUrl(tab.url)) {
      toast.show(msg('pageNotExtractable'), 'error');
      setButtonState('error');
      hideProgress();
      setTimeout(() => setButtonState('default'), 2000);
      return;
    }

    // Get raw HTML from the content script
    let pageData;
    try {
      pageData = await chrome.tabs.sendMessage(tab.id, { action: 'extract', options });
    } catch {
      // Content script not injected yet — inject and retry
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ['src/content/extractor.js'],
      });
      await new Promise((r) => setTimeout(r, 150));
      pageData = await chrome.tabs.sendMessage(tab.id, { action: 'extract', options });
    }

    if (!pageData?.success) throw new Error(pageData?.error || 'Content script failed');

    // Cache raw page data for format switching without re-fetching
    cachedPageData = pageData.data;

    // Parse in the popup (has DOM access, unlike the service worker)
    currentResult = extract({ ...cachedPageData, ...options });

    // Track
    await storage.incrementExtractions();
    await storage.addToHistory({
      url: pageData.data.url,
      title: pageData.data.title,
      domain: pageData.data.domain,
      format: options.format,
      wordCount: currentResult.metadata.wordCount,
    });

    // UI: success state
    setButtonState('success');
    hideProgress();

    // Show preview
    preview.setAttribute('format', currentFormat);
    preview.content = currentResult.output;
    previewSection.style.display = 'block';
    previewSection.classList.add('animate-slide-up');

    // Show action buttons
    actionRow.style.display = 'flex';
    actionRow.classList.add('animate-slide-up');

    // Update page stats from extraction metadata
    wordCount.textContent = `${formatNumber(currentResult.metadata.wordCount)} ${msg('words')}`;
    imageCount.textContent = `${currentResult.metadata.imageCount} ${msg('images')}`;

    // Show token estimate (helps users gauge context window usage)
    if (currentResult.metadata.estimatedTokens) {
      const tokenSep = $('tokenSep');
      const tokenCountEl = $('tokenCount');
      tokenSep.style.display = '';
      tokenCountEl.style.display = '';
      tokenCountEl.textContent = `~${formatNumber(currentResult.metadata.estimatedTokens)} ${msg('tokens')}`;
    }

    // Send result to side panel via service worker
    chrome.runtime.sendMessage({
      action: 'extractionResult',
      result: currentResult,
    }).catch(() => { /* side panel may not be open */ });

    // Track analytics
    await trackExtraction(currentResult.metadata);

    // Reload history
    await loadHistory();

    // Reset button after delay
    setTimeout(() => setButtonState('default'), 2000);
  } catch (error) {
    console.error('[Decant] Extraction error:', error);
    setButtonState('error');
    hideProgress();
    toast.show(msg('toastError'), 'error');
    // Show retry state after error animation
    setTimeout(() => setButtonState('retry'), 2000);
  }
}

// ── DOM Picker ──
async function handleStartPicker() {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab) return;

    if (!isInjectableUrl(tab.url)) {
      toast.show(msg('pageNotExtractable'), 'error');
      return;
    }

    // Inject the DOM picker script
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ['src/content/dom-picker.js'],
    });

    // Close the popup so the user can interact with the page
    window.close();
  } catch (error) {
    console.error('[Decant] Picker injection error:', error);
    toast.show(msg('toastError'), 'error');
  }
}

// ── Batch Extract ──

/**
 * Check if we have the permissions needed for batch extraction.
 * activeTab only grants access to the SINGLE active tab.
 * To inject scripts into ALL tabs, we need tabs + <all_urls>.
 */
async function ensureBatchPermissions() {
  const has = await chrome.permissions.contains({
    permissions: ['tabs'],
    origins: ['<all_urls>'],
  });
  if (has) return true;

  // Request inside user gesture (click handler) — required by Chrome
  const granted = await chrome.permissions.request({
    permissions: ['tabs'],
    origins: ['<all_urls>'],
  });
  return granted;
}

async function handleBatchExtract() {
  try {
    // Step 1: Ensure we have cross-tab permissions
    const granted = await ensureBatchPermissions();
    if (!granted) {
      toast.show(msg('batchPermDenied'), 'error');
      return;
    }

    // Step 2: Query all tabs (now we have tabs permission → url/title accessible)
    const tabs = await chrome.tabs.query({ currentWindow: true });
    const extractableTabs = tabs.filter(
      (t) => t.url && isInjectableUrl(t.url),
    );

    if (extractableTabs.length === 0) {
      toast.show(msg('batchNoTabs'), 'error');
      return;
    }

    // Step 3: Show progress
    batchResults = [];
    batchProgress.hidden = false;
    batchAllBtn.disabled = true;
    batchDownloadBtn.disabled = true;
    const total = extractableTabs.length;

    const options = {
      format: currentFormat,
      includeImages: optImages.checked,
      detectTables: optTables.checked,
      smartExtract: optSmartExtract.checked,
      fullPage: optFullPage.checked,
    };

    // Step 4: Extract each tab sequentially (host_permissions → scripting API works)
    for (let i = 0; i < extractableTabs.length; i++) {
      const tab = extractableTabs[i];
      batchProgressText.textContent = `${i + 1} / ${total}`;
      batchProgressFill.style.width = `${((i + 1) / total) * 100}%`;

      try {
        // Inject content script if needed
        let pageData;
        try {
          pageData = await chrome.tabs.sendMessage(tab.id, { action: 'extract', options });
        } catch {
          await chrome.scripting.executeScript({
            target: { tabId: tab.id },
            files: ['src/content/extractor.js'],
          });
          await new Promise((r) => setTimeout(r, 150));
          pageData = await chrome.tabs.sendMessage(tab.id, { action: 'extract', options });
        }

        if (pageData?.success) {
          const result = extract({ ...pageData.data, ...options });
          batchResults.push({
            title: pageData.data.title || tab.title,
            url: pageData.data.url || tab.url,
            domain: pageData.data.domain || new URL(tab.url).hostname,
            output: result.output,
            metadata: result.metadata,
            format: currentFormat,
          });
        }
      } catch (err) {
        console.warn(`[Decant] Batch: skipped tab ${tab.url}:`, err.message);
      }
    }

    // Step 5: Done
    batchAllBtn.disabled = false;
    batchDownloadBtn.disabled = batchResults.length === 0;
    batchProgressText.textContent = `${batchResults.length} / ${total} ${msg('done')}`;

    if (batchResults.length > 0) {
      toast.show(`${batchResults.length} ${msg('batchDone')}`, 'success');
    } else {
      toast.show(msg('batchNoResults'), 'error');
    }
  } catch (error) {
    console.error('[Decant] Batch extract error:', error);
    toast.show(msg('toastError'), 'error');
    batchAllBtn.disabled = false;
  }
}

function handleBatchDownload() {
  if (batchResults.length === 0) return;

  const ext = { markdown: 'md', json: 'json', mcp: 'json' }[currentFormat] || 'txt';
  const separator = currentFormat === 'markdown' ? '\n\n---\n\n' : '\n';

  // Combine all results into a single file
  const combined = batchResults
    .map((r) => {
      if (currentFormat === 'markdown') {
        return `<!-- Source: ${r.url} -->\n${r.output}`;
      }
      return r.output;
    })
    .join(separator);

  const blob = new Blob([combined], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `decant-batch-${new Date().toISOString().slice(0, 10)}.${ext}`;
  a.click();
  URL.revokeObjectURL(url);
  toast.show(msg('toastSaved'), 'success');
}

// ── UI Helpers ──
function setButtonState(state) {
  extractBtn.className = 'extract-btn';

  switch (state) {
    case 'loading':
      extractBtn.classList.add('loading');
      extractIcon.innerHTML = '<div class="spinner"></div>';
      extractText.textContent = msg('extracting');
      break;

    case 'success':
      extractBtn.classList.add('success');
      extractIcon.innerHTML = `
        <svg class="checkmark" viewBox="0 0 24 24" fill="none">
          <path d="M5 12l5 5L20 7"/>
        </svg>`;
      extractText.textContent = msg('done');
      break;

    case 'error':
      extractBtn.classList.add('error');
      extractIcon.innerHTML = `
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10"/>
          <line x1="15" y1="9" x2="9" y2="15"/>
          <line x1="9" y1="9" x2="15" y2="15"/>
        </svg>`;
      extractText.textContent = msg('failed');
      break;

    case 'retry':
      extractIcon.innerHTML = `
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="23 4 23 10 17 10"/>
          <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
        </svg>`;
      extractText.textContent = msg('retry');
      break;

    default:
      extractIcon.innerHTML = `
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/>
          <polyline points="13 2 13 9 20 9"/>
        </svg>`;
      extractText.textContent = msg('btnExtract');
      break;
  }
}

function showProgress() {
  progressBar.classList.add('visible');
  progressFill.style.width = '0%';
  // Animate progress
  let progress = 0;
  const interval = setInterval(() => {
    progress += Math.random() * 15;
    if (progress >= 90) {
      clearInterval(interval);
      progress = 90;
    }
    progressFill.style.width = `${progress}%`;
  }, 100);
  progressBar._interval = interval;
}

function hideProgress() {
  if (progressBar._interval) clearInterval(progressBar._interval);
  progressFill.style.width = '100%';
  setTimeout(() => {
    progressBar.classList.remove('visible');
    progressFill.style.width = '0%';
  }, 300);
}

function updateThemeIcon(theme) {
  const icon = $('themeIcon');
  if (theme === 'dark') {
    icon.innerHTML = '<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>';
  } else {
    icon.innerHTML =
      '<circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>';
  }
}

async function checkFeedbackTriggers() {
  // Check feedback widget
  if (await shouldShowFeedback()) {
    showFeedbackWidget();
    return;
  }

  // Check rating prompt
  if (await shouldShowRating()) {
    const rating = document.createElement('dc-rating');
    feedbackArea.innerHTML = '';
    feedbackArea.appendChild(rating);
    return;
  }

  // Check NPS
  if (await shouldShowNPS()) {
    const nps = document.createElement('dc-nps');
    feedbackArea.innerHTML = '';
    feedbackArea.appendChild(nps);
  }
}

function showFeedbackWidget() {
  const widget = document.createElement('dc-feedback');
  feedbackArea.innerHTML = '';
  feedbackArea.appendChild(widget);
}

// ── MCP Bridge ──
async function initMcpBridge() {
  const { mcpBridgeEnabled } = await storage.get('mcpBridgeEnabled');
  mcpToggle.checked = mcpBridgeEnabled;

  // Query live connection status from the service worker
  if (mcpBridgeEnabled) {
    try {
      const response = await chrome.runtime.sendMessage({ action: 'getMcpStatus' });
      updateMcpStatus(response?.connected);
    } catch {
      updateMcpStatus(false);
    }
  } else {
    updateMcpStatus(false);
  }
}

async function handleMcpToggle() {
  const enabling = mcpToggle.checked;

  if (enabling) {
    // Request permissions dynamically (tabs + <all_urls> needed for cross-tab extraction)
    const granted = await chrome.permissions.contains({
      permissions: ['tabs'],
      origins: ['<all_urls>'],
    });

    if (!granted) {
      try {
        const ok = await chrome.permissions.request({
          permissions: ['tabs'],
          origins: ['<all_urls>'],
        });
        if (!ok) {
          mcpToggle.checked = false;
          toast.show(msg('mcpPermDenied'), 'error');
          return;
        }
      } catch {
        mcpToggle.checked = false;
        toast.show(msg('mcpPermDenied'), 'error');
        return;
      }
    }

    // Enable bridge
    chrome.runtime.sendMessage({ action: 'enableMcpBridge' });
    updateMcpStatus(false); // Will connect shortly

    // Poll for connection after a brief delay
    setTimeout(async () => {
      try {
        const response = await chrome.runtime.sendMessage({ action: 'getMcpStatus' });
        updateMcpStatus(response?.connected);
      } catch {
        updateMcpStatus(false);
      }
    }, 1500);
  } else {
    // Disable bridge
    chrome.runtime.sendMessage({ action: 'disableMcpBridge' });
    updateMcpStatus(false);
  }
}

function updateMcpStatus(connected) {
  if (connected) {
    mcpStatus.textContent = msg('mcpConnected');
    mcpStatus.className = 'mcp-status connected';
  } else if (mcpToggle.checked) {
    mcpStatus.textContent = msg('mcpDisconnected');
    mcpStatus.className = 'mcp-status disconnected';
  } else {
    mcpStatus.textContent = '';
    mcpStatus.className = 'mcp-status';
  }
}

// ── Utilities ──
function faviconUrl(urlOrDomain) {
  try {
    const domain = urlOrDomain.includes('://') ? new URL(urlOrDomain).hostname : urlOrDomain;
    return `https://www.google.com/s2/favicons?domain=${domain}&sz=32`;
  } catch {
    return '';
  }
}

function setFavicon(url) {
  const src = faviconUrl(url);
  if (!src) return;
  const img = $('pageFavicon');
  const fallback = $('pageFaviconFallback');
  img.src = src;
  img.onload = () => { img.style.display = ''; fallback.style.display = 'none'; };
}

function formatNumber(n) {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return String(n);
}

// ── Boot ──
init();
