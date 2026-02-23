/**
 * Toast notification Web Component.
 * Slide-in + fade-out notifications.
 */
class DecantToast extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  connectedCallback() {
    this.render();
  }

  render() {
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          position: fixed;
          bottom: 16px;
          right: 16px;
          z-index: 10000;
          pointer-events: none;
          display: flex;
          flex-direction: column;
          gap: 8px;
          align-items: flex-end;
        }
        .toast {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 16px;
          border-radius: 10px;
          font-family: 'Inter', -apple-system, sans-serif;
          font-size: 13px;
          font-weight: 500;
          color: #E8E8ED;
          background: rgba(26, 26, 36, 0.95);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          border: 1px solid rgba(255, 255, 255, 0.08);
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
          pointer-events: auto;
          animation: slideIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
          max-width: 300px;
        }
        .toast.removing {
          animation: slideOut 0.25s ease forwards;
        }
        .toast.success { border-left: 3px solid #10B981; }
        .toast.error { border-left: 3px solid #EF4444; }
        .toast.warning { border-left: 3px solid #F59E0B; }
        .toast.info { border-left: 3px solid #8B5CF6; }
        .icon { font-size: 16px; flex-shrink: 0; }
        @keyframes slideIn {
          from { opacity: 0; transform: translateX(16px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes slideOut {
          from { opacity: 1; transform: translateX(0); }
          to { opacity: 0; transform: translateX(16px); }
        }
      </style>
      <div id="container"></div>
    `;
  }

  show(message, type = 'success', duration = 2500) {
    const container = this.shadowRoot.getElementById('container');
    const icons = { success: '\u2705', error: '\u274C', warning: '\u26A0\uFE0F', info: '\u2728' };

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.setAttribute('role', 'alert');
    toast.setAttribute('aria-live', 'polite');
    toast.innerHTML = `<span class="icon" aria-hidden="true">${icons[type] || ''}</span><span>${message}</span>`;

    container.appendChild(toast);

    setTimeout(() => {
      toast.classList.add('removing');
      toast.addEventListener('animationend', () => toast.remove());
    }, duration);
  }
}

customElements.define('dc-toast', DecantToast);
export default DecantToast;
