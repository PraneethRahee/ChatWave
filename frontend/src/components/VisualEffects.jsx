import { useEffect, useRef } from 'react';

const VisualEffects = ({ hasEmail, hasPassword }) => {
  const canvasRef = useRef(null);
  const animationFrameRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth / 2;
    canvas.height = window.innerHeight;

    let time = 0;
    const particles = [];

    // Create particles
    for (let i = 0; i < 50; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        radius: Math.random() * 3 + 1,
        speedX: (Math.random() - 0.5) * 0.5,
        speedY: (Math.random() - 0.5) * 0.5,
        hue: Math.random() * 360,
      });
    }

    const animate = () => {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      time += 0.01;

      particles.forEach((particle, i) => {
        particle.x += particle.speedX;
        particle.y += particle.speedY;

        if (particle.x < 0 || particle.x > canvas.width) particle.speedX *= -1;
        if (particle.y < 0 || particle.y > canvas.height) particle.speedY *= -1;

        if (hasEmail && !hasPassword) {

          particle.x += Math.sin(time * 5 + i) * 2;
          particle.y += Math.cos(time * 5 + i) * 2;
          particle.hue = (particle.hue + 5) % 360;
        } else if (hasPassword) {

          particle.x += Math.sin(time * 2 + i) * 0.5;
          particle.y += Math.cos(time * 2 + i) * 0.5;
        }

        // Draw particle
        const gradient = ctx.createRadialGradient(
          particle.x,
          particle.y,
          0,
          particle.x,
          particle.y,
          particle.radius * 3
        );
        gradient.addColorStop(0, `hsla(${particle.hue}, 70%, 60%, 0.8)`);
        gradient.addColorStop(1, `hsla(${particle.hue}, 70%, 60%, 0)`);

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.radius * 3, 0, Math.PI * 2);
        ctx.fill();

        // Connect nearby particles
        particles.slice(i + 1).forEach((otherParticle) => {
          const dx = particle.x - otherParticle.x;
          const dy = particle.y - otherParticle.y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance < 150) {
            ctx.strokeStyle = `hsla(${(particle.hue + otherParticle.hue) / 2}, 70%, 60%, ${0.3 * (1 - distance / 150)})`;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(particle.x, particle.y);
            ctx.lineTo(otherParticle.x, otherParticle.y);
            ctx.stroke();
          }
        });
      });

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animate();

    const handleResize = () => {
      canvas.width = window.innerWidth / 2;
      canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      window.removeEventListener('resize', handleResize);
    };
  }, [hasEmail, hasPassword]);

  return (
    <div className="w-full h-full relative overflow-hidden bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
      {/* Animated Background Canvas */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full"
        style={{ background: 'transparent' }}
      />

      {/* Floating Geometric Shapes */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Animated Circles */}
        {[...Array(6)].map((_, i) => (
          <div
            key={`circle-${i}`}
            className="absolute rounded-full opacity-20 blur-xl"
            style={{
              width: `${100 + i * 50}px`,
              height: `${100 + i * 50}px`,
              background: `linear-gradient(135deg, 
                hsl(${240 + i * 30}, 70%, 60%), 
                hsl(${280 + i * 30}, 70%, 60%))`,
              left: `${10 + i * 15}%`,
              top: `${20 + i * 10}%`,
              animation: `float${i} ${15 + i * 2}s ease-in-out infinite`,
              animationDelay: `${i * 0.5}s`,
            }}
          />
        ))}

        {/* Gradient Orbs */}
        {[...Array(4)].map((_, i) => (
          <div
            key={`orb-${i}`}
            className="absolute rounded-full blur-3xl"
            style={{
              width: `${150 + i * 80}px`,
              height: `${150 + i * 80}px`,
              background: hasEmail && !hasPassword
                ? `radial-gradient(circle, 
                    hsl(${270 + i * 30}, 80%, 70%), 
                    hsl(${300 + i * 30}, 80%, 50%), 
                    transparent)`
                : hasPassword
                ? `radial-gradient(circle, 
                    hsl(${200 + i * 20}, 60%, 60%), 
                    hsl(${220 + i * 20}, 60%, 40%), 
                    transparent)`
                : `radial-gradient(circle, 
                    hsl(${250 + i * 25}, 70%, 60%), 
                    transparent)`,
              left: `${60 + i * 10}%`,
              top: `${30 + i * 15}%`,
              opacity: hasEmail && !hasPassword ? 0.4 : hasPassword ? 0.3 : 0.25,
              animation: `pulse${i} ${8 + i * 2}s ease-in-out infinite`,
              animationDelay: `${i * 0.3}s`,
              transform: hasEmail && !hasPassword
                ? `scale(${1 + Math.sin(Date.now() / 1000 + i) * 0.3})`
                : 'scale(1)',
              transition: 'all 0.5s ease',
            }}
          />
        ))}
      </div>

      {/* Shimmer Effect */}
      <div
        className="absolute inset-0 opacity-30"
        style={{
          background: hasEmail && !hasPassword
            ? 'linear-gradient(45deg, transparent 30%, rgba(255,255,255,0.3) 50%, transparent 70%)'
            : 'linear-gradient(45deg, transparent 30%, rgba(255,255,255,0.1) 50%, transparent 70%)',
          backgroundSize: '200% 200%',
          animation: hasEmail && !hasPassword ? 'shimmer 3s linear infinite' : 'shimmer 6s linear infinite',
        }}
      />

      {/* Dynamic Text Overlay */}
      {(hasEmail || hasPassword) && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="text-center px-8">
            {hasEmail && !hasPassword && (
              <div className="space-y-4 animate-fadeIn">
                <div className="text-6xl md:text-8xl font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent animate-bounce">
                  ✨
                </div>
                <p className="text-xl md:text-2xl font-semibold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                  Ready to Continue!
                </p>
              </div>
            )}
            {hasPassword && (
              <div className="space-y-4 animate-fadeIn">
                <div className="text-6xl md:text-8xl font-bold animate-pulse">
                  👀
                </div>
                <p className="text-xl md:text-2xl font-semibold text-gray-700">
                  Almost there...
                </p>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
};

export default VisualEffects;

