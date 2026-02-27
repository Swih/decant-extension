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
        <p>MCP Bridge works with Claude Desktop, Claude Code, Cursor, Windsurf, ChatGPT Desktop, VS Code, Gemini CLI, Mistral Vibe, and any MCP-compatible client.</p>
      </TipBox>

      <h2>Prerequisites</h2>
      <ul>
        <li>Node.js 18+ installed</li>
        <li>An MCP-compatible client (see list below)</li>
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
          <p>Pick your client below and add the Decant MCP server to its configuration.</p>
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

      <h2>Client Configuration</h2>

      <h3>Claude Desktop</h3>
      <p>
        Add to your Claude Desktop config file (<code>claude_desktop_config.json</code>):
        Settings &rarr; Developer &rarr; Edit Config.
      </p>
      <pre><code>{`{
  "mcpServers": {
    "decant": {
      "command": "decant-mcp"
    }
  }
}`}</code></pre>

      <h3>Claude Code</h3>
      <p>Run the following command:</p>
      <pre><code>claude mcp add decant -- decant-mcp</code></pre>
      <p>Or add manually to <code>~/.claude/settings.json</code>:</p>
      <pre><code>{`{
  "mcpServers": {
    "decant": {
      "command": "decant-mcp"
    }
  }
}`}</code></pre>

      <h3>Cursor</h3>
      <p>Settings &rarr; MCP Servers &rarr; Add Server. Use this config:</p>
      <pre><code>{`{
  "mcpServers": {
    "decant": {
      "command": "decant-mcp"
    }
  }
}`}</code></pre>

      <h3>Windsurf</h3>
      <p>Settings &rarr; MCP &rarr; Add Configuration:</p>
      <pre><code>{`{
  "mcpServers": {
    "decant": {
      "command": "decant-mcp"
    }
  }
}`}</code></pre>

      <h3>ChatGPT Desktop</h3>
      <p>Settings &rarr; Apps and connectors &rarr; Advanced settings &rarr; enable Developer mode &rarr; Connectors &rarr; Add new connector.</p>
      <TipBox>
        <p>ChatGPT MCP support requires a paid plan (Plus, Pro, Team, or Enterprise).</p>
      </TipBox>

      <h3>VS Code</h3>
      <p>Add to your VS Code <code>settings.json</code>:</p>
      <pre><code>{`{
  "mcp": {
    "servers": {
      "decant": {
        "command": "decant-mcp"
      }
    }
  }
}`}</code></pre>

      <h3>Gemini CLI</h3>
      <p>Add to <code>~/.gemini/settings.json</code>:</p>
      <pre><code>{`{
  "mcpServers": {
    "decant": {
      "command": "npx",
      "args": ["decant-mcp"]
    }
  }
}`}</code></pre>

      <h3>Mistral (Le Chat / Vibe)</h3>
      <p>Edit your Vibe config (<code>~/.vibe/config.toml</code>) and add:</p>
      <pre><code>{`[[mcp_servers]]
name = "decant"
transport = "stdio"
command = "decant-mcp"`}</code></pre>

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
