import { ReactNode } from 'react';
import { X } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface ConversionModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}

export default function ConversionModal({ open, onClose, title, children }: ConversionModalProps) {
  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent
        className="max-w-2xl w-full max-h-[90vh] overflow-y-auto p-0 border-0 shadow-none bg-transparent"
        style={{ background: 'transparent' }}
      >
        <div
          className="rounded-2xl overflow-hidden"
          style={{
            background: 'rgba(15, 10, 35, 0.95)',
            border: '1px solid rgba(139, 92, 246, 0.25)',
            backdropFilter: 'blur(24px)',
            boxShadow: '0 25px 80px rgba(0, 0, 0, 0.6), 0 0 40px rgba(139, 92, 246, 0.1)',
          }}
        >
          {/* Header */}
          <DialogHeader className="px-6 pt-6 pb-4 border-b" style={{ borderColor: 'rgba(139, 92, 246, 0.15)' }}>
            <div className="flex items-center justify-between">
              <DialogTitle className="font-display font-bold text-xl gradient-text">
                {title}
              </DialogTitle>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-200 hover:scale-110"
                style={{
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  color: 'rgba(200, 180, 255, 0.7)',
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.background = 'rgba(220, 38, 38, 0.2)';
                  (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(220, 38, 38, 0.4)';
                  (e.currentTarget as HTMLButtonElement).style.color = 'rgba(252, 165, 165, 1)';
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255, 255, 255, 0.05)';
                  (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(255, 255, 255, 0.1)';
                  (e.currentTarget as HTMLButtonElement).style.color = 'rgba(200, 180, 255, 0.7)';
                }}
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </DialogHeader>

          {/* Content */}
          <div className="p-6">
            {children}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
