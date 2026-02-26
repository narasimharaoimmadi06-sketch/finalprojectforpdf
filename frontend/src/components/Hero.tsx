import { Zap } from 'lucide-react';

export default function Hero() {
  return (
    <header className="relative pt-16 pb-12 px-4 text-center overflow-hidden">
      {/* Background glow orbs */}
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] rounded-full pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse, rgba(139, 92, 246, 0.15) 0%, transparent 70%)',
          filter: 'blur(40px)',
        }}
      />
      <div
        className="absolute top-10 left-1/4 w-[300px] h-[200px] rounded-full pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse, rgba(59, 130, 246, 0.1) 0%, transparent 70%)',
          filter: 'blur(60px)',
        }}
      />
      <div
        className="absolute top-10 right-1/4 w-[300px] h-[200px] rounded-full pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse, rgba(34, 211, 238, 0.08) 0%, transparent 70%)',
          filter: 'blur(60px)',
        }}
      />

      {/* Hero background image */}
      <div
        className="absolute inset-0 pointer-events-none opacity-10"
        style={{
          backgroundImage: 'url(/assets/generated/hero-bg.dim_1920x600.png)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
        }}
      />

      <div className="relative z-10 max-w-4xl mx-auto">
        {/* Logo */}
        <div className="flex items-center justify-center mb-6">
          <div className="relative">
            <div
              className="w-20 h-20 rounded-2xl flex items-center justify-center animate-pulse-glow"
              style={{
                background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.3), rgba(59, 130, 246, 0.3))',
                border: '1px solid rgba(139, 92, 246, 0.4)',
                backdropFilter: 'blur(10px)',
              }}
            >
              <img
                src="/assets/generated/converthub-logo.dim_256x256.png"
                alt="ConvertHub Logo"
                className="w-12 h-12 object-contain"
                onError={(e) => {
                  // Fallback to icon if image fails
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
              <Zap
                className="w-10 h-10 absolute"
                style={{
                  color: 'rgba(167, 139, 250, 0.9)',
                  filter: 'drop-shadow(0 0 8px rgba(139, 92, 246, 0.8))',
                  display: 'none',
                }}
                id="logo-fallback"
              />
            </div>
            {/* Spinning ring */}
            <div
              className="absolute inset-0 rounded-2xl animate-spin-slow pointer-events-none"
              style={{
                background: 'conic-gradient(from 0deg, transparent 0%, rgba(139, 92, 246, 0.6) 25%, transparent 50%, rgba(59, 130, 246, 0.6) 75%, transparent 100%)',
                padding: '2px',
                WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
                WebkitMaskComposite: 'xor',
                maskComposite: 'exclude',
              }}
            />
          </div>
        </div>

        {/* App name */}
        <h1
          className="font-display font-black text-5xl md:text-7xl mb-4 tracking-tight"
          style={{ lineHeight: 1.1 }}
        >
          <span className="gradient-text neon-text-purple">Convert</span>
          <span className="text-white">Hub</span>
        </h1>

        {/* Tagline */}
        <p className="text-lg md:text-xl font-medium mb-3" style={{ color: 'rgba(200, 180, 255, 0.9)' }}>
          All-in-One File Conversion Toolkit
        </p>
        <p className="text-sm md:text-base max-w-xl mx-auto" style={{ color: 'rgba(160, 140, 200, 0.7)' }}>
          Convert PDFs, images, and documents instantly — all processing happens locally in your browser.
          Your files never leave your device.
        </p>

        {/* Stats badges */}
        <div className="flex flex-wrap items-center justify-center gap-3 mt-8">
          {[
            { label: '8 Tools', icon: '⚡' },
            { label: '100% Free', icon: '✨' },
            { label: 'No Upload', icon: '🔒' },
            { label: 'Instant', icon: '🚀' },
          ].map((badge) => (
            <div
              key={badge.label}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-medium"
              style={{
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                color: 'rgba(200, 180, 255, 0.9)',
                backdropFilter: 'blur(8px)',
              }}
            >
              <span>{badge.icon}</span>
              <span>{badge.label}</span>
            </div>
          ))}
        </div>
      </div>
    </header>
  );
}
