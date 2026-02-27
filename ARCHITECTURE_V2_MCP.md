# ARCHITECTURE V2.0 — MCP Bridge Blueprint (Browser-First)

## 1. Vision

Decant V2.0 transforme le navigateur Chrome de l'utilisateur en serveur d'extraction MCP. Claude Desktop (ou tout client MCP) peut demander "Extrais l'onglet actif" et reçoit du Markdown propre, extrait DEPUIS le navigateur réel de l'utilisateur.

### Killer Feature : Browser-First (AUCUNE extraction server-side)

Le serveur Node.js MCP est un **relais pur**. Il ne fetch AUCUNE URL. Toute extraction passe par le navigateur Chrome, ce qui garantit :

- **Cookies de session** → pages payantes (NYT, Medium, docs privés) accessibles
- **Rendu JavaScript exécuté** → SPAs React/Vue/Angular = DOM final complet
- **Bypass Cloudflare/captchas** → le navigateur a déjà passé les protections
- **Empreinte navigateur réelle** → pas de détection bot

Aucun scraper server-side (Puppeteer, jsdom, fetch) ne peut offrir ça.

## 2. Architecture Globale (Flux de données)

```
┌─────────────────────┐
│   Claude Desktop    │  "Extrais le contenu de mon onglet"
│   (MCP Client)      │
└─────────┬───────────┘
          │ stdio (JSON-RPC 2.0)
          │ Transport standard MCP
┌─────────▼───────────┐
│   MCP Server        │
│   (Node.js)         │
│                     │
│   RELAIS PUR :      │
│   aucun fetch,      │
│   aucun jsdom,      │
│   aucune extraction │
│                     │
│ ┌─────────────────┐ │
│ │ WebSocket       │ │
│ │ Server          │ │
│ │ localhost:22816  │ │
│ └────────┬────────┘ │
└──────────┼──────────┘
           │ WebSocket (ws://localhost:22816)
           │ Ping toutes les 20s (keepalive MV3)
┌──────────▼──────────┐
│   Chrome Extension  │
│   (service worker)  │
│                     │
│   Reçoit commande   │
│   ↓                 │
│   Injecte content   │
│   script dans       │
│   l'onglet cible    │
│   ↓                 │
│   Récupère le DOM   │
│   rendu (avec       │
│   cookies, JS       │
│   exécuté, etc.)    │
│   ↓                 │
│   Parse via         │
│   offscreen doc     │
│   (Readability +    │
│   Turndown)         │
│   ↓                 │
│   Renvoie Markdown  │
│   au MCP Server     │
└──────────┬──────────┘
           │ chrome.scripting.executeScript()
┌──────────▼──────────┐
│   Web Pages         │
│   (DOM réel rendu)  │
│   ✓ Cookies actifs  │
│   ✓ JS exécuté      │
│   ✓ Cloudflare OK   │
└─────────────────────┘
```

### Pipeline complet d'une extraction MCP

```
1. Claude Desktop → "extract_active_tab(format: markdown)"
2. MCP Server reçoit via stdio (JSON-RPC)
3. MCP Server → WebSocket → Extension : { action: "extractActiveTab", params: { format: "markdown" } }
4. Service worker → chrome.scripting.executeScript({ tabId, files: ['extractor.js'] })
5. Content script → document.cloneNode(true) → resolveRelativeURLs → outerHTML
6. Service worker reçoit le HTML brut du DOM rendu
7. Service worker → extractViaOffscreen({ html, url, title, format })
8. Offscreen document → Readability → Turndown → Markdown
9. Service worker → WebSocket → MCP Server : { success: true, data: { output, metadata } }
10. MCP Server → stdio → Claude Desktop : résultat MCP
```

### Pourquoi WebSocket (et pas Native Messaging)

| Critère | WebSocket | Native Messaging |
|---------|-----------|-----------------|
| Setup utilisateur | `npx decant-mcp` → terminé | Registre Windows + manifeste JSON + chemin absolu |
| Keepalive MV3 | Chrome 116+ : WebSocket actif prolonge la vie du worker | Bug documenté : native host meurt après idle |
| Cross-platform | Identique partout | Config différente Windows/macOS/Linux |
| Processus | 1 seul (MCP server) | 2 (MCP server + native host bridge) |

