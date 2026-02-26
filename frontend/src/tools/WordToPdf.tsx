import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import FileUploadZone from '../components/FileUploadZone';
import ConversionProgress from '../components/ConversionProgress';
import DownloadButton from '../components/DownloadButton';

declare const mammoth: {
  convertToHtml: (input: { arrayBuffer: ArrayBuffer }) => Promise<{ value: string; messages: unknown[] }>;
};

declare const jspdf: { jsPDF: new (opts?: { orientation?: string; unit?: string; format?: string }) => JsPDFInstance };

interface JsPDFInstance {
  setFontSize: (size: number) => void;
  setFont: (font: string, style?: string) => void;
  text: (text: string, x: number, y: number, opts?: { maxWidth?: number }) => void;
  addPage: () => void;
  internal: { pageSize: { getWidth: () => number; getHeight: () => number } };
  output: (type: 'blob') => Blob;
}

interface ToolProps {
  onClose: () => void;
}

export default function WordToPdf({ onClose: _onClose }: ToolProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [progress, setProgress] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [resultBlob, setResultBlob] = useState<Blob | null>(null);

  const handleFilesSelected = useCallback((selected: File[]) => {
    setFiles(selected);
    setResultBlob(null);
    setProgress(0);
  }, []);

  const handleConvert = async () => {
    if (files.length === 0) {
      toast.error('Please select a DOCX file first');
      return;
    }

    setIsProcessing(true);
    setProgress(0);
    setResultBlob(null);

    try {
      setProgress(10);
      const arrayBuffer = await files[0].arrayBuffer();

      setProgress(30);
      const result = await mammoth.convertToHtml({ arrayBuffer });
      const html = result.value;

      setProgress(50);

      // Parse HTML to extract text content
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = html;

      // Extract text with structure
      const { jsPDF } = jspdf;
      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 20;
      const maxWidth = pageWidth - margin * 2;
      let y = margin;

      const addText = (text: string, fontSize: number, isBold: boolean) => {
        doc.setFontSize(fontSize);
        doc.setFont('helvetica', isBold ? 'bold' : 'normal');

        const lines = doc.internal as unknown as { splitTextToSize: (text: string, maxWidth: number) => string[] };
        // Use manual line splitting
        const words = text.split(' ');
        let currentLine = '';
        const textLines: string[] = [];

        for (const word of words) {
          const testLine = currentLine ? `${currentLine} ${word}` : word;
          // Approximate character width
          const approxWidth = testLine.length * (fontSize * 0.35);
          if (approxWidth > maxWidth && currentLine) {
            textLines.push(currentLine);
            currentLine = word;
          } else {
            currentLine = testLine;
          }
        }
        if (currentLine) textLines.push(currentLine);

        for (const line of textLines) {
          if (y + fontSize * 0.5 > pageHeight - margin) {
            doc.addPage();
            y = margin;
          }
          doc.text(line, margin, y);
          y += fontSize * 0.5;
        }
        y += 2;
      };

      // Process DOM nodes
      const processNode = (node: Element) => {
        const tag = node.tagName?.toLowerCase();
        const text = node.textContent?.trim() || '';
        if (!text) return;

        if (tag === 'h1') addText(text, 20, true);
        else if (tag === 'h2') addText(text, 16, true);
        else if (tag === 'h3') addText(text, 14, true);
        else if (tag === 'p' || tag === 'li') addText(text, 11, false);
        else if (tag === 'strong' || tag === 'b') addText(text, 11, true);
        else {
          // Process children
          Array.from(node.children).forEach(processNode);
        }
      };

      Array.from(tempDiv.children).forEach(processNode);

      setProgress(90);
      const blob = doc.output('blob');
      setProgress(100);
      setResultBlob(blob);
      toast.success('PDF created from Word document!');
    } catch (err) {
      console.error(err);
      toast.error('Failed to convert Word document. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const baseName = files[0]?.name.replace(/\.docx$/i, '') || 'document';

  return (
    <div className="space-y-5">
      <FileUploadZone
        accept=".docx"
        onFilesSelected={handleFilesSelected}
        selectedFiles={files}
        onRemoveFile={() => { setFiles([]); setResultBlob(null); }}
        label="Drop your Word document here or click to browse"
        sublabel="Supports .docx files"
      />

      <button
        onClick={handleConvert}
        disabled={isProcessing || files.length === 0}
        className="btn-primary w-full py-3 rounded-xl font-semibold text-sm"
      >
        {isProcessing ? 'Converting...' : 'Convert to PDF'}
      </button>

      {isProcessing && <ConversionProgress progress={progress} label="Converting Word to PDF..." />}

      {resultBlob && (
        <DownloadButton blob={resultBlob} filename={`${baseName}.pdf`} label="Download PDF" />
      )}
    </div>
  );
}
