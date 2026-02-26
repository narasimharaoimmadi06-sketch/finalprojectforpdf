import React, { useState } from 'react';
import ErrorBoundary from './components/ErrorBoundary';
import Hero from './components/Hero';
import ToolGrid from './components/ToolGrid';
import Footer from './components/Footer';
import ConversionModal from './components/ConversionModal';
import FloatingParticles from './components/FloatingParticles';
import PdfToImage from './tools/PdfToImage';
import ImageToPdf from './tools/ImageToPdf';
import MergePdfs from './tools/MergePdfs';
import PdfToWord from './tools/PdfToWord';
import WordToPdf from './tools/WordToPdf';
import ImageCompressor from './tools/ImageCompressor';
import ImageResizer from './tools/ImageResizer';
import ImageToWord from './tools/ImageToWord';
import { Toaster } from '@/components/ui/sonner';

export type ToolId =
  | 'pdf-to-image'
  | 'image-to-pdf'
  | 'merge-pdfs'
  | 'pdf-to-word'
  | 'word-to-pdf'
  | 'image-compressor'
  | 'image-resizer'
  | 'image-to-word'
  | null;

const toolTitles: Record<NonNullable<ToolId>, string> = {
  'pdf-to-image': 'PDF to Image',
  'image-to-pdf': 'Image to PDF',
  'merge-pdfs': 'Merge PDFs',
  'pdf-to-word': 'PDF to Word',
  'word-to-pdf': 'Word to PDF',
  'image-compressor': 'Image Compressor',
  'image-resizer': 'Image Resizer',
  'image-to-word': 'Image to Word',
};

function renderTool(toolId: NonNullable<ToolId>, onClose: () => void) {
  switch (toolId) {
    case 'pdf-to-image':
      return <PdfToImage onClose={onClose} />;
    case 'image-to-pdf':
      return <ImageToPdf onClose={onClose} />;
    case 'merge-pdfs':
      return <MergePdfs onClose={onClose} />;
    case 'pdf-to-word':
      return <PdfToWord onClose={onClose} />;
    case 'word-to-pdf':
      return <WordToPdf onClose={onClose} />;
    case 'image-compressor':
      return <ImageCompressor onClose={onClose} />;
    case 'image-resizer':
      return <ImageResizer onClose={onClose} />;
    case 'image-to-word':
      return <ImageToWord onClose={onClose} />;
    default:
      return null;
  }
}

export default function App() {
  const [activeTool, setActiveTool] = useState<ToolId>(null);

  const handleOpenTool = (toolId: ToolId) => {
    setActiveTool(toolId);
  };

  const handleCloseTool = () => {
    setActiveTool(null);
  };

  return (
    <ErrorBoundary>
      <div
        className="relative min-h-screen overflow-x-hidden"
        style={{ background: 'linear-gradient(135deg, #0a0618 0%, #0d0a24 50%, #080514 100%)' }}
      >
        <ErrorBoundary>
          <FloatingParticles />
        </ErrorBoundary>

        <div className="relative z-10 flex flex-col min-h-screen">
          <ErrorBoundary>
            <Hero />
          </ErrorBoundary>

          <main className="flex-1">
            <ErrorBoundary>
              <ToolGrid onOpenTool={handleOpenTool} />
            </ErrorBoundary>
          </main>

          <ErrorBoundary>
            <Footer />
          </ErrorBoundary>
        </div>

        {activeTool && (
          <ErrorBoundary>
            <ConversionModal
              open={!!activeTool}
              onClose={handleCloseTool}
              title={toolTitles[activeTool]}
            >
              {renderTool(activeTool, handleCloseTool)}
            </ConversionModal>
          </ErrorBoundary>
        )}

        <Toaster
          position="bottom-right"
          toastOptions={{
            style: {
              background: 'rgba(20, 15, 40, 0.95)',
              border: '1px solid rgba(139, 92, 246, 0.3)',
              color: 'white',
              backdropFilter: 'blur(16px)',
            },
          }}
        />
      </div>
    </ErrorBoundary>
  );
}
