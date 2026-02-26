import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import FileUploadZone from '../components/FileUploadZone';
import ConversionProgress from '../components/ConversionProgress';
import DownloadButton from '../components/DownloadButton';

declare const pdfjsLib: {
  getDocument: (src: { data: ArrayBuffer }) => { promise: Promise<PDFDocumentProxy> };
  GlobalWorkerOptions: { workerSrc: string };
};

interface PDFDocumentProxy {
  numPages: number;
  getPage: (pageNum: number) => Promise<PDFPageProxy>;
}

interface PDFPageProxy {
  getTextContent: () => Promise<{ items: Array<{ str: string; hasEOL?: boolean }> }>;
}

interface ToolProps {
  onClose: () => void;
}

async function buildTextDocx(pages: string[]): Promise<Blob> {
  const encoder = new TextEncoder();

  const contentTypesXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
</Types>`;

  const relsXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`;

  const wordRelsXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
</Relationships>`;

  const escapeXml = (str: string) =>
    str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');

  const paragraphs = pages.flatMap((pageText, i) => {
    const lines = pageText.split('\n').filter((l) => l.trim());
    const paras = lines.map(
      (line) => `<w:p><w:r><w:t xml:space="preserve">${escapeXml(line)}</w:t></w:r></w:p>`
    );
    if (i < pages.length - 1) {
      paras.push(`<w:p><w:r><w:br w:type="page"/></w:r></w:p>`);
    }
    return paras;
  });

  const documentXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"
  xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <w:body>
    ${paragraphs.join('\n    ')}
    <w:sectPr/>
  </w:body>
</w:document>`;

  return buildZip(encoder, {
    '[Content_Types].xml': contentTypesXml,
    '_rels/.rels': relsXml,
    'word/_rels/document.xml.rels': wordRelsXml,
    'word/document.xml': documentXml,
  });
}

function buildZip(encoder: TextEncoder, files: Record<string, string>): Blob {
  const crc32 = (data: Uint8Array): number => {
    const table = new Uint32Array(256);
    for (let i = 0; i < 256; i++) {
      let c = i;
      for (let j = 0; j < 8; j++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
      table[i] = c;
    }
    let crc = 0xffffffff;
    for (let i = 0; i < data.length; i++) crc = table[(crc ^ data[i]) & 0xff] ^ (crc >>> 8);
    return (crc ^ 0xffffffff) >>> 0;
  };

  const u16 = (v: number) => new Uint8Array([v & 0xff, (v >> 8) & 0xff]);
  const u32 = (v: number) => new Uint8Array([v & 0xff, (v >> 8) & 0xff, (v >> 16) & 0xff, (v >> 24) & 0xff]);
  const concat = (arrays: Uint8Array[]) => {
    const total = arrays.reduce((s, a) => s + a.length, 0);
    const r = new Uint8Array(total);
    let off = 0;
    for (const a of arrays) { r.set(a, off); off += a.length; }
    return r;
  };

  const parts: Uint8Array[] = [];
  const centralDir: Uint8Array[] = [];
  let offset = 0;
  const now = new Date();
  const dosDate = ((now.getFullYear() - 1980) << 9) | ((now.getMonth() + 1) << 5) | now.getDate();
  const dosTime = (now.getHours() << 11) | (now.getMinutes() << 5) | (now.getSeconds() >> 1);

  for (const [name, content] of Object.entries(files)) {
    const nameBytes = encoder.encode(name);
    const data = encoder.encode(content);
    const crc = crc32(data);

    const localHeader = concat([
      new Uint8Array([0x50, 0x4b, 0x03, 0x04, 0x14, 0x00, 0x00, 0x00, 0x00, 0x00]),
      u16(dosTime), u16(dosDate), u32(crc), u32(data.length), u32(data.length),
      u16(nameBytes.length), u16(0), nameBytes,
    ]);

    parts.push(localHeader, data);

    centralDir.push(concat([
      new Uint8Array([0x50, 0x4b, 0x01, 0x02, 0x14, 0x00, 0x14, 0x00, 0x00, 0x00, 0x00, 0x00]),
      u16(dosTime), u16(dosDate), u32(crc), u32(data.length), u32(data.length),
      u16(nameBytes.length), u16(0), u16(0), u16(0), u16(0), u32(0), u32(offset), nameBytes,
    ]));

    offset += localHeader.length + data.length;
  }

  const cdData = concat(centralDir);
  const numEntries = Object.keys(files).length;
  const eocd = concat([
    new Uint8Array([0x50, 0x4b, 0x05, 0x06, 0x00, 0x00, 0x00, 0x00]),
    u16(numEntries), u16(numEntries), u32(cdData.length), u32(offset), u16(0),
  ]);

  return new Blob([concat([...parts, cdData, eocd])], {
    type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  });
}

export default function PdfToWord({ onClose: _onClose }: ToolProps) {
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
      toast.error('Please select a PDF file first');
      return;
    }

    setIsProcessing(true);
    setProgress(0);
    setResultBlob(null);

    try {
      pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js`;

      const arrayBuffer = await files[0].arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      const totalPages = pdf.numPages;
      const pageTexts: string[] = [];

      for (let i = 1; i <= totalPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const text = textContent.items
          .map((item) => item.str + (item.hasEOL ? '\n' : ''))
          .join('');
        pageTexts.push(text);
        setProgress(Math.round((i / totalPages) * 80));
      }

      setProgress(85);
      const blob = await buildTextDocx(pageTexts);
      setProgress(100);
      setResultBlob(blob);
      toast.success(`Extracted text from ${totalPages} page${totalPages > 1 ? 's' : ''}!`);
    } catch (err) {
      console.error(err);
      toast.error('Failed to convert PDF. Please try another file.');
    } finally {
      setIsProcessing(false);
    }
  };

  const baseName = files[0]?.name.replace(/\.pdf$/i, '') || 'document';

  return (
    <div className="space-y-5">
      <FileUploadZone
        accept=".pdf"
        onFilesSelected={handleFilesSelected}
        selectedFiles={files}
        onRemoveFile={() => { setFiles([]); setResultBlob(null); }}
        label="Drop your PDF here or click to browse"
        sublabel="Text will be extracted from all pages"
      />

      <button
        onClick={handleConvert}
        disabled={isProcessing || files.length === 0}
        className="btn-primary w-full py-3 rounded-xl font-semibold text-sm"
      >
        {isProcessing ? 'Extracting Text...' : 'Convert to Word'}
      </button>

      {isProcessing && <ConversionProgress progress={progress} label="Extracting text from PDF..." />}

      {resultBlob && (
        <DownloadButton blob={resultBlob} filename={`${baseName}.docx`} label="Download Word Document" />
      )}
    </div>
  );
}