**Prérequis** : `"minimum_chrome_version": "116"` dans le manifest.

## 3. MCP Tools exposés

### Tool 1 : `extract_active_tab`
```json
{
  "name": "extract_active_tab",
  "description": "Extract content from the user's currently active Chrome tab. Returns clean Markdown/JSON/MCP from the real rendered DOM (with cookies, JS executed, Cloudflare bypassed).",
  "inputSchema": {
    "type": "object",
    "properties": {
      "format": { "type": "string", "enum": ["markdown", "json", "mcp"], "default": "markdown" },
      "fullPage": { "type": "boolean", "default": false, "description": "true = skip Readability, extract full page. false = article mode." }
    }
  }
}
```

### Tool 2 : `list_tabs`
```json
{
  "name": "list_tabs",
  "description": "List all open Chrome tabs with their title, URL, and tab ID. Use tab IDs with extract_tab.",
  "inputSchema": { "type": "object", "properties": {} }
}
```

### Tool 3 : `extract_tab`
```json
{
  "name": "extract_tab",
  "description": "Extract content from a specific Chrome tab by ID (use list_tabs first). Extracts from the real rendered DOM.",
  "inputSchema": {
    "type": "object",
    "properties": {
      "tabId": { "type": "number", "description": "Chrome tab ID from list_tabs" },
      "format": { "type": "string", "enum": ["markdown", "json", "mcp"], "default": "markdown" },
      "fullPage": { "type": "boolean", "default": false }
    },
    "required": ["tabId"]
  }
}
```

### Tool 4 : `extract_url`
```json
{
  "name": "extract_url",
  "description": "Open a URL in a new Chrome tab, wait for render, extract content, then close the tab. The page is loaded in the real browser with full cookies and JS execution.",
  "inputSchema": {
    "type": "object",
    "properties": {
      "url": { "type": "string", "description": "URL to open and extract" },
      "format": { "type": "string", "enum": ["markdown", "json", "mcp"], "default": "markdown" },
      "fullPage": { "type": "boolean", "default": false },
      "keepTab": { "type": "boolean", "default": false, "description": "Keep the tab open after extraction" }
    },
    "required": ["url"]
  }
}
```
**Implémentation Browser-First** : Le MCP server envoie l'URL à l'extension → l'extension ouvre un nouvel onglet (`chrome.tabs.create`) → attend `chrome.tabs.onUpdated` status `complete` → injecte le content script → extrait → ferme l'onglet (sauf si `keepTab: true`) → retourne le résultat. Pas de fetch server-side.

### MCP Resources

