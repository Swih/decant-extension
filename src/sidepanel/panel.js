/**
 * Side panel logic — extended view with live preview and tabs.
 */
import '../components/toast.js';
import '../components/format-toggle.js';
import { copyToClipboard } from '../utils/clipboard.js';
import { downloadFile, sanitizeFilename } from '../utils/download.js';
import * as storage from '../utils/storage.js';
import { escapeHtml, escapeAttr } from '../utils/html.js';
import { timeAgo } from '../utils/time.js';
import { applyI18n } from '../utils/i18n-apply.js';

const $ = (id) => document.getElementById(id);
const msg = (key) => chrome.i18n?.getMessage(key) || key;
const toast = $('toast');
let currentData = null;
let currentFormat = 'markdown';

// ── Init ──
async function init() {
  applyI18n();
  const prefs = await storage.getPreferences();
  currentFormat = prefs.format;
  // RTL detection
  const lang = chrome.i18n?.getUILanguage?.() || '';
  if (lang.startsWith('ar')) {
    document.documentElement.dir = 'rtl';
  }

  document.documentElement.dataset.theme = prefs.theme;

  const formatToggle = $('formatToggle');
  if (formatToggle) formatToggle.value = currentFormat;

  setupTabs();
  setupEvents();
  loadHistory();

  // Listen for extraction results from background
  chrome.runtime.onMessage.addListener((message) => {
    if (message.action === 'extractionResult' && message.result) {
      displayResult(message.result);
    }
  });
}

function setupTabs() {
  document.querySelectorAll('.tab').forEach((tab) => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.tab').forEach((t) => t.classList.remove('active'));
      document.querySelectorAll('.tab-panel').forEach((p) => p.classList.remove('active'));
      tab.classList.add('active');
      const panel = document.getElementById(`tab-${tab.dataset.tab}`);
      if (panel) panel.classList.add('active');
    });
  });
}

function setupEvents() {
  // Copy
  $('copyBtn')?.addEventListener('click', async () => {
    if (!currentData) return;
    const ok = await copyToClipboard(currentData.output);
    toast.show(ok ? msg('toastCopied') : msg('copyFailed'), ok ? 'success' : 'error');
  });

  // Save
  $('saveBtn')?.addEventListener('click', () => {
    if (!currentData) return;
    const filename = sanitizeFilename(currentData.metadata?.title || 'decant-export');
    downloadFile(currentData.output, filename, currentFormat);
    toast.show(msg('toastSaved'), 'success');
  });

  // Format toggle
  $('formatToggle')?.addEventListener('format-change', (e) => {
    currentFormat = e.detail.format;
    storage.setPreference('format', currentFormat);
  });

  // Theme
  $('themeToggle')?.addEventListener('click', async () => {
    const current = document.documentElement.dataset.theme;
    const next = current === 'dark' ? 'light' : 'dark';
    document.documentElement.dataset.theme = next;
    await storage.setPreference('theme', next);
  });
}

function displayResult(result) {
  currentData = result;

  // Content tab
  const editor = $('contentEditor');
  if (editor) {
    editor.innerHTML = `<pre>${escapeHtml(result.output)}</pre>`;
  }

  // Tables tab
  const tablesPanel = $('tab-tables');
  if (tablesPanel && result.metadata?.tables > 0) {
    // We'd need to re-parse tables — for now show from JSON output
    tablesPanel.innerHTML =
      `<p style="padding: 16px; color: var(--text-secondary); font-size: 13px;">${msg('tablesInContent')}</p>`;
  }

  // Data tab
  const dataPanel = $('tab-data');
  if (dataPanel && result.metadata?.smartData) {
    const sd = result.metadata.smartData;
    let html = '';

    if (sd.emails?.length) {
      html += buildDataSection(msg('dataEmails'), sd.emails);
    }
    if (sd.dates?.length) {
      html += buildDataSection(msg('dataDates'), sd.dates);
    }
    if (sd.prices?.length) {
      html += buildDataSection(msg('dataPrices'), sd.prices);
    }
    if (sd.phones?.length) {
      html += buildDataSection(msg('dataPhones'), sd.phones);
    }

    dataPanel.innerHTML = html || `<div class="empty-state"><p>${msg('noDataFound')}</p></div>`;
  }
}

function buildDataSection(label, items) {
  return `
    <div class="data-section">
      <div class="data-label">${label}</div>
      <div class="data-items">
        ${items.map((item) => `<span class="data-chip" title="Click to copy">${escapeHtml(item)}</span>`).join('')}
      </div>
    </div>
  `;
}

async function loadHistory() {
  const history = await storage.getHistory();
  const container = $('historyFull');
  if (!container) return;

  if (history.length === 0) {
    container.innerHTML = `<div class="empty-state"><p>${msg('emptyHistory')}</p></div>`;
    return;
  }

  container.innerHTML = history
    .map(
      (item) => `
    <div class="history-full-item" data-url="${escapeAttr(item.url)}">
      <div>
        <div class="domain">${escapeHtml(item.domain)}</div>
        <div class="title">${escapeHtml(item.title || '')}</div>
      </div>
      <div class="meta">${timeAgo(item.timestamp)}</div>
    </div>
  `,
    )
    .join('');

  // Data chip copy
  container.addEventListener('click', (e) => {
    const chip = e.target.closest('.data-chip');
    if (chip) {
      copyToClipboard(chip.textContent);
      toast.show(msg('toastCopied'), 'success');
      return;
    }
    const item = e.target.closest('.history-full-item');
    if (item?.dataset.url) {
      chrome.tabs.create({ url: item.dataset.url });
    }
  });
}

init();
