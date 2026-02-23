/**
 * Options page logic — GDPR data export/delete.
 */
import { applyI18n } from '../utils/i18n-apply.js';

const msg = (key) => chrome.i18n?.getMessage(key) || key;
const $ = (id) => document.getElementById(id);

async function init() {
  applyI18n();

  // Apply theme
  const { preferences } = await chrome.storage.local.get('preferences');
  if (preferences?.theme) {
    document.documentElement.dataset.theme = preferences.theme;
  }

  // RTL detection
  const lang = chrome.i18n?.getUILanguage?.() || '';
  if (lang.startsWith('ar')) {
    document.documentElement.dir = 'rtl';
  }

  // Version
  const version = chrome.runtime.getManifest().version;
  $('versionText').textContent = `Decant v${version}`;

  // Export button
  $('exportBtn').addEventListener('click', handleExport);

  // Delete button
  $('deleteBtn').addEventListener('click', handleDelete);
}

async function handleExport() {
  const data = await chrome.storage.local.get(null);
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `decant-data-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

function handleDelete() {
  // Show confirmation dialog
  const overlay = document.createElement('div');
  overlay.className = 'confirm-overlay';
  overlay.innerHTML = `
    <div class="confirm-dialog" role="alertdialog" aria-label="Confirm deletion">
      <p>${msg('optionsDeleteConfirm')}</p>
      <div class="confirm-actions">
        <button class="btn btn-secondary" id="cancelDelete">${msg('optionsCancel')}</button>
        <button class="btn btn-danger" id="confirmDelete">${msg('optionsDeleteYes')}</button>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);

  overlay.querySelector('#cancelDelete').addEventListener('click', () => overlay.remove());
  overlay.querySelector('#confirmDelete').addEventListener('click', async () => {
    await chrome.storage.local.clear();
    overlay.remove();
    $('deleteBtn').textContent = msg('optionsDeleted');
    $('deleteBtn').disabled = true;
  });
}

init();
