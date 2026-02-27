import TipBox from '../../../components/TipBox';

export const metadata = { title: 'Manual Extraction' };

export default function ExtractionPage() {
  return (
    <>
      <h1>Manual Extraction</h1>
      <p className="subtitle">Master the extraction workflow and output formats.</p>

      <h2>Quick Start</h2>
      <ol className="steps">
        <li>Navigate to any web page</li>
        <li>Click the Decant icon in the toolbar</li>
        <li>Click <strong>Extract Content</strong></li>
        <li>Copy or Save your clean content</li>
      </ol>

      <h2>Output Formats</h2>

      <h3>Markdown</h3>
      <p>
        Clean text with headings, links, and images. Perfect for Obsidian, Notion,
        or any note-taking app. Uses Mozilla Readability + Turndown under the hood.
      </p>

      <h3>JSON</h3>
      <p>
        Structured output with <code>title</code>, <code>url</code>, <code>content</code>,
        and <code>metadata</code> (word count, image count, tables, dates, emails).
        Ideal for automation and pipelines.
      </p>

      <h3>MCP</h3>
      <p>
        Model Context Protocol format. Includes source URL, word/token count, and
        AI-optimized structure. Best for feeding content to Claude, ChatGPT, or other LLMs.
      </p>

      <TipBox>
        <p>Switch formats instantly with the toggle — no need to re-extract.</p>
      </TipBox>

      <h2>Extraction Options</h2>

      <h3>Smart Extract</h3>
      <p>
        Uses Readability to find the main article content. Strips ads, navigation,
        and sidebars automatically. Disable for full page HTML when you need everything.
      </p>

      <h3>Include Images</h3>
      <p>
        Keeps image references in the output. Disable for text-only extraction,
        which saves tokens when feeding content to AI.
      </p>

      <h3>Detect Tables</h3>
      <p>
        Converts HTML tables to proper Markdown or JSON tables. Enable this when
        extracting pages with tabular data.
      </p>

      <h3>Full Page</h3>
      <p>
        Extracts the entire page body instead of the detected article. Use this
        for dashboards, wikis, and single-page applications where Readability
        cannot isolate a single article.
      </p>

      <h2>Copy &amp; Save</h2>
      <p>
        <strong>Copy</strong> sends the extracted content to your clipboard.{' '}
        <strong>Save</strong> downloads it as a <code>.md</code>, <code>.json</code>,
        or <code>.json</code> (MCP) file.
      </p>
      <TipBox>
        <p>Use keyboard shortcuts for even faster workflow.</p>
      </TipBox>

      <h2>Right-Click Menu</h2>
      <ul>
        <li><strong>Extract selection</strong> — extracts only the selected text</li>
        <li><strong>Extract full page</strong> — extracts the entire page</li>
        <li><strong>Copy for AI</strong> — extracts and copies in MCP format</li>
      </ul>

      <h2>Keyboard Shortcuts</h2>
      <table className="tools-table">
        <thead>
          <tr>
            <th>Action</th>
            <th>Shortcut</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Extract</td>
            <td><kbd>Ctrl</kbd> + <kbd>Shift</kbd> + <kbd>E</kbd></td>
          </tr>
          <tr>
            <td>Copy</td>
            <td><kbd>Ctrl</kbd> + <kbd>Shift</kbd> + <kbd>C</kbd></td>
          </tr>
          <tr>
            <td>Save</td>
            <td><kbd>Ctrl</kbd> + <kbd>Shift</kbd> + <kbd>S</kbd></td>
          </tr>
        </tbody>
      </table>
      <p>On macOS, use <kbd>Cmd</kbd> instead. Customize shortcuts at <code>chrome://extensions/shortcuts</code>.</p>
    </>
  );
}
