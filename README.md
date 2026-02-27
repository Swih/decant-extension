# Decant — Web Extractor & MCP Bridge for AI

> Extract clean Markdown from any webpage. Connect Chrome tabs directly to Claude Desktop via Model Context Protocol (MCP).

Decant is a Chrome extension (Manifest V3) that extracts web content into clean, structured formats — and bridges your browser to AI agents via the Model Context Protocol.

## MCP Bridge (V2.0)

Decant connects Chrome to Claude Desktop through a local MCP server. Ask Claude to read, summarize, or compare any web page — no copy-pasting required.

**Four MCP tools:**

| Tool | Description |
|------|-------------|
| `list_tabs` | List all open Chrome tabs |
| `extract_active_tab` | Extract the currently active tab |
| `extract_tab` | Extract a specific tab by ID |
| `extract_url` | Open a URL, extract it, close the tab |

**How it works:**

```
Claude Desktop  <--stdio-->  MCP Server (Node.js)  <--WebSocket-->  Chrome Extension
                             localhost:22816
```

All communication stays on your machine. No cloud relay.

**Setup:** See [MCP_SETUP.md](../MCP_SETUP.md) for Claude Desktop configuration.

## One-Click Extraction

Even without MCP, Decant extracts clean content from any web page:

- **Markdown** — Headings, code blocks, links, images preserved. Paste into ChatGPT, Claude, Obsidian, or Notion.
- **JSON** — Structured metadata for developers and automated workflows.
- **MCP Format** — Native Model Context Protocol output for AI agents.

### Smart Extraction

- Automatic table detection and formatting
- Date, email, and price entity recognition
- Relative URL resolution to absolute
- Mozilla Readability for article isolation

### DOM Picker

Visually select specific elements on a page. `Ctrl+Shift+P` to activate.

## Privacy

- 100% local processing — no external servers
- MCP Bridge uses localhost WebSocket only
- Optional permissions — `tabs` and `<all_urls>` requested only when MCP Bridge is enabled
- No accounts, no tracking, no analytics
- Open source (MIT License)

## Architecture

```
pageforge/
  src/
    background/service-worker.js   # MV3 orchestrator + MCP bridge client
    content/extractor.js           # DOM extraction (injected on-demand)
    content/dom-picker.js          # Visual element selector
    core/parser.js                 # Extraction pipeline
    offscreen/offscreen.js         # DOM parsing (Readability + Turndown)
    popup/popup.js                 # Popup UI + MCP toggle
    sidepanel/panel.js             # Side panel UI
    utils/storage.js               # chrome.storage wrapper
  _locales/                        # 16 languages

mcp-server/
  bin/decant-mcp.js                # CLI entry point
  src/
    index.js                       # MCP Server + tool dispatch
    bridge/ws-server.js            # WebSocket server (port 22816)
    tools/                         # list-tabs, extract-active-tab, extract-tab, extract-url
```

For detailed architecture notes, see [ARCHITECTURE_V2_MCP.md](../ARCHITECTURE_V2_MCP.md).

## Development

```bash
# Install dependencies
npm install

# Development (with HMR)
npm run dev

# Build for production
npm run build

# Run tests (66 tests)
npm test

# Lint & format
npm run lint
npm run format
```

### Load in Chrome

1. `npm run build`
2. Open `chrome://extensions/`
3. Enable "Developer mode"
4. Click "Load unpacked" and select the `dist/` folder

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl+Shift+E` | Open Decant side panel |
| `Ctrl+Shift+C` | Extract and copy to clipboard |
| `Ctrl+Shift+S` | Extract and save to file |
| `Ctrl+Shift+P` | Activate DOM Picker |

## Languages

Arabic, Chinese (Simplified), Chinese (Traditional), English, French, German, Hindi, Indonesian, Italian, Japanese, Korean, Portuguese (Brazil), Russian, Spanish, Turkish, Vietnamese

## License

MIT — Zoplop Studio
