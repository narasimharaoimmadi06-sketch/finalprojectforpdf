import { useState } from 'react';
import { Toaster } from '@/components/ui/sonner';
import FloatingParticles from './components/FloatingParticles';
import Hero from './components/Hero';
import ToolGrid from './components/ToolGrid';
import ConversionModal from './components/ConversionModal';
import Footer from './components/Footer';
import PdfToImage from './tools/PdfToImage';
import ImageToPdf from './tools/ImageToPdf';
import ImageToWord from './tools/ImageToWord';
import PdfToWord from './tools/PdfToWord';
import WordToPdf from './tools/WordToPdf';
import ImageCompressor from './tools/ImageCompressor';
import ImageResizer from './tools/ImageResizer';
import MergePdfs from './tools/MergePdfs';

export type ToolId =
  | 'pdf-to-image'
  | 'image-to-pdf'
  | 'image-to-word'
  | 'pdf-to-word'
  | 'word-to-pdf'
  | 'image-compressor'
  | 'image-resizer'
  | 'merge-pdfs'
  | null;

const toolTitles: Record<NonNullable<ToolId>, string> = {
  'pdf-to-image': 'PDF to Image',
  'image-to-pdf': 'Image to PDF',
  'image-to-word': 'Image to Word',
  'pdf-to-word': 'PDF to Word',
  'word-to-pdf': 'Word to PDF',
  'image-compressor': 'Image Compressor',
  'image-resizer': 'Image Resizer',
  'merge-pdfs': 'Merge PDFs',
};

export default function App() {
  const [activeTool, setActiveTool] = useState<ToolId>(null);

  const handleOpenTool = (toolId: ToolId) => {
    setActiveTool(toolId);
  };

  const handleCloseTool = () => {
    setActiveTool(null);
  };

  const renderToolContent = () => {
    switch (activeTool) {
      case 'pdf-to-image':
        return <PdfToImage onClose={handleCloseTool} />;
      case 'image-to-pdf':
        return <ImageToPdf onClose={handleCloseTool} />;
      case 'image-to-word':
        return <ImageToWord onClose={handleCloseTool} />;
      case 'pdf-to-word':
        return <PdfToWord onClose={handleCloseTool} />;
      case 'word-to-pdf':
        return <WordToPdf onClose={handleCloseTool} />;
      case 'image-compressor':
        return <ImageCompressor onClose={handleCloseTool} />;
      case 'image-resizer':
        return <ImageResizer onClose={handleCloseTool} />;
      case 'merge-pdfs':
        return <MergePdfs onClose={handleCloseTool} />;
      default:
        return null;
    }
  };

  return (
    <div className="relative min-h-screen gradient-bg overflow-x-hidden">
      <FloatingParticles />
      <div className="relative z-10">
        <Hero />
        <main>
          <ToolGrid onOpenTool={handleOpenTool} />
        </main>
        <Footer />
      </div>

      {activeTool && (
        <ConversionModal
          open={!!activeTool}
          onClose={handleCloseTool}
          title={toolTitles[activeTool]}
        >
          {renderToolContent()}
        </ConversionModal>
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
  );
}
