import { useState } from 'react';

interface Tool {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  gradient: string;
  glowColor: string;
  badge: string;
}

interface ToolCardProps {
  tool: Tool;
  onClick: () => void;
  animationDelay?: number;
}

export default function ToolCard({ tool, onClick, animationDelay = 0 }: ToolCardProps) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="glass-card glass-card-hover rounded-2xl p-5 text-left w-full cursor-pointer group"
      style={{
        animationDelay: `${animationDelay}s`,
        boxShadow: isHovered
          ? `0 20px 60px rgba(0, 0, 0, 0.4), 0 0 30px ${tool.glowColor}`
          : '0 8px 32px rgba(0, 0, 0, 0.3)',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      }}
    >
      {/* Icon container */}
      <div className="mb-4 relative">
        <div
          className="w-14 h-14 rounded-xl flex items-center justify-center text-white transition-all duration-300"
          style={{
            background: tool.gradient,
            boxShadow: isHovered ? `0 0 20px ${tool.glowColor}, 0 4px 15px rgba(0,0,0,0.3)` : `0 4px 15px rgba(0,0,0,0.2)`,
            transform: isHovered ? 'scale(1.1) rotate(-3deg)' : 'scale(1) rotate(0deg)',
          }}
        >
          {tool.icon}
        </div>
        {/* Badge */}
        <span
          className="absolute -top-1 -right-1 text-xs font-semibold px-2 py-0.5 rounded-full"
          style={{
            background: 'rgba(255, 255, 255, 0.08)',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            color: 'rgba(200, 180, 255, 0.9)',
            fontSize: '0.65rem',
          }}
        >
          {tool.badge}
        </span>
      </div>

      {/* Content */}
      <h3
        className="font-display font-semibold text-base mb-1.5 transition-colors duration-300"
        style={{ color: isHovered ? 'white' : 'rgba(230, 220, 255, 0.95)' }}
      >
        {tool.name}
      </h3>
      <p
        className="text-xs leading-relaxed transition-colors duration-300"
        style={{ color: isHovered ? 'rgba(200, 180, 255, 0.8)' : 'rgba(160, 140, 200, 0.65)' }}
      >
        {tool.description}
      </p>

      {/* Arrow indicator */}
      <div
        className="mt-4 flex items-center gap-1 text-xs font-medium transition-all duration-300"
        style={{
          color: isHovered ? 'rgba(167, 139, 250, 1)' : 'rgba(139, 92, 246, 0.6)',
          transform: isHovered ? 'translateX(4px)' : 'translateX(0)',
        }}
      >
        <span>Open tool</span>
        <span>→</span>
      </div>
    </button>
  );
}
