import TipBox from '../../../components/TipBox';

export const metadata = { title: 'MCP Bridge Setup' };

export default function McpBridgePage() {
  return (
    <>
      <h1>MCP Bridge</h1>
      <p className="subtitle">Connect Decant to any AI assistant via the Model Context Protocol.</p>

      <h2>What is MCP Bridge?</h2>
      <p>
        MCP Bridge allows AI assistants to extract web page content through Decant.
        It creates a WebSocket bridge between a local MCP server and the Decant extension,
        enabling any MCP-compatible tool to read and process any web page you can see in Chrome.
      </p>
      <TipBox>
        <p>MCP Bridge works with Claude Desktop, Claude Code, Cursor, Windsurf, ChatGPT Desktop, and any MCP-compatible client.</p>
      </TipBox>

      <h2>Prerequisites</h2>
      <ul>
        <li>Node.js 18+ installed</li>
        <li>An MCP-compatible client (Claude Desktop, Cursor, Windsurf, ChatGPT Desktop, Claude Code, etc.)</li>
        <li>Decant extension installed in Chrome</li>
      </ul>

      <h2>Setup</h2>
      <ol className="steps">
        <li>
          <strong>Install the MCP server</strong>
          <p>Install globally via npm:</p>
          <pre><code>npm install -g decant-mcp</code></pre>
          <p>Or from the project source:</p>
          <pre><code>{`cd mcp-server && npm install && npm link`}</code></pre>
        </li>
        <li>
          <strong>Configure your AI client</strong>
          <p>Add Decant to your MCP configuration. The JSON config is the same for all clients:</p>
          <pre><code>{`{
  "mcpServers": {
    "decant": {
      "command": "decant-mcp"
    }
  }
}`}</code></pre>
          <h4>Where to add this config:</h4>
          <ul>
            <li><strong>Claude Desktop</strong> &mdash; Settings &rarr; Developer &rarr; Edit Config (<code>claude_desktop_config.json</code>)</li>
            <li><strong>Claude Code</strong> &mdash; <code>~/.claude/settings.json</code> or project <code>.claude/settings.json</code></li>
            <li><strong>Cursor</strong> &mdash; Settings &rarr; MCP Servers &rarr; Add Server</li>
            <li><strong>Windsurf</strong> &mdash; Settings &rarr; MCP &rarr; Add Configuration</li>
            <li><strong>ChatGPT Desktop</strong> &mdash; Settings &rarr; Beta &rarr; MCP Servers</li>
          </ul>
          <p>Restart your AI client after saving.</p>
        </li>
        <li>
          <strong>Enable in Decant</strong>
          <p>
            Open the Decant popup &rarr; toggle <strong>MCP Bridge (Beta)</strong> ON.
            The extension will request additional permissions (tabs + all URLs).
          </p>
          <p>A green dot means connected. A grey dot means disconnected.</p>
        </li>
      </ol>

      <h2>Available Tools</h2>
      <table className="tools-table">
        <thead>
          <tr>
            <th>Tool</th>
            <th>Description</th>
            <th>Parameters</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><code>list_tabs</code></td>
            <td>List all open Chrome tabs</td>
            <td>None</td>
          </tr>
          <tr>
            <td><code>extract_active_tab</code></td>
            <td>Extract content from the active tab</td>
            <td><code>format</code> (markdown/json/mcp, optional)</td>
          </tr>
          <tr>
            <td><code>extract_tab</code></td>
            <td>Extract content from a specific tab</td>
            <td><code>tabId</code> (required), <code>format</code> (optional)</td>
          </tr>
          <tr>
            <td><code>extract_url</code></td>
            <td>Open a URL, extract, then close</td>
            <td><code>url</code> (required), <code>format</code> (optional)</td>
          </tr>
        </tbody>
      </table>

      <h2>Architecture</h2>
      <p>
        The data flow is straightforward: <strong>Extension</strong> &harr; WebSocket
        (port 22816) &harr; <strong>MCP Server</strong> &harr; stdio &harr; <strong>Your AI client</strong>.
      </p>
      <TipBox>
        <p>The MCP server is a pure relay. No data is stored or processed on the server side.</p>
      </TipBox>

      <h2>Troubleshooting</h2>

      <h3>Bridge shows disconnected</h3>
      <p>
        Check that <code>decant-mcp</code> is running. Verify your MCP client config
        file is correct (Claude Desktop, Cursor, Windsurf, etc.). Try toggling the MCP Bridge off and on again in the Decant popup.
      </p>

      <h3>Permission denied</h3>
      <p>
        The extension needs <code>tabs</code> and <code>&lt;all_urls&gt;</code> permissions
        for cross-tab extraction. Re-toggle MCP Bridge to re-request permissions.
      </p>

      <h3>extract_url times out</h3>
      <p>
        The default timeout is 60 seconds. Some pages with heavy JavaScript may need more
        time. Try extracting after the page loads manually using <code>extract_active_tab</code> instead.
      </p>
    </>
  );
}
