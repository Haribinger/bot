'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  TerminalIcon,
  SearchIcon,
  RefreshIcon,
  SpinnerIcon,
  XIcon,
  CopyIcon,
  ChevronDownIcon,
  FolderIcon,
} from './icons.js';
import { listJobLogs, getJobLogs } from '../log-actions.js';

// ─── Utilities ────────────────────────────────────────────────────────────────

function timeAgo(ts) {
  if (!ts) return '';
  const diff = Date.now() - (ts < 1e12 ? ts * 1000 : ts);
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function formatBytes(bytes) {
  if (!bytes) return '';
  return bytes < 1024 ? `${bytes}B` : `${(bytes / 1024).toFixed(1)}KB`;
}

function HighlightedText({ text, query }) {
  if (!query || !text) return <>{text}</>;
  const idx = text.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return <>{text}</>;
  return (
    <>
      {text.slice(0, idx)}
      <mark className="bg-[--cyan]/30 text-[--cyan] rounded-sm">{text.slice(idx, idx + query.length)}</mark>
      <HighlightedText text={text.slice(idx + query.length)} query={query} />
    </>
  );
}

// ─── Job List Item ─────────────────────────────────────────────────────────────

function JobListItem({ job, selected, onClick, index }) {
  return (
    <motion.button
      initial={{ opacity: 0, x: -6 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.2, delay: Math.min(index * 0.025, 0.3) }}
      onClick={onClick}
      className={`w-full text-left p-3 rounded-lg border transition-all ${
        selected
          ? 'border-[--cyan]/40 bg-[--cyan]/5'
          : 'border-white/[0.06] bg-[--card] hover:border-[--cyan]/20 hover:bg-white/[0.02]'
      }`}
    >
      <div className="flex items-center gap-2 mb-1">
        <div className={`shrink-0 w-1.5 h-1.5 rounded-full ${selected ? 'bg-[--cyan]' : 'bg-green-500/60'}`} />
        <span className="font-mono text-xs font-semibold text-foreground tracking-wider">
          {job.jobId.slice(0, 8)}
        </span>
        {job.size > 0 && (
          <span className="ml-auto font-mono text-[10px] text-muted-foreground/60">
            {formatBytes(job.size)}
          </span>
        )}
      </div>
      {job.title && (
        <p className="font-mono text-[11px] text-muted-foreground leading-relaxed line-clamp-2 pl-3.5">
          {job.title}
        </p>
      )}
      <p className="font-mono text-[10px] text-muted-foreground/50 mt-1 pl-3.5">
        {timeAgo(job.timestamp)}
      </p>
    </motion.button>
  );
}

// ─── Terminal Viewer ───────────────────────────────────────────────────────────

function TerminalViewer({ jobId, logData, loading, searchQuery }) {
  const scrollRef = useRef(null);
  const [copied, setCopied] = useState(false);
  const [autoScroll, setAutoScroll] = useState(true);

  // Auto-scroll to bottom when new lines arrive
  useEffect(() => {
    if (autoScroll && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logData?.lines, autoScroll]);

  // Detect manual scroll up to disable auto-scroll
  function handleScroll() {
    if (!scrollRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
    const atBottom = scrollHeight - scrollTop - clientHeight < 40;
    setAutoScroll(atBottom);
  }

  async function handleCopy() {
    if (!logData) return;
    const text = [
      logData.prompt ? `TASK:\n${logData.prompt}` : '',
      '',
      ...(logData.lines || []),
    ]
      .filter((l, i) => i !== 1 || logData.prompt)
      .join('\n');
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // Fallback for environments without clipboard API
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  function scrollToBottom() {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
      setAutoScroll(true);
    }
  }

  const filteredLines = searchQuery
    ? (logData?.lines || []).filter(line =>
        line.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : logData?.lines || [];

  const displayId = jobId ? jobId.slice(0, 8) : '--------';

  return (
    <div className="rounded-lg border border-white/[0.06] bg-black/60 overflow-hidden flex flex-col" style={{ minHeight: '400px' }}>
      {/* Traffic-lights header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-white/[0.06] bg-black/40 shrink-0">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1">
            <div className="w-2.5 h-2.5 rounded-full bg-[#ff5f57]" />
            <div className="w-2.5 h-2.5 rounded-full bg-[#febc2e]" />
            <div className="w-2.5 h-2.5 rounded-full bg-[#28c840]" />
          </div>
          <span className="font-mono text-[10px] text-muted-foreground ml-1">
            job {displayId}
            {searchQuery && (
              <span className="ml-2 text-[--cyan]">
                &mdash; {filteredLines.length} match{filteredLines.length !== 1 ? 'es' : ''}
              </span>
            )}
          </span>
        </div>
        {logData && (
          <div className="flex items-center gap-1">
            {!autoScroll && (
              <button
                onClick={scrollToBottom}
                title="Scroll to bottom"
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded font-mono text-[10px] text-[--cyan] hover:bg-[--cyan]/10 transition-colors"
              >
                <ChevronDownIcon size={10} /> Bottom
              </button>
            )}
            <button
              onClick={handleCopy}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded font-mono text-[10px] text-muted-foreground hover:text-foreground hover:bg-white/[0.06] transition-colors"
            >
              <CopyIcon size={10} />
              {copied ? 'Copied!' : 'Copy All'}
            </button>
          </div>
        )}
      </div>

      {/* Content area */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex-1 overflow-auto p-4 font-mono text-xs text-green-400/90 whitespace-pre-wrap"
        style={{ maxHeight: '62vh' }}
      >
        {loading ? (
          <div className="flex items-center gap-2 text-muted-foreground">
            <SpinnerIcon size={12} />
            <span>Loading log...</span>
          </div>
        ) : !jobId ? (
          <span className="text-muted-foreground/40">Select a job from the list to view its log.</span>
        ) : !logData ? (
          <span className="text-muted-foreground/40">No log data found for this job.</span>
        ) : (
          <>
            {/* Prompt / task block */}
            {logData.prompt && (
              <div className="mb-4 pb-4 border-b border-white/[0.06]">
                <div className="text-[--cyan]/60 text-[10px] uppercase tracking-widest mb-2 font-semibold">
                  Task Prompt
                </div>
                <div className="text-white/70 leading-relaxed">
                  <HighlightedText text={logData.prompt} query={searchQuery} />
                </div>
              </div>
            )}

            {/* Log lines with line numbers */}
            {filteredLines.length === 0 && searchQuery ? (
              <span className="text-muted-foreground/40">No lines match your search.</span>
            ) : (
              filteredLines.map((line, i) => (
                <div key={i} className="flex gap-3 group hover:bg-white/[0.02] rounded -mx-1 px-1">
                  <span
                    className="shrink-0 w-8 text-right text-[10px] text-muted-foreground/30 select-none group-hover:text-muted-foreground/50 transition-colors"
                    aria-hidden="true"
                  >
                    {searchQuery ? i + 1 : (logData.lines?.indexOf(line) ?? i) + 1}
                  </span>
                  <span className="flex-1 break-all">
                    <HighlightedText text={line} query={searchQuery} />
                  </span>
                </div>
              ))
            )}

            {/* Blinking cursor at end */}
            {!searchQuery && (
              <span className="inline-block w-2 h-4 bg-green-400/70 animate-pulse align-bottom ml-0.5" />
            )}
          </>
        )}
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export function LogViewerPage() {
  const [jobs, setJobs] = useState([]);
  const [selectedJobId, setSelectedJobId] = useState(null);
  const [logData, setLogData] = useState(null);
  const [loadingJobs, setLoadingJobs] = useState(true);
  const [loadingLog, setLoadingLog] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [jobSearch, setJobSearch] = useState('');
  const [logSearch, setLogSearch] = useState('');
  const [logSearchFocused, setLogSearchFocused] = useState(false);
  const logSearchRef = useRef(null);

  async function loadJobs(isRefresh = false) {
    isRefresh ? setRefreshing(true) : setLoadingJobs(true);
    try {
      const list = await listJobLogs();
      const sorted = [...(list || [])].sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
      setJobs(sorted);
      if (!selectedJobId && sorted.length > 0) setSelectedJobId(sorted[0].jobId);
    } catch { /* preserve existing list */ } finally {
      setLoadingJobs(false);
      setRefreshing(false);
    }
  }

  async function loadLog(jobId) {
    if (!jobId) return;
    setLoadingLog(true);
    setLogData(null);
    try {
      const data = await getJobLogs(jobId);
      setLogData(data);
    } catch {
      setLogData(null);
    } finally {
      setLoadingLog(false);
    }
  }

  useEffect(() => { loadJobs(); }, []);
  useEffect(() => { loadLog(selectedJobId); setLogSearch(''); }, [selectedJobId]);

  const filteredJobs = jobSearch
    ? jobs.filter(j =>
        j.jobId.toLowerCase().includes(jobSearch.toLowerCase()) ||
        (j.title || '').toLowerCase().includes(jobSearch.toLowerCase())
      )
    : jobs;

  const handleKeyDown = useCallback((e) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'f' && selectedJobId) {
      e.preventDefault();
      logSearchRef.current?.focus();
    }
  }, [selectedJobId]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  return (
    <>
      {/* Page header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <TerminalIcon size={18} className="text-[--cyan]" />
          <h1 className="text-2xl font-mono font-semibold text-[--cyan] text-glow-cyan">Logs</h1>
          {jobs.length > 0 && (
            <span className="inline-flex items-center gap-1 rounded-full bg-[--cyan]/10 border border-[--cyan]/20 px-2 py-0.5 text-[10px] font-mono text-[--cyan] font-medium">
              {jobs.length} job{jobs.length !== 1 ? 's' : ''}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {/* Log search (appears when a job is selected) */}
          <AnimatePresence>
            {selectedJobId && (
              <motion.div
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: 'auto' }}
                exit={{ opacity: 0, width: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="relative">
                  <div className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none">
                    <SearchIcon size={12} />
                  </div>
                  <input
                    ref={logSearchRef}
                    value={logSearch}
                    onChange={e => setLogSearch(e.target.value)}
                    onFocus={() => setLogSearchFocused(true)}
                    onBlur={() => setLogSearchFocused(false)}
                    placeholder="Search log..."
                    className="w-40 text-xs border border-white/[0.06] rounded-md pl-8 pr-7 py-1.5 bg-black/20 font-mono placeholder:text-muted-foreground/50 focus:outline-none focus:border-[--cyan]/40 focus:ring-1 focus:ring-[--cyan]/20 transition-all focus:w-56"
                  />
                  {logSearch && (
                    <button
                      onClick={() => setLogSearch('')}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <XIcon size={11} />
                    </button>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          {/* Refresh button */}
          <button
            onClick={() => loadJobs(true)}
            disabled={refreshing}
            title="Refresh job list"
            className="inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-mono font-medium border border-white/[0.06] hover:bg-white/[0.04] disabled:opacity-50 transition-colors text-muted-foreground hover:text-foreground"
          >
            {refreshing ? <SpinnerIcon size={12} /> : <RefreshIcon size={12} />}
            Refresh
          </button>
        </div>
      </div>

      {/* Loading skeleton for job list */}
      {loadingJobs ? (
        <div className="flex flex-col gap-3">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="h-16 animate-pulse rounded-lg bg-white/[0.04] border border-white/[0.06]"
            />
          ))}
        </div>
      ) : jobs.length === 0 ? (
        /* Empty state */
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="rounded-full bg-white/[0.04] border border-white/[0.06] p-5 mb-4">
            <TerminalIcon size={28} className="text-muted-foreground/40" />
          </div>
          <p className="text-sm font-mono font-medium mb-1">No job logs found</p>
          <p className="text-[11px] font-mono text-muted-foreground max-w-xs">
            Logs will appear here after the agent completes jobs. Run a job from the Swarm page or via cron.
          </p>
        </div>
      ) : (
        /* Main two-panel layout */
        <div className="flex flex-col lg:flex-row gap-4" style={{ minHeight: '60vh' }}>
          {/* ─── Job list panel ──────────────────────────────────────────────── */}
          <div className="w-full lg:w-[280px] shrink-0 flex flex-col gap-2">
            {/* Job search */}
            <div className="relative mb-1">
              <div className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none">
                <SearchIcon size={12} />
              </div>
              <input
                value={jobSearch}
                onChange={e => setJobSearch(e.target.value)}
                placeholder="Filter jobs..."
                className="w-full text-xs border border-white/[0.06] rounded-md pl-8 pr-3 py-1.5 bg-black/20 font-mono placeholder:text-muted-foreground/50 focus:outline-none focus:border-[--cyan]/40 transition-colors"
              />
              {jobSearch && (
                <button
                  onClick={() => setJobSearch('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  <XIcon size={11} />
                </button>
              )}
            </div>

            {/* Panel label */}
            <div className="flex items-center justify-between px-1 mb-0.5">
              <span className="text-[10px] font-mono font-medium uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <FolderIcon size={11} /> Jobs
              </span>
              {jobSearch && (
                <span className="text-[10px] font-mono text-muted-foreground/60">
                  {filteredJobs.length} of {jobs.length}
                </span>
              )}
            </div>

            {/* Job items */}
            <div className="flex flex-col gap-1.5 overflow-y-auto max-h-[30vh] lg:max-h-[72vh] scrollbar-thin pr-0.5">
              {filteredJobs.length === 0 ? (
                <div className="flex flex-col items-center py-8 text-center">
                  <SearchIcon size={18} className="text-muted-foreground/30 mb-2" />
                  <p className="text-[11px] font-mono text-muted-foreground">No jobs match your filter</p>
                </div>
              ) : (
                filteredJobs.map((job, i) => (
                  <JobListItem
                    key={job.jobId}
                    job={job}
                    selected={selectedJobId === job.jobId}
                    onClick={() => setSelectedJobId(job.jobId)}
                    index={i}
                  />
                ))
              )}
            </div>
          </div>

          {/* ─── Log viewer panel ────────────────────────────────────────────── */}
          <div className="flex-1 min-w-0">
            <AnimatePresence mode="wait">
              <motion.div
                key={selectedJobId || 'empty'}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.18 }}
              >
                <TerminalViewer
                  jobId={selectedJobId}
                  logData={logData}
                  loading={loadingLog}
                  searchQuery={logSearch}
                />
              </motion.div>
            </AnimatePresence>

            {/* Keyboard hint */}
            {selectedJobId && !logSearchFocused && (
              <p className="text-[10px] font-mono text-muted-foreground/40 mt-2 text-right">
                Ctrl+F / Cmd+F to search log
              </p>
            )}
          </div>
        </div>
      )}
    </>
  );
}
