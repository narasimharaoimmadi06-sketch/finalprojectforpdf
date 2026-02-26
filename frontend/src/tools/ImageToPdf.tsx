import React, { useState, useRef } from 'react';

interface ToolProps {
  onClose: () => void;
}

const ImageToPdf: React.FC<ToolProps> = ({ onClose: _onClose }) => {
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [isConverting, setIsConverting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files || []).filter((f) =>
      f.type.startsWith('image/')
    );
    if (selected.length > 0) {
      setFiles((prev) => [...prev, ...selected]);
      selected.forEach((file) => {
        const reader = new FileReader();
        reader.onload = (ev) => {
          setPreviews((prev) => [...prev, ev.target?.result as string]);
        };
        reader.readAsDataURL(file);
      });
      setError(null);
    }
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
    setPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const convertToPdf = async () => {
    if (files.length === 0) {
      setError('Please add at least one image.');
      return;
    }

    if (!window.jspdf) {
      setError('jsPDF library is not loaded. Please refresh the page and try again.');
      return;
    }

    setIsConverting(true);
    setError(null);

    try {
      const { jsPDF } = window.jspdf;

      const loadImageData = (file: File): Promise<{ dataUrl: string; width: number; height: number }> =>
        new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = (e) => {
            const dataUrl = e.target?.result as string;
            const img = new Image();
            img.onload = () => resolve({ dataUrl, width: img.width, height: img.height });
            img.onerror = reject;
            img.src = dataUrl;
          };
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });

      const imageDataList = await Promise.all(files.map(loadImageData));
      const first = imageDataList[0];
      const orientation = first.width > first.height ? 'l' : 'p';

      const doc = new jsPDF({
        orientation,
        unit: 'px',
        format: [first.width, first.height],
      });

      doc.addImage(first.dataUrl, 'JPEG', 0, 0, first.width, first.height);

      for (let i = 1; i < imageDataList.length; i++) {
        const { dataUrl, width, height } = imageDataList[i];
        doc.addPage([width, height], width > height ? 'l' : 'p');
        doc.addImage(dataUrl, 'JPEG', 0, 0, width, height);
      }

      doc.save('images.pdf');
    } catch (err: any) {
      setError(`Conversion failed: ${err?.message || 'Unknown error'}`);
    } finally {
      setIsConverting(false);
    }
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
          accept="image/*"
          multiple
          onChange={handleFileChange}
          className="hidden"
        />
        <div className="text-3xl mb-2">🖼️</div>
        <p className="font-medium" style={{ color: 'rgba(200, 180, 255, 0.9)' }}>Add images</p>
        <p className="text-sm mt-1" style={{ color: 'rgba(160, 140, 200, 0.7)' }}>JPG, PNG, WebP supported</p>
      </div>

      {error && (
        <div className="rounded-lg p-3 text-sm" style={{ background: 'rgba(220, 38, 38, 0.1)', border: '1px solid rgba(220, 38, 38, 0.3)', color: 'rgba(252, 165, 165, 0.9)' }}>
          {error}
        </div>
      )}

      {previews.length > 0 && (
        <div className="grid grid-cols-3 gap-2 max-h-48 overflow-y-auto">
          {previews.map((src, i) => (
            <div
              key={i}
              className="relative group rounded-lg overflow-hidden"
              style={{ border: '1px solid rgba(139, 92, 246, 0.2)' }}
            >
              <img src={src} alt={`Image ${i + 1}`} className="w-full h-20 object-cover" />
              <button
                onClick={() => removeFile(i)}
                className="absolute top-1 right-1 rounded-full w-5 h-5 text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-white"
                style={{ background: 'rgba(220, 38, 38, 0.8)' }}
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}

      {files.length > 0 && (
        <button
          onClick={convertToPdf}
          disabled={isConverting}
          className="btn-primary w-full py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2"
        >
          {isConverting ? (
            <>
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
              Converting...
            </>
          ) : (
            `Convert ${files.length} image${files.length > 1 ? 's' : ''} to PDF`
          )}
        </button>
      )}
    </div>
  );
};

export default ImageToPdf;
