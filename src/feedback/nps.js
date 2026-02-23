/**
 * Net Promoter Score survey (quarterly).
 * Simple 0-10 scale with optional comment.
 */
class NPSSurvey extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this._score = null;
  }

  connectedCallback() {
    this.render();
    this.setupEvents();
  }

  render() {
    this.shadowRoot.innerHTML = `
      <style>
        :host { display: block; }
        .nps {
          background: var(--bg-secondary, #1A1A24);
          border: 1px solid var(--border, rgba(255,255,255,0.06));
          border-radius: 12px;
          padding: 16px;
          animation: fadeIn 0.3s ease;
        }
        .title {
          font-size: 13px;
          font-weight: 600;
          color: var(--text-primary, #E8E8ED);
          text-align: center;
          margin-bottom: 4px;
        }
        .subtitle {
          font-size: 11px;
          color: var(--text-tertiary, #5C5C6F);
          text-align: center;
          margin-bottom: 12px;
        }
        .scale {
          display: flex;
          gap: 4px;
          justify-content: center;
          margin-bottom: 8px;
        }
        .scale-labels {
          display: flex;
          justify-content: space-between;
          margin-bottom: 12px;
        }
        .scale-label {
          font-size: 9px;
          color: var(--text-tertiary, #5C5C6F);
        }
        .score-btn {
          width: 28px;
          height: 28px;
          border: 1px solid var(--border, rgba(255,255,255,0.06));
          border-radius: 6px;
          background: var(--bg-tertiary, #22222E);
          color: var(--text-secondary, #8B8B9E);
          font-size: 11px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.15s ease;
        }
        .score-btn:hover {
          border-color: var(--accent-primary, #8B5CF6);
          color: var(--text-primary, #E8E8ED);
        }
        .score-btn.selected {
          background: var(--accent-primary, #8B5CF6);
          color: white;
          border-color: var(--accent-primary, #8B5CF6);
        }
        .actions {
          display: flex;
          justify-content: center;
          gap: 8px;
          margin-top: 12px;
        }
        .submit-btn {
          background: var(--accent-primary, #8B5CF6);
          color: white;
          border: none;
          padding: 6px 16px;
          border-radius: 6px;
          font-size: 12px;
          font-weight: 500;
          cursor: pointer;
          display: none;
        }
        .submit-btn.visible { display: inline-block; }
        .submit-btn:hover { background: var(--accent-primary-hover, #7C3AED); }
        .dismiss-btn {
          background: none;
          border: none;
          color: var(--text-tertiary, #5C5C6F);
          font-size: 11px;
          cursor: pointer;
        }
        .thanks {
          text-align: center;
          color: var(--success, #10B981);
          font-size: 13px;
          padding: 12px;
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      </style>
      <div class="nps" id="nps" role="region" aria-label="Net Promoter Score survey">
        <div class="title" id="nps-title">How likely are you to recommend Decant?</div>
        <div class="subtitle">0 = Not likely &nbsp;&middot;&nbsp; 10 = Extremely likely</div>
        <div class="scale" id="scale" role="radiogroup" aria-labelledby="nps-title">
          ${Array.from({ length: 11 }, (_, i) => `<button class="score-btn" data-score="${i}" role="radio" aria-checked="false" aria-label="Score ${i}">${i}</button>`).join('')}
        </div>
        <div class="actions">
          <button class="dismiss-btn" id="dismissBtn">Not now</button>
          <button class="submit-btn" id="submitBtn">Submit</button>
        </div>
      </div>
    `;
  }

  setupEvents() {
    const scale = this.shadowRoot.getElementById('scale');
    const submitBtn = this.shadowRoot.getElementById('submitBtn');
    const dismissBtn = this.shadowRoot.getElementById('dismissBtn');

    scale.addEventListener('click', (e) => {
      const btn = e.target.closest('.score-btn');
      if (!btn) return;
      scale.querySelectorAll('.score-btn').forEach((b) => {
        b.classList.remove('selected');
        b.setAttribute('aria-checked', 'false');
      });
      btn.classList.add('selected');
      btn.setAttribute('aria-checked', 'true');
      this._score = parseInt(btn.dataset.score);
      submitBtn.classList.add('visible');
    });

    submitBtn.addEventListener('click', () => {
      this.dispatchEvent(
        new CustomEvent('nps-submit', {
          detail: { score: this._score },
          bubbles: true,
        }),
      );
      const nps = this.shadowRoot.getElementById('nps');
      nps.innerHTML = '<div class="thanks">\u2728 Thank you!</div>';
      setTimeout(() => this.remove(), 1500);
    });

    dismissBtn.addEventListener('click', () => {
      this.dispatchEvent(new CustomEvent('nps-dismiss', { bubbles: true }));
      this.remove();
    });
  }
}

customElements.define('dc-nps', NPSSurvey);
export default NPSSurvey;
