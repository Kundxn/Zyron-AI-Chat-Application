import React, { useEffect, useRef } from 'react';
import { Message } from '../types';
import { MessageItem } from './MessageItem';
import { SolarSystemCard } from './SolarSystemCard';

interface ChatAreaProps {
  messages: Message[];
  isStreaming: boolean;
  currentModel: string;
  onSelectPromptSuggestion: (prompt: string) => void;
  onRegenerate: (messageId: string) => void;
}

export const ChatArea: React.FC<ChatAreaProps> = ({
  messages,
  isStreaming,
  currentModel,
  onSelectPromptSuggestion,
  onRegenerate,
}) => {
  const bottomRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const userScrolledUpRef = useRef(false);

  // Auto-scroll handler
  useEffect(() => {
    if (!userScrolledUpRef.current) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isStreaming]);

  // Track if user manually scrolled up
  const handleScroll = () => {
    if (!scrollContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
    const isAtBottom = scrollHeight - scrollTop - clientHeight < 60;
    userScrolledUpRef.current = !isAtBottom;
  };

  return (
    <div
      ref={scrollContainerRef}
      onScroll={handleScroll}
      className="flex-1 overflow-y-auto bg-[#000000] dark:bg-[#000000] light:bg-[#ffffff] text-slate-100 light:text-slate-900 transition-colors"
    >
      {messages.length === 0 ? (
        /* Empty State / Welcome Screen Matching the ChatGPT Screenshot */
        <div className="min-h-full flex flex-col items-center justify-center p-6 text-center max-w-4xl mx-auto space-y-7">
          {/* Headline matching screenshot */}
          <h1 className="text-3xl md:text-4xl font-display font-medium text-white dark:text-white light:text-slate-900 tracking-tight">
            What's on your mind today?
          </h1>

          {/* Interactive Card Section matching screenshot */}
          <div className="flex flex-col items-center space-y-4 pt-2">
            <SolarSystemCard />

            <div className="space-y-1">
              <h2 className="text-base font-semibold text-white dark:text-white light:text-slate-900">
                Zyron with Intelligent UI
              </h2>
              <p className="text-xs text-slate-400 dark:text-slate-400 light:text-slate-500 max-w-md">
                Get visual and interactive answers to help you take the next step
              </p>
            </div>

            <button
              onClick={() =>
                onSelectPromptSuggestion(
                  'Explain orbital mechanics and planetary resonance in a solar system with code examples.'
                )
              }
              className="px-5 py-2 rounded-full border border-slate-700/80 hover:border-slate-500 bg-[#171717] hover:bg-[#212121] text-xs font-semibold text-white transition-all shadow-md cursor-pointer"
            >
              Try Zyron
            </button>
          </div>
        </div>
      ) : (
        /* Message Stream */
        <div className="divide-y divide-transparent pb-10">
          {messages.map((message, idx) => (
            <MessageItem
              key={message.id || idx}
              message={message}
              isStreaming={isStreaming && idx === messages.length - 1 && message.role === 'assistant'}
              onRegenerate={onRegenerate}
            />
          ))}
          <div ref={bottomRef} />
        </div>
      )}
    </div>
  );
};
