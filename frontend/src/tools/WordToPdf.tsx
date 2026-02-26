import React, { useState, useRef } from 'react';

interface ToolProps {
  onClose: () => void;
}

const WordToPdf: React.FC<ToolProps> = ({ onClose: _onClose }) => {
  const [file, setFile] = useState<File | null>(null);
  const [isConverting, setIsConverting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (
      selected &&
      (selected.name.endsWith('.docx') ||
        selected.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document')
    ) {
      setFile(selected);
      setError(null);
    } else if (selected) {
      setError('Please select a valid .docx file.');
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const dropped = e.dataTransfer.files[0];
    if (dropped && dropped.name.endsWith('.docx')) {
      setFile(dropped);
      setError(null);
    } else {
      setError('Please drop a valid .docx file.');
    }
  };

  const convertToPdf = async () => {
    if (!file) return;

    if (!window.mammoth) {
      setError('Mammoth.js library is not loaded. Please refresh the page and try again.');
      return;
    }

    if (!window.jspdf) {
      setError('jsPDF library is not loaded. Please refresh the page and try again.');
      return;
    }

    setIsConverting(true);
    setError(null);

    try {
      const arrayBuffer = await file.arrayBuffer();
      const result = await window.mammoth.extractRawText({ arrayBuffer });
      const text: string = result.value;

      const { jsPDF } = window.jspdf;
      const doc = new jsPDF({ unit: 'pt', format: 'a4' });

      const pageWidth = doc.internal.pageSize.getWidth();
      const margin = 40;
      const maxWidth = pageWidth - margin * 2;
      const lineHeight = 14;
      const fontSize = 11;

      doc.setFontSize(fontSize);

      const lines: string[] = doc.splitTextToSize(text, maxWidth);
      let y = margin + 20;

      for (const line of lines) {
        if (y + lineHeight > doc.internal.pageSize.getHeight() - margin) {
          doc.addPage();
          y = margin + 20;
        }
        doc.text(line, margin, y);
        y += lineHeight;
      }

      doc.save(`${file.name.replace(/\.docx$/i, '')}.pdf`);
    } catch (err: any) {
      setError(`Conversion failed: ${err?.message || 'Unknown error'}`);
    } finally {
      setIsConverting(false);
    }
  };

  return (
    <div className="space-y-4">
      <div
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        onClick={() => fileInputRef.current?.click()}
        className="border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors"
        style={{ borderColor: 'rgba(139, 92, 246, 0.4)' }}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
          onChange={handleFileChange}
          className="hidden"
        />
        <div className="text-4xl mb-3">📃</div>
        {file ? (
          <div>
            <p className="font-medium" style={{ color: 'rgba(200, 180, 255, 0.9)' }}>{file.name}</p>
            <p className="text-sm mt-1" style={{ color: 'rgba(160, 140, 200, 0.7)' }}>
              {(file.size / 1024 / 1024).toFixed(2)} MB
            </p>
          </div>
        ) : (
          <div>
            <p className="font-medium" style={{ color: 'rgba(200, 180, 255, 0.9)' }}>Drop your DOCX file here</p>
            <p className="text-sm mt-1" style={{ color: 'rgba(160, 140, 200, 0.7)' }}>or click to browse</p>
          </div>
        )}
      </div>

      {error && (
        <div className="rounded-lg p-3 text-sm" style={{ background: 'rgba(220, 38, 38, 0.1)', border: '1px solid rgba(220, 38, 38, 0.3)', color: 'rgba(252, 165, 165, 0.9)' }}>
          {error}
        </div>
      )}

      {file && !isConverting && (
        <button
          onClick={convertToPdf}
          className="btn-primary w-full py-3 rounded-xl font-semibold text-sm"
        >
          Convert to PDF
        </button>
      )}

      {isConverting && (
        <div className="flex items-center justify-center gap-3 py-4">
          <svg className="animate-spin h-5 w-5" style={{ color: 'rgba(139, 92, 246, 0.9)' }} viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
          </svg>
          <span className="text-sm" style={{ color: 'rgba(160, 140, 200, 0.7)' }}>Converting...</span>
        </div>
      )}
    </div>
  );
};

export default WordToPdf;
