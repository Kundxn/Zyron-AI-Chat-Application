import React, { useEffect, useState } from 'react';
import { Pause, Play } from 'lucide-react';

export const SolarSystemCard: React.FC = () => {
  const [isPlaying, setIsPlaying] = useState(true);
  const [speed, setSpeed] = useState(1);

  return (
    <div className="relative w-full max-w-[480px] h-[220px] rounded-2xl bg-gradient-to-b from-[#1b64da] to-[#0f4bb5] overflow-hidden shadow-2xl border border-blue-400/30 flex flex-col justify-between p-3 select-none">
      {/* Top Controls */}
      <div className="flex justify-end">
        <button
          onClick={() => setIsPlaying(!isPlaying)}
          className="p-1 rounded-md bg-white/20 hover:bg-white/30 text-white transition-colors"
          title={isPlaying ? 'Pause simulation' : 'Play simulation'}
        >
          {isPlaying ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
        </button>
      </div>

      {/* Orbiting System Graphic */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <svg viewBox="0 0 400 220" className="w-full h-full opacity-90">
          <defs>
            <radialGradient id="sunGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#fffae6" />
              <stop offset="60%" stopColor="#f59e0b" />
              <stop offset="100%" stopColor="#d97706" stopOpacity="0" />
            </radialGradient>
          </defs>

          {/* Elliptical Orbits */}
          <ellipse cx="200" cy="110" rx="60" ry="22" fill="none" stroke="#60a5fa" strokeWidth="1" strokeDasharray="3 3" opacity="0.6" />
          <ellipse cx="200" cy="110" rx="105" ry="38" fill="none" stroke="#60a5fa" strokeWidth="1" opacity="0.5" />
          <ellipse cx="200" cy="110" rx="150" ry="54" fill="none" stroke="#60a5fa" strokeWidth="1" strokeDasharray="4 4" opacity="0.4" />
          <ellipse cx="200" cy="110" rx="180" ry="68" fill="none" stroke="#60a5fa" strokeWidth="1" opacity="0.3" />

          {/* Sun */}
          <circle cx="200" cy="110" r="16" fill="url(#sunGlow)" />
          <circle cx="200" cy="110" r="9" fill="#fbbf24" />

          {/* Planets with CSS animations */}
          {/* Planet 1 - Mercury/Venus */}
          <g className={isPlaying ? 'animate-[spin_4s_linear_infinite]' : ''} style={{ transformOrigin: '200px 110px' }}>
            <circle cx="260" cy="110" r="3.5" fill="#e0f2fe" />
          </g>

          {/* Planet 2 - Earth */}
          <g className={isPlaying ? 'animate-[spin_7s_linear_infinite]' : ''} style={{ transformOrigin: '200px 110px' }}>
            <circle cx="95" cy="110" r="5" fill="#38bdf8" />
            <circle cx="95" cy="104" r="1.5" fill="#f8fafc" />
          </g>

          {/* Planet 3 - Mars */}
          <g className={isPlaying ? 'animate-[spin_11s_linear_infinite]' : ''} style={{ transformOrigin: '200px 110px' }}>
            <circle cx="350" cy="110" r="4" fill="#f87171" />
          </g>

          {/* Planet 4 - Jupiter */}
          <g className={isPlaying ? 'animate-[spin_18s_linear_infinite]' : ''} style={{ transformOrigin: '200px 110px' }}>
            <circle cx="20" cy="110" r="7" fill="#fde047" />
          </g>
        </svg>
      </div>

      {/* Bottom Timeline & Orbit Selection Controls matching screenshot */}
      <div className="relative z-10 space-y-1.5 pt-2">
        {/* Planet Number Badges */}
        <div className="flex items-center justify-center gap-3">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((num) => (
            <button
              key={num}
              className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-medium transition-all ${
                num === 3
                  ? 'bg-white text-blue-900 font-bold shadow-xs scale-110'
                  : 'bg-white/20 text-white/90 hover:bg-white/30'
              }`}
            >
              {num}
            </button>
          ))}
        </div>

        {/* Sliders row */}
        <div className="flex items-center justify-between text-white/80 text-[10px] px-2 font-mono">
          <div className="flex items-center gap-1.5">
            <span>Speed</span>
            <input
              type="range"
              min="0.5"
              max="2"
              step="0.5"
              value={speed}
              onChange={(e) => setSpeed(parseFloat(e.target.value))}
              className="w-16 h-1 accent-white bg-white/30 rounded-lg cursor-pointer"
            />
          </div>
          <span>1.2x</span>
        </div>
      </div>
    </div>
  );
};
