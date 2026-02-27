# EXTRACTION_STANDARDS.md — Decant Quality Bible

> Version: 1.0 | Date: 2026-02-27 | Applies to: Decant V1.3+ (parser.js, markdown.js, mcp-format.js)

Ce document définit les standards qualitatifs **B2B-grade** pour les trois formats de sortie de Decant. Il sert de checklist pour toute modification du moteur d'extraction.

---

## 1. Standards Markdown (Optimisé LLM)

### 1.1 Whitespace Minification

| Règle | Regex / Action | Justification |
|-------|---------------|---------------|
| Tabs → espace | `\t` → ` ` | Les tabs proviennent de l'indentation HTML et coûtent des tokens inutiles |
| NBSP → espace | `\xA0` → ` ` | Non-breaking spaces sont invisibles mais comptent dans le tokenizer |
| Zero-width chars | `\u200B`, `\uFEFF` → supprimé | Artefacts d'encodage, 0 valeur sémantique |
| Multi-espaces → 1 | `/ {2,}/g` → ` ` | Les spans/divs vides génèrent des séries d'espaces |
| Trim chaque ligne | `/^ +\| +$/gm` → `''` | Les espaces en début/fin de ligne sont du bruit pur |
| Max 1 ligne vide | `\n{3,}` → `\n\n` | 2 newlines = 1 ligne vide. Au-delà = gaspillage de tokens |
| Pas de trailing whitespace | `.trim()` global | Aucun espace après le dernier caractère du document |

**Objectif token** : L'extraction doit produire un ratio texte utile / tokens total > 90%. Les espaces blancs ne doivent jamais dépasser 5% du total des tokens.

### 1.2 Traitement des liens

| Contexte | Comportement | Exemple |
|----------|-------------|---------|
| Lien interne relatif | **Résoudre en absolu** | `[Wiki](/wiki/France)` → `[Wiki](https://fr.wikipedia.org/wiki/France)` |
| Lien externe | Garder tel quel | `[Source](https://example.com)` |
| Lien vide (pas de texte) | **Supprimer** | `<a href="..."></a>` → rien |
| Lien ancre (`#section`) | **Supprimer le lien, garder le texte** | `[Section](#intro)` → `Section` |
| Lien javascript: | **Supprimer complètement** | `<a href="javascript:void(0)">` → rien |

**Pourquoi résoudre en absolu ?** : Un LLM qui reçoit `[Lien](/wiki/...)` ne peut pas naviguer vers la source. Les URLs absolues permettent la vérification et le grounding.

### 1.3 Traitement des images

| Règle | Comportement |
|-------|-------------|
| Image avec `alt` + `src` | `![alt text](https://absolute.url/image.jpg)` |
| Image sans `alt` | `![](url)` — garder si URL valide |
| Image sans `src` | **Supprimer** |
| Image décorative (`alt=""`) | **Supprimer** — pas de valeur sémantique |
| Lazy-loaded (`data-src`) | Résoudre `data-src` comme fallback de `src` |
| Format inline (avatar, icône) | **Supprimer** — images < 50x50 pixels n'ajoutent rien en Markdown |

**Principe** : Les images en Markdown doivent ajouter du contexte sémantique, pas du bruit. Une image sans alt significatif dans un flux de texte est un token gaspillé.

### 1.4 Structure du document Markdown

```markdown
# {Titre de la page}

> **Source:** {URL absolue}
> **Site:** {Nom du site}
> **Summary:** {Meta description ou excerpt}
> **Extracted:** {ISO 8601} | {word count} words

---

{Contenu principal — Markdown propre, minifié}

---

## Extracted Tables

### Table 1: {Caption}
| Header | Header |
| --- | --- |
| Cell | Cell |

---

## Extracted Data

**Emails:** email@example.com
**Dates:** 2026-02-27
```

---

## 2. Standards JSON (Pipeline RAG)

### 2.1 Schéma JSON

Le format JSON est conçu pour l'intégration directe dans un pipeline RAG (Retrieval-Augmented Generation). La séparation claire entre `metadata`, `content` et `extracted` permet un indexage sélectif.

