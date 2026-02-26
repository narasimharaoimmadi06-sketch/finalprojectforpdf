import { ToolId } from '../App';
import ToolCard from './ToolCard';
import {
  FileImage,
  FileText,
  FileType,
  Minimize2,
  Maximize2,
  Layers,
  ArrowRightLeft,
  FileOutput,
} from 'lucide-react';

interface Tool {
  id: NonNullable<ToolId>;
  name: string;
  description: string;
  icon: React.ReactNode;
  gradient: string;
  glowColor: string;
  badge: string;
}

const tools: Tool[] = [
  {
    id: 'pdf-to-image',
    name: 'PDF to Image',
    description: 'Convert PDF pages to high-quality JPG or PNG images',
    icon: <FileImage className="w-7 h-7" />,
    gradient: 'linear-gradient(135deg, #7c3aed, #4f46e5)',
    glowColor: 'rgba(124, 58, 237, 0.4)',
    badge: 'PDF → JPG/PNG',
  },
  {
    id: 'image-to-pdf',
    name: 'Image to PDF',
    description: 'Combine multiple images into a single PDF document',
    icon: <FileOutput className="w-7 h-7" />,
    gradient: 'linear-gradient(135deg, #2563eb, #0891b2)',
    glowColor: 'rgba(37, 99, 235, 0.4)',
    badge: 'JPG/PNG → PDF',
  },
  {
    id: 'image-to-word',
    name: 'Image to Word',
    description: 'Embed images into a downloadable Word document',
    icon: <FileType className="w-7 h-7" />,
    gradient: 'linear-gradient(135deg, #0891b2, #0d9488)',
    glowColor: 'rgba(8, 145, 178, 0.4)',
    badge: 'JPG/PNG → DOCX',
  },
  {
    id: 'pdf-to-word',
    name: 'PDF to Word',
    description: 'Extract text from PDFs and export as Word documents',
    icon: <ArrowRightLeft className="w-7 h-7" />,
    gradient: 'linear-gradient(135deg, #059669, #0d9488)',
    glowColor: 'rgba(5, 150, 105, 0.4)',
    badge: 'PDF → DOCX',
  },
  {
    id: 'word-to-pdf',
    name: 'Word to PDF',
    description: 'Convert Word documents to professional PDF files',
    icon: <FileText className="w-7 h-7" />,
    gradient: 'linear-gradient(135deg, #d97706, #dc2626)',
    glowColor: 'rgba(217, 119, 6, 0.4)',
    badge: 'DOCX → PDF',
  },
  {
    id: 'image-compressor',
    name: 'Image Compressor',
    description: 'Reduce image file size while maintaining quality',
    icon: <Minimize2 className="w-7 h-7" />,
    gradient: 'linear-gradient(135deg, #dc2626, #db2777)',
    glowColor: 'rgba(220, 38, 38, 0.4)',
    badge: 'Compress',
  },
  {
    id: 'image-resizer',
    name: 'Image Resizer',
    description: 'Resize images to custom dimensions with aspect ratio lock',
    icon: <Maximize2 className="w-7 h-7" />,
    gradient: 'linear-gradient(135deg, #db2777, #9333ea)',
    glowColor: 'rgba(219, 39, 119, 0.4)',
    badge: 'Resize',
  },
  {
    id: 'merge-pdfs',
    name: 'Merge PDFs',
    description: 'Combine multiple PDF files into one document',
    icon: <Layers className="w-7 h-7" />,
    gradient: 'linear-gradient(135deg, #9333ea, #7c3aed)',
    glowColor: 'rgba(147, 51, 234, 0.4)',
    badge: 'Merge',
  },
];

interface ToolGridProps {
  onOpenTool: (toolId: ToolId) => void;
}

export default function ToolGrid({ onOpenTool }: ToolGridProps) {
  return (
    <section className="px-4 pb-16 max-w-7xl mx-auto">
      <div className="text-center mb-10">
        <h2 className="font-display font-bold text-2xl md:text-3xl text-white mb-2">
          Choose Your Conversion Tool
        </h2>
        <p className="text-sm" style={{ color: 'rgba(160, 140, 200, 0.7)' }}>
          Click any tool to get started — no sign-up required
        </p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
        {tools.map((tool, index) => (
          <ToolCard
            key={tool.id}
            tool={tool}
            onClick={() => onOpenTool(tool.id)}
            animationDelay={index * 0.05}
          />
        ))}
      </div>
    </section>
  );
}
