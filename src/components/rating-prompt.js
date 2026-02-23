/**
 * Chrome Web Store rating prompt Web Component.
 * Appears after positive feedback + time threshold.
 */
class RatingPrompt extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  _msg(key, fallback) {
    return chrome.i18n?.getMessage(key) || fallback;
  }

  connectedCallback() {
    this.render();
    this.setupEvents();
  }

  render() {
    this.shadowRoot.innerHTML = `
      <style>
        :host { display: block; }
        .prompt {
          background: var(--bg-secondary, #1A1A24);
          border: 1px solid rgba(139, 92, 246, 0.2);
          border-radius: 12px;
          padding: 16px;
          text-align: center;
          animation: fadeIn 0.3s ease;
        }
        .star { font-size: 28px; margin-bottom: 8px; }
        .title {
          font-size: 14px;
          font-weight: 600;
          color: var(--text-primary, #E8E8ED);
          margin-bottom: 4px;
        }
        .body {
          font-size: 12px;
          color: var(--text-secondary, #8B8B9E);
          margin-bottom: 14px;
        }
        .actions { display: flex; gap: 8px; justify-content: center; }
        .btn-rate {
          background: var(--accent-primary, #8B5CF6);
          color: white;
          border: none;
          padding: 8px 16px;
          border-radius: 8px;
          font-size: 12px;
          font-weight: 500;
          cursor: pointer;
          transition: background 0.15s;
        }
        .btn-rate:hover { background: var(--accent-primary-hover, #7C3AED); }
        .btn-later {
          background: none;
          color: var(--text-tertiary, #5C5C6F);
          border: none;
          padding: 8px 12px;
          font-size: 12px;
          cursor: pointer;
        }
        .btn-later:hover { color: var(--text-secondary, #8B8B9E); }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(4px); }
          to { opacity: 1; transform: translateY(0); }
        }
      </style>
      <div class="prompt" role="dialog" aria-label="Rate Decant">
        <div class="star" aria-hidden="true">\u2B50</div>
        <div class="title">${this._msg('ratingTitle', 'Enjoying Decant?')}</div>
        <div class="body">${this._msg('ratingBody', 'Your review helps us reach more users!')}</div>
        <div class="actions">
          <button class="btn-later" id="laterBtn">${this._msg('ratingLater', 'Maybe later')}</button>
          <button class="btn-rate" id="rateBtn">${this._msg('ratingYes', 'Rate on Chrome Store')}</button>
        </div>
      </div>
    `;
  }

  setupEvents() {
    this.shadowRoot.getElementById('rateBtn').addEventListener('click', async () => {
      this.dispatchEvent(new CustomEvent('rating-accept', { bubbles: true }));
      const { STORE_URL, isPublished } = await import('../utils/config.js');
      if (isPublished()) {
        chrome.tabs.create({ url: STORE_URL });
      }
      this.remove();
    });

    this.shadowRoot.getElementById('laterBtn').addEventListener('click', () => {
      this.dispatchEvent(new CustomEvent('rating-dismiss', { bubbles: true }));
      this.remove();
    });
  }
}

customElements.define('dc-rating', RatingPrompt);
export default RatingPrompt;
