import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import FileUploadZone from '../components/FileUploadZone';
import ConversionProgress from '../components/ConversionProgress';
import DownloadButton from '../components/DownloadButton';
import { ImageIcon, Download } from 'lucide-react';

declare const pdfjsLib: {
  getDocument: (src: { data: ArrayBuffer }) => { promise: Promise<PDFDocumentProxy> };
  GlobalWorkerOptions: { workerSrc: string };
  version: string;
};

interface PDFDocumentProxy {
  numPages: number;
  getPage: (pageNum: number) => Promise<PDFPageProxy>;
}

interface PDFPageProxy {
  getViewport: (opts: { scale: number }) => { width: number; height: number };
  render: (ctx: { canvasContext: CanvasRenderingContext2D; viewport: { width: number; height: number } }) => { promise: Promise<void> };
}

interface ToolProps {
  onClose: () => void;
}

export default function PdfToImage({ onClose: _onClose }: ToolProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [format, setFormat] = useState<'jpeg' | 'png'>('jpeg');
  const [progress, setProgress] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [resultBlobs, setResultBlobs] = useState<{ blob: Blob; name: string }[]>([]);

  const handleFilesSelected = useCallback((selected: File[]) => {
    setFiles(selected);
    setResultBlobs([]);
    setProgress(0);
  }, []);

  const handleConvert = async () => {
    if (files.length === 0) {
      toast.error('Please select a PDF file first');
      return;
    }

    setIsProcessing(true);
    setProgress(0);
    setResultBlobs([]);

    try {
      // Set worker source
      pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js`;

      const arrayBuffer = await files[0].arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      const totalPages = pdf.numPages;
      const blobs: { blob: Blob; name: string }[] = [];

      for (let i = 1; i <= totalPages; i++) {
        const page = await pdf.getPage(i);
        const viewport = page.getViewport({ scale: 2.0 });

        const canvas = document.createElement('canvas');
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        const ctx = canvas.getContext('2d')!;

        await page.render({ canvasContext: ctx, viewport }).promise;

        const blob = await new Promise<Blob>((resolve) => {
          canvas.toBlob(
            (b) => resolve(b!),
            `image/${format}`,
            format === 'jpeg' ? 0.92 : undefined
          );
        });

        const baseName = files[0].name.replace(/\.pdf$/i, '');
        blobs.push({ blob, name: `${baseName}_page${i}.${format === 'jpeg' ? 'jpg' : 'png'}` });
        setProgress(Math.round((i / totalPages) * 100));
      }

      setResultBlobs(blobs);
      toast.success(`Converted ${totalPages} page${totalPages > 1 ? 's' : ''} successfully!`);
    } catch (err) {
      console.error(err);
      toast.error('Failed to convert PDF. Please try another file.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownloadAll = () => {
    resultBlobs.forEach(({ blob, name }) => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    });
  };

  return (
    <div className="space-y-5">
      <FileUploadZone
        accept=".pdf"
        onFilesSelected={handleFilesSelected}
        selectedFiles={files}
        onRemoveFile={() => { setFiles([]); setResultBlobs([]); }}
        label="Drop your PDF here or click to browse"
        sublabel="Supports single PDF files"
      />

      {/* Format selector */}
      <div>
        <p className="text-sm font-medium mb-2" style={{ color: 'rgba(200, 180, 255, 0.9)' }}>
          Output Format
        </p>
        <div className="flex gap-3">
          {(['jpeg', 'png'] as const).map((fmt) => (
            <button
              key={fmt}
              onClick={() => setFormat(fmt)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200"
              style={{
                background: format === fmt ? 'rgba(139, 92, 246, 0.2)' : 'rgba(255, 255, 255, 0.04)',
                border: `1px solid ${format === fmt ? 'rgba(139, 92, 246, 0.5)' : 'rgba(255, 255, 255, 0.08)'}`,
                color: format === fmt ? 'rgba(200, 180, 255, 1)' : 'rgba(160, 140, 200, 0.7)',
                boxShadow: format === fmt ? '0 0 10px rgba(139, 92, 246, 0.2)' : 'none',
              }}
            >
              <ImageIcon className="w-4 h-4" />
              {fmt.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Convert button */}
      <button
        onClick={handleConvert}
        disabled={isProcessing || files.length === 0}
        className="btn-primary w-full py-3 rounded-xl font-semibold text-sm"
      >
        {isProcessing ? 'Converting...' : 'Convert to Images'}
      </button>

      {/* Progress */}
      {isProcessing && <ConversionProgress progress={progress} label="Rendering PDF pages..." />}

      {/* Results */}
      {resultBlobs.length > 0 && (
        <div className="space-y-3">
          <div
            className="p-3 rounded-xl text-sm"
            style={{
              background: 'rgba(5, 150, 105, 0.1)',
              border: '1px solid rgba(5, 150, 105, 0.25)',
              color: 'rgba(110, 231, 183, 0.9)',
            }}
          >
            ✓ {resultBlobs.length} image{resultBlobs.length > 1 ? 's' : ''} ready for download
          </div>

          {resultBlobs.length === 1 ? (
            <DownloadButton
              blob={resultBlobs[0].blob}
              filename={resultBlobs[0].name}
              label={`Download ${resultBlobs[0].name}`}
            />
          ) : (
            <button
              onClick={handleDownloadAll}
              className="btn-download flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm w-full justify-center"
            >
              <Download className="w-4 h-4" />
              Download All {resultBlobs.length} Images
            </button>
          )}
        </div>
      )}
    </div>
  );
}
