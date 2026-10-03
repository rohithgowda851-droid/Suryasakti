import React, { useState } from 'react';
import { ArrowRight, Sparkles } from 'lucide-react';
import { Landing3DScene } from './Landing3DScene';

interface LandingPageProps {
  onEnter: () => void;
}

// Crisp Sci-Fi Web Audio synthesizer chime for terminal access
const playAccessChime = () => {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gainNode = ctx.createGain();

    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
    osc1.frequency.exponentialRampToValueAtTime(1046.5, ctx.currentTime + 0.18); // C6

    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(659.25, ctx.currentTime); // E5
    osc2.frequency.exponentialRampToValueAtTime(1318.5, ctx.currentTime + 0.22); // E6

    gainNode.gain.setValueAtTime(0.12, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);

    osc1.connect(gainNode);
    osc2.connect(gainNode);
    gainNode.connect(ctx.destination);

    osc1.start();
    osc2.start();
    osc1.stop(ctx.currentTime + 0.35);
    osc2.stop(ctx.currentTime + 0.35);
  } catch {
    // Graceful fallback
  }
};

export const LandingPage: React.FC<LandingPageProps> = ({ onEnter }) => {
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [transitionMsg, setTransitionMsg] = useState('');

  const handleEnterClick = () => {
    playAccessChime();
    setIsTransitioning(true);
    setTransitionMsg('AUTHENTICATING SCADA ACCESS...');

    // Snappy, instantaneous access without synthetic delays
    setTimeout(() => {
      onEnter();
    }, 40);
  };

  return (
    <div className="relative w-screen h-screen min-h-screen overflow-hidden bg-slate-950 text-slate-100 flex flex-col items-center justify-center font-sans select-none">
      {/* 3D Renewable-Energy Environment Background */}
      <Landing3DScene onEnter={handleEnterClick} />

      {/* Atmospheric Vignette Gradients for Text Legibility & Obsidian Aesthetic */}
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_center,rgba(2,6,23,0.35)_0%,rgba(2,6,23,0.8)_75%,rgba(2,6,23,0.98)_100%)]" />
      <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-slate-950 via-transparent to-slate-950/80" />

      {/* Floating Ambient 3D Navigation Guide Tip */}
      <div className="absolute top-5 right-6 z-20 pointer-events-none hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900/60 border border-slate-700/60 text-[11px] font-mono text-slate-400 backdrop-blur-md">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
        <span>3D Geospatial Grid Active • Drag to Orbit</span>
      </div>

      {/* Centerpiece Content: Clean, High-Impact, Legible */}
      <div className="relative z-10 px-6 sm:px-10 max-w-4xl w-full text-center space-y-8 flex flex-col items-center pointer-events-auto">
        {/* Brand Tagline */}
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-900/80 border border-emerald-500/30 text-emerald-400 text-xs font-mono tracking-widest uppercase backdrop-blur-md shadow-lg shadow-emerald-950/40">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>SURYA SAKTI</span>
            <span className="text-slate-600">|</span>
            <span className="text-slate-300">1,650 MW NATIONAL ASSET BASE</span>
          </div>

          <p className="text-xs sm:text-sm font-mono tracking-[0.3em] uppercase text-slate-400 font-medium">
            SURYA SAKTI
          </p>
        </div>

        {/* Main Title: SURYA SAKTI RENEWABLE ENERGY COMMAND CENTER */}
        <div className="space-y-4">
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight uppercase leading-[1.08] drop-shadow-2xl">
            <span className="block text-white">
              SURYA SAKTI
            </span>
            <span className="block bg-gradient-to-r from-amber-400 via-emerald-300 to-teal-200 bg-clip-text text-transparent">
              RENEWABLE ENERGY
            </span>
            <span className="block text-slate-100 tracking-wider text-3xl sm:text-5xl lg:text-6xl mt-1">
              COMMAND CENTER
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-sm sm:text-base lg:text-lg font-mono tracking-wider uppercase text-emerald-400/90 font-medium max-w-xl mx-auto drop-shadow-md">
            Physics-Informed Renewable Fleet
            <span className="block text-slate-300 font-sans font-light tracking-normal text-sm sm:text-base mt-1">
              SCADA Control Center
            </span>
          </p>
        </div>

        {/* ENTER COMMAND CENTER Button */}
        <div className="pt-2 sm:pt-4 flex flex-col items-center gap-4">
          <button
            type="button"
            disabled={isTransitioning}
            onClick={handleEnterClick}
            className={`group relative px-9 sm:px-12 py-4 sm:py-5 rounded-2xl bg-slate-900/80 hover:bg-emerald-950/70 border border-emerald-400/50 hover:border-emerald-300/80 text-white font-bold text-sm sm:text-base tracking-widest uppercase backdrop-blur-md shadow-2xl shadow-emerald-500/25 hover:shadow-emerald-500/50 cursor-pointer transition-all duration-300 transform hover:scale-105 active:scale-95 flex items-center justify-center gap-3.5 ring-2 ring-emerald-500/20 hover:ring-emerald-400/40 ${
              isTransitioning ? 'animate-pulse opacity-90' : ''
            }`}
          >
            {/* Subtle luminous glow layer inside button */}
            <span className="absolute inset-0 rounded-2xl bg-gradient-to-r from-emerald-500/10 via-teal-500/20 to-cyan-500/10 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />

            <span className="tracking-[0.18em] font-extrabold text-white group-hover:text-emerald-300 transition-colors">
              {isTransitioning ? 'INITIALIZING...' : 'ENTER COMMAND CENTER'}
            </span>

            <ArrowRight className="w-5 h-5 text-emerald-400 group-hover:text-emerald-300 group-hover:translate-x-1.5 transition-all duration-300" />
          </button>

          {/* Terminal Authorization Feedback */}
          {isTransitioning ? (
            <div className="font-mono text-xs text-emerald-400 bg-slate-950/90 px-4 py-1.5 rounded-lg border border-emerald-500/50 animate-fadeIn backdrop-blur-md">
              &gt; {transitionMsg}
            </div>
          ) : (
            <p className="text-xs text-slate-500 font-mono tracking-wider">
              [ SECURE SCADA INGESTION PORTAL • 6 SITES READY ]
            </p>
          )}
        </div>
      </div>

      {/* Subtle bottom footer copyright */}
      <div className="absolute bottom-4 z-10 text-[11px] font-mono text-slate-500 tracking-wider">
        SURYASAKTI // NATIONAL RENEWABLE FLEET CONTROL &bull; OBSIDIAN SCADA ARCHITECTURE
      </div>
    </div>
  );
};
