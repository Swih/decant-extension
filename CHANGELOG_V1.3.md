# Decant V1.3 — DOM Picker + Batch Extract

## Vue d'ensemble

Decant V1.3 introduit deux fonctionnalites majeures qui resolvent les limites identifiees de V1.2 :

1. **DOM Picker** — Selection chirurgicale d'elements pour les pages ou Readability echoue
2. **Batch Extract** — Extraction de tous les onglets ouverts en une seule operation

Ces ajouts preparent aussi l'architecture pour la V2.0 (MCP Bridge) en ajoutant les `optional_permissions` et `minimum_chrome_version`.

---

## Nouvelles fonctionnalites

### 1. DOM Picker (Selection chirurgicale)

#### Le probleme
Mozilla Readability excelle sur les articles de blog/news, mais echoue sur :
- Pages produit (Amazon, eBay)
- Repos GitHub avec README complexes
- Fils Reddit tres imbriques
- Tableaux de bord SaaS
- Documentation technique avec navigation lourde

#### La solution
Un selecteur visuel d'elements qui permet a l'utilisateur de cibler precisement la zone a extraire.

#### Comment l'utiliser

**Option 1 — Bouton dans le popup :**
1. Cliquer sur l'icone curseur a droite du bouton "Extract Content"
2. Le popup se ferme, une banniere violette "Decant Picker" apparait en haut de la page
3. Survoler les elements : chaque element se surligne avec un contour violet
4. Un tooltip affiche le tag HTML, les classes, et les dimensions
5. Cliquer sur l'element voulu
6. Le contenu est extrait et copie dans le presse-papier

**Option 2 — Raccourci clavier :**
- `Ctrl+Shift+P` (Windows/Linux) / `Cmd+Shift+P` (Mac)

**Option 3 — Menu contextuel :**
- Clic droit → Decant → "Pick element to extract"

#### Comportement
- L'element selectionne est clone (le DOM live n'est jamais modifie)
- Les URLs relatives sont resolues en absolues
- L'extraction passe par le pipeline Readability en mode `fullPage: true` (pas de filtrage article)
- Le resultat est automatiquement copie dans le presse-papier
- Le resultat est aussi envoye au Side Panel s'il est ouvert

#### Annulation
- `Echap` pour annuler
- Clic droit pour annuler
- Bouton "Cancel" dans la banniere

#### Details techniques

**Fichier :** `src/content/dom-picker.js`

Architecture :
```
Popup/Keyboard/Context Menu
  → chrome.scripting.executeScript({ files: ['dom-picker.js'] })
  → DOM Picker s'active dans la page
  → Utilisateur clique un element
  → chrome.runtime.sendMessage({ action: 'pickerResult', data: { html, url, title, domain, selector } })
  → Service Worker recoit le message
  → extractViaOffscreen() avec fullPage: true
  → Resultat copie + envoye au Side Panel
```

Caracteristiques UI :
- Overlay violet semi-transparent (`rgba(139, 92, 246, 0.08)`)
- Bordure violette (`#8B5CF6`) avec box-shadow glow
- Tooltip flottant avec tag HTML, classes, et dimensions
- Banniere superieure avec instructions et bouton Cancel
- Curseur crosshair sur toute la page
- Transitions fluides (80ms ease-out)
- Z-index maximum (`2147483646-47`) pour etre au-dessus de tout
- Nettoyage complet a la sortie (aucun residu dans le DOM)

Permissions :
- `activeTab` (deja presente) — suffisant pour injecter le content script
- `scripting` (deja presente) — pour `chrome.scripting.executeScript()`
- **Aucune nouvelle permission requise**

---

### 2. Batch Extract (Extraction par lot)

#### Le probleme
Les chercheurs, developeurs et analystes doivent souvent extraire le contenu de 5-20 pages pour constituer un dataset d'entrainement ou un corpus d'analyse. Extraire page par page est fastidieux.

#### La solution
Un panneau pliable dans le popup qui permet d'extraire tous les onglets ouverts en un clic.

#### Comment l'utiliser

1. Ouvrir les pages a extraire dans des onglets Chrome
2. Cliquer sur "Batch Extract" dans le popup Decant (panneau pliable)
3. Cliquer "All Tabs" pour lancer l'extraction
4. Suivre la progression (barre de progression + compteur)
5. Une fois termine, cliquer "Download All" pour telecharger un fichier combine

