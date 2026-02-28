'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Streamdown } from 'streamdown';
import { cn } from '../utils.js';
import { SpinnerIcon, FileTextIcon, CopyIcon, CheckIcon, RefreshIcon, SquarePenIcon, XIcon } from './icons.js';
import { EnhancedToolCall } from './enhanced-tool-call.js';

function LinkSafetyModal({ url, isOpen, onClose, onConfirm }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  }, [url]);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative mx-4 flex w-full flex-col gap-3 rounded-lg border border-white/[0.06] bg-[--card] p-4 shadow-lg"
        style={{ maxWidth: '340px' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="font-medium text-sm text-foreground">Open external link?</div>
        <div className="break-all rounded-md bg-black/30 px-2.5 py-2 font-mono text-xs text-foreground/80 border border-white/[0.04]">
          {url}
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleCopy}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-md border border-white/[0.06] px-3 py-1.5 text-xs font-medium text-foreground hover:bg-white/[0.04]"
          >
            {copied ? <CheckIcon size={12} /> : <CopyIcon size={12} />}
            <span>{copied ? 'Copied' : 'Copy'}</span>
          </button>
          <button
            onClick={() => { onConfirm(); onClose(); }}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-md bg-[--primary] px-3 py-1.5 text-xs font-medium text-primary-foreground hover:opacity-90"
          >
            <span>Open</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export const linkSafety = {
  enabled: true,
  renderModal: (props) => <LinkSafetyModal {...props} />,
};

export function PreviewMessage({ message, isLoading, onRetry, onEdit }) {
  const isUser = message.role === 'user';
  const [copied, setCopied] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editText, setEditText] = useState('');
  const textareaRef = useRef(null);

  const text =
    message.parts
      ?.filter((p) => p.type === 'text')
      .map((p) => p.text)
      .join('\n') ||
    message.content ||
    '';

  const fileParts = message.parts?.filter((p) => p.type === 'file') || [];
  const imageParts = fileParts.filter((p) => p.mediaType?.startsWith('image/'));
  const otherFileParts = fileParts.filter((p) => !p.mediaType?.startsWith('image/'));
  const hasToolParts = message.parts?.some((p) => p.type?.startsWith('tool-')) || false;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  const handleEditStart = () => {
    setEditText(text);
    setEditing(true);
  };

  const handleEditCancel = () => {
    setEditing(false);
    setEditText('');
  };

  const handleEditSubmit = () => {
    const trimmed = editText.trim();
    if (trimmed && trimmed !== text) {
      onEdit?.(message, trimmed);
    }
    setEditing(false);
    setEditText('');
  };

  useEffect(() => {
    if (editing && textareaRef.current) {
      const ta = textareaRef.current;
      ta.focus();
      ta.style.height = 'auto';
      ta.style.height = `${ta.scrollHeight}px`;
      ta.setSelectionRange(ta.value.length, ta.value.length);
    }
  }, [editing]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className={cn(
        'group flex gap-4 w-full',
        isUser ? 'justify-end' : 'justify-start'
      )}
    >
      <div className="flex flex-col max-w-[80%]">
        {editing ? (
          <div className="flex flex-col gap-2">
            <textarea
              ref={textareaRef}
              value={editText}
              onChange={(e) => {
                setEditText(e.target.value);
                e.target.style.height = 'auto';
                e.target.style.height = `${e.target.scrollHeight}px`;
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleEditSubmit();
                }
                if (e.key === 'Escape') {
                  handleEditCancel();
                }
              }}
              className="w-full resize-none rounded-lg border border-[--primary]/20 bg-[--card] px-4 py-3 text-sm leading-relaxed text-foreground focus:outline-none focus:ring-1 focus:ring-[--primary]/40 font-mono"
              rows={1}
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={handleEditCancel}
                className="rounded-md px-3 py-1 text-xs text-muted-foreground hover:text-foreground"
              >
                Cancel
              </button>
              <button
                onClick={handleEditSubmit}
                className="rounded-md bg-[--primary] px-3 py-1 text-xs text-primary-foreground hover:opacity-80"
              >
                Send
              </button>
            </div>
          </div>
        ) : (
          <>
            <div
              className={cn(
                'rounded-lg px-4 py-3 text-sm leading-relaxed',
                isUser
                  ? 'bg-[--primary]/10 border border-[--primary]/20 text-foreground'
                  : ''
              )}
            >
              {isUser ? (
                <>
                  {imageParts.length > 0 && (
                    <div className="mb-2 flex flex-wrap gap-2">
                      {imageParts.map((part, i) => (
                        <img
                          key={i}
                          src={part.url}
                          alt="attachment"
                          className="max-h-64 max-w-full rounded-lg object-contain"
                        />
                      ))}
                    </div>
                  )}
                  {otherFileParts.length > 0 && (
                    <div className="mb-2 flex flex-wrap gap-2">
                      {otherFileParts.map((part, i) => (
                        <div
                          key={i}
                          className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs bg-[--primary]/10 border border-[--primary]/20"
                        >
                          <FileTextIcon size={12} />
                          <span className="max-w-[150px] truncate">
                            {part.name || part.mediaType || 'file'}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                  {text ? (
                    <div className="whitespace-pre-wrap break-words">{text}</div>
                  ) : null}
                </>
              ) : (
                <>
                  {message.parts?.length > 0 ? (
                    message.parts.map((part, i) => {
                      if (part.type === 'text') {
                        return <Streamdown key={i} mode={isLoading ? 'streaming' : 'static'} linkSafety={linkSafety}>{part.text}</Streamdown>;
                      }
                      if (part.type === 'file') {
                        if (part.mediaType?.startsWith('image/')) {
                          return (
                            <div key={i} className="mb-2">
                              <img src={part.url} alt="attachment" className="max-h-64 max-w-full rounded-lg object-contain" />
                            </div>
                          );
                        }
                        return (
                          <div key={i} className="mb-2 inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs bg-white/[0.04] border border-white/[0.06]">
                            <FileTextIcon size={12} />
                            <span className="max-w-[150px] truncate">{part.name || part.mediaType || 'file'}</span>
                          </div>
                        );
                      }
                      if (part.type?.startsWith('tool-')) {
                        return <EnhancedToolCall key={part.toolCallId || i} part={part} />;
                      }
                      return null;
                    })
                  ) : text ? (
                    <Streamdown mode={isLoading ? 'streaming' : 'static'} linkSafety={linkSafety}>{text}</Streamdown>
                  ) : isLoading && !hasToolParts ? (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <SpinnerIcon size={14} />
                      <span>Working...</span>
                    </div>
                  ) : null}
                </>
              )}
            </div>

            {/* Action toolbar */}
            {!isLoading && text && (
              <div
                className={cn(
                  'flex gap-1 mt-1 opacity-0 transition-opacity group-hover:opacity-100',
                  isUser ? 'justify-end' : 'justify-start'
                )}
              >
                <button
                  onClick={handleCopy}
                  className="rounded-md p-1 text-muted-foreground hover:text-[--cyan] hover:bg-white/[0.04]"
                  aria-label="Copy message"
                >
                  {copied ? <CheckIcon size={14} /> : <CopyIcon size={14} />}
                </button>
                {onRetry && (
                  <button
                    onClick={() => onRetry(message)}
                    className="rounded-md p-1 text-muted-foreground hover:text-[--cyan] hover:bg-white/[0.04]"
                    aria-label="Retry"
                  >
                    <RefreshIcon size={14} />
                  </button>
                )}
                {isUser && onEdit && (
                  <button
                    onClick={handleEditStart}
                    className="rounded-md p-1 text-muted-foreground hover:text-[--cyan] hover:bg-white/[0.04]"
                    aria-label="Edit message"
                  >
                    <SquarePenIcon size={14} />
                  </button>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </motion.div>
  );
}

export function ThinkingMessage() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex gap-4 w-full justify-start"
    >
      <div className="flex items-center gap-3 rounded-lg px-4 py-3 text-sm">
        <div className="flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-[--cyan] animate-thinking-pulse" style={{ animationDelay: '0ms' }} />
          <span className="w-1.5 h-1.5 rounded-full bg-[--cyan] animate-thinking-pulse" style={{ animationDelay: '200ms' }} />
          <span className="w-1.5 h-1.5 rounded-full bg-[--cyan] animate-thinking-pulse" style={{ animationDelay: '400ms' }} />
        </div>
        <span className="text-muted-foreground font-mono text-xs">Processing</span>
      </div>
    </motion.div>
  );
}
