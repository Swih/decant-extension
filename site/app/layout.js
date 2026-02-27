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
    url: 'https://decant-extention.vercel.app',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
        <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>💧</text></svg>" />
      </head>
      <body>{children}</body>
    </html>
  );
}
