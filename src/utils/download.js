/**
 * Download content as a file.
 */

const FORMAT_EXTENSIONS = {
  markdown: 'md',
  json: 'json',
  mcp: 'json',
};

const FORMAT_MIMES = {
  markdown: 'text/markdown',
  json: 'application/json',
  mcp: 'application/json',
};

export function downloadFile(content, filename, format = 'markdown') {
  const ext = FORMAT_EXTENSIONS[format] || 'txt';
  const mime = FORMAT_MIMES[format] || 'text/plain';
  const fullName = filename.endsWith(`.${ext}`) ? filename : `${filename}.${ext}`;

  const blob = new Blob([content], { type: `${mime};charset=utf-8` });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = fullName;
  a.style.display = 'none';
  document.body.appendChild(a);
  a.click();

  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 100);
}

export function sanitizeFilename(title) {
  return title
    .replace(/[<>:"/\\|?*]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, 100)
    .toLowerCase();
}
