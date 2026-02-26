import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import FileUploadZone from '../components/FileUploadZone';
import ConversionProgress from '../components/ConversionProgress';
import DownloadButton from '../components/DownloadButton';
import { Slider } from '@/components/ui/slider';

interface ToolProps {
  onClose: () => void;
}

const formatSize = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
};

export default function ImageCompressor({ onClose: _onClose }: ToolProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [quality, setQuality] = useState([80]);
  const [progress, setProgress] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [resultBlob, setResultBlob] = useState<Blob | null>(null);
  const [originalSize, setOriginalSize] = useState(0);
  const [compressedSize, setCompressedSize] = useState(0);

  const handleFilesSelected = useCallback((selected: File[]) => {
    setFiles(selected);
    setResultBlob(null);
    setOriginalSize(selected[0]?.size || 0);
    setCompressedSize(0);
    setProgress(0);
  }, []);

  const handleCompress = async () => {
    if (files.length === 0) {
      toast.error('Please select an image first');
      return;
    }

    setIsProcessing(true);
    setProgress(0);
    setResultBlob(null);

    try {
      setProgress(20);
      const img = await new Promise<HTMLImageElement>((resolve, reject) => {
        const image = new Image();
        const url = URL.createObjectURL(files[0]);
        image.onload = () => { URL.revokeObjectURL(url); resolve(image); };
        image.onerror = reject;
        image.src = url;
      });

      setProgress(50);

      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(img, 0, 0);

      setProgress(75);

      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob(
          (b) => {
            if (b) resolve(b);
            else reject(new Error('Failed to create blob'));
          },
          'image/jpeg',
          quality[0] / 100
        );
      });

      setProgress(100);
      setResultBlob(blob);
      setCompressedSize(blob.size);

      const reduction = Math.round((1 - blob.size / files[0].size) * 100);
      toast.success(`Compressed! Reduced by ${reduction}%`);
    } catch (err) {
      console.error(err);
      toast.error('Failed to compress image. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const reduction =
    originalSize && compressedSize ? Math.round((1 - compressedSize / originalSize) * 100) : 0;

  const baseName = files[0]?.name.replace(/\.[^.]+$/, '') || 'compressed';

  return (
    <div className="space-y-5">
      <FileUploadZone
        accept=".jpg,.jpeg,.png,.webp"
        onFilesSelected={handleFilesSelected}
        selectedFiles={files}
        onRemoveFile={() => {
          setFiles([]);
          setResultBlob(null);
          setOriginalSize(0);
          setCompressedSize(0);
        }}
        label="Drop your image here or click to browse"
        sublabel="Supports JPG, PNG, WebP"
      />

      {/* Quality slider */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium" style={{ color: 'rgba(200, 180, 255, 0.9)' }}>
            Quality
          </p>
          <span
            className="text-sm font-bold px-2 py-0.5 rounded-md"
            style={{
              background: 'rgba(139, 92, 246, 0.15)',
              color: 'rgba(167, 139, 250, 1)',
              border: '1px solid rgba(139, 92, 246, 0.3)',
            }}
          >
            {quality[0]}%
          </span>
        </div>
        <Slider
          value={quality}
          onValueChange={setQuality}
          min={10}
          max={100}
          step={5}
          className="w-full"
        />
        <div className="flex justify-between text-xs" style={{ color: 'rgba(120, 100, 160, 0.6)' }}>
          <span>Smaller file</span>
          <span>Better quality</span>
        </div>
      </div>

      {/* Size comparison */}
      {originalSize > 0 && (
        <div
          className="grid grid-cols-2 gap-3 p-3 rounded-xl"
          style={{
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid rgba(255, 255, 255, 0.06)',
          }}
        >
          <div className="text-center">
            <p className="text-xs mb-1" style={{ color: 'rgba(120, 100, 160, 0.6)' }}>
              Original
            </p>
            <p className="text-sm font-semibold" style={{ color: 'rgba(200, 180, 255, 0.9)' }}>
              {formatSize(originalSize)}
            </p>
          </div>
          <div className="text-center">
            <p className="text-xs mb-1" style={{ color: 'rgba(120, 100, 160, 0.6)' }}>
              Compressed
            </p>
            <p
              className="text-sm font-semibold"
              style={{
                color: compressedSize
                  ? 'rgba(110, 231, 183, 0.9)'
                  : 'rgba(160, 140, 200, 0.5)',
              }}
            >
              {compressedSize ? formatSize(compressedSize) : '—'}
            </p>
          </div>
          {reduction > 0 && (
            <div className="col-span-2 text-center">
              <span
                className="text-xs font-bold px-3 py-1 rounded-full"
                style={{
                  background: 'rgba(5, 150, 105, 0.15)',
                  color: 'rgba(110, 231, 183, 0.9)',
                  border: '1px solid rgba(5, 150, 105, 0.25)',
                }}
              >
                ↓ {reduction}% smaller
              </span>
            </div>
          )}
        </div>
      )}

      <button
        onClick={handleCompress}
        disabled={isProcessing || files.length === 0}
        className="btn-primary w-full py-3 rounded-xl font-semibold text-sm"
      >
        {isProcessing ? 'Compressing...' : 'Compress Image'}
      </button>

      {isProcessing && <ConversionProgress progress={progress} label="Compressing image..." />}

      {resultBlob && (
        <DownloadButton
          blob={resultBlob}
          filename={`${baseName}_compressed.jpg`}
          label="Download Compressed Image"
        />
      )}
    </div>
  );
}