```json
{
  "version": "1.0",
  "metadata": {
    "title": "string",
    "url": "string (absolute)",
    "domain": "string",
    "siteName": "string",
    "excerpt": "string",
    "wordCount": "number",
    "imageCount": "number",
    "estimatedTokens": "number",
    "extractedAt": "string (ISO 8601)",
    "tableCount": "number"
  },
  "content": {
    "plain": "string (texte brut, whitespace normalisé)",
    "sections": [
      {
        "heading": "string",
        "level": "number (1-6)",
        "content": "string"
      }
    ],
    "headings": [{ "level": "number", "text": "string" }],
    "links": [{ "text": "string", "href": "string (absolute)" }],
    "images": [{ "src": "string (absolute)", "alt": "string" }],
    "codeBlocks": [{ "language": "string", "code": "string" }],
    "lists": [{ "type": "ordered|unordered", "items": ["string"] }]
  },
  "tables": [
    {
      "index": "number",
      "caption": "string|null",
      "headers": ["string"],
      "rows": [["string"]],
      "markdown": "string"
    }
  ],
  "extractedData": {
    "emails": ["string"],
    "dates": ["string"],
    "prices": ["string"],
    "phones": ["string"]
  }
}
```

### 2.2 Règles qualitatives JSON

| Règle | Description |
|-------|-------------|
| `plain` est whitespace-normalisé | Même pipeline que les règles Markdown §1.1 |
| `sections` sont ordonnées | Respectent l'ordre DOM du document |
| URLs absolues partout | `links[].href`, `images[].src` — jamais de relatif |
| Pas de HTML dans `plain` | Texte pur, aucune balise |
| Pas de HTML dans `sections[].content` | Texte pur ou Markdown, jamais du HTML brut |
| `estimatedTokens` est une estimation | Heuristique `(chars/4 + words*1.33) / 2` — suffisante pour le planning de contexte |
| `extractedAt` en UTC ISO 8601 | Ex: `2026-02-27T12:34:56.789Z` |

---

## 3. Standards MCP (State of the Art)

### 3.1 Spécification MCP Resources (Nov 2025)

