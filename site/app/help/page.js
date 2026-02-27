import TipBox from '../../components/TipBox';
import Footer from '../../components/Footer';

export const metadata = { title: 'Help & FAQ' };

export default function HelpPage() {
  return (
    <div className="content-page">
      <nav><a href="/">{'\u2190'} Back to Decant</a></nav>
      <h1>Help {"&"} FAQ</h1>
      <p className="subtitle">Everything you need to know about using Decant.</p>

      {/* Getting Started */}
      <h2>Getting started</h2>
      <ol>
        <li>Visit any web page you want to extract content from.</li>
        <li>Click the <strong>Decant icon</strong> in your Chrome toolbar (or pin it for easy access).</li>
        <li>Click <strong>{'"'}Extract{'"'}</strong> {"—"} your clean content appears instantly.</li>
        <li>Choose <strong>Copy</strong> or <strong>Save</strong> to use it anywhere.</li>
      </ol>

      <TipBox>
        <p><strong>Tip:</strong> Pin Decant to your toolbar by clicking the puzzle icon in Chrome, then the pin icon next to Decant.</p>
      </TipBox>

      {/* Output Formats */}
      <h2>Output formats</h2>
      <p>Switch between formats using the toggle at the top of the popup:</p>
      <div className="format-grid">
        <div className="format-card">
          <h4>Markdown</h4>
          <p>Clean text with headings, links, and images preserved. Perfect for notes, Obsidian, Notion.</p>
        </div>
        <div className="format-card">
          <h4>JSON</h4>
          <p>Structured data with title, content, metadata. Ideal for developers and automation.</p>
        </div>
        <div className="format-card">
          <h4>MCP</h4>
          <p>Model Context Protocol format, optimized for AI assistants like Claude and ChatGPT.</p>
        </div>
      </div>

      {/* Extraction Options */}
      <h2>Extraction options</h2>
      <h3>Smart Extract</h3>
      <p>When enabled, Decant uses Mozilla Readability to identify the main article content, stripping ads, navigation, sidebars, and clutter. Disable it to get the full page HTML converted to your chosen format.</p>

      <h3>Include Images</h3>
      <p>Keep image references in the output. Disable to get text-only content (useful for pasting into AI chat windows with token limits).</p>

      <h3>Detect Tables</h3>
      <p>Converts HTML tables into proper Markdown/JSON tables. The metadata also shows how many tables were found.</p>

      <h3>Full Page</h3>
      <p>Extract the entire page body instead of just the detected article. Useful for pages without a clear article structure (dashboards, wikis, etc.).</p>

      {/* Keyboard Shortcuts */}
      <h2>Keyboard shortcuts</h2>
      <table className="shortcut-table">
        <tbody>
          <tr>
            <td>Extract page content</td>
            <td><kbd>Ctrl+Shift+E</kbd></td>
          </tr>
          <tr>
            <td>Extract {"&"} copy to clipboard</td>
            <td><kbd>Ctrl+Shift+C</kbd></td>
          </tr>
          <tr>
            <td>Extract {"&"} save to file</td>
            <td><kbd>Ctrl+Shift+S</kbd></td>
          </tr>
        </tbody>
      </table>
      <p>On macOS, replace <kbd>Ctrl</kbd> with <kbd>Cmd</kbd>.</p>

      <TipBox>
        <p><strong>Customize shortcuts:</strong> Go to <code>chrome://extensions/shortcuts</code> in your browser to change key bindings.</p>
      </TipBox>

      {/* Right-Click Menu */}
      <h2>Right-click menu</h2>
      <p>Right-click on any page (or selected text) to access Decant from the context menu:</p>
      <ul>
        <li><strong>Extract selection</strong> {"—"} extract only the selected text</li>
        <li><strong>Extract full page</strong> {"—"} extract the entire page</li>
        <li><strong>Copy for AI</strong> {"—"} extract and copy in MCP format, optimized for AI assistants</li>
      </ul>

      {/* Side Panel */}
      <h2>Side panel</h2>
      <p>Decant also has a Chrome side panel for a larger preview of your extraction. After extracting content from the popup, the result is automatically sent to the side panel where you can:</p>
      <ul>
        <li>View the full extracted content</li>
        <li>Browse detected structured data (emails, dates, prices)</li>
        <li>See your extraction history</li>
      </ul>
      <p>Open the side panel from Chrome{"'"}s side panel menu (click the side panel icon in the toolbar).</p>

      {/* Guides */}
      <h2>Guides</h2>
      <p>Explore our in-depth guides for specific features:</p>
      <ul>
        <li><a href="/guides/mcp-bridge">MCP Bridge Setup</a> {"—"} Connect Decant to AI assistants like Claude</li>
        <li><a href="/guides/extraction">Manual Extraction</a> {"—"} Master the extraction workflow and output formats</li>
        <li><a href="/guides/selector">DOM Picker</a> {"—"} Select specific elements from any page</li>
        <li><a href="/guides/batch">Batch Extraction</a> {"—"} Extract all open tabs at once</li>
      </ul>

      {/* Data & Privacy */}
      <h2>Your data</h2>
      <p>Decant stores preferences and history <strong>locally on your device only</strong>. No data is ever sent to any server.</p>
      <p>You can manage your data from the extension settings page:</p>
      <ul>
        <li><strong>Export:</strong> Download all your stored data as a JSON file</li>
        <li><strong>Delete:</strong> Permanently remove all stored data</li>
      </ul>
      <p>To access settings: right-click the Decant icon {"→"} <strong>Options</strong>, or go to <code>chrome://extensions</code> {"→"} Decant {"→"} <strong>Details</strong> {"→"} <strong>Extension options</strong>.</p>

      {/* FAQ */}
      <h2>Frequently asked questions</h2>

      <h3>Why does Decant need the {'"'}activeTab{'"'} permission?</h3>
      <p>To read the content of the page you{"'"}re currently viewing. This permission only activates when you click the Decant icon {"—"} it cannot read other tabs or run in the background.</p>

      <h3>Does Decant work on all websites?</h3>
      <p>Decant works on most websites. It cannot access Chrome internal pages (<code>chrome://</code>), the Chrome Web Store, or pages that use special security headers to block content scripts.</p>

      <h3>Why is the extraction empty or incomplete?</h3>
      <p>Some pages load content dynamically (infinite scroll, lazy loading). Try enabling <strong>Full Page</strong> mode. If the page is a single-page app that loads content via JavaScript, wait for it to fully load before extracting.</p>

      <h3>Can I extract content from PDFs?</h3>
      <p>Decant works on HTML pages. PDF files opened in Chrome{"'"}s built-in viewer have limited support. For best results, use dedicated PDF tools.</p>

      <h3>What is MCP format?</h3>
      <p>MCP (Model Context Protocol) is a format designed for AI assistants. It includes metadata like the source URL, word count, and token estimate, wrapped in a structure that helps AI models understand the context of the content.</p>

      <h3>How do I report a bug or suggest a feature?</h3>
      <p>Contact us at <a href="mailto:contact@zoplop.com">contact@zoplop.com</a>. We read every message.</p>

      <Footer />
    </div>
  );
}