| URI | Description |
|-----|-------------|
| `decant://status` | Statut de la connexion Chrome (connected/disconnected, nombre d'onglets) |

## 4. Permissions Chrome (LE PIÈGE À ÉVITER)

### Règle absolue : JAMAIS de `host_permissions` ou `tabs` en permission REQUISE

**Permissions actuelles V1.3 (inchangées) :**
```json
"permissions": [
  "activeTab", "storage", "sidePanel", "clipboardWrite",
  "contextMenus", "alarms", "scripting", "offscreen"
]
```

**Ajouts V2.0 :**
```json
"optional_permissions": ["tabs"],
"optional_host_permissions": ["<all_urls>"],
"minimum_chrome_version": "116"
```

### Matrice des permissions par fonctionnalité

| Fonctionnalité | Permission | Type | Quand demandée |
|---|---|---|---|
| Extraction popup (existant) | `activeTab` | Requise (déjà là) | Installation |
| DOM Picker V1.3 | `activeTab` | Requise (déjà là) | Installation |
| Raccourcis clavier | `activeTab` | Requise (déjà là) | Installation |
| `extract_active_tab` (MCP) | `optional_host_permissions` | Optionnelle | 1er clic "Enable MCP" |
| `list_tabs` (MCP) | `optional_permissions: tabs` | Optionnelle | 1er clic "Enable MCP" |
| `extract_tab` (MCP) | `optional_host_permissions` | Optionnelle | 1er clic "Enable MCP" |
| `extract_url` (MCP) | `optional_host_permissions` | Optionnelle | 1er clic "Enable MCP" |

### UX d'activation MCP

Quand l'utilisateur clique "Enable MCP Bridge" (dans options ou popup) :
```javascript
// Geste utilisateur obligatoire pour chrome.permissions.request()
const granted = await chrome.permissions.request({
  permissions: ['tabs'],
  origins: ['<all_urls>']
});
if (granted) {
  await chrome.storage.local.set({ mcpBridgeEnabled: true });
  connectMcpBridge(); // démarre le WebSocket client
}
```

- **Accepté** → tous les tools MCP fonctionnent
- **Refusé** → l'extension normale fonctionne toujours (popup, raccourcis, DOM picker)
- **Aucun message effrayant à l'installation/mise à jour**

### Impact review Google

| Scénario | Review |
|---|---|
| V1.3 (`activeTab` + `optional_permissions`) | ~2h auto |
| V2.0 (idem, pas de changement de permissions requises) | ~2h auto |
| Si `host_permissions: ["<all_urls>"]` en requis | 3-7 jours, review manuelle |

## 5. Structure du package

```
pageforge/
├── src/                           (extension existante)
│   ├── background/
│   │   └── service-worker.js      (MODIFIÉ: ajout WebSocket client MCP)
│   ├── content/
│   │   ├── extractor.js           (INCHANGÉ)
│   │   └── dom-picker.js          (NOUVEAU V1.3: sélection visuelle d'éléments)
│   ├── core/
│   │   ├── parser.js              (INCHANGÉ - pipeline Readability+Turndown)
│   │   ├── markdown.js            (INCHANGÉ)
│   │   ├── json-export.js         (INCHANGÉ)
│   │   ├── mcp-format.js          (INCHANGÉ)
│   │   ├── smart-extract.js       (INCHANGÉ)
│   │   └── table-detect.js        (INCHANGÉ)
│   ├── offscreen/
│   │   └── offscreen.js           (INCHANGÉ - parse HTML côté extension)
│   └── popup/, sidepanel/, ...    (MODIFIÉ V1.3: DOM Picker + Batch Extract UI)
│
├── mcp-server/                    (NOUVEAU V2.0 - package npm séparé)
│   ├── package.json
│   ├── bin/
│   │   └── decant-mcp.js          (#!/usr/bin/env node - CLI entry)
│   ├── src/
│   │   ├── index.js               (MCP server setup + stdio transport)
│   │   ├── tools/
│   │   │   ├── extract-active-tab.js
│   │   │   ├── extract-tab.js
│   │   │   ├── extract-url.js
│   │   │   └── list-tabs.js
│   │   └── bridge/
│   │       └── ws-server.js       (WebSocket server localhost:22816)
│   └── README.md
│
├── manifest.json                  (MODIFIÉ: optional_permissions + minimum_chrome_version)
├── package.json
└── ARCHITECTURE_V2_MCP.md         (CE DOCUMENT)
```

### Le MCP server est un RELAIS PUR

Le dossier `mcp-server/` ne contient **aucune logique d'extraction**. Pas de Readability, pas de Turndown, pas de jsdom. Toute l'extraction se fait dans l'extension Chrome (offscreen document). Le serveur :

1. Reçoit les commandes MCP de Claude Desktop (stdio)
2. Les relaie à l'extension Chrome (WebSocket)
3. Attend la réponse de l'extension
4. Retourne le résultat à Claude Desktop (stdio)

## 6. Paquets requis

### MCP Server (`mcp-server/package.json`)

```json
{
  "name": "decant-mcp",
  "version": "2.0.0",
  "type": "module",
  "bin": { "decant-mcp": "./bin/decant-mcp.js" },
  "dependencies": {
    "@modelcontextprotocol/sdk": "^1.x",
    "ws": "^8.x"
  }
}
```

**2 dépendances seulement :**

| Paquet | Rôle | Taille |
|--------|------|--------|
| `@modelcontextprotocol/sdk` | SDK officiel MCP (Server, StdioServerTransport, Zod) | ~50KB |
| `ws` | WebSocket server Node.js | ~50KB |

**PAS de jsdom, PAS de Readability, PAS de Turndown côté serveur.** Le serveur est ultra-léger (~100KB de dépendances).

### Extension Chrome (inchangée)

Les dépendances existantes (`@mozilla/readability`, `turndown`) restent dans le `package.json` racine. Elles sont utilisées uniquement dans l'offscreen document du navigateur.

## 7. Installation utilisateur

### Étape 1 — Configurer Claude Desktop

Ajouter dans `claude_desktop_config.json` :
```json
{
  "mcpServers": {
    "decant": {
      "command": "npx",
      "args": ["-y", "decant-mcp"]
    }
  }
}
```

### Étape 2 — Activer le bridge dans Chrome

Dans l'extension Decant → Options → "Enable MCP Bridge" → Accepter les permissions.

**C'est tout.** Zéro registre Windows, zéro manifeste natif, zéro chemin absolu.

## 8. Protocole WebSocket

### Handshake

```
Extension → ws://localhost:22816
  Headers: { "X-Decant-Id": chrome.runtime.id }

Server → Extension :
  { "type": "welcome", "version": "2.0.0", "tools": ["extract_active_tab", "list_tabs", "extract_tab", "extract_url"] }
```

### Messages

```typescript
// Commande : MCP server → extension
{
  "id": "uuid-v4",
  "type": "command",
  "action": "extractActiveTab" | "listTabs" | "extractTab" | "extractUrl",
  "params": { format?: string, fullPage?: boolean, tabId?: number, url?: string, keepTab?: boolean }
}

// Réponse : extension → MCP server
{
  "id": "uuid-v4",
  "type": "response",
  "success": true,
  "data": {
    "output": "# Article Title\n\nContent...",
    "metadata": { "title": "...", "url": "...", "wordCount": 1234, ... },
    "format": "markdown"
  }
}

// Erreur : extension → MCP server
{
  "id": "uuid-v4",
  "type": "response",
  "success": false,
  "error": "Tab not found"
}
```

### Keepalive

```
Toutes les 20s :
  Server → { "type": "ping" }
  Extension → { "type": "pong" }
```

Chrome 116+ : les messages WebSocket maintiennent le service worker actif.

### Reconnexion (service worker lifecycle)

```javascript
// Dans le service worker
chrome.alarms.create('mcp-reconnect', { periodInMinutes: 0.5 });

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'mcp-reconnect') {
    if (!mcpSocket || mcpSocket.readyState !== WebSocket.OPEN) {
      connectMcpBridge();
    }
  }
});
```

Si le worker meurt → alarm le réveille toutes les 30s → reconnexion automatique.

## 9. Service Worker : handler MCP commands

```javascript
async function handleMcpCommand(msg) {
  try {
    switch (msg.action) {
      case 'extractActiveTab': {
        const tab = await getActiveTab();
        if (!tab) return { success: false, error: 'No active tab' };
        const pageData = await sendToContentScript(tab.id, { action: 'extract' });
        if (!pageData.success) return { success: false, error: pageData.error };
        const result = await extractViaOffscreen({
          ...pageData.data,
          format: msg.params.format || 'markdown',
          fullPage: msg.params.fullPage || false,
          includeImages: true,
          detectTables: true,
          smartExtract: true,
        });
        return { success: true, data: result };
      }

      case 'listTabs': {
        const tabs = await chrome.tabs.query({ currentWindow: true });
        const filtered = tabs
          .filter(t => !t.url.startsWith('chrome://') && !t.url.startsWith('chrome-extension://'))
          .map(t => ({ id: t.id, title: t.title, url: t.url, active: t.active }));
        return { success: true, data: filtered };
      }

      case 'extractTab': {
        const pageData = await sendToContentScript(msg.params.tabId, { action: 'extract' });
        if (!pageData.success) return { success: false, error: pageData.error };
        const result = await extractViaOffscreen({
          ...pageData.data,
          format: msg.params.format || 'markdown',
          fullPage: msg.params.fullPage || false,
          includeImages: true,
          detectTables: true,
          smartExtract: true,
        });
        return { success: true, data: result };
      }

      case 'extractUrl': {
        // Browser-First : ouvrir l'URL dans un vrai onglet Chrome
        const newTab = await chrome.tabs.create({
          url: msg.params.url,
          active: false  // onglet en arrière-plan
        });
        // Attendre que la page charge complètement
        await waitForTabLoad(newTab.id);
        // Extraire depuis le DOM rendu (cookies, JS, Cloudflare = OK)
        const pageData = await sendToContentScript(newTab.id, { action: 'extract' });
        if (!pageData.success) {
          if (!msg.params.keepTab) await chrome.tabs.remove(newTab.id);
          return { success: false, error: pageData.error };
        }
        const result = await extractViaOffscreen({
          ...pageData.data,
          format: msg.params.format || 'markdown',
          fullPage: msg.params.fullPage || false,
          includeImages: true,
          detectTables: true,
          smartExtract: true,
        });
        // Fermer l'onglet sauf si keepTab
        if (!msg.params.keepTab) await chrome.tabs.remove(newTab.id);
        return { success: true, data: result };
      }

      default:
        return { success: false, error: `Unknown action: ${msg.action}` };
    }
  } catch (err) {
    return { success: false, error: err.message };
  }
}

// Helper : attendre qu'un onglet finisse de charger
function waitForTabLoad(tabId, timeout = 30000) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      chrome.tabs.onUpdated.removeListener(listener);
      reject(new Error('Tab load timeout'));
    }, timeout);

    function listener(id, info) {
      if (id === tabId && info.status === 'complete') {
        clearTimeout(timer);
        chrome.tabs.onUpdated.removeListener(listener);
        // Petit délai pour laisser les SPAs finir le rendu JS
        setTimeout(resolve, 500);
      }
    }
    chrome.tabs.onUpdated.addListener(listener);
  });
}
```

## 10. Modèle de sécurité

| Menace | Mitigation |
|--------|-----------|
| Port localhost sniffé | WebSocket accepte uniquement les connexions avec `X-Decant-Id` valide |
| Extension malveillante qui se connecte | Token d'auth échangé au handshake (généré à l'activation, stocké dans `chrome.storage.local`) |
| Extraction de pages privées sans consentement | L'utilisateur a explicitement cliqué "Enable MCP Bridge" + accordé les permissions |
| Données en transit | Localhost uniquement, pas de réseau |
| Commande MCP malformée | Validation Zod stricte côté serveur MCP avant relai |
| Tab bombing (ouvrir 100 onglets) | Rate limit dans le handler `extractUrl` (max 5 onglets ouverts simultanément) |

