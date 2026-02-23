/**
 * Preview card Web Component.
 * Shows extracted content preview with syntax highlighting for Markdown.
 */
import { escapeHtml } from '../utils/html.js';
import { copyToClipboard } from '../utils/clipboard.js';

class PreviewCard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this._content = '';
    this._format = 'markdown';
  }

  static get observedAttributes() {
    return ['format'];
  }

  attributeChangedCallback(name, oldVal, newVal) {
    if (name === 'format') {
      this._format = newVal;
      this.updateDisplay();
    }
  }

  set content(value) {
    this._content = value;
    this.updateDisplay();
  }

  get content() {
    return this._content;
  }

  connectedCallback() {
    this.render();
    this.shadowRoot.getElementById('copyBtn').addEventListener('click', () => this._handleCopy());
  }

  async _handleCopy() {
    if (!this._content) return;
    const btn = this.shadowRoot.getElementById('copyBtn');
    const ok = await copyToClipboard(this._content);
    if (ok) {
      btn.classList.add('copied');
      btn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`;
      setTimeout(() => {
        btn.classList.remove('copied');
        btn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>`;
      }, 1500);
    }
  }

  render() {
    this.shadowRoot.innerHTML = `
      <style>
        :host { display: block; }
        .preview {
          background: var(--bg-tertiary, #22222E);
          border: 1px solid var(--border, rgba(255,255,255,0.06));
          border-radius: 10px;
          overflow: hidden;
          max-height: 300px;
        }
        .preview-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 8px 12px;
          background: var(--bg-secondary, #1A1A24);
          border-bottom: 1px solid var(--border, rgba(255,255,255,0.06));
        }
        .preview-label {
          font-size: 11px;
          font-weight: 500;
          color: var(--text-tertiary, #5C5C6F);
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        .header-right {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .line-count {
          font-size: 10px;
          color: var(--text-tertiary, #5C5C6F);
        }
        .copy-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 24px;
          height: 24px;
          border: none;
          border-radius: 5px;
          background: transparent;
          color: var(--text-tertiary, #5C5C6F);
          cursor: pointer;
          transition: all 0.15s ease;
          padding: 0;
        }
        .copy-btn:hover {
          background: rgba(255,255,255,0.06);
          color: var(--text-primary, #E8E8ED);
        }
        .copy-btn.copied {
          color: var(--success, #10B981);
        }
        .preview-body {
          padding: 12px;
          overflow-y: auto;
          max-height: 260px;
          scrollbar-width: thin;
        }
        pre {
          margin: 0;
          white-space: pre-wrap;
          word-break: break-word;
          font-family: 'SF Mono', 'Fira Code', 'Cascadia Code', monospace;
          font-size: 11px;
          line-height: 1.6;
          color: var(--text-primary, #E8E8ED);
          tab-size: 2;
        }
        /* Basic syntax highlighting for markdown */
        .md-heading { color: #8B5CF6; font-weight: 600; }
        .md-bold { color: #E8E8ED; font-weight: 600; }
        .md-link { color: #06B6D4; }
        .md-code { color: #10B981; background: rgba(16,185,129,0.1); padding: 1px 4px; border-radius: 3px; }
        .md-blockquote { color: #8B8B9E; border-left: 2px solid #8B5CF6; padding-left: 8px; }
        .md-list { color: #F59E0B; }
        /* JSON highlighting */
        .json-key { color: #8B5CF6; }
        .json-string { color: #10B981; }
        .json-number { color: #06B6D4; }
        .json-bool { color: #F59E0B; }
        .json-null { color: #8B8B9E; }
      </style>
      <div class="preview" role="region" aria-label="Content preview">
        <div class="preview-header">
          <span class="preview-label" id="label">Preview</span>
          <div class="header-right">
            <span class="line-count" id="lineCount" aria-live="polite"></span>
            <button class="copy-btn" id="copyBtn" aria-label="Copy">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
              </svg>
            </button>
          </div>
        </div>
        <div class="preview-body" tabindex="0" aria-label="Extracted content">
          <pre id="code"></pre>
        </div>
      </div>
    `;
  }

  updateDisplay() {
    const code = this.shadowRoot.getElementById('code');
    const label = this.shadowRoot.getElementById('label');
    const lineCount = this.shadowRoot.getElementById('lineCount');
    if (!code) return;

    label.textContent = this._format.toUpperCase() + ' Preview';
    const lines = this._content.split('\n');
    lineCount.textContent = `${lines.length} lines`;

    if (this._format === 'json' || this._format === 'mcp') {
      code.innerHTML = highlightJSON(this._content);
    } else {
      code.innerHTML = highlightMarkdown(this._content);
    }
  }
}

function highlightMarkdown(text) {
  return escapeHtml(text)
    .replace(/^(#{1,6}\s.*)$/gm, '<span class="md-heading">$1</span>')
    .replace(/\*\*(.+?)\*\*/g, '<span class="md-bold">**$1**</span>')
    .replace(/`([^`]+)`/g, '<span class="md-code">`$1`</span>')
    .replace(/^(&gt;\s.*)$/gm, '<span class="md-blockquote">$1</span>')
    .replace(/^\s*[-*]\s/gm, '<span class="md-list">- </span>')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<span class="md-link">[$1]($2)</span>');
}

function highlightJSON(text) {
  return escapeHtml(text)
    .replace(/"([^"]+)":/g, '<span class="json-key">"$1"</span>:')
    .replace(/:\s*"([^"]*?)"/g, ': <span class="json-string">"$1"</span>')
    .replace(/:\s*(\d+\.?\d*)/g, ': <span class="json-number">$1</span>')
    .replace(/:\s*(true|false)/g, ': <span class="json-bool">$1</span>')
    .replace(/:\s*(null)/g, ': <span class="json-null">$1</span>');
}

customElements.define('dc-preview', PreviewCard);
export default PreviewCard;
