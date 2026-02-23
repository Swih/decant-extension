/**
 * Format toggle Web Component.
 * Pill-style toggle between Markdown / JSON / MCP.
 */
class FormatToggle extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this._value = 'markdown';
  }

  static get observedAttributes() {
    return ['value'];
  }

  attributeChangedCallback(name, oldVal, newVal) {
    if (name === 'value' && newVal !== oldVal) {
      this._value = newVal;
      this.updateActive();
    }
  }

  get value() {
    return this._value;
  }

  set value(val) {
    this._value = val;
    this.setAttribute('value', val);
    this.updateActive();
  }

  connectedCallback() {
    this._value = this.getAttribute('value') || 'markdown';
    this.render();
    this.setupEvents();
  }

  render() {
    const msg = (key, fb) => chrome.i18n?.getMessage(key) || fb;
    const md = msg('formatMarkdown', 'Markdown');
    const json = msg('formatJSON', 'JSON');
    const mcp = msg('formatMCP', 'MCP');

    this.shadowRoot.innerHTML = `
      <style>
        :host { display: block; }
        .pill-group {
          display: flex;
          gap: 2px;
          padding: 3px;
          background: var(--bg-tertiary, #22222E);
          border-radius: 10px;
          border: 1px solid var(--border, rgba(255,255,255,0.06));
        }
        .pill {
          flex: 1;
          padding: 6px 12px;
          border: none;
          border-radius: 7px;
          background: transparent;
          color: var(--text-secondary, #8B8B9E);
          font-family: 'Inter', -apple-system, sans-serif;
          font-size: 12px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
          text-align: center;
          position: relative;
          white-space: nowrap;
        }
        .pill:hover {
          color: var(--text-primary, #E8E8ED);
        }
        .pill.active {
          background: var(--accent-primary, #8B5CF6);
          color: white;
          box-shadow: 0 2px 8px rgba(139, 92, 246, 0.3);
        }
        .pill .badge {
          display: inline-block;
          font-size: 8px;
          background: rgba(6, 182, 212, 0.2);
          color: var(--accent-secondary, #06B6D4);
          padding: 1px 4px;
          border-radius: 4px;
          margin-left: 4px;
          vertical-align: top;
          font-weight: 600;
        }
      </style>
      <div class="pill-group" id="group" role="radiogroup" aria-label="Output format">
        <button class="pill" data-value="markdown" role="radio" aria-checked="false">${md}</button>
        <button class="pill" data-value="json" role="radio" aria-checked="false">${json}</button>
        <button class="pill" data-value="mcp" role="radio" aria-checked="false">${mcp}<span class="badge" aria-label="AI optimized">AI</span></button>
      </div>
    `;
    this.updateActive();
  }

  setupEvents() {
    this.shadowRoot.getElementById('group').addEventListener('click', (e) => {
      const pill = e.target.closest('.pill');
      if (!pill) return;
      const newVal = pill.dataset.value;
      if (newVal === this._value) return;

      this._value = newVal;
      this.updateActive();
      this.dispatchEvent(
        new CustomEvent('format-change', {
          detail: { format: newVal },
          bubbles: true,
        }),
      );
    });
  }

  updateActive() {
    const pills = this.shadowRoot?.querySelectorAll('.pill');
    if (!pills) return;
    pills.forEach((p) => {
      const isActive = p.dataset.value === this._value;
      p.classList.toggle('active', isActive);
      p.setAttribute('aria-checked', String(isActive));
    });
  }
}

customElements.define('dc-format-toggle', FormatToggle);
export default FormatToggle;
