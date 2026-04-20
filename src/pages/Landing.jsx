import { useNavigate } from 'react-router-dom';
import { useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';

// Utility: random between min and max
const rand = (min, max) => Math.random() * (max - min) + min;

function ParticleCanvas() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationId;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    // Create particles
    const particles = Array.from({ length: 60 }, () => ({
      x: rand(0, canvas.width),
      y: rand(0, canvas.height),
      r: rand(2, 5),
      dx: rand(-0.4, 0.4),
      dy: rand(-0.5, 0.2),
      alpha: rand(0.15, 0.45),
      color: ['#7c3aed', '#a855f7', '#06b6d4', '#f43f5e', '#f97316'][Math.floor(rand(0, 5))],
    }));

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach(p => {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.alpha;
        ctx.fill();
        ctx.globalAlpha = 1;

        p.x += p.dx;
        p.y += p.dy;

        if (p.x < -10) p.x = canvas.width + 10;
        if (p.x > canvas.width + 10) p.x = -10;
        if (p.y < -10) p.y = canvas.height + 10;
        if (p.y > canvas.height + 10) p.y = -10;
      });
      animationId = requestAnimationFrame(draw);
    };
    draw();

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 0,
      }}
    />
  );
}

const FEATURES = [
  {
    icon: '🗄️',
    title: 'Smart Inventory',
    desc: 'Track everything in your pantry, fridge, and freezer. Never buy duplicates or forget what you have.',
    gradient: 'linear-gradient(135deg, rgba(129,140,248,0.15), rgba(99,102,241,0.05))',
    border: 'rgba(129,140,248,0.3)',
    glow: 'rgba(129,140,248,0.2)',
  },
  {
    icon: '⏰',
    title: 'Expiry Tracking',
    desc: 'Get live visual alerts for expiring items. Reduce food waste and save money every single week.',
    gradient: 'linear-gradient(135deg, rgba(251,191,36,0.15), rgba(245,158,11,0.05))',
    border: 'rgba(251,191,36,0.3)',
    glow: 'rgba(251,191,36,0.2)',
  },
  {
    icon: '👨‍🍳',
    title: 'Recipe Magic',
    desc: 'Discover Indian recipes tailored to your inventory. Use expiring ingredients before they go bad.',
    gradient: 'linear-gradient(135deg, rgba(52,211,153,0.15), rgba(16,185,129,0.05))',
    border: 'rgba(52,211,153,0.3)',
    glow: 'rgba(52,211,153,0.2)',
  },
  {
    icon: '🛒',
    title: 'Auto Shopping Lists',
    desc: 'When an item runs out, it\'s automatically added to your shopping list. Zero mental effort required.',
    gradient: 'linear-gradient(135deg, rgba(56,189,248,0.15), rgba(14,165,233,0.05))',
    border: 'rgba(56,189,248,0.3)',
    glow: 'rgba(56,189,248,0.2)',
  },
];


