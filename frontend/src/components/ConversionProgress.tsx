import { Progress } from '@/components/ui/progress';
import { Loader2 } from 'lucide-react';

interface ConversionProgressProps {
  progress: number;
  label?: string;
}

export default function ConversionProgress({ progress, label = 'Processing...' }: ConversionProgressProps) {
  return (
    <div className="space-y-3 py-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Loader2 className="w-4 h-4 animate-spin" style={{ color: 'rgba(167, 139, 250, 0.9)' }} />
          <span className="text-sm font-medium" style={{ color: 'rgba(200, 180, 255, 0.9)' }}>
            {label}
          </span>
        </div>
        <span className="text-sm font-bold" style={{ color: 'rgba(167, 139, 250, 1)' }}>
          {Math.round(progress)}%
        </span>
      </div>
      <div
        className="relative h-2 rounded-full overflow-hidden"
        style={{ background: 'rgba(255, 255, 255, 0.06)' }}
      >
        <div
          className="absolute inset-y-0 left-0 rounded-full transition-all duration-300"
          style={{
            width: `${progress}%`,
            background: 'linear-gradient(90deg, #7c3aed, #4f46e5, #0891b2)',
            backgroundSize: '200% 100%',
            animation: 'progressShimmer 2s linear infinite',
            boxShadow: '0 0 10px rgba(139, 92, 246, 0.5)',
          }}
        />
      </div>
    </div>
  );
}