#### Comportement
- Extrait tous les onglets de la fenetre courante
- Ignore automatiquement les onglets `chrome://`, `chrome-extension://` et `about:`
- Les onglets non-extractibles (erreurs de permission, pages vides) sont ignores silencieusement
- Le format utilise est celui selectionne dans le popup (Markdown/JSON/MCP)
- Les options actives (images, tableaux, smart extract, full page) s'appliquent a tous les onglets
- Le fichier combine utilise `---` comme separateur en Markdown
- Chaque section est precedee d'un commentaire `<!-- Source: URL -->`

#### Details techniques

**Integration popup :** `src/popup/popup.js` + `src/popup/popup.html`

Architecture :
```
Utilisateur clique "All Tabs"
  → ensureBatchPermissions()
    → chrome.permissions.contains({ tabs, <all_urls> })
    → Si manquant : chrome.permissions.request() (prompt Chrome natif)
    → Si refuse : toast "Permission denied" → stop
  → chrome.tabs.query({ currentWindow: true })  // tabs permission → url/title accessibles
  → Filtre les onglets extractibles
  → Pour chaque onglet :
    → chrome.scripting.executeScript()  // <all_urls> → injection autorisee
    → Envoie { action: 'extract' }
    → Parse le resultat via extract() (dans le popup, qui a acces au DOM)
    → Stocke dans batchResults[]
  → Active le bouton "Download All"
  → L'utilisateur telecharge le fichier combine
```

