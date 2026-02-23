/**
 * Offscreen document — provides DOM access for the service worker.
 *
 * MV3 service workers don't have access to DOMParser, document, or window.
 * This offscreen document receives raw HTML from the service worker,
 * parses it using the extraction pipeline (Readability + Turndown),
 * and returns the structured result.
 *
 * Communication: chrome.runtime messaging only (per Chrome docs).
 */
import { extract } from '../core/parser.js';

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.target !== 'offscreen') return;

  if (message.action === 'extract') {
    try {
      const result = extract(message.options);
      sendResponse({ success: true, result });
    } catch (error) {
      sendResponse({ success: false, error: error.message });
    }
    return true; // async response
  }
});
