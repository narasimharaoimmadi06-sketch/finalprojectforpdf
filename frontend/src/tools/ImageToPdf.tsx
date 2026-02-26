import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import FileUploadZone from '../components/FileUploadZone';
import ConversionProgress from '../components/ConversionProgress';
import DownloadButton from '../components/DownloadButton';
import { ArrowUp, ArrowDown } from 'lucide-react';

declare const jspdf: { jsPDF: new (opts?: { orientation?: string; unit?: string; format?: string | number[] }) => JsPDFInstance };

interface JsPDFInstance {
  addImage: (data: string, format: string, x: number, y: number, w: number, h: number) => void;
  addPage: () => void;
  internal: { pageSize: { getWidth: () => number; getHeight: () => number } };
  output: (type: 'blob') => Blob;
}

interface ToolProps {
  onClose: () => void;
}

export default function ImageToPdf({ onClose: _onClose }: ToolProps) {
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
  };

  const handleConvert = async () => {
    if (files.length === 0) {
      toast.error('Please select at least one image');
      return;
    }

    setIsProcessing(true);
    setProgress(0);
    setResultBlob(null);

    try {
      const { jsPDF } = jspdf;

      const loadImage = (file: File): Promise<HTMLImageElement> =>
        new Promise((resolve, reject) => {
          const img = new Image();
          const url = URL.createObjectURL(file);
          img.onload = () => { URL.revokeObjectURL(url); resolve(img); };
          img.onerror = reject;
          img.src = url;
        });

      const images = await Promise.all(files.map(loadImage));
      setProgress(30);

      // Create PDF with first image dimensions
      const firstImg = images[0];
      const isLandscape = firstImg.width > firstImg.height;
      const doc = new jsPDF({
        orientation: isLandscape ? 'landscape' : 'portrait',
        unit: 'px',
        format: [firstImg.width, firstImg.height],
      });

      for (let i = 0; i < images.length; i++) {
        const img = images[i];
        if (i > 0) {
          doc.addPage();
        }

        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d')!;
        ctx.drawImage(img, 0, 0);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.92);

        const pageW = doc.internal.pageSize.getWidth();
        const pageH = doc.internal.pageSize.getHeight();
        doc.addImage(dataUrl, 'JPEG', 0, 0, pageW, pageH);

        setProgress(30 + Math.round(((i + 1) / images.length) * 65));
      }

      const blob = doc.output('blob');
      setResultBlob(blob);
      setProgress(100);
      toast.success(`PDF created with ${files.length} page${files.length > 1 ? 's' : ''}!`);
    } catch (err) {
      console.error(err);
      toast.error('Failed to create PDF. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-5">
      <FileUploadZone
        accept=".jpg,.jpeg,.png,.webp"
        multiple
        onFilesSelected={handleFilesSelected}
        label="Drop images here or click to browse"
        sublabel="You can add multiple images — each becomes a PDF page"
      />

      {/* File list with reorder */}
      {files.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-medium" style={{ color: 'rgba(160, 140, 200, 0.7)' }}>
            Page order ({files.length} image{files.length > 1 ? 's' : ''}):
          </p>
          {files.map((file, index) => (
            <div
              key={`${file.name}-${index}`}
              className="file-item flex items-center gap-2 px-3 py-2 rounded-lg"
            >
              <span className="text-xs font-bold w-5 text-center" style={{ color: 'rgba(139, 92, 246, 0.8)' }}>
                {index + 1}
              </span>
              <span className="flex-1 text-sm truncate" style={{ color: 'rgba(200, 180, 255, 0.9)' }}>
                {file.name}
              </span>
              <div className="flex gap-1">
                <button
                  onClick={() => moveFile(index, 'up')}
                  disabled={index === 0}
                  className="w-6 h-6 rounded flex items-center justify-center disabled:opacity-30"
                  style={{ background: 'rgba(139, 92, 246, 0.15)', color: 'rgba(167, 139, 250, 0.9)' }}
                >
                  <ArrowUp className="w-3 h-3" />
                </button>
                <button
                  onClick={() => moveFile(index, 'down')}
                  disabled={index === files.length - 1}
                  className="w-6 h-6 rounded flex items-center justify-center disabled:opacity-30"
                  style={{ background: 'rgba(139, 92, 246, 0.15)', color: 'rgba(167, 139, 250, 0.9)' }}
                >
                  <ArrowDown className="w-3 h-3" />
                </button>
                <button
                  onClick={() => handleRemoveFile(index)}
                  className="w-6 h-6 rounded flex items-center justify-center"
                  style={{ background: 'rgba(220, 38, 38, 0.1)', color: 'rgba(252, 165, 165, 0.8)' }}
                >
                  ×
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <button
        onClick={handleConvert}
        disabled={isProcessing || files.length === 0}
        className="btn-primary w-full py-3 rounded-xl font-semibold text-sm"
      >
        {isProcessing ? 'Creating PDF...' : 'Convert to PDF'}
      </button>

      {isProcessing && <ConversionProgress progress={progress} label="Building PDF document..." />}

      {resultBlob && (
        <DownloadButton blob={resultBlob} filename="converted.pdf" label="Download PDF" />
      )}
    </div>
  );
}
