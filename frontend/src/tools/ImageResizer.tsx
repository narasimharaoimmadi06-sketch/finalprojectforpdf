import { useState, useCallback, useEffect } from 'react';
import { toast } from 'sonner';
import FileUploadZone from '../components/FileUploadZone';
import ConversionProgress from '../components/ConversionProgress';
import DownloadButton from '../components/DownloadButton';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Lock, Unlock } from 'lucide-react';

interface ToolProps {
  onClose: () => void;
}

export default function ImageResizer({ onClose: _onClose }: ToolProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [width, setWidth] = useState('');
  const [height, setHeight] = useState('');
  const [lockAspect, setLockAspect] = useState(true);
  const [originalDims, setOriginalDims] = useState<{ w: number; h: number } | null>(null);
  const [progress, setProgress] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [resultBlob, setResultBlob] = useState<Blob | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // Load image dimensions when file is selected
  useEffect(() => {
    if (files.length === 0) {
      setOriginalDims(null);
      setWidth('');
      setHeight('');
      setPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(files[0]);
    setPreviewUrl(url);
    const img = new Image();
    img.onload = () => {
      setOriginalDims({ w: img.naturalWidth, h: img.naturalHeight });
      setWidth(String(img.naturalWidth));
      setHeight(String(img.naturalHeight));
    };
    img.src = url;
    return () => URL.revokeObjectURL(url);
  }, [files]);

  const handleFilesSelected = useCallback((selected: File[]) => {
    setFiles(selected);
    setResultBlob(null);
    setProgress(0);
  }, []);

  const handleWidthChange = (val: string) => {
    setWidth(val);
    if (lockAspect && originalDims && val) {
      const w = parseInt(val, 10);
      if (!isNaN(w) && w > 0) {
        const ratio = originalDims.h / originalDims.w;
        setHeight(String(Math.round(w * ratio)));
      }
    }
  };

  const handleHeightChange = (val: string) => {
    setHeight(val);
    if (lockAspect && originalDims && val) {
      const h = parseInt(val, 10);
      if (!isNaN(h) && h > 0) {
        const ratio = originalDims.w / originalDims.h;
        setWidth(String(Math.round(h * ratio)));
      }
    }
  };

  const handleResize = async () => {
    if (files.length === 0) {
      toast.error('Please select an image first');
      return;
    }
    const targetW = parseInt(width, 10);
    const targetH = parseInt(height, 10);
    if (!targetW || !targetH || targetW <= 0 || targetH <= 0) {
      toast.error('Please enter valid width and height values');
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
      canvas.width = targetW;
      canvas.height = targetH;
      const ctx = canvas.getContext('2d')!;
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, 0, 0, targetW, targetH);

      setProgress(80);

      const ext = files[0].name.split('.').pop()?.toLowerCase() || 'jpeg';
      const mimeType = ext === 'png' ? 'image/png' : 'image/jpeg';

      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob(
          (b) => {
            if (b) resolve(b);
            else reject(new Error('Failed to create blob'));
          },
          mimeType,
          0.92
        );
      });

      setProgress(100);
      setResultBlob(blob);
      toast.success(`Resized to ${targetW}×${targetH}px!`);
    } catch (err) {
      console.error(err);
      toast.error('Failed to resize image. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const baseName = files[0]?.name.replace(/\.[^.]+$/, '') || 'resized';
  const ext = files[0]?.name.split('.').pop()?.toLowerCase() || 'jpg';

  return (
    <div className="space-y-5">
      <FileUploadZone
        accept=".jpg,.jpeg,.png,.webp"
        onFilesSelected={handleFilesSelected}
        selectedFiles={files}
        onRemoveFile={() => {
          setFiles([]);
          setResultBlob(null);
          setOriginalDims(null);
          setWidth('');
          setHeight('');
          setPreviewUrl(null);
        }}
        label="Drop your image here or click to browse"
        sublabel="Supports JPG, PNG, WebP"
      />

      {/* Preview */}
      {previewUrl && (
        <div className="flex justify-center">
          <img
            src={previewUrl}
            alt="Preview"
            className="max-h-32 max-w-full rounded-lg object-contain"
            style={{ border: '1px solid rgba(139, 92, 246, 0.2)' }}
          />
        </div>
      )}

      {/* Dimensions */}
      {originalDims && (
        <div className="space-y-3">
          <div
            className="text-xs px-3 py-1.5 rounded-lg inline-block"
            style={{
              background: 'rgba(139, 92, 246, 0.1)',
              border: '1px solid rgba(139, 92, 246, 0.2)',
              color: 'rgba(167, 139, 250, 0.8)',
            }}
          >
            Original: {originalDims.w} × {originalDims.h} px
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium" style={{ color: 'rgba(200, 180, 255, 0.8)' }}>
                Width (px)
              </Label>
              <Input
                type="number"
                value={width}
                onChange={(e) => handleWidthChange(e.target.value)}
                min={1}
                className="glass-input rounded-lg text-sm"
                style={{
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  color: 'white',
                }}
                placeholder="Width"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium" style={{ color: 'rgba(200, 180, 255, 0.8)' }}>
                Height (px)
              </Label>
              <Input
                type="number"
                value={height}
                onChange={(e) => handleHeightChange(e.target.value)}
                min={1}
                className="glass-input rounded-lg text-sm"
                style={{
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  color: 'white',
                }}
                placeholder="Height"
              />
            </div>
          </div>

          {/* Aspect ratio lock */}
          <div className="flex items-center gap-3">
            <Switch
              checked={lockAspect}
              onCheckedChange={setLockAspect}
              id="aspect-lock"
            />
            <Label
              htmlFor="aspect-lock"
              className="flex items-center gap-1.5 text-sm cursor-pointer"
              style={{ color: 'rgba(200, 180, 255, 0.8)' }}
            >
              {lockAspect ? (
                <Lock className="w-3.5 h-3.5" style={{ color: 'rgba(167, 139, 250, 0.9)' }} />
              ) : (
                <Unlock className="w-3.5 h-3.5" style={{ color: 'rgba(160, 140, 200, 0.6)' }} />
              )}
              Lock aspect ratio
            </Label>
          </div>

          {/* Output dimensions preview */}
          {width && height && (
            <div
              className="text-xs px-3 py-1.5 rounded-lg"
              style={{
                background: 'rgba(5, 150, 105, 0.08)',
                border: '1px solid rgba(5, 150, 105, 0.2)',
                color: 'rgba(110, 231, 183, 0.8)',
              }}
            >
              Output: {width} × {height} px
            </div>
          )}
        </div>
      )}

      <button
        onClick={handleResize}
        disabled={isProcessing || files.length === 0 || !width || !height}
        className="btn-primary w-full py-3 rounded-xl font-semibold text-sm"
      >
        {isProcessing ? 'Resizing...' : 'Resize Image'}
      </button>

      {isProcessing && <ConversionProgress progress={progress} label="Resizing image..." />}

      {resultBlob && (
        <DownloadButton
          blob={resultBlob}
          filename={`${baseName}_${width}x${height}.${ext}`}
          label="Download Resized Image"
        />
      )}
    </div>
  );
}
