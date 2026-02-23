/**
 * Content script — runs in the context of web pages.
 * Extracts DOM content and sends it to the background/popup.
 */

// Listen for extraction requests from popup or background
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'extract') {
    try {
      const data = extractPageData(message.options || {});
      sendResponse({ success: true, data });
    } catch (error) {
      sendResponse({ success: false, error: error.message });
    }
    return true; // Keep message channel open for async response
  }

  if (message.action === 'getPageInfo') {
    sendResponse({
      success: true,
      data: {
        title: document.title,
        url: window.location.href,
        domain: window.location.hostname,
        wordCount: estimateWordCount(),
        imageCount: document.querySelectorAll('img').length,
      },
    });
    return true;
  }

  if (message.action === 'copyToClipboard') {
    navigator.clipboard
      .writeText(message.text)
      .then(() => sendResponse({ success: true }))
      .catch((err) => sendResponse({ success: false, error: err.message }));
    return true;
  }

  if (message.action === 'downloadFile') {
    try {
      const ext = { markdown: 'md', json: 'json', mcp: 'json' }[message.format] || 'txt';
      const mime =
        { markdown: 'text/markdown', json: 'application/json', mcp: 'application/json' }[
          message.format
        ] || 'text/plain';
      const blob = new Blob([message.content], { type: mime });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${message.filename}.${ext}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      sendResponse({ success: true });
    } catch (err) {
      sendResponse({ success: false, error: err.message });
    }
    return true;
  }

  if (message.action === 'ping') {
    sendResponse({ success: true });
    return true;
  }
});

/**
 * Extract the full page data for processing.
 */
function extractPageData(_options) {
  // Clone the entire document to avoid modifying the live DOM
  const docClone = document.cloneNode(true);

  // Resolve all relative URLs to absolute
  resolveRelativeURLs(docClone);

  return {
    html: docClone.documentElement.outerHTML,
    url: window.location.href,
    title: document.title,
    domain: window.location.hostname,
  };
}

/**
 * Resolve relative URLs in images and links to absolute.
 */
function resolveRelativeURLs(doc) {
  const base = window.location.href;

  doc.querySelectorAll('img[src]').forEach((img) => {
    try {
      img.src = new URL(img.getAttribute('src'), base).href;
    } catch {
      /* skip invalid URLs */
    }
  });

  doc.querySelectorAll('img[data-src]').forEach((img) => {
    try {
      img.setAttribute('data-src', new URL(img.getAttribute('data-src'), base).href);
    } catch {
      /* skip */
    }
  });

  doc.querySelectorAll('a[href]').forEach((a) => {
    try {
      const href = a.getAttribute('href');
      if (href && !href.startsWith('#') && !href.startsWith('javascript:')) {
        a.href = new URL(href, base).href;
      }
    } catch {
      /* skip */
    }
  });
}

/**
 * Quick word count estimate for page info display.
 */
function estimateWordCount() {
  const text = document.body?.innerText || '';
  return text.trim().split(/\s+/).filter(Boolean).length;
}
