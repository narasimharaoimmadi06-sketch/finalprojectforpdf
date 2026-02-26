import { Download, CheckCircle } from 'lucide-react';

interface DownloadButtonProps {
  blob: Blob | null;
  filename: string;
  label?: string;
  disabled?: boolean;
}

export default function DownloadButton({ blob, filename, label = 'Download', disabled = false }: DownloadButtonProps) {
  const handleDownload = () => {
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <button
      onClick={handleDownload}
      disabled={disabled || !blob}
      className="btn-download flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm w-full justify-center"
      style={{
        opacity: disabled || !blob ? 0.5 : 1,
        cursor: disabled || !blob ? 'not-allowed' : 'pointer',
      }}
    >
      {blob ? (
        <>
          <CheckCircle className="w-4 h-4" />
          <span>{label}</span>
          <Download className="w-4 h-4" />
        </>
      ) : (
        <>
          <Download className="w-4 h-4" />
          <span>{label}</span>
        </>
      )}
    </button>
  );
}
