import { useEffect, useRef } from 'react';

interface Particle {
  x: number;
  y: number;
  size: number;
  speedX: number;
  speedY: number;
  opacity: number;
  color: string;
  pulse: number;
  pulseSpeed: number;
}

export default function FloatingParticles() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);
  const particlesRef = useRef<Particle[]>([]);

  useEffect(() => {
    let canvas: HTMLCanvasElement | null = null;
    let ctx: CanvasRenderingContext2D | null = null;

    try {
      canvas = canvasRef.current;
      if (!canvas) return;

      ctx = canvas.getContext('2d');
      if (!ctx) return;
    } catch {
      return;
    }

    const colors = [
      'rgba(139, 92, 246,',   // purple
      'rgba(99, 102, 241,',   // indigo
      'rgba(59, 130, 246,',   // blue
      'rgba(34, 211, 238,',   // cyan
      'rgba(167, 139, 250,',  // light purple
    ];

    const resize = () => {
      if (!canvas) return;
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    const createParticles = () => {
      if (!canvas) return;
      const count = Math.floor((window.innerWidth * window.innerHeight) / 18000);
      particlesRef.current = Array.from({ length: Math.min(count, 60) }, () => ({
        x: Math.random() * (canvas?.width ?? window.innerWidth),
        y: Math.random() * (canvas?.height ?? window.innerHeight),
        size: Math.random() * 3 + 0.5,
        speedX: (Math.random() - 0.5) * 0.4,
        speedY: (Math.random() - 0.5) * 0.4,
        opacity: Math.random() * 0.5 + 0.1,
        color: colors[Math.floor(Math.random() * colors.length)],
        pulse: Math.random() * Math.PI * 2,
        pulseSpeed: Math.random() * 0.02 + 0.005,
      }));
    };

    const animate = () => {
      try {
        if (!ctx || !canvas) return;

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        particlesRef.current.forEach((p) => {
          if (!ctx || !canvas) return;
          p.x += p.speedX;
          p.y += p.speedY;
          p.pulse += p.pulseSpeed;

          if (p.x < -10) p.x = canvas.width + 10;
          if (p.x > canvas.width + 10) p.x = -10;
          if (p.y < -10) p.y = canvas.height + 10;
          if (p.y > canvas.height + 10) p.y = -10;

          const currentOpacity = p.opacity * (0.7 + 0.3 * Math.sin(p.pulse));

          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fillStyle = `${p.color}${currentOpacity})`;
          ctx.fill();

          // Glow effect for larger particles
          if (p.size > 2) {
            const gradient = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size * 4);
            gradient.addColorStop(0, `${p.color}${currentOpacity * 0.4})`);
            gradient.addColorStop(1, `${p.color}0)`);
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size * 4, 0, Math.PI * 2);
            ctx.fillStyle = gradient;
            ctx.fill();
          }
        });

        animationRef.current = requestAnimationFrame(animate);
      } catch {
        // Silently stop animation on error to avoid crashing the app
      }
    };

    try {
      resize();
      createParticles();
      animate();
    } catch {
      // Silently fail — particles are decorative only
    }

    const handleResize = () => {
      try {
        resize();
        createParticles();
      } catch {
        // ignore
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationRef.current);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0"
      style={{ opacity: 0.7 }}
    />
  );
}
