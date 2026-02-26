import React, { useState, useRef } from 'react';

interface ToolProps {
  onClose: () => void;
}

const PdfToWord: React.FC<ToolProps> = ({ onClose: _onClose }) => {
  const [file, setFile] = useState<File | null>(null);
  const [isConverting, setIsConverting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected && selected.type === 'application/pdf') {
      setFile(selected);
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
      setError(null);
    } else {
      setError('Please drop a valid PDF file.');
    }
  };

  const buildDocx = (text: string): Blob => {
    const paragraphs = text
      .split('\n')
      .filter((line) => line.trim())
      .map(
        (line) =>
          `<w:p><w:r><w:t xml:space="preserve">${line
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')}</w:t></w:r></w:p>`
      )
      .join('');

    const documentXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>${paragraphs}<w:sectPr/></w:body>
</w:document>`;

    const relsXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`;

    const wordRelsXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
</Relationships>`;

    const contentTypesXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
</Types>`;

    const enc = new TextEncoder();
    const zipFiles: { name: string; data: Uint8Array }[] = [
      { name: '[Content_Types].xml', data: enc.encode(contentTypesXml) },
      { name: '_rels/.rels', data: enc.encode(relsXml) },
      { name: 'word/document.xml', data: enc.encode(documentXml) },
      { name: 'word/_rels/document.xml.rels', data: enc.encode(wordRelsXml) },
    ];

    const crc32 = (data: Uint8Array): number => {
      const table = new Uint32Array(256);
      for (let i = 0; i < 256; i++) {
        let c = i;
        for (let j = 0; j < 8; j++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
        table[i] = c;
      }
      let crc = 0xffffffff;
      for (const byte of data) crc = table[(crc ^ byte) & 0xff] ^ (crc >>> 8);
      return (crc ^ 0xffffffff) >>> 0;
    };

    const le16 = (n: number) => new Uint8Array([n & 0xff, (n >> 8) & 0xff]);
    const le32 = (n: number) =>
      new Uint8Array([n & 0xff, (n >> 8) & 0xff, (n >> 16) & 0xff, (n >> 24) & 0xff]);

    const zipParts: Uint8Array[] = [];
    const centralDir: Uint8Array[] = [];
    let offset = 0;

    for (const f of zipFiles) {
      const nameBytes = enc.encode(f.name);
      const crc = crc32(f.data);
      const localHeader = new Uint8Array([
        0x50, 0x4b, 0x03, 0x04,
        ...le16(20), ...le16(0), ...le16(0),
        ...le32(crc),
        ...le32(f.data.length), ...le32(f.data.length),
        ...le16(nameBytes.length), ...le16(0),
        ...nameBytes,
      ]);
      const centralEntry = new Uint8Array([
        0x50, 0x4b, 0x01, 0x02,
        ...le16(20), ...le16(20), ...le16(0), ...le16(0),
        ...le32(crc),
        ...le32(f.data.length), ...le32(f.data.length),
        ...le16(nameBytes.length), ...le16(0), ...le16(0),
        ...le16(0), ...le16(0), ...le32(0),
        ...le32(offset),
        ...nameBytes,
      ]);
      zipParts.push(localHeader, f.data);
      centralDir.push(centralEntry);
      offset += localHeader.length + f.data.length;
    }

    const cdSize = centralDir.reduce((acc, e) => acc + e.length, 0);
    const cdData = new Uint8Array(cdSize);
    let cdOffset = 0;
    for (const e of centralDir) { cdData.set(e, cdOffset); cdOffset += e.length; }

    const eocd = new Uint8Array([
      0x50, 0x4b, 0x05, 0x06,
      ...le16(0), ...le16(0),
      ...le16(zipFiles.length), ...le16(zipFiles.length),
      ...le32(cdSize), ...le32(offset),
      ...le16(0),
    ]);

    const totalSize = zipParts.reduce((acc, p) => acc + p.length, 0) + cdData.length + eocd.length;
    const result = new Uint8Array(totalSize);
    let pos = 0;
    for (const part of zipParts) { result.set(part, pos); pos += part.length; }
    result.set(cdData, pos); pos += cdData.length;
    result.set(eocd, pos);

    return new Blob([result.buffer], {
      type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    });
  };

  const convertToWord = async () => {
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
      let fullText = '';

      for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
        const page = await pdf.getPage(pageNum);
        const textContent = await page.getTextContent();
        const pageText = textContent.items.map((item: any) => item.str).join(' ');
        fullText += `--- Page ${pageNum} ---\n${pageText}\n\n`;
        setProgress(Math.round((pageNum / totalPages) * 100));
      }

      const blob = buildDocx(fullText);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${file.name.replace(/\.pdf$/i, '')}.docx`;
      a.click();
      URL.revokeObjectURL(url);
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
          accept=".pdf,application/pdf"
          onChange={handleFileChange}
          className="hidden"
        />
        <div className="text-4xl mb-3">📝</div>
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

      {file && !isConverting && (
        <button
          onClick={convertToWord}
          className="btn-primary w-full py-3 rounded-xl font-semibold text-sm"
        >
          Convert to Word
        </button>
      )}

      {isConverting && (
        <div className="space-y-2">
          <div className="flex justify-between text-sm" style={{ color: 'rgba(160, 140, 200, 0.7)' }}>
            <span>Extracting text...</span>
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
    </div>
  );
};

export default PdfToWord;
