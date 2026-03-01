'use client';

import { useState, useEffect } from 'react';
import { PageLayout } from './page-layout.js';
import { ClockIcon, ZapIcon, KeyIcon, PlugIcon, CpuIcon, ActivityIcon } from './icons.js';

const TABS = [
  { id: 'crons', label: 'Crons', href: '/settings/crons', icon: ClockIcon },
  { id: 'triggers', label: 'Triggers', href: '/settings/triggers', icon: ZapIcon },
  { id: 'secrets', label: 'Secrets', href: '/settings/secrets', icon: KeyIcon },
  { id: 'mcp', label: 'MCP', href: '/settings/mcp', icon: PlugIcon },
  { id: 'providers', label: 'Providers', href: '/settings/providers', icon: CpuIcon },
  { id: 'diagnostics', label: 'Diagnostics', href: '/settings/diagnostics', icon: ActivityIcon },
];

export function SettingsLayout({ session, children }) {
  const [activePath, setActivePath] = useState('');

  useEffect(() => {
    setActivePath(window.location.pathname);
  }, []);

  return (
    <PageLayout session={session}>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-semibold" style={{ fontFamily: 'var(--font-display)' }}>Settings</h1>
      </div>

      {/* Tab navigation */}
      <div className="flex gap-2 mb-6">
        {TABS.map((tab) => {
          const isActive = activePath === tab.href || activePath.startsWith(tab.href + '/');
          const Icon = tab.icon;
          return (
            <a
              key={tab.id}
              href={tab.href}
              className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-mono font-medium transition-colors border ${
                isActive
                  ? 'bg-[--primary]/10 text-[--cyan] border-[--primary]/20'
                  : 'border-white/[0.06] text-muted-foreground hover:text-foreground hover:border-white/[0.12]'
              }`}
            >
              <Icon size={12} />
              {tab.label}
            </a>
          );
        })}
      </div>

      {/* Tab content */}
      {children}
    </PageLayout>
  );
}