## 11. Phases d'implémentation

| Phase | Contenu | Statut |
|-------|---------|--------|
| **V1.3** | DOM Picker + Batch Extract + optional_permissions | En cours |
| **Alpha** | MCP server relais + WebSocket + `extract_active_tab` + `list_tabs` | Planifié |
| **Beta** | `extract_tab` + `extract_url` (ouvre onglet) + reconnexion auto | Planifié |
| **RC** | UI "Enable MCP Bridge" + permission flow + i18n | Planifié |
| **V2.0** | Tests E2E + publication npm `decant-mcp` + doc | Planifié |

## 12. Tests

| Test | Comment |
|------|---------|
| MCP protocol | `npx @modelcontextprotocol/inspector` → vérifier les 4 tools |
| WebSocket bridge | Extension chargée + MCP server lancé → connexion établie |
| `extract_active_tab` | Ouvrir une page → Claude: "extrais mon onglet" → Markdown reçu |
| `list_tabs` | 3 onglets ouverts → Claude: "liste mes onglets" → 3 résultats |
| `extract_tab` | `list_tabs` → choisir un ID → `extract_tab(id)` → Markdown |
| `extract_url` | Claude: "extrais https://example.com" → onglet s'ouvre, se ferme, Markdown reçu |
| SPA React | Ouvrir une app React → `extract_active_tab` → DOM rendu complet (pas le HTML source) |
| Page authentifiée | Se connecter sur un site payant → `extract_active_tab` → contenu complet |
| Service worker restart | Attendre 30s idle → envoyer commande MCP → reconnexion auto + réponse OK |
| Permissions denied | Ne PAS activer le bridge → envoyer commande MCP → erreur claire |
| Claude Desktop E2E | Config complète → conversation Claude → extraction réussie |
