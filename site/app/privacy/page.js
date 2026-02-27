import TipBox from '../../components/TipBox';
import Footer from '../../components/Footer';

export const metadata = { title: 'Privacy Policy' };

export default function PrivacyPage() {
  return (
    <div className="content-page">
      <nav><a href="/">{'\u2190'} Back to Decant</a></nav>
      <h1>Privacy Policy</h1>
      <p className="updated">Last updated: February 23, 2026</p>

      <TipBox>
        <p>
          <strong>TL;DR:</strong> Decant processes everything locally on your device. No data is
          sent to any server. No accounts. No tracking. No analytics.
        </p>
      </TipBox>

      <h2>1. What Decant Does</h2>
      <p>
        Decant is a Chrome extension that extracts and converts web page content into clean,
        structured formats (Markdown, JSON, MCP). All processing happens entirely in your browser
        using local JavaScript {"—"} no external servers are involved.
      </p>

      <h2>2. Data We Collect</h2>
      <p><strong>None.</strong> Decant does not collect, transmit, or store any personal data.</p>
      <p>Specifically, Decant does <strong>not</strong>:</p>
      <ul>
        <li>Send any data to external servers</li>
        <li>Use analytics or tracking services (no Google Analytics, no Mixpanel, nothing)</li>
        <li>Require user accounts or authentication</li>
        <li>Access browsing history beyond the current active tab</li>
        <li>Read cookies or form data</li>
        <li>Inject advertisements</li>
      </ul>

      <h2>3. Local Storage</h2>
      <p>
        Decant uses <code>chrome.storage.local</code> to save your preferences and a small
        extraction history on your device. This includes:
      </p>
      <ul>
        <li><strong>User preferences:</strong> output format, toggle states, theme choice</li>
        <li><strong>Extraction history:</strong> page titles, URLs, domains, and word counts of recent extractions (last 50 entries)</li>
        <li><strong>Usage counters:</strong> extraction count and feedback interaction dates</li>
        <li><strong>Error logs:</strong> local error records for debugging (last 50 entries)</li>
      </ul>
      <p>
        This data <strong>never leaves your device</strong>. It is stored locally and can be
        exported or deleted at any time through the extension settings.
      </p>

      <h2>4. Permissions Explained</h2>
      <ul>
        <li><strong><code>activeTab</code>:</strong> Access the content of the currently active tab when you click the extension</li>
        <li><strong><code>storage</code>:</strong> Save your preferences and extraction history locally on your device</li>
        <li><strong><code>clipboardWrite</code>:</strong> Copy extracted content to your clipboard when you click {'"'}Copy{'"'}</li>
        <li><strong><code>sidePanel</code>:</strong> Display the side panel interface for previewing extractions</li>
        <li><strong><code>contextMenus</code>:</strong> Add right-click menu options for quick extraction</li>
        <li><strong><code>alarms</code>:</strong> Schedule periodic checks for the optional feedback prompt (no network calls)</li>
        <li><strong><code>scripting</code>:</strong> Inject the content extraction script into the active tab when needed</li>
      </ul>

      <h2>5. Your Rights (GDPR / RGPD)</h2>
      <p>Since all data stays on your device, you have full control:</p>
      <ul>
        <li><strong>Export:</strong> Use the extension settings to export all your stored data as JSON</li>
        <li><strong>Delete:</strong> Use the extension settings to delete all stored data, or uninstall the extension</li>
        <li><strong>Access:</strong> All your data is visible in the extension{"'"}s settings page</li>
      </ul>
      <p>No data portability request is needed {"—"} you already have direct access to everything Decant stores.</p>

      <h2>6. Third-Party Libraries</h2>
      <p>Decant includes the following open-source libraries, bundled locally:</p>
      <ul>
        <li><strong>@mozilla/readability</strong> (Apache 2.0) {"—"} article extraction from HTML, runs locally</li>
        <li><strong>Turndown</strong> (MIT) {"—"} HTML-to-Markdown conversion, runs locally</li>
      </ul>
      <p>Neither library makes any network requests.</p>

      <h2>7. Children{"'"}s Privacy</h2>
      <p>Decant does not collect any personal information from anyone, including children under 13 years of age.</p>

      <h2>8. Changes to This Policy</h2>
      <p>If this policy changes, the updated version will be published with a new {'"'}Last updated{'"'} date. Since Decant does not collect email addresses, we cannot notify users directly {"—"} please check this page periodically.</p>

      <h2>9. Contact</h2>
      <p>If you have questions about this privacy policy, contact us at <strong>Zoplop Studio</strong> via email: <a href="mailto:contact@zoplop.com">contact@zoplop.com</a>.</p>

      <Footer />
    </div>
  );
}