**Pourquoi la permission est demandee au clic (et pas a l'installation) :**
- `activeTab` ne donne acces qu'a l'onglet actif au moment du clic
- Pour injecter des scripts dans les AUTRES onglets, il faut `tabs` + `<all_urls>`
- `chrome.permissions.request()` doit etre appele dans un gestionnaire de geste utilisateur
- Le clic sur "All Tabs" est ce geste → le prompt Chrome natif s'affiche
- Si accorde, la permission persiste (pas de re-demande)

Format du fichier combine (Markdown) :
```markdown
<!-- Source: https://example.com/page1 -->
# Page 1 Title
...contenu...

---

<!-- Source: https://example.com/page2 -->
# Page 2 Title
...contenu...
```

---

## Modifications de fichiers

### Fichiers crees
| Fichier | Description |
|---------|-------------|
| `src/content/dom-picker.js` | Content script du DOM Picker (injecte a la demande) |
| `ARCHITECTURE_V2_MCP.md` | Blueprint V2.0 MCP Bridge |
| `CHANGELOG_V1.3.md` | Ce document |

### Fichiers modifies
| Fichier | Changements |
|---------|-------------|
| `manifest.json` | Version → 1.3.0, `optional_permissions`, `optional_host_permissions`, `minimum_chrome_version: "116"`, commande `dom-picker`, `dom-picker.js` dans `web_accessible_resources` |
| `package.json` | Version → 1.3.0 |
| `vite.config.js` | Copie `dom-picker.js` vers dist/ en plus de `extractor.js` |
| `src/background/service-worker.js` | Handler commande `dom-picker`, handlers messages `pickerResult`/`pickerCancelled`, fonctions `handleStartDomPicker`/`handlePickerResult`, menu contextuel "Pick element" |
| `src/popup/popup.html` | Bouton picker, section Batch Extract avec toggle/progress/actions |
| `src/popup/popup.js` | Logique picker button, logique Batch Extract (all tabs + download) |
| `src/popup/popup.css` | Styles pour `.picker-btn`, `.batch-*` |
| `_locales/en/messages.json` | 10 nouvelles cles i18n (picker + batch) |
| `_locales/fr/messages.json` | 10 nouvelles cles i18n (picker + batch) |

### Fichiers inchanges
Tous les fichiers core (`parser.js`, `markdown.js`, `json-export.js`, `mcp-format.js`, `smart-extract.js`, `table-detect.js`, `offscreen.js`, `extractor.js`) restent inchanges. Le DOM Picker et le Batch Extract reutilisent le pipeline d'extraction existant sans modification.

---

## Permissions

### Permissions requises (inchangees depuis V1.2)
```json
"permissions": [
  "activeTab",     // Extraction popup + DOM Picker + raccourcis
  "storage",       // Preferences + historique
  "sidePanel",     // Panneau lateral
  "clipboardWrite",// Copie presse-papier
  "contextMenus",  // Menu clic droit
  "alarms",        // NPS + (futur: MCP reconnexion)
  "scripting",     // Injection dynamique extractor.js + dom-picker.js
  "offscreen"      // Parse HTML (DOMParser + Readability)
]
```

### Permissions optionnelles (nouvelles, pour V2.0)
```json
"optional_permissions": ["tabs"],
"optional_host_permissions": ["<all_urls>"]
```
Ces permissions ne sont **pas demandees a l'installation**. Elles seront demandees uniquement quand l'utilisateur activera le MCP Bridge en V2.0.

### Impact review Chrome Web Store
- **Aucun changement** de permissions requises → review automatique (~2h)
- Les `optional_permissions` n'affectent pas le processus de review

---

## Raccourcis clavier

| Raccourci | Action |
|-----------|--------|
| `Ctrl+Shift+E` | Extraire la page |
| `Ctrl+Shift+C` | Extraire et copier |
| `Ctrl+Shift+S` | Extraire et sauvegarder |
| `Ctrl+Shift+P` | **DOM Picker** (nouveau) |

---

## Menu contextuel

| Element | Action |
|---------|--------|
| Extract selection as Markdown | Extraire la selection |
| Extract full page | Extraire la page entiere |
| Copy for AI (optimized) | Copier au format MCP |
| **Pick element to extract** | **Lancer le DOM Picker** (nouveau) |

---

## Architecture du DOM Picker

```
┌──────────────────────────────────┐
│          Popup / Shortcut /      │
│          Context Menu            │
│                                  │
│  "Start DOM Picker"              │
└──────────────┬───────────────────┘
               │
               │ chrome.scripting.executeScript()
               │
┌──────────────▼───────────────────┐
│          dom-picker.js           │
│    (content script - page DOM)   │
│                                  │
│  ┌─────────────────────────┐     │
│  │  Banniere superieure    │     │
│  │  "Decant Picker —       │     │
│  │   Click to extract"     │     │
│  └─────────────────────────┘     │
│                                  │
│  ┌─────────────────────────┐     │
│  │  Overlay violet         │     │
│  │  (suit le mouseover)    │     │
│  └─────────────────────────┘     │
│                                  │
│  ┌─────────────────────────┐     │
│  │  Tooltip                │     │
│  │  <div.article> 800×400  │     │
│  └─────────────────────────┘     │
│                                  │
│  Click → cloneNode + outerHTML   │
│  ESC/Right-click → Cancel        │
└──────────────┬───────────────────┘
               │
               │ chrome.runtime.sendMessage()
               │ { action: 'pickerResult', data }
               │
┌──────────────▼───────────────────┐
│       Service Worker             │
│                                  │
│  handlePickerResult(data)        │
│  → extractViaOffscreen()         │
│  → copyToClipboard()            │
│  → sendToSidePanel()             │
└──────────────────────────────────┘
```

---

## Preparation V2.0

V1.3 pose les fondations de la V2.0 MCP Bridge :

| Element V1.3 | Utilise par V2.0 |
|--------------|------------------|
| `optional_permissions: ["tabs"]` | `list_tabs` MCP tool |
| `optional_host_permissions: ["<all_urls>"]` | `extract_tab` / `extract_url` MCP tools |
| `minimum_chrome_version: "116"` | WebSocket keepalive du service worker |
| Pipeline DOM Picker | Base technique pour `extract_url` (ouvrir + extraire + fermer) |
| Batch Extract | Preuve de concept multi-tab extraction |

Le blueprint complet de l'architecture V2.0 est dans `ARCHITECTURE_V2_MCP.md`.

---

## Tests recommandes

| Test | Procedure |
|------|-----------|
| DOM Picker - injection | Ouvrir une page → `Ctrl+Shift+P` → Banniere violette apparait |
| DOM Picker - highlight | Survoler des elements → overlay violet suit le curseur |
| DOM Picker - tooltip | Survoler → tooltip affiche tag + dimensions |
| DOM Picker - capture | Cliquer un element → contenu copie dans le presse-papier |
| DOM Picker - cancel ESC | `Echap` → picker se ferme, page revient a la normale |
| DOM Picker - cancel clic droit | Clic droit → picker se ferme |
| DOM Picker - popup button | Popup → clic icone curseur → popup se ferme, picker s'active |
| DOM Picker - context menu | Clic droit → Decant → "Pick element" → picker s'active |
| DOM Picker - cleanup | Apres fermeture, aucun element Decant ne reste dans le DOM |
| Batch - toggle | Clic "Batch Extract" → panneau se deplie/replie |
| Batch - all tabs | 3+ onglets → "All Tabs" → progression affichee → resultat |
| Batch - download | Apres extraction → "Download All" → fichier telecharge |
| Batch - chrome:// tabs | Onglets chrome:// ignores sans erreur |
| Batch - format | Changer format (MD/JSON/MCP) avant batch → fichier au bon format |
| Permissions | Installation sans warning supplementaire |
| Backward compat | Toutes les fonctions V1.2 (popup extract, shortcuts, context menu) intactes |