export default function Landing() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  const handleCtaClick = () => {
    navigate(currentUser ? '/dashboard' : '/signup');
  };

  return (
    <>
      <ParticleCanvas />

      {/* Decorative glowing orbs */}
      <div style={{
        position: 'fixed', top: '10%', left: '8%', width: '450px', height: '450px',
        background: 'radial-gradient(circle, rgba(124,58,237,0.1) 0%, transparent 70%)',
        borderRadius: '50%', pointerEvents: 'none', zIndex: 0, filter: 'blur(40px)',
        animation: 'orb-drift-1 10s ease-in-out infinite alternate',
      }} />
      <div style={{
        position: 'fixed', top: '40%', right: '5%', width: '380px', height: '380px',
        background: 'radial-gradient(circle, rgba(6,182,212,0.1) 0%, transparent 70%)',
        borderRadius: '50%', pointerEvents: 'none', zIndex: 0, filter: 'blur(40px)',
        animation: 'orb-drift-2 13s ease-in-out infinite alternate',
      }} />
      <div style={{
        position: 'fixed', bottom: '10%', left: '35%', width: '320px', height: '320px',
        background: 'radial-gradient(circle, rgba(249,115,22,0.08) 0%, transparent 70%)',
        borderRadius: '50%', pointerEvents: 'none', zIndex: 0, filter: 'blur(50px)',
        animation: 'orb-drift-3 16s ease-in-out infinite alternate',
      }} />

      {/* Page Content */}
      <div style={{
        position: 'relative', zIndex: 1,
        maxWidth: '1280px', margin: '0 auto',
        padding: '0 24px 80px',
        paddingTop: 'calc(var(--nav-height) + 80px)',
      }}>

        {/* ── Hero ─────────────────────────────────── */}
        <div style={{ textAlign: 'center', maxWidth: '800px', margin: '0 auto 80px' }}>

          {/* Eyebrow pill */}
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '8px',
            background: 'rgba(129,140,248,0.12)', border: '1px solid rgba(129,140,248,0.3)',
            borderRadius: '9999px', padding: '6px 18px', marginBottom: '32px',
            fontSize: '0.85rem', color: '#818cf8', fontWeight: 600,
          }}>
            ✨ Smart Kitchen Management
          </div>

          <h1 style={{
            fontSize: 'clamp(2.8rem, 6vw, 5rem)',
            fontWeight: 800, lineHeight: 1.1, marginBottom: '28px',
            letterSpacing: '-0.03em',
          }}>
            Stop Wasting Food.{' '}
            <br />
            <span style={{
              background: 'linear-gradient(135deg, #f3e5ab 0%, #d4af37 45%, #c5a059 100%)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}>
              Start Cooking Smarter.
            </span>
          </h1>

          <p style={{
            fontSize: '1.2rem', color: 'var(--text-secondary)',
            lineHeight: 1.8, maxWidth: '560px', margin: '0 auto 56px',
            fontFamily: 'var(--font-primary)'
          }}>
            Epicure tracks your ingredients, alerts you before things expire, and suggests luxury recipes tailored to what's in your kitchen — all in real time.
          </p>

          {/* CTA Buttons */}
          <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button
              onClick={handleCtaClick}
              style={{
                padding: '16px 40px', fontSize: '1.05rem', fontWeight: 700,
                background: 'linear-gradient(135deg, #d4af37 0%, #c5a059 60%, #aa8c49 100%)',
                border: 'none', borderRadius: '14px', color: '#0a0a0a', cursor: 'pointer',
                boxShadow: '0 6px 30px rgba(212,175,55,0.2)',
                transition: 'all 0.25s ease',
              }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 12px 40px rgba(212,175,55,0.4)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 6px 30px rgba(212,175,55,0.2)'; }}
            >
              {currentUser ? '📊 Go to Dashboard →' : '🚀 Get Started Free'}
            </button>
            {!currentUser && (
              <button
                onClick={() => navigate('/login')}
                style={{
                  padding: '16px 40px', fontSize: '1.05rem', fontWeight: 600,
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.15)',
                  borderRadius: '14px', color: 'var(--text-primary)', cursor: 'pointer',
                  backdropFilter: 'blur(12px)', transition: 'all 0.25s ease',
                }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.25)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)'; }}
              >
                Log In
              </button>
            )}
          </div>
        </div>



        {/* ── Feature Cards ─────────────────────────── */}
        <div style={{ marginBottom: '32px', textAlign: 'center' }}>
          <h2 style={{
            fontSize: '2rem', fontWeight: 700, marginBottom: '12px',
            background: 'linear-gradient(135deg, #f3efe6, #a8a29e)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
          }}>Everything Your Kitchen Needs</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '1rem' }}>Built for smart home cooks who appreciate luxury and efficiency.</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(270px, 1fr))', gap: '20px' }}>
          {FEATURES.map(({ icon, title, desc, gradient, border, glow }) => (
            <div
              key={title}
              style={{
                padding: '32px 28px', borderRadius: '20px',
                background: gradient, border: `1px solid ${border}`,
                backdropFilter: 'blur(20px)', transition: 'all 0.3s ease',
                cursor: 'default',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.transform = 'translateY(-6px)';
                e.currentTarget.style.boxShadow = `0 20px 50px ${glow}`;
              }}
              onMouseLeave={e => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <div style={{
                fontSize: '2.8rem', marginBottom: '20px',
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                width: '64px', height: '64px',
                background: 'rgba(255,255,255,0.06)', borderRadius: '16px',
              }}>{icon}</div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '12px', color: 'var(--text-primary)' }}>{title}</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: 1.7 }}>{desc}</p>
            </div>
          ))}
        </div>

        {/* ── Bottom CTA ────────────────────────────── */}
        {!currentUser && (
          <div style={{
            marginTop: '80px', textAlign: 'center', padding: '60px 40px',
            background: 'linear-gradient(135deg, rgba(129,140,248,0.1) 0%, rgba(192,132,252,0.1) 100%)',
            border: '1px solid rgba(129,140,248,0.2)', borderRadius: '24px',
            backdropFilter: 'blur(20px)',
          }}>
            <h2 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '16px' }}>
              Ready to reduce food waste?
            </h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '36px', fontSize: '1.05rem' }}>
              Join and start managing your kitchen intelligently.
            </p>
            <button
              onClick={() => navigate('/signup')}
              style={{
                padding: '16px 48px', fontSize: '1.1rem', fontWeight: 700,
                background: 'linear-gradient(135deg, #818cf8 0%, #c084fc 60%, #38bdf8 100%)',
                border: 'none', borderRadius: '14px', color: 'white', cursor: 'pointer',
                boxShadow: '0 8px 30px rgba(129,140,248,0.4)', transition: 'all 0.25s ease',
              }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 14px 40px rgba(129,140,248,0.55)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 8px 30px rgba(129,140,248,0.4)'; }}
            >
              🍳 Create Your Free Account
            </button>
          </div>
        )}
      </div>
    </>
  );
}


