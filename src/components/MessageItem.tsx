import React, { useState } from 'react';
import { Bot, Check, ChevronDown, ChevronUp, Copy, FileText, RotateCcw, User } from 'lucide-react';
import { Message } from '../types';
import { CodeBlock } from './CodeBlock';

interface MessageItemProps {
  message: Message;
  isStreaming?: boolean;
  onRegenerate?: (messageId: string) => void;
}

export const MessageItem: React.FC<MessageItemProps> = ({
  message,
  isStreaming = false,
  onRegenerate,
}) => {
  const [copied, setCopied] = useState(false);
  const [showCitations, setShowCitations] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy', err);
    }
  };

  const isUser = message.role === 'user';

  // Parse markdown into segments (blocks of text, headers, lists, code fences)
  const renderFormattedContent = (content: string) => {
    const parts = content.split(/(```[\s\S]*?```)/g);

    return parts.map((part, index) => {
      if (part.startsWith('```') && part.endsWith('```')) {
        const firstLineEnd = part.indexOf('\n');
        const lang = firstLineEnd !== -1 ? part.slice(3, firstLineEnd).trim() : '';
        const code = firstLineEnd !== -1 ? part.slice(firstLineEnd + 1, -3) : part.slice(3, -3);
        return <CodeBlock key={index} language={lang} code={code} />;
      }

      // Render regular paragraphs, headers, bullet points
      const lines = part.split('\n');
      return (
        <div key={index} className="space-y-2">
          {lines.map((line, lIdx) => {
            const trimmed = line.trim();
            if (!trimmed) return <div key={lIdx} className="h-2" />;

            // Headings
            if (trimmed.startsWith('### ')) {
              return (
                <h3 key={lIdx} className="text-base font-semibold text-slate-900 dark:text-slate-100 mt-3 mb-1">
                  {trimmed.replace('### ', '')}
                </h3>
              );
            }
            if (trimmed.startsWith('## ')) {
              return (
                <h2 key={lIdx} className="text-lg font-bold text-slate-900 dark:text-slate-100 mt-4 mb-2">
                  {trimmed.replace('## ', '')}
                </h2>
              );
            }
            if (trimmed.startsWith('# ')) {
              return (
                <h1 key={lIdx} className="text-xl font-bold text-slate-900 dark:text-slate-100 mt-5 mb-2">
                  {trimmed.replace('# ', '')}
                </h1>
              );
            }

            // Bullet items
            if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
              return (
                <li key={lIdx} className="ml-4 list-disc text-sm text-slate-800 dark:text-slate-200">
                  {renderInlineFormatting(trimmed.slice(2))}
                </li>
              );
            }

            // Numbered items
            if (/^\d+\.\s/.test(trimmed)) {
              return (
                <div key={lIdx} className="ml-4 flex gap-2 text-sm text-slate-800 dark:text-slate-200">
                  <span className="font-mono text-slate-500">{trimmed.match(/^\d+\./)?.[0]}</span>
                  <span>{renderInlineFormatting(trimmed.replace(/^\d+\.\s/, ''))}</span>
                </div>
              );
            }

            // Blockquotes
            if (trimmed.startsWith('> ')) {
              return (
                <blockquote
                  key={lIdx}
                  className="pl-3 border-l-2 border-indigo-400 dark:border-indigo-500 italic text-slate-600 dark:text-slate-400 text-sm my-1"
                >
                  {renderInlineFormatting(trimmed.replace('> ', ''))}
                </blockquote>
              );
            }

            return (
              <p key={lIdx} className="text-sm leading-relaxed text-slate-800 dark:text-slate-200">
                {renderInlineFormatting(line)}
              </p>
            );
          })}
        </div>
      );
    });
  };

  // Inline formatting for **bold**, *italic*, and `code`
  const renderInlineFormatting = (text: string) => {
    const inlineCodeRegex = /`([^`]+)`/g;
    const segments: React.ReactNode[] = [];
    let lastIndex = 0;
    let match;

    while ((match = inlineCodeRegex.exec(text)) !== null) {
      if (match.index > lastIndex) {
        segments.push(parseBoldItalic(text.substring(lastIndex, match.index)));
      }
      segments.push(
        <code
          key={`code-${match.index}`}
          className="px-1.5 py-0.5 rounded text-xs font-mono bg-slate-100 dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 border border-slate-200 dark:border-slate-700/60"
        >
          {match[1]}
        </code>
      );
      lastIndex = inlineCodeRegex.lastIndex;
    }

    if (lastIndex < text.length) {
      segments.push(parseBoldItalic(text.substring(lastIndex)));
    }

    return segments.length > 0 ? segments : parseBoldItalic(text);
  };

  const parseBoldItalic = (text: string): React.ReactNode => {
    // Basic bold parsing
    const boldRegex = /\*\*([^*]+)\*\*/g;
    const parts = text.split(boldRegex);

    if (parts.length === 1) return text;

    return parts.map((part, i) =>
      i % 2 === 1 ? (
        <strong key={i} className="font-semibold text-slate-900 dark:text-white">
          {part}
        </strong>
      ) : (
        part
      )
    );
  };

  return (
    <div
      className={`group w-full py-5 px-4 md:px-6 transition-colors ${
        isUser
          ? 'bg-transparent'
          : 'bg-slate-50/70 dark:bg-slate-900/40 border-y border-slate-200/40 dark:border-slate-800/40'
      }`}
    >
      <div className="max-w-3xl mx-auto flex gap-4">
        {/* Avatar */}
        <div className="shrink-0 pt-0.5">
          {isUser ? (
            <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center shadow-sm">
              <User className="w-4 h-4" />
            </div>
          ) : (
            <div className="w-8 h-8 rounded-lg bg-slate-800 text-white border border-slate-700 flex items-center justify-center shadow-sm">
              <Bot className="w-4 h-4 text-white" />
            </div>
          )}
        </div>

        {/* Message Content Area */}
        <div className="flex-1 min-w-0">
          {/* Header Info */}
          <div className="flex items-center gap-2 mb-1.5 text-xs text-slate-400">
            <span className="font-semibold text-white light:text-slate-900">
              {isUser ? 'You' : 'Zyron'}
            </span>
            {!isUser && message.model && (
              <span className="text-[11px] text-slate-400">
                ({message.model})
              </span>
            )}
            <span aria-hidden="true">·</span>
            <span className="tabular-nums">
              {new Date(message.timestamp).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </span>
          </div>

          {/* Body */}
          <div className="prose dark:prose-invert max-w-none">
            {renderFormattedContent(message.content)}
            {isStreaming && (
              <span className="inline-block w-2 h-4 ml-1 bg-indigo-500 animate-pulse align-middle" />
            )}
          </div>

          {/* Citations if available */}
          {message.citations && message.citations.length > 0 && (
            <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-800">
              <button
                onClick={() => setShowCitations(!showCitations)}
                className="flex items-center gap-1.5 text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:underline"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>
                  {message.citations.length} Document Source{message.citations.length > 1 ? 's' : ''} Cited
                </span>
                {showCitations ? (
                  <ChevronUp className="w-3.5 h-3.5" />
                ) : (
                  <ChevronDown className="w-3.5 h-3.5" />
                )}
              </button>

              {showCitations && (
                <div className="mt-2 space-y-2">
                  {message.citations.map((cit, idx) => (
                    <div
                      key={cit.id || idx}
                      className="p-2.5 rounded-lg bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60 text-xs"
                    >
                      <div className="flex items-center justify-between font-medium text-slate-800 dark:text-slate-200 mb-1">
                        <span className="truncate max-w-[280px]">
                          [{idx + 1}] {cit.documentName}
                        </span>
                        <span className="tabular-nums font-mono text-indigo-500">
                          {cit.similarity}% match
                        </span>
                      </div>
                      <p className="text-slate-600 dark:text-slate-400 text-xs italic line-clamp-2">
                        "{cit.snippet}"
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Action Bar */}
          {!isUser && !isStreaming && (
            <div className="flex items-center gap-3 mt-3 pt-2 text-xs text-slate-400">
              <button
                onClick={handleCopy}
                className="flex items-center gap-1 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
                title="Copy response"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-500" />
                    <span className="text-emerald-500">Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy</span>
                  </>
                )}
              </button>

              {onRegenerate && (
                <button
                  onClick={() => onRegenerate(message.id)}
                  className="flex items-center gap-1 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
                  title="Regenerate response"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Regenerate</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
