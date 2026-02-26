import React, { useState, useRef } from 'react';

interface ToolProps {
  onClose: () => void;
}

const MergePdfs: React.FC<ToolProps> = ({ onClose: _onClose }) => {
  const [files, setFiles] = useState<File[]>([]);
  const [isMerging, setIsMerging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mergedUrl, setMergedUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files || []).filter(
      (f) => f.type === 'application/pdf'
    );
    if (selected.length > 0) {
      setFiles((prev) => [...prev, ...selected]);
      setMergedUrl(null);
      setError(null);
    }
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
    setMergedUrl(null);
  };

  const moveUp = (index: number) => {
    if (index === 0) return;
    setFiles((prev) => {
      const arr = [...prev];
      [arr[index - 1], arr[index]] = [arr[index], arr[index - 1]];
      return arr;
    });
  };

  const moveDown = (index: number) => {
    if (index === files.length - 1) return;
    setFiles((prev) => {
      const arr = [...prev];
      [arr[index], arr[index + 1]] = [arr[index + 1], arr[index]];
      return arr;
    });
  };

  const mergePdfs = async () => {
    if (files.length < 2) {
      setError('Please add at least 2 PDF files to merge.');
      return;
    }

    if (!window.PDFLib) {
      setError('pdf-lib library is not loaded. Please refresh the page and try again.');
      return;
    }

    setIsMerging(true);
    setError(null);

    try {
      const { PDFDocument } = window.PDFLib;
      const mergedPdf = await PDFDocument.create();

      for (const file of files) {
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await PDFDocument.load(arrayBuffer);
        const pages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
        pages.forEach((page: any) => mergedPdf.addPage(page));
      }

      const mergedBytes = await mergedPdf.save();
      const blob = new Blob([mergedBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      setMergedUrl(url);
    } catch (err: any) {
      setError(`Merge failed: ${err?.message || 'Unknown error'}`);
    } finally {
      setIsMerging(false);
    }
  };

  const downloadMerged = () => {
    if (!mergedUrl) return;
    const a = document.createElement('a');
    a.href = mergedUrl;
    a.download = 'merged.pdf';
    a.click();
  };

  return (
    <div className="space-y-4">
      <div
        onClick={() => fileInputRef.current?.click()}
        className="border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors"
        style={{ borderColor: 'rgba(139, 92, 246, 0.4)' }}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,application/pdf"
          multiple
          onChange={handleFileChange}
          className="hidden"
        />
        <div className="text-3xl mb-2">🔗</div>
        <p className="font-medium" style={{ color: 'rgba(200, 180, 255, 0.9)' }}>Add PDF files</p>
        <p className="text-sm mt-1" style={{ color: 'rgba(160, 140, 200, 0.7)' }}>Click to browse (select multiple)</p>
      </div>

      {error && (
        <div className="rounded-lg p-3 text-sm" style={{ background: 'rgba(220, 38, 38, 0.1)', border: '1px solid rgba(220, 38, 38, 0.3)', color: 'rgba(252, 165, 165, 0.9)' }}>
          {error}
        </div>
      )}

      {files.length > 0 && (
        <div className="space-y-2">
          {files.map((file, i) => (
            <div
              key={i}
              className="file-item flex items-center gap-2 px-3 py-2.5 rounded-lg"
            >
              <span className="text-sm flex-1 truncate" style={{ color: 'rgba(200, 180, 255, 0.9)' }}>{file.name}</span>
              <span className="text-xs shrink-0" style={{ color: 'rgba(120, 100, 160, 0.6)' }}>
                {(file.size / 1024).toFixed(0)} KB
              </span>
              <button
                onClick={() => moveUp(i)}
                disabled={i === 0}
                className="text-xs px-1 disabled:opacity-30"
                style={{ color: 'rgba(167, 139, 250, 0.9)' }}
              >
                ↑
              </button>
              <button
                onClick={() => moveDown(i)}
                disabled={i === files.length - 1}
                className="text-xs px-1 disabled:opacity-30"
                style={{ color: 'rgba(167, 139, 250, 0.9)' }}
              >
                ↓
              </button>
              <button
                onClick={() => removeFile(i)}
                className="text-xs px-1"
                style={{ color: 'rgba(252, 165, 165, 0.8)' }}
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}

      {files.length === 1 && (
        <div className="text-xs px-3 py-2 rounded-lg" style={{ background: 'rgba(217, 119, 6, 0.1)', border: '1px solid rgba(217, 119, 6, 0.2)', color: 'rgba(252, 211, 77, 0.8)' }}>
          ⚠ Add at least one more PDF to merge
        </div>
      )}

      {files.length >= 2 && !mergedUrl && (
        <button
          onClick={mergePdfs}
          disabled={isMerging}
          className="btn-primary w-full py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2"
        >
          {isMerging ? (
            <>
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
              Merging...
            </>
          ) : (
            `Merge ${files.length} PDFs`
          )}
        </button>
      )}

      {mergedUrl && (
        <button
          onClick={downloadMerged}
          className="btn-download w-full py-3 rounded-xl font-semibold text-sm"
        >
          ⬇ Download Merged PDF
        </button>
      )}
    </div>
  );
};

export default MergePdfs;
