/**
 * Feedback widget Web Component.
 * Emoji-based micro-survey after extractions.
 */
class FeedbackWidget extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this._selected = null;
  }

  connectedCallback() {
    this.render();
    this.setupEvents();
  }

  render() {
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
        }
        .feedback-container {
          background: var(--bg-secondary, #1A1A24);
          border: 1px solid var(--border, rgba(255,255,255,0.06));
          border-radius: 12px;
          padding: 14px;
          animation: fadeIn 0.3s ease;
        }
        .title {
          font-size: 12px;
          font-weight: 500;
          color: var(--text-secondary, #8B8B9E);
          margin-bottom: 10px;
          text-align: center;
        }
        .emojis {
          display: flex;
          justify-content: center;
          gap: 12px;
          margin-bottom: 10px;
        }
        .emoji-btn {
          background: none;
          border: 2px solid transparent;
          border-radius: 50%;
          width: 40px;
          height: 40px;
          font-size: 22px;
          cursor: pointer;
          transition: all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .emoji-btn:hover {
          transform: scale(1.2);
          background: rgba(255,255,255,0.05);
        }
        .emoji-btn.selected {
          transform: scale(1.25);
          border-color: var(--accent-primary, #8B5CF6);
          background: rgba(139, 92, 246, 0.1);
        }
        .comment-area {
          display: none;
          margin-top: 10px;
        }
        .comment-area.visible {
          display: block;
          animation: fadeIn 0.25s ease;
        }
        textarea {
          width: 100%;
          height: 60px;
          background: var(--bg-tertiary, #22222E);
          border: 1px solid var(--border, rgba(255,255,255,0.06));
          border-radius: 8px;
          color: var(--text-primary, #E8E8ED);
          font-family: inherit;
          font-size: 12px;
          padding: 8px;
          resize: none;
          outline: none;
          box-sizing: border-box;
        }
        textarea:focus {
          border-color: var(--accent-primary, #8B5CF6);
        }
        .actions {
          display: flex;
          justify-content: flex-end;
          margin-top: 8px;
          gap: 8px;
        }
        .send-btn {
          background: var(--accent-primary, #8B5CF6);
          color: white;
          border: none;
          padding: 6px 14px;
          border-radius: 6px;
          font-size: 12px;
          font-weight: 500;
          cursor: pointer;
          transition: background 0.15s;
        }
        .send-btn:hover { background: var(--accent-primary-hover, #7C3AED); }
        .dismiss-btn {
          background: none;
          color: var(--text-tertiary, #5C5C6F);
          border: none;
          padding: 6px 10px;
          font-size: 12px;
          cursor: pointer;
        }
        .dismiss-btn:hover { color: var(--text-secondary, #8B8B9E); }
        .thanks {
          text-align: center;
          font-size: 13px;
          color: var(--success, #10B981);
          padding: 8px;
          animation: fadeIn 0.3s ease;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(4px); }
          to { opacity: 1; transform: translateY(0); }
        }
      </style>
      <div class="feedback-container" id="widget" role="region" aria-label="Feedback">
        <div class="title" id="title">${chrome.i18n?.getMessage('feedbackTitle') || 'How was this extraction?'}</div>
        <div class="emojis" id="emojis" role="radiogroup" aria-label="Rate your experience">
          <button class="emoji-btn" data-value="angry" title="Bad" role="radio" aria-checked="false" aria-label="Bad">\uD83D\uDE21</button>
          <button class="emoji-btn" data-value="meh" title="Meh" role="radio" aria-checked="false" aria-label="Okay">\uD83D\uDE10</button>
          <button class="emoji-btn" data-value="good" title="Good" role="radio" aria-checked="false" aria-label="Good">\uD83D\uDE0A</button>
          <button class="emoji-btn" data-value="love" title="Love it" role="radio" aria-checked="false" aria-label="Love it">\uD83E\uDD29</button>
        </div>
        <div class="comment-area" id="commentArea">
          <textarea id="comment" placeholder="${chrome.i18n?.getMessage('feedbackPlaceholder') || 'Any thoughts? (optional)'}"></textarea>
          <div class="actions">
            <button class="dismiss-btn" id="dismissBtn">\u2715</button>
            <button class="send-btn" id="sendBtn">${chrome.i18n?.getMessage('feedbackSend') || 'Send'}</button>
          </div>
        </div>
      </div>
    `;
  }

  setupEvents() {
    const emojis = this.shadowRoot.getElementById('emojis');
    const commentArea = this.shadowRoot.getElementById('commentArea');
    const sendBtn = this.shadowRoot.getElementById('sendBtn');
    const dismissBtn = this.shadowRoot.getElementById('dismissBtn');

    emojis.addEventListener('click', (e) => {
      const btn = e.target.closest('.emoji-btn');
      if (!btn) return;

      // Deselect all, select this one
      emojis.querySelectorAll('.emoji-btn').forEach((b) => {
        b.classList.remove('selected');
        b.setAttribute('aria-checked', 'false');
      });
      btn.classList.add('selected');
      btn.setAttribute('aria-checked', 'true');
      this._selected = btn.dataset.value;

      // Show comment area
      commentArea.classList.add('visible');
    });

    sendBtn.addEventListener('click', () => {
      this.submit();
    });

    dismissBtn.addEventListener('click', () => {
      this.dismiss();
    });
  }

  submit() {
    const comment = this.shadowRoot.getElementById('comment')?.value || '';
    const detail = { rating: this._selected, comment };

    this.dispatchEvent(new CustomEvent('feedback-submit', { detail, bubbles: true }));

    // Show thanks
    const widget = this.shadowRoot.getElementById('widget');
    widget.innerHTML = '<div class="thanks">\u2728 Thanks for your feedback!</div>';

    setTimeout(() => this.remove(), 2000);
  }

  dismiss() {
    this.dispatchEvent(new CustomEvent('feedback-dismiss', { bubbles: true }));
    this.remove();
  }
}

customElements.define('pf-feedback', FeedbackWidget);
export default FeedbackWidget;
