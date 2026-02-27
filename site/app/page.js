import Logo from '../components/Logo';
import Footer from '../components/Footer';
import styles from './page.module.css';

export default function HomePage() {
  return (
    <>
      {/* Hero */}
      <section className={styles.hero}>
        <div className={styles.logo}>
          <Logo />
          <span className={styles.logoText}>Decant</span>
        </div>
        <p className={styles.tagline}>
          Extract pure, AI-ready content from any web page. No servers, no tracking, no accounts.
        </p>
        <div className={styles.formats}>
          <span className={styles.pillHl}>Markdown</span>
          <span className={styles.pill}>JSON</span>
          <span className={styles.pill}>MCP</span>
        </div>
        <a className={styles.cta} href="https://chromewebstore.google.com/detail/decant/iddjjbfkefeikdjcnhlklblfanhdignj" target="_blank" rel="noopener">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
          Install for Chrome
        </a>
        <p className={styles.subCta}>Free &amp; open source &middot; 100% local processing</p>
      </section>

      {/* Features */}
      <section className={styles.features}>
        <div className={styles.card}>
          <div className={styles.cardIcon}>{'\u{1F4C4}'}</div>
          <h3>Three output formats</h3>
          <p>Markdown for notes, JSON for developers, MCP for AI agents. Switch instantly.</p>
        </div>
        <div className={styles.card}>
          <div className={styles.cardIcon}>{'\u{1F512}'}</div>
          <h3>100% Local</h3>
          <p>Everything runs in your browser. No data leaves your device. No analytics, no tracking, ever.</p>
        </div>
        <div className={styles.card}>
          <div className={styles.cardIcon}>{'\u26A1'}</div>
          <h3>Smart extraction</h3>
          <p>Powered by Mozilla Readability. Strips ads, nav, clutter. Keeps the content you need.</p>
        </div>
        <div className={styles.card}>
          <div className={styles.cardIcon}>{'\u{1F4CA}'}</div>
          <h3>Tables &amp; data</h3>
          <p>Detect tables, emails, dates, prices, phone numbers. Structured data, ready to use.</p>
        </div>
        <div className={styles.card}>
          <div className={styles.cardIcon}>{'\u2328\uFE0F'}</div>
          <h3>Keyboard-first</h3>
          <p>Ctrl+Shift+E to extract, Ctrl+Shift+C to copy, Ctrl+Shift+S to save. Zero clicks needed.</p>
        </div>
        <div className={styles.card}>
          <div className={styles.cardIcon}>{'\u{1F30D}'}</div>
          <h3>16 languages</h3>
          <p>Full i18n support including RTL. Arabic, Chinese, Japanese, Korean, and 12 more.</p>
        </div>
      </section>

      {/* Privacy Banner */}
      <div className={styles.privacyBanner}>
        <h2>Privacy first, always</h2>
        <p>No accounts. No servers. No analytics. Your data stays on your device. <a href="/privacy">Read our privacy policy</a>.</p>
      </div>

      {/* Footer */}
      <Footer />
    </>
  );
}
