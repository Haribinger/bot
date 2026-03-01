'use client';

import { AppSidebar } from './app-sidebar.js';
import { SidebarProvider, SidebarInset, SidebarTrigger } from './ui/sidebar.js';
import { ChatNavProvider } from './chat-nav-context.js';

function defaultNavigateToChat(id) {
  if (id) {
    window.location.href = `/chat/${id}`;
  } else {
    window.location.href = '/';
  }
}

function PageBreadcrumb() {
  const path = typeof window !== 'undefined' ? window.location.pathname : '';
  const segments = path.split('/').filter(Boolean);
  if (segments.length === 0) return null;

  const LABELS = {
    settings: 'Settings', crons: 'Crons', triggers: 'Triggers', secrets: 'Secrets',
    providers: 'Providers', mcp: 'MCP', targets: 'Targets', findings: 'Findings',
    agents: 'Agents', swarm: 'Swarm', notifications: 'Notifications', chats: 'Chats',
    toolbox: 'Toolbox', 'mission-control': 'Mission Control', diagnostics: 'Diagnostics',
    logs: 'Logs',
  };

  return (
    <nav className="flex items-center gap-1 text-xs font-mono text-muted-foreground">
      <a href="/" className="hover:text-[--cyan] transition-colors">Home</a>
      {segments.map((seg, i) => {
        const href = '/' + segments.slice(0, i + 1).join('/');
        const isLast = i === segments.length - 1;
        const label = LABELS[seg] || seg;
        return (
          <span key={i} className="flex items-center gap-1">
            <span className="text-muted-foreground/40">/</span>
            {isLast ? (
              <span className="text-foreground">{label}</span>
            ) : (
              <a href={href} className="hover:text-[--cyan] transition-colors">{label}</a>
            )}
          </span>
        );
      })}
    </nav>
  );
}

export function PageLayout({ session, children }) {
  return (
    <ChatNavProvider value={{ activeChatId: null, navigateToChat: defaultNavigateToChat }}>
      <SidebarProvider>
        <AppSidebar user={session.user} />
        <SidebarInset>
          <header className="sticky top-0 z-10 flex items-center gap-3 bg-background/80 backdrop-blur-sm border-b border-white/[0.04] px-4 py-2">
            <SidebarTrigger />
            <PageBreadcrumb />
          </header>
          <div className="flex flex-col flex-1 max-w-5xl mx-auto w-full px-4 py-6 min-h-0 overflow-y-auto">
            {children}
          </div>
        </SidebarInset>
      </SidebarProvider>
    </ChatNavProvider>
  );
}
