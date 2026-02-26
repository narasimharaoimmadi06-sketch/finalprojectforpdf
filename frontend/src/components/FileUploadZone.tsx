import { useRef, useState, DragEvent, ChangeEvent } from 'react';
import { Upload, File, X } from 'lucide-react';

interface FileUploadZoneProps {
  accept: string;
  multiple?: boolean;
  onFilesSelected: (files: File[]) => void;
  selectedFiles?: File[];
  onRemoveFile?: (index: number) => void;
  label?: string;
  sublabel?: string;
}

export default function FileUploadZone({
  accept,
  multiple = false,
  onFilesSelected,
  selectedFiles = [],
  onRemoveFile,
  label = 'Drop files here or click to browse',
  sublabel,
}: FileUploadZoneProps) {
  const [isDragActive, setIsDragActive] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragActive(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragActive(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragActive(false);
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      onFilesSelected(multiple ? files : [files[0]]);
    }
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      onFilesSelected(multiple ? files : [files[0]]);
    }
    // Reset input so same file can be re-selected
    if (inputRef.current) inputRef.current.value = '';
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  return (
    <div className="space-y-3">
      <div
        className={`upload-zone rounded-xl p-8 text-center cursor-pointer transition-all duration-300 ${isDragActive ? 'drag-active' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === 'Enter' && inputRef.current?.click()}
      >
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          onChange={handleChange}
          className="hidden"
        />
        <div className="flex flex-col items-center gap-3">
          <div
            className="w-14 h-14 rounded-xl flex items-center justify-center"
            style={{
              background: isDragActive
                ? 'rgba(139, 92, 246, 0.2)'
                : 'rgba(139, 92, 246, 0.08)',
              border: '1px solid rgba(139, 92, 246, 0.3)',
              transition: 'all 0.3s ease',
            }}
          >
            <Upload
              className="w-6 h-6 transition-transform duration-300"
              style={{
                color: isDragActive ? 'rgba(167, 139, 250, 1)' : 'rgba(139, 92, 246, 0.8)',
                transform: isDragActive ? 'translateY(-2px)' : 'translateY(0)',
              }}
            />
          </div>
          <div>
            <p className="font-medium text-sm" style={{ color: 'rgba(200, 180, 255, 0.9)' }}>
              {isDragActive ? 'Release to upload' : label}
            </p>
            {sublabel && (
              <p className="text-xs mt-1" style={{ color: 'rgba(140, 120, 180, 0.7)' }}>
                {sublabel}
              </p>
            )}
            <p className="text-xs mt-2" style={{ color: 'rgba(120, 100, 160, 0.6)' }}>
              Accepted: {accept.replace(/\./g, '').toUpperCase().replace(/,/g, ', ')}
            </p>
          </div>
        </div>
      </div>

      {/* File list */}
      {selectedFiles.length > 0 && (
        <div className="space-y-2">
          {selectedFiles.map((file, index) => (
            <div
              key={`${file.name}-${index}`}
              className="file-item flex items-center gap-3 px-3 py-2.5 rounded-lg"
            >
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ background: 'rgba(139, 92, 246, 0.15)', border: '1px solid rgba(139, 92, 246, 0.2)' }}
              >
                <File className="w-4 h-4" style={{ color: 'rgba(167, 139, 250, 0.9)' }} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate" style={{ color: 'rgba(220, 210, 255, 0.9)' }}>
                  {file.name}
                </p>
                <p className="text-xs" style={{ color: 'rgba(140, 120, 180, 0.6)' }}>
                  {formatSize(file.size)}
                </p>
              </div>
              {onRemoveFile && (
                <button
                  onClick={(e) => { e.stopPropagation(); onRemoveFile(index); }}
                  className="w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0 transition-all duration-200 hover:scale-110"
                  style={{
                    background: 'rgba(220, 38, 38, 0.1)',
                    border: '1px solid rgba(220, 38, 38, 0.2)',
                    color: 'rgba(252, 165, 165, 0.8)',
                  }}
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
