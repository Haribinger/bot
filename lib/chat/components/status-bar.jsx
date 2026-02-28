'use client';

import { cn } from '../utils.js';

export function StatusBar({ status, toolCount = 0, showToolPanel, onToggleToolPanel }) {
  const isActive = status === 'streaming' || status === 'submitted';

  return (
    <div className="flex items-center justify-between px-4 py-1.5 border-b border-white/[0.06] bg-[--card]/50 backdrop-blur-sm">
      <div className="flex items-center gap-3">
        {/* Status indicator */}
        <div className="flex items-center gap-1.5">
          <div className={cn(
            'w-1.5 h-1.5 rounded-full',
            isActive ? 'bg-[--success] animate-pulse' : 'bg-muted-foreground/40'
          )} />
          <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
            {isActive ? 'Live' : 'Ready'}
          </span>
        </div>

        {/* Tool count */}
        {toolCount > 0 && (
          <div className="flex items-center gap-1.5">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="text-[--cyan]">
              <path d="M13 2 3 14h9l-1 10 10-12h-9l1-10z" />
            </svg>
            <span className="font-mono text-[10px] text-muted-foreground">
              {toolCount} tool{toolCount !== 1 ? 's' : ''}
            </span>
          </div>
        )}
      </div>

      {/* Panel toggle */}
      {toolCount > 0 && (
        <button
          onClick={onToggleToolPanel}
          className={cn(
            'font-mono text-[10px] uppercase tracking-wider px-2 py-0.5 rounded transition-colors',
            showToolPanel
              ? 'text-[--cyan] bg-[--cyan]/10'
              : 'text-muted-foreground hover:text-foreground'
          )}
        >
          {showToolPanel ? 'Hide Panel' : 'Show Panel'}
        </button>
      )}
    </div>
  );
}
