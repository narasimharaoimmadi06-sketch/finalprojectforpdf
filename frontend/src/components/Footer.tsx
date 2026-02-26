import { Shield, Zap, Heart } from 'lucide-react';

export default function Footer() {
  const year = new Date().getFullYear();
  const appId = encodeURIComponent(typeof window !== 'undefined' ? window.location.hostname : 'converthub');

  return (
    <footer
      className="relative mt-8 border-t"
      style={{ borderColor: 'rgba(139, 92, 246, 0.15)' }}
    >
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'linear-gradient(to top, rgba(139, 92, 246, 0.05), transparent)',
        }}
      />
      <div className="relative z-10 max-w-7xl mx-auto px-4 py-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{
                  background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.3), rgba(59, 130, 246, 0.3))',
                  border: '1px solid rgba(139, 92, 246, 0.3)',
                }}
              >
                <Zap className="w-4 h-4" style={{ color: 'rgba(167, 139, 250, 0.9)' }} />
              </div>
              <span className="font-display font-bold text-lg gradient-text">ConvertHub</span>
            </div>
            <p className="text-sm leading-relaxed" style={{ color: 'rgba(140, 120, 180, 0.7)' }}>
              Your all-in-one file conversion toolkit. Fast, free, and completely private.
            </p>
          </div>

          {/* Tools */}
          <div>
            <h4 className="font-semibold text-sm mb-3" style={{ color: 'rgba(200, 180, 255, 0.9)' }}>
              Tools
            </h4>
            <ul className="space-y-1.5">
              {['PDF to Image', 'Image to PDF', 'Image to Word', 'PDF to Word', 'Word to PDF', 'Image Compressor', 'Image Resizer', 'Merge PDFs'].map((tool) => (
                <li key={tool}>
                  <span className="text-xs" style={{ color: 'rgba(120, 100, 160, 0.65)' }}>
                    {tool}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          {/* Privacy */}
          <div>
            <h4 className="font-semibold text-sm mb-3" style={{ color: 'rgba(200, 180, 255, 0.9)' }}>
              Privacy First
            </h4>
            <div className="space-y-2">
              {[
                { icon: '🔒', text: 'Files never leave your browser' },
                { icon: '⚡', text: 'All processing is 100% local' },
                { icon: '🚫', text: 'No uploads to any server' },
                { icon: '🆓', text: 'Completely free, no sign-up' },
              ].map((item) => (
                <div key={item.text} className="flex items-start gap-2">
                  <span className="text-sm">{item.icon}</span>
                  <span className="text-xs" style={{ color: 'rgba(120, 100, 160, 0.65)' }}>
                    {item.text}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div
          className="pt-6 border-t flex flex-col sm:flex-row items-center justify-between gap-3"
          style={{ borderColor: 'rgba(139, 92, 246, 0.1)' }}
        >
          <div className="flex items-center gap-1.5 text-xs" style={{ color: 'rgba(100, 80, 140, 0.6)' }}>
            <Shield className="w-3 h-3" />
            <span>© {year} ConvertHub. All conversions processed locally in your browser.</span>
          </div>
          <div className="flex items-center gap-1 text-xs" style={{ color: 'rgba(100, 80, 140, 0.6)' }}>
            <span>Built with</span>
            <Heart className="w-3 h-3 fill-current" style={{ color: 'rgba(167, 139, 250, 0.8)' }} />
            <span>using</span>
            <a
              href={`https://caffeine.ai/?utm_source=Caffeine-footer&utm_medium=referral&utm_content=${appId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold transition-colors duration-200 hover:underline"
              style={{ color: 'rgba(167, 139, 250, 0.9)' }}
            >
              caffeine.ai
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
