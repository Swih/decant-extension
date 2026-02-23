/**
 * Selection mode — allows users to select a specific zone of the page.
 * Activated via the popup or keyboard shortcut.
 */

let isSelecting = false;
let overlay = null;
let highlightedEl = null;
let previousOutline = '';

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'startSelection') {
    startSelectionMode();
    sendResponse({ success: true });
    return true;
  }

  if (message.action === 'cancelSelection') {
    cancelSelectionMode();
    sendResponse({ success: true });
    return true;
  }
});

function startSelectionMode() {
  if (isSelecting) return;
  isSelecting = true;

  // Create overlay with instructions
  overlay = document.createElement('div');
  overlay.id = 'decant-selection-overlay';
  overlay.innerHTML = `
    <div style="
      position: fixed;
      top: 16px;
      left: 50%;
      transform: translateX(-50%);
      background: rgba(15, 15, 20, 0.9);
      backdrop-filter: blur(16px);
      color: #E8E8ED;
      padding: 10px 20px;
      border-radius: 12px;
      font-family: -apple-system, sans-serif;
      font-size: 13px;
      z-index: 2147483647;
      border: 1px solid rgba(139, 92, 246, 0.4);
      box-shadow: 0 4px 24px rgba(0, 0, 0, 0.4);
      pointer-events: none;
    ">
      Click an element to extract it. Press <kbd style="
        background: rgba(255,255,255,0.1);
        padding: 2px 6px;
        border-radius: 4px;
        font-size: 11px;
      ">Esc</kbd> to cancel.
    </div>
  `;
  document.body.appendChild(overlay);

  document.addEventListener('mouseover', onHover, true);
  document.addEventListener('mouseout', onHoverOut, true);
  document.addEventListener('click', onClick, true);
  document.addEventListener('keydown', onKeyDown, true);
}

function cancelSelectionMode() {
  if (!isSelecting) return;
  isSelecting = false;

  if (overlay) {
    overlay.remove();
    overlay = null;
  }

  clearHighlight();

  document.removeEventListener('mouseover', onHover, true);
  document.removeEventListener('mouseout', onHoverOut, true);
  document.removeEventListener('click', onClick, true);
  document.removeEventListener('keydown', onKeyDown, true);
}

function onHover(e) {
  if (!isSelecting) return;
  clearHighlight();
  highlightedEl = e.target;
  previousOutline = highlightedEl.style.outline;
  highlightedEl.style.outline = '2px solid rgba(139, 92, 246, 0.8)';
  highlightedEl.style.outlineOffset = '2px';
}

function onHoverOut(_e) {
  clearHighlight();
}

function onClick(e) {
  if (!isSelecting) return;
  e.preventDefault();
  e.stopPropagation();

  const target = e.target;
  const html = target.outerHTML;

  cancelSelectionMode();

  // Send the selected element back
  chrome.runtime.sendMessage({
    action: 'selectionComplete',
    data: {
      html,
      url: window.location.href,
      title: document.title,
      domain: window.location.hostname,
    },
  });
}

function onKeyDown(e) {
  if (e.key === 'Escape') {
    cancelSelectionMode();
  }
}

function clearHighlight() {
  if (highlightedEl) {
    highlightedEl.style.outline = previousOutline;
    highlightedEl = null;
    previousOutline = '';
  }
}
