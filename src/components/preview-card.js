/**
 * Preview card Web Component.
 * Shows extracted content preview with syntax highlighting for Markdown.
 */
import { escapeHtml } from '../utils/html.js';

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
        .line-count {
          font-size: 10px;
          color: var(--text-tertiary, #5C5C6F);
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
          <span class="line-count" id="lineCount" aria-live="polite"></span>
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
