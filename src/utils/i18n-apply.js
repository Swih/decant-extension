/**
 * i18n DOM applicator — translates all data-i18n attributes using chrome.i18n.
 * Import and call applyI18n() from each page's module JS.
 */
export function applyI18n() {
  const msg = (key) => chrome.i18n?.getMessage(key) || '';

  // Translate textContent
  document.querySelectorAll('[data-i18n]').forEach((el) => {
    const key = el.getAttribute('data-i18n');
    const translated = msg(key);
    if (translated) el.textContent = translated;
  });

  // Translate title attributes
  document.querySelectorAll('[data-i18n-title]').forEach((el) => {
    const key = el.getAttribute('data-i18n-title');
    const translated = msg(key);
    if (translated) el.title = translated;
  });

  // Translate placeholder attributes
  document.querySelectorAll('[data-i18n-placeholder]').forEach((el) => {
    const key = el.getAttribute('data-i18n-placeholder');
    const translated = msg(key);
    if (translated) el.placeholder = translated;
  });
}
