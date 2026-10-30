import React, { useRef, useState } from 'react';
import {
  Check,
  Eye,
  FileText,
  Paperclip,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import { formatBytes } from '../services/ollamaService';
import { UploadedDocument } from '../types';

interface DocumentModalProps {
  isOpen: boolean;
  onClose: () => void;
  documents: UploadedDocument[];
  onUploadFile: (file: File) => Promise<void>;
  onDeleteDocument: (id: string) => void;
  activeDocIds: string[];
  onToggleActiveDoc: (id: string) => void;
}

export const DocumentModal: React.FC<DocumentModalProps> = ({
  isOpen,
  onClose,
  documents,
  onUploadFile,
  onDeleteDocument,
  activeDocIds,
  onToggleActiveDoc,
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [selectedDocId, setSelectedDocId] = useState<string | null>(null);
  const [searchFilter, setSearchFilter] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setIsUploading(true);
    for (let i = 0; i < files.length; i++) {
      try {
        await onUploadFile(files[i]);
      } catch (err) {
        console.error('Upload error', err);
      }
    }
    setIsUploading(false);
  };

  const selectedDoc = documents.find((d) => d.id === selectedDocId);

  const filteredDocs = documents.filter((d) =>
    d.name.toLowerCase().includes(searchFilter.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
      <div className="w-full max-w-4xl max-h-[85vh] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800">
          <div>
            <h2 className="text-lg font-display font-bold text-slate-900 dark:text-white">
              Document Knowledge Base (RAG)
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Upload PDF and TXT files for local vector retrieval and contextual grounding
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Upload Drop Zone */}
          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-indigo-500 dark:hover:border-indigo-400 rounded-xl p-6 text-center cursor-pointer transition-colors bg-slate-50/50 dark:bg-slate-800/40"
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={(e) => handleFiles(e.target.files)}
              accept=".pdf,.txt,.md,.json,.csv"
              multiple
              className="hidden"
            />
            <div className="flex flex-col items-center justify-center gap-2">
              <div className="w-10 h-10 rounded-full bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                <Upload className="w-5 h-5" />
              </div>
              <div className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                {isUploading ? 'Extracting & Chunking Document...' : 'Click or Drag & Drop Documents Here'}
              </div>
              <p className="text-xs text-slate-400">
                Supports PDF, TXT, Markdown, CSV. Text is parsed and vector-indexed locally.
              </p>
            </div>
          </div>

          {/* Document Table & Chunk Previewer */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            {/* Document List */}
            <div className="md:col-span-7 space-y-3">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-400 uppercase tracking-wider">
                <span>Indexed Documents ({documents.length})</span>
                <input
                  type="text"
                  placeholder="Filter documents..."
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value)}
                  className="bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded text-xs text-slate-800 dark:text-slate-200 outline-none w-36 normal-case"
                />
              </div>

              {filteredDocs.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-400 border border-slate-200 dark:border-slate-800 rounded-xl">
                  No documents indexed yet. Upload a PDF or text file to enable RAG.
                </div>
              ) : (
                <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                  {filteredDocs.map((doc) => {
                    const isActive = activeDocIds.includes(doc.id);
                    const isSelected = doc.id === selectedDocId;

                    return (
                      <div
                        key={doc.id}
                        className={`p-3 rounded-xl border transition-all flex items-center justify-between gap-3 ${
                          isSelected
                            ? 'border-indigo-500 bg-indigo-50/20 dark:bg-indigo-950/30'
                            : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/60'
                        }`}
                      >
                        <div
                          className="flex items-center gap-3 min-w-0 flex-1 cursor-pointer"
                          onClick={() => setSelectedDocId(doc.id)}
                        >
                          <FileText className="w-5 h-5 text-indigo-500 shrink-0" />
                          <div className="min-w-0">
                            <div className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">
                              {doc.name}
                            </div>
                            <div className="text-[11px] text-slate-400 flex items-center gap-2">
                              <span>{formatBytes(doc.size)}</span>
                              <span>·</span>
                              <span>{doc.chunkCount} vector chunks</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          {/* Toggle Active for RAG */}
                          <button
                            onClick={() => onToggleActiveDoc(doc.id)}
                            className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                              isActive
                                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                                : 'bg-slate-100 dark:bg-slate-700 text-slate-500 hover:text-slate-700'
                            }`}
                            title={isActive ? 'Active for RAG grounding' : 'Inactive'}
                          >
                            {isActive ? 'Active' : 'Include'}
                          </button>

                          {/* Preview Chunks */}
                          <button
                            onClick={() => setSelectedDocId(doc.id)}
                            className="p-1.5 text-slate-400 hover:text-indigo-500 rounded"
                            title="Inspect text chunks"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {/* Delete */}
                          <button
                            onClick={() => onDeleteDocument(doc.id)}
                            className="p-1.5 text-slate-400 hover:text-red-500 rounded"
                            title="Delete document"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Chunk Inspector Preview */}
            <div className="md:col-span-5 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 rounded-xl p-4 flex flex-col h-72">
              <div className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2 flex items-center justify-between">
                <span>Vector Chunk Inspector</span>
                {selectedDoc && (
                  <span className="font-mono text-[11px] text-indigo-500">
                    {selectedDoc.chunkCount} chunks
                  </span>
                )}
              </div>

              {selectedDoc && selectedDoc.chunks && selectedDoc.chunks.length > 0 ? (
                <div className="flex-1 overflow-y-auto space-y-2 pr-1 text-xs">
                  {selectedDoc.chunks.map((ch, idx) => (
                    <div
                      key={ch.id || idx}
                      className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800"
                    >
                      <div className="flex items-center justify-between font-mono text-[10px] text-slate-400 mb-1">
                        <span>Chunk #{ch.chunkIndex + 1} (Page {ch.pageNumber || 1})</span>
                        <span className="text-emerald-500">64-dim vector</span>
                      </div>
                      <p className="text-slate-700 dark:text-slate-300 line-clamp-4 leading-relaxed">
                        {ch.content}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex-1 flex items-center justify-center text-center text-xs text-slate-400">
                  Select a document on the left to inspect its semantic chunks and vector embeddings.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex items-center justify-between text-xs text-slate-500">
          <span>Active documents will automatically ground your next prompt using cosine similarity.</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-medium shadow-xs"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
