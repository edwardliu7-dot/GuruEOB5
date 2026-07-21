import React from 'react';

export default function BuBijak() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 relative overflow-hidden">
      <style>
        {`
          @keyframes scale-pulse {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.05); }
          }
          .animate-scale-pulse {
            animation: scale-pulse 3s ease-in-out infinite;
          }
        `}
      </style>

      {/* Mascot Container */}
      <div className="relative flex flex-col items-center animate-scale-pulse">
        
        {/* Speech Bubble */}
        <div className="absolute -top-16 left-1/2 -translate-x-1/2 w-72 bg-white rounded-2xl shadow-xl p-4 border border-slate-200 z-10 text-center">
          <p className="text-slate-700 font-medium text-sm leading-relaxed">
            Semangat! Progem Semester perlu dicek ya 📅
          </p>
          {/* Bubble Tail */}
          <div className="absolute -bottom-2.5 left-1/2 -translate-x-1/2 w-5 h-5 bg-white border-b border-r border-slate-200 transform rotate-45 shadow-sm"></div>
        </div>

        {/* Mascot SVG */}
        <div className="w-48 h-[320px] mt-12 relative z-0">
          <svg viewBox="0 0 120 200" className="w-full h-full drop-shadow-md" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="skinGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#F3D1A5" />
                <stop offset="100%" stopColor="#D9A066" />
              </linearGradient>
              <linearGradient id="kebayaGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#A5B8A8" />
                <stop offset="100%" stopColor="#7B9382" />
              </linearGradient>
              <linearGradient id="hairGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#4E342E" />
                <stop offset="100%" stopColor="#212121" />
              </linearGradient>
            </defs>

            {/* Hair Bun (Sanggul) */}
            <circle cx="80" cy="45" r="16" fill="url(#hairGrad)" />
            {/* Hair Pin (Tusuk Konde) */}
            <path d="M 72 38 L 92 28 M 75 46 L 98 40" stroke="#FFD54F" strokeWidth="2" strokeLinecap="round" />

            {/* Neck */}
            <rect x="52" y="65" width="16" height="20" fill="url(#skinGrad)" />
            {/* Neck shadow */}
            <rect x="52" y="65" width="16" height="5" fill="#C28A4B" />

            {/* Head */}
            <ellipse cx="60" cy="48" rx="22" ry="26" fill="url(#skinGrad)" />
            
            {/* Hair Front */}
            <path d="M 38 48 C 38 15 82 15 82 48 C 82 25 65 20 60 20 C 55 20 38 25 38 48 Z" fill="url(#hairGrad)" />
            <path d="M 38 48 C 45 33 55 35 60 40 C 65 35 75 33 82 48" fill="url(#hairGrad)" />

            {/* Face details */}
            {/* Eyebrows (curved, warm) */}
            <path d="M 46 40 Q 51 37 54 40" fill="none" stroke="#4E342E" strokeWidth="1.5" strokeLinecap="round" />
            <path d="M 66 40 Q 69 37 74 40" fill="none" stroke="#4E342E" strokeWidth="1.5" strokeLinecap="round" />
            
            {/* Eyes (soft, smiling) */}
            <path d="M 46 48 Q 50 45 53 48" fill="none" stroke="#4E342E" strokeWidth="1.5" strokeLinecap="round" />
            <path d="M 67 48 Q 70 45 74 48" fill="none" stroke="#4E342E" strokeWidth="1.5" strokeLinecap="round" />

            {/* Nose */}
            <path d="M 59 52 C 59 55 61 56 62 55" fill="none" stroke="#C28A4B" strokeWidth="1.5" strokeLinecap="round" />

            {/* Mouth (smile) */}
            <path d="M 53 61 Q 60 67 67 61" fill="none" stroke="#A93226" strokeWidth="1.5" strokeLinecap="round" />
            <path d="M 55 61 Q 60 64 65 61" fill="#E6B0AA" />

            {/* Kebaya Top (Torso) */}
            <path d="M 42 78 Q 60 70 78 78 L 85 140 C 85 150 35 150 35 140 Z" fill="url(#kebayaGrad)" />
            {/* Kebaya Collar Fold */}
            <path d="M 42 78 L 60 110 L 78 78 L 60 115 Z" fill="#8DA399" opacity="0.6" />
            
            {/* Skirt/Lower body */}
            <path d="M 35 130 C 35 180 25 200 25 200 L 95 200 C 95 200 85 180 85 130 Z" fill="#5D4037" />
            {/* Batik Pattern Hint */}
            <path d="M 40 140 Q 50 150 60 140 T 80 140 M 35 160 Q 45 170 55 160 T 75 160 M 30 180 Q 40 190 50 180 T 70 180" fill="none" stroke="#8D6E63" strokeWidth="2" opacity="0.5" />

            {/* Folded Arms */}
            {/* Back arm (Right arm from viewer's perspective) */}
            <path d="M 82 85 C 95 100 80 120 70 120 L 50 120" fill="none" stroke="url(#kebayaGrad)" strokeWidth="12" strokeLinecap="round" />
            <ellipse cx="50" cy="120" rx="5" ry="4" fill="url(#skinGrad)" />
            
            {/* Front arm (Left arm) */}
            <path d="M 38 85 C 25 100 40 120 50 120 L 70 120" fill="none" stroke="#A5B8A8" strokeWidth="12" strokeLinecap="round" />
            <path d="M 38 85 C 25 100 40 120 50 120 L 70 120" fill="none" stroke="url(#kebayaGrad)" strokeWidth="12" strokeLinecap="round" opacity="0.8" />
            <ellipse cx="70" cy="120" rx="5" ry="4" fill="url(#skinGrad)" />

            {/* Brooch */}
            <circle cx="60" cy="92" r="5" fill="#FFD54F" />
            <circle cx="60" cy="92" r="2.5" fill="#FFA000" />
            <path d="M 57 92 L 55 95 M 63 92 L 65 95 M 60 89 L 60 86 M 60 95 L 60 98" stroke="#FFD54F" strokeWidth="1" />
          </svg>
        </div>
      </div>
    </div>
  );
}
