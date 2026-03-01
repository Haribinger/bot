'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileTextIcon,
  XIcon,
  FolderIcon,
  PencilIcon,
  CheckIcon,
  SpinnerIcon,
  CopyIcon,
  EyeIcon,
} from './icons.js';
import { getAgentWorkspace, updateAgentFile } from '../actions.js';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatSize(bytes) {
  if (bytes === 0) return '0 B';
  if (bytes < 1024) return `${bytes} B`;
  return `${(bytes / 1024).toFixed(1)} KB`;
}

// ─── TrafficLights ────────────────────────────────────────────────────────────

function TrafficLights({ label }) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-1">
        <div className="w-2 h-2 rounded-full bg-[#ff5f57]" />
        <div className="w-2 h-2 rounded-full bg-[#febc2e]" />
        <div className="w-2 h-2 rounded-full bg-[#28c840]" />
      </div>
      {label && (
        <span className="font-mono text-[10px] font-medium text-[--cyan] uppercase tracking-wider ml-1">
          {label}
        </span>
      )}
    </div>
  );
}

// ─── FileList ─────────────────────────────────────────────────────────────────

function FileList({ files, selectedFile, onSelect, loading }) {
  if (loading) {
    return (
      <div className="flex flex-col gap-1 p-2">
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="h-10 rounded-md border border-white/[0.06] bg-white/[0.02] animate-pulse"
          />
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-0.5 p-2 overflow-y-auto">
      {files.map((file) => {
        const isSelected = selectedFile?.name === file.name;
        const isEmpty = file.size === 0;
        return (
          <button
            key={file.name}
            onClick={() => onSelect(file)}
            className={`w-full text-left rounded-md px-2.5 py-2 border transition-all font-mono group ${
              isSelected
                ? 'border-[--cyan]/30 bg-[--cyan]/[0.06] text-[--cyan]'
                : 'border-transparent hover:border-white/[0.06] hover:bg-white/[0.03] text-foreground'
            }`}
          >
            <div className="flex items-center gap-2">
              <span
                className={`shrink-0 transition-colors ${
                  isSelected ? 'text-[--cyan]' : 'text-muted-foreground group-hover:text-foreground'
                }`}
              >
                <FileTextIcon size={12} />
              </span>
              <span className="text-[11px] font-medium truncate flex-1">{file.name}</span>
            </div>
            <div className="flex items-center gap-2 mt-0.5 pl-[20px]">
              <span
                className={`text-[9px] font-mono ${
                  isEmpty ? 'text-muted-foreground/40' : 'text-muted-foreground'
                }`}
              >
                {isEmpty ? 'empty' : formatSize(file.size)}
              </span>
              {!isEmpty && (
                <span className="text-[9px] font-mono text-green-500/70">exists</span>
              )}
            </div>
          </button>
        );
      })}
    </div>
  );
}

// ─── FileViewer ───────────────────────────────────────────────────────────────

function FileViewer({ file, agentId, onSaved }) {
  const [editing, setEditing] = useState(false);
  const [editContent, setEditContent] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [copied, setCopied] = useState(false);

  // Sync edit content when file changes
  useEffect(() => {
    setEditing(false);
    setEditContent(file?.content ?? '');
    setSaved(false);
  }, [file?.name]);

  const handleEdit = useCallback(() => {
    setEditContent(file?.content ?? '');
    setEditing(true);
    setSaved(false);
  }, [file]);

  const handleCancel = useCallback(() => {
    setEditing(false);
    setEditContent(file?.content ?? '');
  }, [file]);

  const handleSave = useCallback(async () => {
    if (!file || saving) return;
    setSaving(true);
    try {
      await updateAgentFile(agentId, file.name, editContent);
      setSaved(true);
      setEditing(false);
      onSaved?.(file.name, editContent);
      setTimeout(() => setSaved(false), 2500);
    } finally {
      setSaving(false);
    }
  }, [agentId, file, editContent, saving, onSaved]);

  const handleCopy = useCallback(async () => {
    const text = editing ? editContent : (file?.content ?? '');
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // clipboard not available
    }
  }, [editing, editContent, file]);

  if (!file) {
    return (
      <div className="flex-1 flex items-center justify-center text-center p-8">
        <div>
          <FolderIcon size={28} className="text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-xs font-mono text-muted-foreground/50">Select a file to view</p>
        </div>
      </div>
    );
  }

  const displayContent = editing ? editContent : (file.content ?? '');
  const isEmpty = !file.content && !editing;

  return (
    <div className="flex-1 flex flex-col min-h-0">
      {/* Viewer header */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/[0.06] shrink-0">
        <TrafficLights label={file.name} />
        <div className="flex items-center gap-1.5">
          {saved && (
            <motion.span
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-mono font-medium bg-[--success]/10 text-green-400 border border-green-500/20"
            >
              <CheckIcon size={8} /> Saved
            </motion.span>
          )}
          {/* Copy */}
          <button
            onClick={handleCopy}
            title="Copy content"
            className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-[10px] font-mono font-medium border border-white/[0.06] hover:bg-white/[0.04] hover:border-[--cyan]/30 hover:text-[--cyan] transition-colors text-muted-foreground"
          >
            {copied ? <CheckIcon size={10} /> : <CopyIcon size={10} />}
            {copied ? 'Copied' : 'Copy'}
          </button>
          {/* Edit / Cancel */}
          {file.editable && !editing && (
            <button
              onClick={handleEdit}
              className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-[10px] font-mono font-medium border border-white/[0.06] hover:bg-white/[0.04] hover:border-[--cyan]/30 hover:text-[--cyan] transition-colors text-muted-foreground"
            >
              <PencilIcon size={10} /> Edit
            </button>
          )}
          {editing && (
            <>
              <button
                onClick={handleCancel}
                className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-[10px] font-mono font-medium border border-white/[0.06] hover:bg-white/[0.04] transition-colors text-muted-foreground"
              >
                <XIcon size={10} /> Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-[10px] font-mono font-medium bg-[--cyan]/10 text-[--cyan] border border-[--cyan]/20 hover:bg-[--cyan] hover:text-[--primary-foreground] transition-colors disabled:opacity-50"
              >
                {saving ? <SpinnerIcon size={10} /> : <CheckIcon size={10} />}
                {saving ? 'Saving...' : 'Save'}
              </button>
            </>
          )}
        </div>
      </div>

      {/* Content area */}
      <div className="flex-1 min-h-0 overflow-hidden">
        <AnimatePresence mode="wait">
          {editing ? (
            <motion.div
              key="editor"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="h-full flex flex-col p-3"
            >
              <textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                spellCheck={false}
                className="flex-1 w-full resize-none rounded-md border border-white/[0.06] bg-black/30 p-3 text-[11px] font-mono text-foreground/85 focus:outline-none focus:border-[--cyan]/40 focus:ring-1 focus:ring-[--cyan]/10 transition-colors scrollbar-thin"
                style={{ minHeight: 0 }}
              />
            </motion.div>
          ) : (
            <motion.div
              key="viewer"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="h-full overflow-auto p-3 scrollbar-thin"
            >
              {isEmpty ? (
                <div className="flex flex-col items-center justify-center h-full gap-2 text-center py-10">
                  <EyeIcon size={20} className="text-muted-foreground/30" />
                  <p className="text-[10px] font-mono text-muted-foreground/50">File is empty</p>
                  {file.editable && (
                    <button
                      onClick={handleEdit}
                      className="mt-1 inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-[10px] font-mono font-medium bg-[--cyan]/10 text-[--cyan] border border-[--cyan]/20 hover:bg-[--cyan]/20 transition-colors"
                    >
                      <PencilIcon size={10} /> Create file
                    </button>
                  )}
                </div>
              ) : (
                <pre className="text-[11px] font-mono text-foreground/80 whitespace-pre-wrap break-words leading-relaxed">
                  {displayContent}
                </pre>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

// ─── AgentWorkspace (main export) ────────────────────────────────────────────

export function AgentWorkspace({ agentId, agentName, open, onClose }) {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);

  // Load workspace when opened
  useEffect(() => {
    if (!open || !agentId) return;
    setLoading(true);
    setSelectedFile(null);
    getAgentWorkspace(agentId).then(({ files: loadedFiles }) => {
      setFiles(loadedFiles ?? []);
      // Auto-select first non-empty file, or first file
      const first = loadedFiles?.find((f) => f.size > 0) ?? loadedFiles?.[0] ?? null;
      setSelectedFile(first);
      setLoading(false);
    });
  }, [open, agentId]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    function onKey(e) {
      if (e.key === 'Escape') onClose?.();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  // Handle in-memory update after save so viewer reflects new content immediately
  const handleSaved = useCallback((filename, newContent) => {
    setFiles((prev) =>
      prev.map((f) =>
        f.name === filename
          ? { ...f, content: newContent, size: Buffer.byteLength?.(newContent, 'utf8') ?? newContent.length }
          : f
      )
    );
    setSelectedFile((prev) =>
      prev?.name === filename
        ? { ...prev, content: newContent, size: newContent.length }
        : prev
    );
  }, []);

  const displayName = agentName ?? agentId ?? 'Agent';
  const label = `@${displayName.toUpperCase()} Workspace`;

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            key="workspace-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm"
          />

          {/* Panel */}
          <motion.div
            key="workspace-panel"
            initial={{ opacity: 0, scale: 0.97, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: 8 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
          >
            <div
              className="pointer-events-auto w-full max-w-3xl rounded-lg border border-white/[0.06] bg-[--card] shadow-2xl flex flex-col overflow-hidden"
              style={{ maxHeight: 'min(680px, calc(100vh - 2rem))' }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06] shrink-0">
                <TrafficLights label={label} />
                <button
                  onClick={onClose}
                  aria-label="Close workspace"
                  className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-white/[0.04] transition-colors"
                >
                  <XIcon size={14} />
                </button>
              </div>

              {/* Body — two-column on desktop, stacked on mobile */}
              <div className="flex flex-col sm:flex-row flex-1 min-h-0 divide-y sm:divide-y-0 sm:divide-x divide-white/[0.06]">
                {/* Left: file list */}
                <div className="sm:w-[200px] shrink-0 flex flex-col min-h-0">
                  <div className="px-3 pt-2.5 pb-1.5 border-b border-white/[0.06]">
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <FolderIcon size={11} />
                      <span className="text-[10px] font-mono uppercase tracking-wider">Files</span>
                    </div>
                  </div>
                  <div className="flex-1 overflow-y-auto">
                    <FileList
                      files={files}
                      selectedFile={selectedFile}
                      onSelect={setSelectedFile}
                      loading={loading}
                    />
                  </div>
                </div>

                {/* Right: file viewer */}
                <div className="flex-1 flex flex-col min-h-0 min-w-0" style={{ minHeight: '300px' }}>
                  <AnimatePresence mode="wait">
                    {loading ? (
                      <motion.div
                        key="loading"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="flex-1 flex items-center justify-center"
                      >
                        <div className="flex flex-col items-center gap-2 text-muted-foreground/50">
                          <SpinnerIcon size={18} />
                          <span className="text-[10px] font-mono">Loading workspace...</span>
                        </div>
                      </motion.div>
                    ) : (
                      <motion.div
                        key={selectedFile?.name ?? 'empty'}
                        initial={{ opacity: 0, x: 4 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -4 }}
                        transition={{ duration: 0.15 }}
                        className="flex-1 flex flex-col min-h-0"
                      >
                        <FileViewer
                          file={selectedFile}
                          agentId={agentId}
                          onSaved={handleSaved}
                        />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
