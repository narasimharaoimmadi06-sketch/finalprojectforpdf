import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import FileUploadZone from '../components/FileUploadZone';
import ConversionProgress from '../components/ConversionProgress';
import DownloadButton from '../components/DownloadButton';

interface ToolProps {
  onClose: () => void;
}

function concatArrays(arrays: Uint8Array[]): Uint8Array {
  const total = arrays.reduce((sum, a) => sum + a.length, 0);
  const result = new Uint8Array(total);
  let offset = 0;
  for (const arr of arrays) {
    result.set(arr, offset);
    offset += arr.length;
  }
  return result;
}

async function buildDocxWithImage(imageFile: File): Promise<Blob> {
  const arrayBuffer = await imageFile.arrayBuffer();
  const bytes = new Uint8Array(arrayBuffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  const base64 = btoa(binary);

  const ext = imageFile.name.split('.').pop()?.toLowerCase() || 'jpeg';
  const mimeType = ext === 'png' ? 'image/png' : 'image/jpeg';
  const relType = ext === 'png' ? 'png' : 'jpeg';

  const imgDimensions = await new Promise<{ width: number; height: number }>((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(imageFile);
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve({ width: img.naturalWidth, height: img.naturalHeight });
    };
    img.src = url;
  });

  const maxWidthEmu = 5486400;
  const aspectRatio = imgDimensions.height / imgDimensions.width;
  const widthEmu = Math.min(maxWidthEmu, imgDimensions.width * 9144);
  const heightEmu = Math.round(widthEmu * aspectRatio);

  const contentTypesXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Default Extension="${relType}" ContentType="${mimeType}"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
</Types>`;

  const relsXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`;

  const wordRelsXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="media/image1.${relType}"/>
</Relationships>`;

  const documentXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:wpc="http://schemas.microsoft.com/office/word/2010/wordprocessingCanvas"
  xmlns:mc="http://schemas.openxmlformats.org/markup-compatibility/2006"
  xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"
  xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing"
  xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"
  mc:Ignorable="w14 wp14">
  <w:body>
    <w:p>
      <w:r>
        <w:drawing>
          <wp:inline distT="0" distB="0" distL="0" distR="0">
            <wp:extent cx="${widthEmu}" cy="${heightEmu}"/>
            <wp:effectExtent l="0" t="0" r="0" b="0"/>
            <wp:docPr id="1" name="Image1"/>
            <wp:cNvGraphicFramePr>
              <a:graphicFrameLocks xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" noChangeAspect="1"/>
            </wp:cNvGraphicFramePr>
            <a:graphic xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main">
              <a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture">
                <pic:pic xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture">
                  <pic:nvPicPr>
                    <pic:cNvPr id="1" name="Image1"/>
                    <pic:cNvPicPr/>
                  </pic:nvPicPr>
                  <pic:blipFill>
                    <a:blip r:embed="rId1"/>
                    <a:stretch><a:fillRect/></a:stretch>
                  </pic:blipFill>
                  <pic:spPr>
                    <a:xfrm><a:off x="0" y="0"/><a:ext cx="${widthEmu}" cy="${heightEmu}"/></a:xfrm>
                    <a:prstGeom prst="rect"><a:avLst/></a:prstGeom>
                  </pic:spPr>
                </pic:pic>
              </a:graphicData>
            </a:graphic>
          </wp:inline>
        </w:drawing>
      </w:r>
    </w:p>
    <w:sectPr/>
  </w:body>
</w:document>`;

  const imageBytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));

  return buildDocxZip({
    '[Content_Types].xml': contentTypesXml,
    '_rels/.rels': relsXml,
    'word/_rels/document.xml.rels': wordRelsXml,
    'word/document.xml': documentXml,
    [`word/media/image1.${relType}`]: imageBytes,
  });
}

function buildDocxZip(files: Record<string, string | Uint8Array>): Blob {
  const encoder = new TextEncoder();

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

  const parts: Uint8Array[] = [];
  const centralDir: Uint8Array[] = [];
  let offset = 0;
  const now = new Date();
  const dosDate = ((now.getFullYear() - 1980) << 9) | ((now.getMonth() + 1) << 5) | now.getDate();
  const dosTime = (now.getHours() << 11) | (now.getMinutes() << 5) | (now.getSeconds() >> 1);

  for (const [name, content] of Object.entries(files)) {
    const nameBytes = encoder.encode(name);
    const data: Uint8Array = typeof content === 'string' ? encoder.encode(content) : content;
    const crc = crc32(data);

    const localHeader = concatArrays([
      new Uint8Array([0x50, 0x4b, 0x03, 0x04, 0x14, 0x00, 0x00, 0x00, 0x00, 0x00]),
      u16(dosTime), u16(dosDate), u32(crc), u32(data.length), u32(data.length),
      u16(nameBytes.length), u16(0), nameBytes,
    ]);

    parts.push(localHeader, data);

    centralDir.push(concatArrays([
      new Uint8Array([0x50, 0x4b, 0x01, 0x02, 0x14, 0x00, 0x14, 0x00, 0x00, 0x00, 0x00, 0x00]),
      u16(dosTime), u16(dosDate), u32(crc), u32(data.length), u32(data.length),
      u16(nameBytes.length), u16(0), u16(0), u16(0), u16(0), u32(0), u32(offset), nameBytes,
    ]));

    offset += localHeader.length + data.length;
  }

  const cdData = concatArrays(centralDir);
  const numEntries = Object.keys(files).length;
  const eocd = concatArrays([
    new Uint8Array([0x50, 0x4b, 0x05, 0x06, 0x00, 0x00, 0x00, 0x00]),
    u16(numEntries), u16(numEntries), u32(cdData.length), u32(offset), u16(0),
  ]);

  const finalData = concatArrays([...parts, cdData, eocd]);
  // Use ArrayBuffer to avoid SharedArrayBuffer type issues
  const buffer = finalData.buffer.slice(finalData.byteOffset, finalData.byteOffset + finalData.byteLength) as ArrayBuffer;
  return new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  });
}

export default function ImageToWord({ onClose: _onClose }: ToolProps) {
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
      toast.error('Please select an image file first');
      return;
    }

    setIsProcessing(true);
    setProgress(0);
    setResultBlob(null);

    try {
      setProgress(20);
      const blob = await buildDocxWithImage(files[0]);
      setProgress(100);
      setResultBlob(blob);
      toast.success('Word document created successfully!');
    } catch (err) {
      console.error(err);
      toast.error('Failed to create Word document. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const baseName = files[0]?.name.replace(/\.[^.]+$/, '') || 'image';

  return (
    <div className="space-y-5">
      <FileUploadZone
        accept=".jpg,.jpeg,.png,.webp"
        onFilesSelected={handleFilesSelected}
        selectedFiles={files}
        onRemoveFile={() => { setFiles([]); setResultBlob(null); }}
        label="Drop your image here or click to browse"
        sublabel="Supports JPG, PNG, WebP"
      />

      <button
        onClick={handleConvert}
        disabled={isProcessing || files.length === 0}
        className="btn-primary w-full py-3 rounded-xl font-semibold text-sm"
      >
        {isProcessing ? 'Creating Document...' : 'Convert to Word'}
      </button>

      {isProcessing && <ConversionProgress progress={progress} label="Building Word document..." />}

      {resultBlob && (
        <DownloadButton blob={resultBlob} filename={`${baseName}.docx`} label="Download Word Document" />
      )}
    </div>
  );
}
