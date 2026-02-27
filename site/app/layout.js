import './globals.css';

export const metadata = {
  title: {
    default: 'Decant — Extract pure, AI-ready content from any page',
    template: '%s — Decant',
  },
  description: 'Decant the web. Extract clean Markdown, JSON, or MCP content from any page. 100% local, no data sent anywhere.',
  openGraph: {
    title: 'Decant — Decant the web',
    description: 'Extract pure, AI-ready content from any page. Markdown, JSON, MCP. 100% local.',
    type: 'website',
    url: 'https://decant-extension.vercel.app',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <link rel="icon" href="/favicon-32.png" sizes="32x32" type="image/png" />
        <link rel="apple-touch-icon" href="/favicon.png" />
      </head>
      <body>{children}</body>
    </html>
  );
}
