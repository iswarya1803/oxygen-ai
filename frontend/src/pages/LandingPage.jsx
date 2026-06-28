import { Link } from 'react-router-dom';
import { ArrowRight, Zap, Target, MessageSquare, CheckCircle } from 'lucide-react';

function LandingPage() {
  return (
    <div className="landing-page animate-fade-in">
      {/* Hero Section */}
      <section className="hero text-center mt-8 mb-8">
        <div className="badge mb-4 mx-auto inline-flex items-center gap-2" style={{ background: 'rgba(99,102,241,0.1)', padding: '6px 12px', borderRadius: '20px', border: '1px solid rgba(99,102,241,0.3)', color: '#818cf8', fontSize: '0.85rem', fontWeight: 600 }}>
          <SparklesIcon /> Oxygen AI Copilot 2.0
        </div>
        <h1 className="gradient-text" style={{ fontSize: '4rem', marginBottom: '1.5rem', letterSpacing: '-1px' }}>
          Launch Faster.<br />Scale Smarter.
        </h1>
        <p className="text-muted" style={{ fontSize: '1.25rem', maxWidth: '650px', margin: '0 auto 2.5rem' }}>
          The enterprise-grade AI marketing platform built exclusively for Oxygen Sports. Generate multi-channel product announcements in seconds.
        </p>
        <div className="flex justify-center gap-4">
          <Link to="/generate" className="btn btn-primary" style={{ fontSize: '1.1rem', padding: '14px 32px' }}>
            Open Workspace <ArrowRight size={20} />
          </Link>
          <Link to="/history" className="btn btn-secondary" style={{ fontSize: '1.1rem', padding: '14px 32px' }}>
            View History
          </Link>
        </div>
      </section>

      {/* Glassmorphism Preview */}
      <section className="preview-section mt-8 mb-8" style={{ perspective: '1000px' }}>
        <div className="card glass-panel mx-auto" style={{ maxWidth: '900px', transform: 'rotateX(5deg)', transformStyle: 'preserve-3d', borderTop: '1px solid rgba(255,255,255,0.2)' }}>
          <div className="flex items-center gap-2 mb-4 pb-4" style={{ borderBottom: '1px solid var(--border)' }}>
            <div className="w-3 h-3 rounded-full bg-danger"></div>
            <div className="w-3 h-3 rounded-full text-warning" style={{ background: '#fbbf24'}}></div>
            <div className="w-3 h-3 rounded-full bg-success"></div>
            <span className="text-muted ml-4 text-sm font-mono">oxygen-workspace / output</span>
          </div>
          <div className="grid grid-3">
            <div className="preview-card p-4 rounded bg-black bg-opacity-30 border border-white border-opacity-10">
              <h4 className="text-success mb-2 flex items-center gap-2"><MessageSquare size={16}/> WhatsApp</h4>
              <p className="text-muted text-sm">Hey Oxygen fam! 🏃‍♂️💨 Get ready to crush your personal best because the ALL-NEW Oxygen Pro Running Shoes have officially dropped! 🚀</p>
            </div>
            <div className="preview-card p-4 rounded bg-black bg-opacity-30 border border-white border-opacity-10">
              <h4 className="text-accent mb-2 flex items-center gap-2"><Target size={16}/> Instagram</h4>
              <p className="text-muted text-sm">Defy gravity. Break limits. The Oxygen Pro Running Shoes are here. ⚡👟 Tag your running buddy who needs an upgrade! 👇</p>
            </div>
            <div className="preview-card p-4 rounded bg-black bg-opacity-30 border border-white border-opacity-10">
              <h4 className="text-secondary mb-2 flex items-center gap-2"><Zap size={16}/> In-Store</h4>
              <p className="text-muted text-sm">Attention shoppers! The wait is over. Elevate your run with the brand new Oxygen Pro Running Shoes, now available in-store!</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="features mt-8 mb-8 pt-8">
        <h2 className="text-center mb-8">Enterprise Features</h2>
        <div className="grid grid-3">
          <div className="card glass-panel hover-glow">
            <div className="icon-wrapper mb-4 text-primary bg-primary bg-opacity-10 p-3 inline-block rounded-lg">
              <Zap size={28} />
            </div>
            <h3>Lightning Fast</h3>
            <p className="text-muted">Powered by cutting-edge AI, get your marketing copy instantly without waiting for a creative team.</p>
          </div>
          
          <div className="card glass-panel hover-glow">
            <div className="icon-wrapper mb-4 text-secondary bg-secondary bg-opacity-10 p-3 inline-block rounded-lg">
              <Target size={28} />
            </div>
            <h3>On-Brand Tone</h3>
            <p className="text-muted">Maintains the energetic and professional tone of Oxygen Sports across all platforms automatically.</p>
          </div>

          <div className="card glass-panel hover-glow">
            <div className="icon-wrapper mb-4 text-success bg-success bg-opacity-10 p-3 inline-block rounded-lg">
              <CheckCircle size={28} />
            </div>
            <h3>Multi-Channel</h3>
            <p className="text-muted">Generates perfectly formatted announcements for WhatsApp, Instagram, and In-Store displays instantly.</p>
          </div>
        </div>
      </section>
    </div>
  );
}

const SparklesIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 3l1.912 5.813a2 2 0 001.275 1.275L21 12l-5.813 1.912a2 2 0 00-1.275 1.275L12 21l-1.912-5.813a2 2 0 00-1.275-1.275L3 12l5.813-1.912a2 2 0 001.275-1.275L12 3z"></path>
  </svg>
)

export default LandingPage;
