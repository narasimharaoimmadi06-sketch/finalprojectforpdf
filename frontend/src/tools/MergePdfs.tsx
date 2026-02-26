import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import FileUploadZone from '../components/FileUploadZone';
import ConversionProgress from '../components/ConversionProgress';
import DownloadButton from '../components/DownloadButton';
import { ArrowUp, ArrowDown, X, FileText } from 'lucide-react';

declare const PDFLib: {
  PDFDocument: {
    create: () => Promise<PDFDocumentInstance>;
    load: (bytes: ArrayBuffer) => Promise<PDFDocumentInstance>;
  };
};

interface PDFDocumentInstance {
  getPageCount: () => number;
  copyPages: (src: PDFDocumentInstance, indices: number[]) => Promise<PDFPageInstance[]>;
  addPage: (page: PDFPageInstance) => void;
  save: () => Promise<Uint8Array>;
}

interface PDFPageInstance {
  // opaque page reference
  _type: 'PDFPage';
}

interface ToolProps {
  onClose: () => void;
}

const formatSize = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
};

export default function MergePdfs({ onClose: _onClose }: ToolProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [progress, setProgress] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [resultBlob, setResultBlob] = useState<Blob | null>(null);

  const handleFilesSelected = useCallback((selected: File[]) => {
    setFiles((prev) => [...prev, ...selected]);
    setResultBlob(null);
  }, []);

  const handleRemoveFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
    setResultBlob(null);
  };

  const moveFile = (index: number, direction: 'up' | 'down') => {
    const newFiles = [...files];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newFiles.length) return;
    [newFiles[index], newFiles[targetIndex]] = [newFiles[targetIndex], newFiles[index]];
    setFiles(newFiles);
    setResultBlob(null);
  };

  const handleMerge = async () => {
    if (files.length < 2) {
      toast.error('Please add at least 2 PDF files to merge');
      return;
    }

    setIsProcessing(true);
    setProgress(0);
    setResultBlob(null);

    try {
      const mergedDoc = await PDFLib.PDFDocument.create();
      setProgress(10);

      for (let i = 0; i < files.length; i++) {
        const arrayBuffer = await files[i].arrayBuffer();
        const pdfDoc = await PDFLib.PDFDocument.load(arrayBuffer);
        const pageCount = pdfDoc.getPageCount();
        const pageIndices = Array.from({ length: pageCount }, (_, idx) => idx);
        const copiedPages = await mergedDoc.copyPages(pdfDoc, pageIndices);
        copiedPages.forEach((page) => mergedDoc.addPage(page));
        setProgress(10 + Math.round(((i + 1) / files.length) * 80));
      }

      setProgress(92);
      const pdfBytes = await mergedDoc.save();
      setProgress(98);

      // Convert Uint8Array to ArrayBuffer to avoid SharedArrayBuffer issues
      const buffer = pdfBytes.buffer.slice(
        pdfBytes.byteOffset,
        pdfBytes.byteOffset + pdfBytes.byteLength
      ) as ArrayBuffer;
      const blob = new Blob([buffer], { type: 'application/pdf' });

      setProgress(100);
      setResultBlob(blob);

      const totalPages = files.reduce((sum) => sum, 0);
      toast.success(`Merged ${files.length} PDFs successfully!`);
      void totalPages;
    } catch (err) {
      console.error(err);
      toast.error('Failed to merge PDFs. Please check your files and try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-5">
      <FileUploadZone
        accept=".pdf"
        multiple
        onFilesSelected={handleFilesSelected}
        label="Drop PDF files here or click to browse"
        sublabel="Add multiple PDFs — they will be merged in order"
      />

      {/* File list with reorder */}
      {files.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-medium" style={{ color: 'rgba(160, 140, 200, 0.7)' }}>
            Merge order ({files.length} file{files.length !== 1 ? 's' : ''}):
          </p>
          {files.map((file, index) => (
            <div
              key={`${file.name}-${index}`}
              className="file-item flex items-center gap-2 px-3 py-2.5 rounded-lg"
            >
              <div
                className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{
                  background: 'rgba(139, 92, 246, 0.15)',
                  border: '1px solid rgba(139, 92, 246, 0.2)',
                }}
              >
                <FileText className="w-3.5 h-3.5" style={{ color: 'rgba(167, 139, 250, 0.9)' }} />
              </div>
              <span
                className="text-xs font-bold w-5 text-center flex-shrink-0"
                style={{ color: 'rgba(139, 92, 246, 0.8)' }}
              >
                {index + 1}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-sm truncate" style={{ color: 'rgba(200, 180, 255, 0.9)' }}>
                  {file.name}
                </p>
                <p className="text-xs" style={{ color: 'rgba(120, 100, 160, 0.6)' }}>
                  {formatSize(file.size)}
                </p>
              </div>
              <div className="flex gap-1 flex-shrink-0">
                <button
                  onClick={() => moveFile(index, 'up')}
                  disabled={index === 0}
                  className="w-6 h-6 rounded flex items-center justify-center disabled:opacity-30 transition-opacity"
                  style={{
                    background: 'rgba(139, 92, 246, 0.15)',
                    color: 'rgba(167, 139, 250, 0.9)',
                  }}
                >
                  <ArrowUp className="w-3 h-3" />
                </button>
                <button
                  onClick={() => moveFile(index, 'down')}
                  disabled={index === files.length - 1}
                  className="w-6 h-6 rounded flex items-center justify-center disabled:opacity-30 transition-opacity"
                  style={{
                    background: 'rgba(139, 92, 246, 0.15)',
                    color: 'rgba(167, 139, 250, 0.9)',
                  }}
                >
                  <ArrowDown className="w-3 h-3" />
                </button>
                <button
                  onClick={() => handleRemoveFile(index)}
                  className="w-6 h-6 rounded flex items-center justify-center transition-colors"
                  style={{
                    background: 'rgba(220, 38, 38, 0.1)',
                    color: 'rgba(252, 165, 165, 0.8)',
                  }}
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {files.length === 1 && (
        <div
          className="text-xs px-3 py-2 rounded-lg"
          style={{
            background: 'rgba(217, 119, 6, 0.1)',
            border: '1px solid rgba(217, 119, 6, 0.2)',
            color: 'rgba(252, 211, 77, 0.8)',
          }}
        >
          ⚠ Add at least one more PDF to merge
        </div>
      )}

      <button
        onClick={handleMerge}
        disabled={isProcessing || files.length < 2}
        className="btn-primary w-full py-3 rounded-xl font-semibold text-sm"
      >
        {isProcessing ? 'Merging PDFs...' : `Merge ${files.length > 0 ? files.length : ''} PDFs`}
      </button>

      {isProcessing && <ConversionProgress progress={progress} label="Merging PDF documents..." />}

      {resultBlob && (
        <DownloadButton blob={resultBlob} filename="merged.pdf" label="Download Merged PDF" />
      )}
    </div>
  );
}
