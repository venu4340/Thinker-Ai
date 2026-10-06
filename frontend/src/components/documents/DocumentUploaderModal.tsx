import React, { useState } from 'react';
import { FileText, UploadCloud, Trash2, Sparkles, X, FileCheck } from 'lucide-react';
import { useProject } from '../../context/ProjectContext';
import { Button } from '../ui/Button';

interface DocumentUploaderModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DocumentUploaderModal: React.FC<DocumentUploaderModalProps> = ({ isOpen, onClose }) => {
  const { project, uploadDocument, deleteDocument, generateAIPlan, isAiGenerating } = useProject();
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  if (!isOpen || !project) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    setIsUploading(true);
    try {
      await uploadDocument(file);
      setFile(null);
    } finally {
      setIsUploading(false);
    }
  };

  const handleGenerateFromDocs = async () => {
    onClose();
    await generateAIPlan('Synthesize and strictly incorporate the uploaded document requirements and specifications.');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="fixed inset-0" onClick={onClose} />
      <div className="relative w-full max-w-2xl bg-[#0C1220]/95 border border-slate-700/60 rounded-2xl shadow-2xl overflow-hidden z-10 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-[#080D16]/90">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-[#27E6B5]/15 border border-[#27E6B5]/30 text-[#27E6B5]">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                Requirements Ingestion & Document RAG
              </h3>
              <p className="text-xs text-slate-400">
                Upload PRDs, research papers, or specs. Our RAG engine extracts and vectors context for plan generation.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-[#27E6B5] rounded-lg hover:bg-[#101827] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6 overflow-y-auto flex-1">
          {/* Upload Drop Area */}
          <div className="border-2 border-dashed border-slate-700 hover:border-[#27E6B5]/60 rounded-2xl p-8 text-center bg-[#05080D]/50 transition-colors">
            <UploadCloud className="w-10 h-10 mx-auto text-[#27E6B5] mb-3" />
            <p className="text-sm font-semibold text-white mb-1">
              Select or Drop Requirements Document
            </p>
            <p className="text-xs text-slate-400 mb-4">
              Supported formats: PDF, Markdown (.md), Plain Text (.txt), DOCX (Max 15MB)
            </p>

            <input
              type="file"
              id="doc-upload"
              accept=".pdf,.txt,.md,.docx"
              onChange={handleFileChange}
              className="hidden"
            />
            <label
              htmlFor="doc-upload"
              className="inline-flex items-center gap-2 px-4 py-2 bg-[#27E6B5] text-[#03110F] font-semibold rounded-xl text-xs cursor-pointer hover:brightness-105 transition-all shadow-md shadow-teal-500/20"
            >
              Browse Files
            </label>

            {file && (
              <div className="mt-4 p-3 bg-[#0C1220] rounded-xl border border-slate-700 flex items-center justify-between text-xs max-w-md mx-auto">
                <span className="font-semibold text-slate-200 truncate">{file.name}</span>
                <Button variant="primary" size="sm" onClick={handleUpload} isLoading={isUploading}>
                  Upload & Vectorize
                </Button>
              </div>
            )}
          </div>

          {/* Uploaded Documents List */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
              Ingested Project Documents ({project.documents.length})
            </h4>

            {project.documents.length === 0 ? (
              <p className="text-xs text-slate-400 italic p-4 bg-[#05080D]/40 rounded-xl border border-slate-800 text-center">
                No documents uploaded yet. Upload a PRD or specification to ground AI planning.
              </p>
            ) : (
              <div className="space-y-2">
                {project.documents.map((doc) => (
                  <div
                    key={doc.id}
                    className="p-3 bg-[#080D16]/90 rounded-xl border border-slate-800 flex items-center justify-between hover:border-slate-700"
                  >
                    <div className="flex items-center gap-3">
                      <FileCheck className="w-4 h-4 text-[#27E6B5]" />
                      <div>
                        <span className="text-xs font-semibold text-white block">{doc.filename}</span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {(doc.file_size / 1024).toFixed(1)} KB • Ingested {new Date(doc.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => deleteDocument(doc.id)}
                      className="p-1 text-slate-400 hover:text-rose-400 rounded transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 flex items-center justify-between bg-[#080D16]">
          <Button
            variant="primary"
            size="sm"
            onClick={handleGenerateFromDocs}
            disabled={project.documents.length === 0 || isAiGenerating}
          >
            <Sparkles className="w-3.5 h-3.5 mr-1.5" />
            Build Plan From Documents
          </Button>

          <Button variant="outline" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </div>
  );
};
