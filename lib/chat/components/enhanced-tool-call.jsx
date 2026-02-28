'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { cn } from '../utils.js';
import { SpinnerIcon, CheckIcon, XIcon } from './icons.js';

const TOOL_DISPLAY_NAMES = {
  create_job: 'Create Job',
  get_job_status: 'Check Job Status',
  get_system_technical_specs: 'Read Tech Docs',
  get_skill_building_guide: 'Read Skill Docs',
};

function getToolDisplayName(toolName) {
  return TOOL_DISPLAY_NAMES[toolName] || toolName.replace(/_/g, ' ');
}

function formatContent(content) {
  if (content == null) return null;
  if (typeof content === 'string') {
    try {
      const parsed = JSON.parse(content);
      return JSON.stringify(parsed, null, 2);
    } catch {
      return content;
    }
  }
  return JSON.stringify(content, null, 2);
}

export function EnhancedToolCall({ part }) {
  const [expanded, setExpanded] = useState(false);

  const toolName = part.toolName || (part.type?.startsWith('tool-') ? part.type.slice(5) : 'tool');
  const displayName = getToolDisplayName(toolName);
  const state = part.state || 'input-available';

  const isRunning = state === 'input-streaming' || state === 'input-available';
  const isDone = state === 'output-available';
  const isError = state === 'output-error';

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className="my-2 rounded-lg border border-white/[0.06] bg-[--card] overflow-hidden"
    >
      {/* Terminal header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center gap-3 px-3 py-2.5 text-left hover:bg-white/[0.02] transition-colors"
      >
        {/* Traffic light dots */}
        <div className="flex items-center gap-1.5 shrink-0">
          <div className="w-2.5 h-2.5 rounded-full bg-[#ff5f57]" />
          <div className="w-2.5 h-2.5 rounded-full bg-[#febc2e]" />
          <div className="w-2.5 h-2.5 rounded-full bg-[#28c840]" />
        </div>

        {/* Tool name */}
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="text-[--cyan] shrink-0">
            <path d="M13 2 3 14h9l-1 10 10-12h-9l1-10z" />
          </svg>
          <span className="font-mono text-xs font-medium text-[--cyan] truncate">{displayName}</span>
        </div>

        {/* Status */}
        <span className="flex items-center gap-1.5 text-xs shrink-0">
          {isRunning && (
            <>
              <SpinnerIcon size={12} className="text-[--cyan]" />
              <span className="text-muted-foreground font-mono">running</span>
            </>
          )}
          {isDone && (
            <>
              <CheckIcon size={12} className="text-[--success]" />
              <span className="text-[--success] font-mono">done</span>
            </>
          )}
          {isError && (
            <>
              <XIcon size={12} className="text-[--destructive]" />
              <span className="text-[--destructive] font-mono">error</span>
            </>
          )}
        </span>
      </button>

      {/* Terminal prompt line */}
      <div className="px-3 pb-2 flex items-center gap-1.5 text-[11px] font-mono text-muted-foreground">
        <span className="text-[--cyan]">harbinger:~$</span>
        <span className="text-foreground/60">{toolName}</span>
        {isRunning && <span className="w-1.5 h-3.5 bg-[--cyan] animate-terminal-cursor" />}
      </div>

      {/* Expandable detail */}
      {expanded && (
        <div className="border-t border-white/[0.06] px-3 py-3 text-xs">
          {part.input != null && (
            <div className="mb-3">
              <div className="font-mono text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-1.5">Input</div>
              <pre className="whitespace-pre-wrap break-all rounded-md bg-black/30 p-2.5 text-foreground/80 overflow-x-auto font-mono text-[11px] border border-white/[0.04]">
                {formatContent(part.input)}
              </pre>
            </div>
          )}
          {part.output != null && (
            <div>
              <div className="font-mono text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-1.5">Output</div>
              <pre className="whitespace-pre-wrap break-all rounded-md bg-black/30 p-2.5 text-foreground/80 overflow-x-auto max-h-64 overflow-y-auto font-mono text-[11px] border border-white/[0.04] scrollbar-thin">
                {formatContent(part.output)}
              </pre>
            </div>
          )}
          {part.input == null && part.output == null && (
            <div className="text-muted-foreground italic font-mono">Waiting for data...</div>
          )}
        </div>
      )}

      {/* Progress bar */}
      <div className="h-0.5 w-full bg-white/[0.04]">
        {isRunning && (
          <div className="h-full w-1/3 bg-[--cyan] rounded-full animate-progress-shimmer" />
        )}
        {isDone && (
          <div className="h-full w-full bg-[--success] transition-all duration-500" />
        )}
        {isError && (
          <div className="h-full w-full bg-[--destructive] transition-all duration-500" />
        )}
      </div>
    </motion.div>
  );
}
