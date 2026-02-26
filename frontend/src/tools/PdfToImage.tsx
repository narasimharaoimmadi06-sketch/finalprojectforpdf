import React, { useState, useRef } from 'react';

declare global {
  interface Window {
    pdfjsLib: any;
    jspdf: any;
    PDFLib: any;
    mammoth: any;
  }
}

interface ToolProps {
  onClose: () => void;
}

const PdfToImage: React.FC<ToolProps> = ({ onClose: _onClose }) => {
  const [file, setFile] = useState<File | null>(null);
  const [images, setImages] = useState<string[]>([]);
  const [isConverting, setIsConverting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected && selected.type === 'application/pdf') {
      setFile(selected);
      setImages([]);
      setError(null);
    } else if (selected) {
      setError('Please select a valid PDF file.');
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const dropped = e.dataTransfer.files[0];
    if (dropped && dropped.type === 'application/pdf') {
      setFile(dropped);
      setImages([]);
      setError(null);
    } else {
      setError('Please drop a valid PDF file.');
    }
  };

  const convertToImages = async () => {
    if (!file) return;

    if (!window.pdfjsLib) {
      setError('PDF.js library is not loaded. Please refresh the page and try again.');
      return;
    }

    setIsConverting(true);
    setError(null);
    setProgress(0);

    try {
      window.pdfjsLib.GlobalWorkerOptions.workerSrc =
        'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

      const arrayBuffer = await file.arrayBuffer();
      const pdf = await window.pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      const totalPages = pdf.numPages;
      const convertedImages: string[] = [];

      for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
        const page = await pdf.getPage(pageNum);
        const viewport = page.getViewport({ scale: 2.0 });

        const canvas = document.createElement('canvas');
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) throw new Error('Could not get canvas context');

        await page.render({ canvasContext: ctx, viewport }).promise;
        convertedImages.push(canvas.toDataURL('image/png'));
        setProgress(Math.round((pageNum / totalPages) * 100));
      }

      setImages(convertedImages);
    } catch (err: any) {
      setError(`Conversion failed: ${err?.message || 'Unknown error'}`);
    } finally {
      setIsConverting(false);
    }
  };

  const downloadImage = (dataUrl: string, index: number) => {
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = `page-${index + 1}.png`;
    a.click();
  };

  const downloadAll = () => {
    images.forEach((img, i) => downloadImage(img, i));
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
          accept=".pdf,application/pdf"
          onChange={handleFileChange}
          className="hidden"
        />
        <div className="text-4xl mb-3">📄</div>
        {file ? (
          <div>
            <p className="font-medium" style={{ color: 'rgba(200, 180, 255, 0.9)' }}>{file.name}</p>
            <p className="text-sm mt-1" style={{ color: 'rgba(160, 140, 200, 0.7)' }}>
              {(file.size / 1024 / 1024).toFixed(2)} MB
            </p>
          </div>
        ) : (
          <div>
            <p className="font-medium" style={{ color: 'rgba(200, 180, 255, 0.9)' }}>Drop your PDF here</p>
            <p className="text-sm mt-1" style={{ color: 'rgba(160, 140, 200, 0.7)' }}>or click to browse</p>
          </div>
        )}
      </div>

      {error && (
        <div className="rounded-lg p-3 text-sm" style={{ background: 'rgba(220, 38, 38, 0.1)', border: '1px solid rgba(220, 38, 38, 0.3)', color: 'rgba(252, 165, 165, 0.9)' }}>
          {error}
        </div>
      )}

      {file && !isConverting && images.length === 0 && (
        <button
          onClick={convertToImages}
          className="btn-primary w-full py-3 rounded-xl font-semibold text-sm"
        >
          Convert to Images
        </button>
      )}

      {isConverting && (
        <div className="space-y-2">
          <div className="flex justify-between text-sm" style={{ color: 'rgba(160, 140, 200, 0.7)' }}>
            <span>Converting...</span>
            <span>{progress}%</span>
          </div>
          <div className="w-full rounded-full h-2" style={{ background: 'rgba(255,255,255,0.08)' }}>
            <div
              className="h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%`, background: 'linear-gradient(90deg, #7c3aed, #4f46e5)' }}
            />
          </div>
        </div>
      )}

      {images.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium" style={{ color: 'rgba(200, 180, 255, 0.9)' }}>
              {images.length} page{images.length > 1 ? 's' : ''} converted
            </p>
            {images.length > 1 && (
              <button
                onClick={downloadAll}
                className="text-sm font-medium"
                style={{ color: 'rgba(167, 139, 250, 0.9)' }}
              >
                Download All
              </button>
            )}
          </div>
          <div className="grid grid-cols-2 gap-3 max-h-64 overflow-y-auto">
            {images.map((img, i) => (
              <div
                key={i}
                className="relative group cursor-pointer rounded-lg overflow-hidden"
                style={{ border: '1px solid rgba(139, 92, 246, 0.2)' }}
                onClick={() => downloadImage(img, i)}
              >
                <img src={img} alt={`Page ${i + 1}`} className="w-full h-auto" />
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <span className="text-white text-sm font-medium">Download</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default PdfToImage;
