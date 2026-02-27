import TipBox from '../../../components/TipBox';

export const metadata = { title: 'Batch Extraction' };

export default function BatchPage() {
  return (
    <>
      <h1>Batch Extraction</h1>
      <p className="subtitle">Extract content from all open tabs at once.</p>

      <h2>What is Batch Extraction?</h2>
      <p>
        Batch Extraction lets you extract content from every open tab in the current window
        in one operation. Results are combined into a single downloadable file.
      </p>

      <h2>Permissions</h2>
      <p>
        Batch extraction requires additional permissions: <code>tabs</code> (to list all
        open tabs) and <code>&lt;all_urls&gt;</code> (to inject the content script into
        each tab).
      </p>
      <TipBox>
        <p>
          These permissions are only requested when you use Batch Extract. They are not
          needed for single-tab extraction.
        </p>
      </TipBox>
      <p>
        Chrome will prompt you to approve. You can revoke them later
        from <code>chrome://extensions</code>.
      </p>

      <h2>Step by Step</h2>
      <ol className="steps">
        <li>Open the Decant popup</li>
        <li>Click the <strong>Batch Extract</strong> section to expand it</li>
        <li>Click <strong>All Tabs</strong> — Chrome may ask for permissions</li>
        <li>Watch the progress bar as each tab is extracted</li>
        <li>When done, click <strong>Download All</strong> to save the combined file</li>
      </ol>

      <h2>Output</h2>
      <p>All tabs are combined into a single file:</p>
      <ul>
        <li>
          <strong>Markdown</strong> — separated by <code>---</code> horizontal rules,
          each prefixed with a source URL comment
        </li>
        <li>
          <strong>JSON / MCP</strong> — one entry per line (JSON Lines format)
        </li>
      </ul>
      <p>
        Filename format: <code>decant-batch-YYYY-MM-DD.md</code> (or <code>.json</code>).
      </p>

      <h2>Tips</h2>
      <TipBox>
        <p>Chrome internal pages (chrome://, extensions, Web Store) are automatically skipped.</p>
      </TipBox>
      <ul>
        <li>Tabs that fail to extract (e.g., require login, have CSP restrictions) are silently skipped.</li>
        <li>The progress bar shows the extracted / total count as tabs are processed.</li>
        <li>For best results, make sure all tabs are fully loaded before starting.</li>
      </ul>
    </>
  );
}
