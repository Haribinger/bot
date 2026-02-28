'use client';

import { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../utils.js';
import { SpinnerIcon, CheckIcon, XIcon } from './icons.js';

function getToolDisplayName(toolName) {
  const names = {
    create_job: 'Create Job',
    get_job_status: 'Check Job Status',
    get_system_technical_specs: 'Read Tech Docs',
    get_skill_building_guide: 'Read Skill Docs',
  };
  return names[toolName] || toolName.replace(/_/g, ' ');
}

function formatContent(content) {
  if (content == null) return null;
  if (typeof content === 'string') {
    try {
      return JSON.stringify(JSON.parse(content), null, 2);
    } catch {
      return content.length > 200 ? content.slice(0, 200) + '...' : content;
    }
  }
  const str = JSON.stringify(content, null, 2);
  return str.length > 200 ? str.slice(0, 200) + '...' : str;
}

function ToolItem({ part }) {
  const toolName = part.toolName || (part.type?.startsWith('tool-') ? part.type.slice(5) : 'tool');
  const displayName = getToolDisplayName(toolName);
  const state = part.state || 'input-available';
  const isRunning = state === 'input-streaming' || state === 'input-available';
  const isDone = state === 'output-available';
  const isError = state === 'output-error';

  return (
    <div className="rounded-md border border-white/[0.06] bg-black/20 p-2.5">
      <div className="flex items-center gap-2 mb-1.5">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="text-[--cyan] shrink-0">
          <path d="M13 2 3 14h9l-1 10 10-12h-9l1-10z" />
        </svg>
        <span className="font-mono text-[11px] font-medium text-foreground/80 truncate flex-1">{displayName}</span>
        {isRunning && <SpinnerIcon size={10} className="text-[--cyan]" />}
        {isDone && <CheckIcon size={10} className="text-[--success]" />}
        {isError && <XIcon size={10} className="text-[--destructive]" />}
      </div>
      {isDone && part.output != null && (
        <pre className="font-mono text-[10px] text-muted-foreground whitespace-pre-wrap break-all max-h-20 overflow-hidden">
          {formatContent(part.output)}
        </pre>
      )}
      {isError && part.output != null && (
        <pre className="font-mono text-[10px] text-[--destructive]/80 whitespace-pre-wrap break-all max-h-20 overflow-hidden">
          {formatContent(part.output)}
        </pre>
      )}
    </div>
  );
}

export function ToolPanel({ messages, show }) {
  // Extract all tool parts from messages (client-side only, no backend changes)
  const toolParts = useMemo(() => {
    const parts = [];
    for (const msg of messages) {
      if (!msg.parts) continue;
      for (const part of msg.parts) {
        if (part.type?.startsWith('tool-')) {
          parts.push(part);
        }
      }
    }
    return parts;
  }, [messages]);

  const activeParts = toolParts.filter(p => {
    const s = p.state || 'input-available';
    return s === 'input-streaming' || s === 'input-available';
  });
  const completedParts = toolParts.filter(p => {
    const s = p.state || 'input-available';
    return s === 'output-available' || s === 'output-error';
  });

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ width: 0, opacity: 0 }}
          animate={{ width: 300, opacity: 1 }}
          exit={{ width: 0, opacity: 0 }}
          transition={{ duration: 0.25, ease: 'easeInOut' }}
          className="hidden md:flex flex-col h-full border-l border-white/[0.06] bg-[--card]/50 backdrop-blur-sm overflow-hidden shrink-0"
        >
          <div className="p-3 border-b border-white/[0.06]">
            <h3 className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">Tool Activity</h3>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-3 scrollbar-thin">
            {/* Active tools */}
            {activeParts.length > 0 && (
              <div>
                <div className="font-mono text-[9px] uppercase tracking-wider text-[--cyan] mb-2 flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-[--cyan] animate-pulse" />
                  Running ({activeParts.length})
                </div>
                <div className="space-y-2">
                  {activeParts.map((p, i) => (
                    <ToolItem key={p.toolCallId || `active-${i}`} part={p} />
                  ))}
                </div>
              </div>
            )}

            {/* Completed tools */}
            {completedParts.length > 0 && (
              <div>
                <div className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground mb-2">
                  Recent ({completedParts.length})
                </div>
                <div className="space-y-2">
                  {completedParts.slice(-10).reverse().map((p, i) => (
                    <ToolItem key={p.toolCallId || `done-${i}`} part={p} />
                  ))}
                </div>
              </div>
            )}

            {toolParts.length === 0 && (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground/40 mb-2">
                  <path d="M13 2 3 14h9l-1 10 10-12h-9l1-10z" />
                </svg>
                <span className="font-mono text-[10px] text-muted-foreground/40">No tool activity yet</span>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
