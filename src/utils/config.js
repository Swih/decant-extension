/**
 * Centralized configuration constants.
 */

// TODO: Replace with real extension ID after Chrome Web Store publication
export const EXTENSION_ID = '';

export const STORE_URL = EXTENSION_ID
  ? `https://chrome.google.com/webstore/detail/decant/${EXTENSION_ID}/reviews`
  : '';

// Public website (Vercel) — update after deployment
export const SITE_URL = 'https://decant-extension.vercel.app';

export const VERSION = chrome.runtime?.getManifest?.()?.version || '1.0.0';

export const isPublished = () => !!EXTENSION_ID;