Référence officielle : [MCP Specification 2025-11-25](https://modelcontextprotocol.io/specification/2025-11-25)

Le format MCP de Decant produit un objet `Resource` conforme au protocole :

```json
{
  "type": "resource",
  "uri": "decant://extracted/{domain}/{slug}",
  "name": "{title}",
  "description": "{excerpt}",
  "mimeType": "text/plain",
  "content": "{LLM-optimized plain text}",
  "metadata": {
    "source": { "url", "domain", "siteName", "extractedAt" },
    "contentType": "article|data_table|product|contact|general",
    "stats": { "wordCount", "imageCount", "estimatedTokens", "tableCount" },
    "extractedEntities": { "emails", "dates", "prices", "phones" },
    "tables": [{ "index", "caption", "headers", "rows", "rowCount" }]
  }
}
```

### 3.2 Best Practices Anthropic pour l'injection de contexte

Sources : [Anthropic Long Context Tips](https://docs.anthropic.com/en/docs/build-with-claude/prompt-engineering/long-context-tips) | [XML Tags Guide](https://docs.anthropic.com/en/docs/build-with-claude/prompt-engineering/use-xml-tags)

**Recommandation Anthropic : utiliser des tags XML `<document>` pour le contexte long.**

```xml
<documents>
  <document index="1">
    <source>https://fr.wikipedia.org/wiki/France</source>
    <document_content>
      {contenu extrait}
    </document_content>
  </document>
</documents>
```

**Cependant**, le format MCP `text/plain` de Decant utilise des marqueurs `[Source: ...]` / `[URL: ...]` en texte brut. Ce choix est justifié par :

| Approche | Avantages | Inconvénients |
|----------|-----------|---------------|
| **XML `<document>` tags** | Structure claire pour Claude, parsing non-ambigu, recommandé par Anthropic pour le multi-document | Plus verbeux (+tokens), pas standard dans l'écosystème MCP |
| **Plain text avec marqueurs `[...]`** | Compact, compatible avec tous les LLMs (pas seulement Claude), format MCP natif (`text/plain`) | Moins structuré, risque de confusion si le contenu contient des `[...]` |
| **Markdown encapsulé** | Formatage riche, headings/listes préservés, lisible par les humains | Overhead de formatage, pas de séparation metadata/content native |

**Décision Decant** : Le format MCP utilise `text/plain` avec marqueurs `[...]` pour la compatibilité maximale. Pour les cas multi-documents (batch extract), le MCP server V2.0 pourra encapsuler chaque document dans des tags `<document>`.

### 3.3 Structure du contenu MCP (text/plain)

```
[Source: {title}]
[URL: {absolute URL}]
[Summary: {excerpt}]

{contenu principal — texte brut, whitespace normalisé, aucun tab, max 1 ligne vide}

[Tables]
Table 1 - {caption}:
header1 | header2
row1col1 | row1col2

[Extracted Entities]
Emails: email@example.com
Dates: 2026-02-27
Prices: $29.99
Phones: +1-555-0123
```

### 3.4 Règles qualitatives MCP

| Règle | Description |
|-------|-------------|
| Whitespace minifié | Mêmes règles que §1.1 — critique pour les tokens API |
| Pas de HTML | Jamais de `<div>`, `<span>`, `<a>` dans la sortie |
| Pas de Markdown | Le content MCP est `text/plain` pur |
| Tables en pipe-delimited | `col1 \| col2` — parseable par les LLMs |
| URLs absolues | Dans les marqueurs `[URL: ...]` et nulle part ailleurs dans le texte |
| `contentType` classification | Aide le LLM à adapter son traitement (`article` vs `data_table`) |
| `estimatedTokens` obligatoire | Permet au client MCP de gérer sa fenêtre de contexte |

---

## 4. Blacklist CSS Universelle

### 4.1 Philosophie

La blacklist CSS s'applique **avant** Readability et Turndown. Son rôle est de supprimer les éléments DOM qui ne sont **jamais du contenu** sur aucun site web. C'est le premier filtre, le plus agressif.

**Principe** : Mieux vaut supprimer un élément UI douteux que de laisser passer du bruit dans l'extraction. Le contenu principal est rarement dans un `<button>`, un `<nav>`, ou un `.sidebar`.

### 4.2 Sélecteurs par catégorie

#### Core non-content (toujours supprimer)
```css
script
style
noscript
iframe:not([src*="youtube"]):not([src*="vimeo"])
svg
```

#### Navigation & page chrome
```css
nav
footer:not(article footer)
header:not(article header)
[role="navigation"]
[role="banner"]
[role="contentinfo"]
[role="search"]
[role="menu"]
[role="menubar"]
[role="toolbar"]
[role="complementary"]
[role="dialog"]
[role="alertdialog"]
[role="directory"]
.breadcrumb
.breadcrumbs
.pagination
```

#### Buttons & form controls (interactifs, jamais du contenu)
```css
button
[role="button"]
input
select
textarea
fieldset
[type="search"]
```

#### Publicités & tracking
```css
.ad
.ads
.advertisement
.sponsored
[class*="ad-"]
[class*="ads-"]
[id*="ad-"]
[id*="ads-"]
ins.adsbygoogle
[id*="google_ads"]
```

#### Sidebars & widgets
```css
.sidebar
aside:not(article aside)
.widget
.widgets
```

#### Cookies & consent
```css
[class*="cookie"]
[id*="cookie"]
[class*="consent"]
.cookie-banner
.cookie-consent
#cookie-banner
#gdpr
.gdpr
[class*="gdpr"]
```

#### Popups & overlays
```css
[class*="popup"]
[class*="modal"]
[class*="overlay"]
```

#### Social sharing
```css
[class*="share"]
[class*="social"]
.share-buttons
.social-share
```

#### Commentaires
```css
.comments
#comments
.disqus
[id*="comment"]
```

#### Contenu associé
```css
[class*="related"]
[class*="recommended"]
.related-posts
```

#### Éléments cachés / accessibilité-only
```css
[aria-hidden="true"]
.print-only
.screen-reader-text
.sr-only
.visually-hidden
.noprint
```

#### Liens d'édition & actions CMS
```css
.edit-link
.edit-section
.mw-editsection
a[href*="action=edit"]
```

#### Table des matières
```css
#toc
.toc
```

#### Skip / navigation accessibilité
```css
.skip-link
.mw-jump-link
[class*="skip-to"]
```

#### MediaWiki (Wikipedia, Fandom, etc.)
```css
.navbox
.navbox-inner
.catlinks
.mw-indicators
.mw-empty-elt
.sistersitebox
.portalbox
.metadata
.hatnote
.ambox
.infobox
.mw-authority-control
#mw-navigation
#mw-panel
```

#### WordPress
```css
.wp-block-latest-comments
.wp-block-archives
.wp-block-calendar
.wp-block-tag-cloud
```

#### Newsletter / signup / promo
```css
[class*="newsletter"]
[class*="subscribe"]
[class*="signup"]
[class*="promo"]
```

#### Utilitaires
```css
.back-to-top
[class*="backtotop"]
[class*="go-to-top"]
```

### 4.3 Phase 2 : Nettoyage des nœuds vides

Après la suppression par sélecteurs, les conteneurs parents deviennent vides (ex: `<div>` qui contenait un `<nav>` supprimé). Deux passes de nettoyage suppriment ces éléments :

```
Tags ciblés : div, section, span, p, li, ul, ol, dl, dd, dt, figure, figcaption, aside, header, footer, article

Condition de suppression :
  - textContent.trim() === '' (aucun texte visible)
  - ET pas d'éléments media enfants (img, video, audio, canvas, picture)
```

**2 passes** sont nécessaires car la suppression d'éléments internes peut rendre des éléments externes vides à leur tour.

### 4.4 Turndown — Suppression additionnelle

En plus de la blacklist DOM, Turndown supprime les éléments interactifs qui pourraient passer le filtre :

```javascript
td.remove([
  'script', 'style', 'noscript', 'iframe',
  'button', 'input', 'select', 'textarea', 'fieldset',
  'nav', 'svg', 'form',
]);
```

---

## 5. Métriques de qualité

### 5.1 KPIs d'extraction

| Métrique | Cible | Mesure |
|----------|-------|--------|
| **Ratio signal/bruit** | > 90% | `(mots de contenu) / (mots totaux extraits)` |
| **Tabs résiduels** | 0 | `output.includes('\t')` doit être `false` |
| **Lignes vides consécutives** | Max 1 | `/\n{3,}/` ne doit pas matcher |
| **Éléments UI résiduels** | 0 | Pas de "Modifier", "Lire la suite", "Cookie" dans l'output |
| **URLs relatives** | 0 | Tous les liens et images doivent être absolus |
| **HTML résiduel** | 0 (MCP/JSON plain) | Pas de `<div>`, `<span>` dans les champs texte |
| **Token overhead** | < 10% | Tokens de formatage / tokens totaux |

### 5.2 Sites de test recommandés

| Site | Challenge |
|------|-----------|
| fr.wikipedia.org (Accueil) | Navbox, editsection, multi-colonnes, infobox |
| en.wikipedia.org (Article long) | Citations, tables, infobox, catlinks |
| medium.com (Article payant) | Paywall partiel, images lazy-load, recommandations |
| github.com (README) | Code blocks, badges, navigation, sidebar |
| amazon.com (Page produit) | Structure non-article, prix, images, widgets |
| reddit.com (Thread) | Commentaires imbriqués, upvotes, sidebars |
| docs.python.org | Navigation lourde, TOC, code blocks |
| nytimes.com | Paywall, publicités, related content |

---

## 6. Changelog des standards

| Version | Date | Changements |
|---------|------|-------------|
| 1.0 | 2026-02-27 | Version initiale — whitespace minification, blacklist CSS 75+ sélecteurs, standards MCP/JSON/Markdown |
