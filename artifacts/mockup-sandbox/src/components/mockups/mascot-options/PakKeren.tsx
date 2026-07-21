import React from 'react';

export default function PakKeren() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 font-sans p-4 overflow-hidden">
      <style>{`
        @keyframes sway {
          0%, 100% { transform: rotate(-2deg) translateY(0px); }
          50% { transform: rotate(2deg) translateY(-4px); }
        }
        @keyframes floatBubble {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-6px); }
        }
        .animate-sway {
          animation: sway 4s ease-in-out infinite;
          transform-origin: bottom center;
        }
        .animate-bubble {
          animation: floatBubble 3s ease-in-out infinite;
        }
      `}</style>
      
      <div className="relative flex flex-col items-center">
        {/* Speech Bubble */}
        <div className="animate-bubble relative bg-white border-[3px] border-slate-800 text-slate-800 text-sm md:text-base font-bold rounded-2xl p-4 shadow-xl mb-6 max-w-[260px] text-center z-10">
          "Administrasi belum lengkap nih, cek sekarang!"
          
          {/* Pointer */}
          <div className="absolute -bottom-3 left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-[12px] border-l-transparent border-r-[12px] border-r-transparent border-t-[14px] border-t-slate-800">
            <div className="absolute -top-[16px] -left-[8px] w-0 h-0 border-l-[8px] border-l-transparent border-r-[8px] border-r-transparent border-t-[11px] border-t-white" />
          </div>
        </div>

        {/* Character SVG */}
        <div className="animate-sway drop-shadow-2xl">
          <svg viewBox="0 0 160 220" width="180" height="250" className="max-w-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="skin" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#fde2d0" />
                <stop offset="100%" stopColor="#efc1a6" />
              </linearGradient>
            </defs>
            
            {/* Torso */}
            <g id="torso" transform="translate(80, 150)">
              {/* Body shape */}
              <path d="M-35,70 C-40,10 -25,-15 0,-15 C25,-15 40,10 35,70 Z" fill="#ffffff" stroke="#1e293b" strokeWidth="3" />
              
              {/* Collar */}
              <path d="M-20,-15 L0,2 L20,-15 L10,-20 L-10,-20 Z" fill="#f8fafc" stroke="#1e293b" strokeWidth="2.5" strokeLinejoin="round" />
              
              {/* Tie */}
              <path d="M-4,2 L4,2 L6,38 L0,48 L-6,38 Z" fill="#1e3a8a" stroke="#1e293b" strokeWidth="2.5" strokeLinejoin="round" />
              
              {/* Collar wings */}
              <path d="M0,2 L15,14" fill="none" stroke="#1e293b" strokeWidth="2.5" strokeLinecap="round" />
              <path d="M0,2 L-15,14" fill="none" stroke="#1e293b" strokeWidth="2.5" strokeLinecap="round" />
              
              {/* Buttons */}
              <circle cx="0" cy="55" r="1.5" fill="#1e293b" />
              <circle cx="0" cy="65" r="1.5" fill="#1e293b" />
            </g>

            {/* Left Arm (Behind book, character's right arm) */}
            <g id="left-arm" transform="translate(45, 145)">
              <path d="M0,0 Q-15,25 0,45" fill="none" stroke="#1e293b" strokeWidth="21" strokeLinecap="round" />
              <path d="M0,0 Q-15,25 0,45" fill="none" stroke="#ffffff" strokeWidth="15" strokeLinecap="round" />
              <line x1="-12" y1="42" x2="4" y2="48" stroke="#1e293b" strokeWidth="2.5" strokeLinecap="round" />
              <path d="M0,45 Q15,60 25,45" fill="none" stroke="#1e293b" strokeWidth="12" strokeLinecap="round" />
              <path d="M0,45 Q15,60 25,45" fill="none" stroke="url(#skin)" strokeWidth="8" strokeLinecap="round" />
            </g>

            {/* Book */}
            <g id="book" transform="translate(56, 164) rotate(-12)">
              <rect x="0" y="0" width="32" height="42" rx="3" fill="#1e3a8a" stroke="#1e293b" strokeWidth="2.5" />
              <rect x="3" y="3" width="26" height="36" rx="1.5" fill="#f1f5f9" />
              <line x1="7" y1="12" x2="25" y2="12" stroke="#cbd5e1" strokeWidth="2" strokeLinecap="round" />
              <line x1="7" y1="18" x2="20" y2="18" stroke="#cbd5e1" strokeWidth="2" strokeLinecap="round" />
              <line x1="7" y1="24" x2="25" y2="24" stroke="#cbd5e1" strokeWidth="2" strokeLinecap="round" />
              <line x1="7" y1="30" x2="16" y2="30" stroke="#cbd5e1" strokeWidth="2" strokeLinecap="round" />
            </g>

            {/* Right Arm (Character's left arm, holding front of book) */}
            <g id="right-arm" transform="translate(115, 145)">
              <path d="M0,0 Q15,25 -5,45" fill="none" stroke="#1e293b" strokeWidth="21" strokeLinecap="round" />
              <path d="M0,0 Q15,25 -5,45" fill="none" stroke="#ffffff" strokeWidth="15" strokeLinecap="round" />
              <line x1="-4" y1="48" x2="12" y2="42" stroke="#1e293b" strokeWidth="2.5" strokeLinecap="round" />
              <path d="M-5,45 Q-25,60 -30,45" fill="none" stroke="#1e293b" strokeWidth="12" strokeLinecap="round" />
              <path d="M-5,45 Q-25,60 -30,45" fill="none" stroke="url(#skin)" strokeWidth="8" strokeLinecap="round" />
              <circle cx="-30" cy="45" r="5.5" fill="url(#skin)" stroke="#1e293b" strokeWidth="2.5" />
            </g>

            {/* Left Hand on book */}
            <g id="left-hand">
              <circle cx="70" cy="190" r="5.5" fill="url(#skin)" stroke="#1e293b" strokeWidth="2.5" />
            </g>

            {/* Head & Neck */}
            <g id="head" transform="translate(80, 80)">
              {/* Neck */}
              <rect x="-8" y="20" width="16" height="35" fill="url(#skin)" stroke="#1e293b" strokeWidth="2.5" />
              
              {/* Back Hair (under ears) */}
              <path d="M-28,10 C-30,20 -20,25 -20,25 C20,25 30,20 28,10 Z" fill="#1e293b" />
              
              {/* Ears */}
              <path d="M-24,5 C-32,5 -32,18 -24,20" fill="url(#skin)" stroke="#1e293b" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M24,5 C32,5 32,18 24,20" fill="url(#skin)" stroke="#1e293b" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              
              {/* Face Shape */}
              <path d="M-25,5 C-25,35 25,35 25,5 C25,-15 -25,-15 -25,5 Z" fill="url(#skin)" stroke="#1e293b" strokeWidth="2.5" />
              
              {/* Main Hair Volume */}
              <path d="M-27,5 C-30,-20 -5,-35 15,-30 C30,-25 30,-10 27,5 Q20,-10 10,-10 Q0,-10 -27,5 Z" fill="#1e293b" stroke="#0f172a" strokeWidth="1.5" strokeLinejoin="round" />
              
              {/* Hair Part Lines */}
              <path d="M10,-10 C15,-20 15,-25 15,-25" fill="none" stroke="#0f172a" strokeWidth="2" strokeLinecap="round" />
              <path d="M0,-5 C5,-15 5,-20 5,-20" fill="none" stroke="#0f172a" strokeWidth="2" strokeLinecap="round" />
              <path d="M-10,-2 C-5,-10 -5,-15 -5,-15" fill="none" stroke="#0f172a" strokeWidth="2" strokeLinecap="round" />
              
              {/* Glasses */}
              <rect x="-21" y="0" width="18" height="13" rx="2" fill="rgba(255,255,255,0.4)" stroke="#0f172a" strokeWidth="2.5" />
              <rect x="3" y="0" width="18" height="13" rx="2" fill="rgba(255,255,255,0.4)" stroke="#0f172a" strokeWidth="2.5" />
              <line x1="-3" y1="6" x2="3" y2="6" stroke="#0f172a" strokeWidth="2.5" />
              {/* Temple arms wrapping back to ears */}
              <line x1="-21" y1="4" x2="-26" y2="2" stroke="#0f172a" strokeWidth="2.5" strokeLinecap="round" />
              <line x1="21" y1="4" x2="26" y2="2" stroke="#0f172a" strokeWidth="2.5" strokeLinecap="round" />
              
              {/* Eyes */}
              <circle cx="-12" cy="6" r="2.5" fill="#0f172a" />
              <circle cx="12" cy="6" r="2.5" fill="#0f172a" />
              
              {/* Eyebrows */}
              <path d="M-19,-5 Q-12,-8 -5,-5" fill="none" stroke="#1e293b" strokeWidth="2.5" strokeLinecap="round" />
              <path d="M19,-5 Q12,-8 5,-5" fill="none" stroke="#1e293b" strokeWidth="2.5" strokeLinecap="round" />
              
              {/* Nose */}
              <path d="M-2,14 Q0,17 2,14" fill="none" stroke="#b48c78" strokeWidth="2.5" strokeLinecap="round" />
              
              {/* Mouth (Confident slight smile) */}
              <path d="M-6,23 Q0,27 6,22" fill="none" stroke="#1e293b" strokeWidth="2.5" strokeLinecap="round" />
              <circle cx="-6" cy="22.5" r="1.5" fill="#1e293b" />
            </g>
          </svg>
        </div>
      </div>
    </div>
  );
}
