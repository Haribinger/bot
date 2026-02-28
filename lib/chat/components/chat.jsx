'use client';

import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';
import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Messages } from './messages.js';
import { ChatInput } from './chat-input.js';
import { ChatHeader } from './chat-header.js';
import { StatusBar } from './status-bar.js';
import { ToolPanel } from './tool-panel.js';
import { Greeting } from './greeting.js';

export function Chat({ chatId, initialMessages = [] }) {
  const [input, setInput] = useState('');
  const [files, setFiles] = useState([]);
  const [showToolPanel, setShowToolPanel] = useState(false);
  const hasNavigated = useRef(false);

  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: '/stream/chat',
        body: { chatId },
      }),
    [chatId]
  );

  const {
    messages,
    status,
    stop,
    error,
    sendMessage,
    regenerate,
    setMessages,
  } = useChat({
    id: chatId,
    messages: initialMessages,
    transport,
    onError: (err) => console.error('Chat error:', err),
  });

  // Count tool parts for status bar
  const toolCount = useMemo(() => {
    let count = 0;
    for (const msg of messages) {
      if (!msg.parts) continue;
      for (const part of msg.parts) {
        if (part.type?.startsWith('tool-')) count++;
      }
    }
    return count;
  }, [messages]);

  // Auto-show tool panel when tools are detected
  useEffect(() => {
    if (toolCount > 0 && !showToolPanel) {
      setShowToolPanel(true);
    }
  }, [toolCount]);

  // After first message sent, update URL and notify sidebar
  useEffect(() => {
    if (!hasNavigated.current && messages.length >= 1 && status !== 'ready' && window.location.pathname !== `/chat/${chatId}`) {
      hasNavigated.current = true;
      window.history.replaceState({}, '', `/chat/${chatId}`);
      window.dispatchEvent(new Event('chatsupdated'));
      setTimeout(() => window.dispatchEvent(new Event('chatsupdated')), 5000);
    }
  }, [messages.length, status, chatId]);

  const handleSend = () => {
    if (!input.trim() && files.length === 0) return;
    const text = input;
    const currentFiles = files;
    setInput('');
    setFiles([]);

    if (currentFiles.length === 0) {
      sendMessage({ text });
    } else {
      const fileParts = currentFiles.map((f) => ({
        type: 'file',
        mediaType: f.file.type || 'text/plain',
        url: f.previewUrl,
        filename: f.file.name,
      }));
      sendMessage({ text: text || undefined, files: fileParts });
    }
  };

  const handleRetry = useCallback((message) => {
    if (message.role === 'assistant') {
      regenerate({ messageId: message.id });
    } else {
      const idx = messages.findIndex((m) => m.id === message.id);
      const nextAssistant = messages.slice(idx + 1).find((m) => m.role === 'assistant');
      if (nextAssistant) {
        regenerate({ messageId: nextAssistant.id });
      } else {
        const text =
          message.parts
            ?.filter((p) => p.type === 'text')
            .map((p) => p.text)
            .join('\n') ||
          message.content ||
          '';
        if (text.trim()) {
          sendMessage({ text });
        }
      }
    }
  }, [messages, regenerate, sendMessage]);

  const handleEdit = useCallback((message, newText) => {
    const idx = messages.findIndex((m) => m.id === message.id);
    if (idx === -1) return;
    setMessages(messages.slice(0, idx));
    sendMessage({ text: newText });
  }, [messages, setMessages, sendMessage]);

  return (
    <div className="flex h-svh flex-col">
      <ChatHeader chatId={chatId} />
      <StatusBar
        status={status}
        toolCount={toolCount}
        showToolPanel={showToolPanel}
        onToggleToolPanel={() => setShowToolPanel(!showToolPanel)}
      />
      {messages.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center px-4 md:px-6">
          <div className="w-full max-w-4xl">
            <Greeting />
            {error && (
              <div className="mt-4 rounded-lg border border-[--destructive]/30 bg-[--destructive]/10 px-4 py-2 text-sm text-[--destructive]">
                {error.message || 'Something went wrong. Please try again.'}
              </div>
            )}
            <div className="mt-4">
              <ChatInput
                input={input}
                setInput={setInput}
                onSubmit={handleSend}
                status={status}
                stop={stop}
                files={files}
                setFiles={setFiles}
              />
            </div>
          </div>
        </div>
      ) : (
        <div className="flex flex-1 min-h-0">
          {/* Main chat area */}
          <div className="flex flex-1 flex-col min-w-0">
            <Messages messages={messages} status={status} onRetry={handleRetry} onEdit={handleEdit} />
            {error && (
              <div className="mx-auto w-full max-w-4xl px-2 md:px-4">
                <div className="rounded-lg border border-[--destructive]/30 bg-[--destructive]/10 px-4 py-2 text-sm text-[--destructive]">
                  {error.message || 'Something went wrong. Please try again.'}
                </div>
              </div>
            )}
            <ChatInput
              input={input}
              setInput={setInput}
              onSubmit={handleSend}
              status={status}
              stop={stop}
              files={files}
              setFiles={setFiles}
            />
          </div>

          {/* Right tool panel */}
          <ToolPanel messages={messages} show={showToolPanel} />
        </div>
      )}
    </div>
  );
}
