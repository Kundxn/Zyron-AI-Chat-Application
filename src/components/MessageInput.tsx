import React, { useRef, useEffect, useState } from 'react';
import { ArrowUp, Brain, FileText, Mic, MicOff, Plus, Square, Volume2, X } from 'lucide-react';
import { UploadedDocument } from '../types';

interface MessageInputProps {
  onSendMessage: (content: string) => void;
  isStreaming: boolean;
  onStopGeneration: () => void;
  activeDocuments: UploadedDocument[];
  onAttachFile: (file: File) => void;
  onRemoveDocument: (docId: string) => void;
  currentModel: string;
}

export const MessageInput: React.FC<MessageInputProps> = ({
  onSendMessage,
  isStreaming,
  onStopGeneration,
  activeDocuments,
  onAttachFile,
  onRemoveDocument,
  currentModel,
}) => {
  const [input, setInput] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(
        textareaRef.current.scrollHeight,
        180
      )}px`;
    }
  }, [input]);

  // Speech-to-text integration
  const toggleSpeechRecognition = () => {
    if (isListening) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsListening(false);
      return;
    }

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert('Speech recognition is not supported in this browser.');
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';

      recognition.onstart = () => setIsListening(true);
      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInput((prev) => (prev ? `${prev} ${transcript}` : transcript));
      };
      recognition.onerror = () => setIsListening(false);
      recognition.onend = () => setIsListening(false);

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      console.error('Speech recognition error:', err);
      setIsListening(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleSubmit = () => {
    if (!input.trim() || isStreaming) return;
    const finalPrompt = isThinking ? `[Think Mode] ${input.trim()}` : input.trim();
    onSendMessage(finalPrompt);
    setInput('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      for (let i = 0; i < files.length; i++) {
        onAttachFile(files[i]);
      }
      e.target.value = '';
    }
  };

  return (
    <div className="p-3 md:p-5 bg-[#000000] dark:bg-[#000000] light:bg-[#ffffff] transition-colors">
      <div className="max-w-3xl mx-auto">
        {/* Attached Document Chips */}
        {activeDocuments.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-2 px-3">
            {activeDocuments.map((doc) => (
              <div
                key={doc.id}
                className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#212121] border border-slate-700 text-xs text-slate-300"
              >
                <FileText className="w-3.5 h-3.5 text-indigo-400" />
                <span className="truncate max-w-[150px]">{doc.name}</span>
                <button
                  type="button"
                  onClick={() => onRemoveDocument(doc.id)}
                  className="p-0.5 hover:text-red-400"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Central Pill Input matching screenshot */}
        <div className="relative flex items-center gap-2 bg-[#212121] dark:bg-[#212121] light:bg-slate-100 border border-[#2f2f2f] light:border-slate-300 rounded-full shadow-lg px-3 py-1.5 md:py-2 transition-all">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".pdf,.txt,.md,.json,.csv"
            multiple
            className="hidden"
          />

          {/* Plus button on left matching screenshot */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-white light:hover:text-slate-900 hover:bg-[#2f2f2f] transition-colors shrink-0 cursor-pointer"
            title="Attach file or document"
          >
            <Plus className="w-5 h-5 stroke-[2]" />
          </button>

          {/* Textarea with placeholder "Ask Zyron" */}
          <textarea
            ref={textareaRef}
            rows={1}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask Zyron"
            className="w-full max-h-36 resize-none bg-transparent py-1.5 px-1 text-sm text-white light:text-slate-900 placeholder-slate-400 outline-none leading-relaxed"
          />

          {/* Right Action Icons: Mic, Voice Wave / Send */}
          <div className="flex items-center gap-1.5 shrink-0">
            {/* Mic button */}
            <button
              type="button"
              onClick={toggleSpeechRecognition}
              className={`p-1.5 rounded-full transition-colors cursor-pointer ${
                isListening
                  ? 'text-red-400 bg-red-500/20 animate-pulse'
                  : 'text-slate-400 hover:text-white hover:bg-[#2f2f2f]'
              }`}
              title="Voice dictation"
            >
              {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            </button>

            {/* Orange Circular Voice Wave / Send Button matching screenshot */}
            {isStreaming ? (
              <button
                type="button"
                onClick={onStopGeneration}
                className="w-8 h-8 rounded-full bg-white text-black hover:bg-slate-200 flex items-center justify-center transition-colors shadow-sm cursor-pointer"
                title="Stop generation"
              >
                <Square className="w-3 h-3 fill-current" />
              </button>
            ) : input.trim() ? (
              <button
                type="button"
                onClick={handleSubmit}
                className="w-8 h-8 rounded-full bg-white text-black hover:bg-slate-200 flex items-center justify-center transition-all shadow-sm cursor-pointer"
                title="Send message"
              >
                <ArrowUp className="w-4 h-4 stroke-[2.5]" />
              </button>
            ) : (
              <div
                className="w-8 h-8 rounded-full bg-[#f59e0b] text-black flex items-center justify-center cursor-pointer shadow-xs hover:scale-105 transition-transform"
                title="Realtime voice wave"
              >
                <Volume2 className="w-4 h-4" />
              </div>
            )}
          </div>
        </div>

        {/* Quiet disclaimer */}
        <div className="text-center mt-2 text-[11px] text-slate-500 font-normal">
          Zyron can make mistakes. Verify important information.
        </div>
      </div>
    </div>
  );
};
