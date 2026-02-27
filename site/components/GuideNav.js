'use client';

import { usePathname } from 'next/navigation';

const guides = [
  { href: '/guides/mcp-bridge', label: 'MCP Bridge' },
  { href: '/guides/extraction', label: 'Manual Extraction' },
  { href: '/guides/selector', label: 'DOM Picker' },
  { href: '/guides/batch', label: 'Batch Extraction' },
];

export default function GuideNav() {
  const pathname = usePathname();

  return (
    <nav>
      <ul className="guide-nav">
        {guides.map((g) => (
          <li key={g.href}>
            <a href={g.href} className={pathname === g.href ? 'active' : ''}>
              {g.label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
