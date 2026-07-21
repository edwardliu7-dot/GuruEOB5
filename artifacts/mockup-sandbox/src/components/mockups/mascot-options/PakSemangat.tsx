import React from 'react';

export default function PakSemangat() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 p-8 overflow-hidden">
      <style>
        {`
          @keyframes bounce-elastic {
            0%, 100% { transform: translateY(0); }
            40% { transform: translateY(-20px); }
            60% { transform: translateY(-5px); }
            80% { transform: translateY(-10px); }
          }
          .animate-bounce-elastic {
            animation: bounce-elastic 2.5s infinite cubic-bezier(0.28, 0.84, 0.42, 1);
          }
          .mascot-outline { stroke: #1e293b; stroke-width: 5; stroke-linecap: round; stroke-linejoin: round; }
        `}
      </style>
      
      <div className="relative flex flex-col items-center animate-bounce-elastic">
        {/* Speech Bubble */}
        <div className="bg-white border-4 border-slate-800 rounded-3xl py-3 px-6 mb-2 shadow-[6px_6px_0_0_#1e293b] relative max-w-[280px] text-center z-10 transform -rotate-2">
          <p className="font-bold text-slate-800 text-[1.1rem] leading-snug">
            Hei! Jangan lupa absensi siswa hari ini! ✊
          </p>
          {/* Bubble Tail */}
          <div className="absolute -bottom-5 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[14px] border-l-transparent border-t-[20px] border-t-slate-800 border-r-[14px] border-r-transparent">
            <div className="absolute -top-[23px] -left-[9px] w-0 h-0 border-l-[9px] border-l-transparent border-t-[14px] border-t-white border-r-[9px] border-r-transparent" />
          </div>
        </div>

        {/* Mascot SVG */}
        <div className="w-[220px] h-[330px]">
          <svg
            viewBox="0 0 200 300"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="w-full h-full drop-shadow-xl overflow-visible"
          >
            {/* Outline / Base Definitions */}
            <defs>
              <linearGradient id="hoodieGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#ff9900" />
                <stop offset="100%" stopColor="#e66a00" />
              </linearGradient>
            </defs>

            {/* Back Arm (Left) */}
            <g className="mascot-outline fill-[#e66a00]">
              <path d="M45,170 Q20,200 35,240 Q50,240 65,210 Z" />
            </g>
            {/* Back Hand */}
            <g className="mascot-outline fill-[#fcd9ba]">
              <circle cx="38" cy="245" r="16" />
              <path d="M25,245 Q38,255 48,245" fill="none" strokeWidth="4" />
            </g>

            {/* Body */}
            {/* White T-shirt peaking out at bottom */}
            <path className="mascot-outline fill-white" d="M75,150 Q100,170 125,150 L120,260 Q100,275 80,260 Z" />
            
            {/* Orange Hoodie Main Body */}
            <path className="mascot-outline" fill="url(#hoodieGrad)" d="M60,140 Q100,220 140,140 L150,250 Q100,270 50,250 Z" />
            
            {/* Hoodie Pouch/Details */}
            <path className="mascot-outline" d="M60,140 Q80,190 85,255 M140,140 Q120,190 115,255" fill="none" strokeWidth="4" />
            <path className="mascot-outline" d="M75,220 Q100,210 125,220" fill="none" strokeWidth="4" />
            
            {/* Hoodie Strings */}
            <path className="mascot-outline fill-white" d="M85,155 Q80,175 88,195" fill="none" strokeWidth="4.5" />
            <path className="mascot-outline fill-white" d="M115,155 Q120,175 112,195" fill="none" strokeWidth="4.5" />
            <circle cx="88" cy="195" r="4" fill="#1e293b" />
            <circle cx="112" cy="195" r="4" fill="#1e293b" />

            {/* Raised Front Arm (Right) */}
            <g className="mascot-outline" fill="url(#hoodieGrad)">
              {/* dynamic sleeve angled up */}
              <path d="M135,150 Q170,120 165,70 L135,80 Q140,130 125,155 Z" />
            </g>
            {/* Sleeve Cuff */}
            <path className="mascot-outline fill-[#cc5e00]" d="M135,80 Q150,75 165,70 L162,60 Q145,65 132,70 Z" />
            
            {/* Raised Fist (Right Hand) */}
            <g className="mascot-outline fill-[#fcd9ba]">
              <circle cx="160" cy="55" r="20" />
              {/* Fingers clenched */}
              <path d="M145,45 Q160,40 175,45" fill="none" strokeWidth="4" />
              <path d="M142,55 Q160,50 177,55" fill="none" strokeWidth="4" />
              <path d="M145,65 Q160,60 175,65" fill="none" strokeWidth="4" />
              <path d="M152,38 Q140,55 152,72" fill="none" strokeWidth="5" /> {/* Thumb crossing */}
            </g>

            {/* Neck */}
            <path className="mascot-outline fill-[#e5c0a1]" d="M85,140 L85,155 L115,155 L115,140 Z" />

            {/* Head Shape */}
            <g className="mascot-outline fill-[#fcd9ba]">
              <path d="M60,95 C45,55 155,55 140,95 C145,135 115,150 100,150 C85,150 55,135 60,95 Z" />
            </g>

            {/* Ears */}
            <g className="mascot-outline fill-[#fcd9ba]">
              <path d="M57,95 C40,90 40,115 52,115 C54,115 56,113 58,110" />
              <path d="M143,95 C160,90 160,115 148,115 C146,115 144,113 142,110" />
            </g>
            <path className="mascot-outline" d="M50,105 Q55,105 52,110" fill="none" strokeWidth="3" />
            <path className="mascot-outline" d="M150,105 Q145,105 148,110" fill="none" strokeWidth="3" />

            {/* Messy Spikey Hair */}
            <g className="mascot-outline fill-[#3a2214]">
              {/* Main hair block */}
              <path d="M53,88 Q35,55 68,45 Q65,15 90,30 Q105,5 120,25 Q145,10 138,40 Q165,55 147,88 Q135,65 100,60 Q65,65 53,88 Z" />
              {/* Extra dramatic spikes */}
              <path d="M85,32 L88,5 L102,28 Z" />
              <path d="M65,48 L48,22 L75,40 Z" />
              <path d="M115,28 L138,5 L128,38 Z" />
              <path d="M135,42 L165,30 L145,55 Z" />
              
              {/* Sideburns */}
              <path d="M53,88 L52,105 L60,92 Z" />
              <path d="M147,88 L148,105 L140,92 Z" />
            </g>

            {/* Face Details */}
            {/* Big Eyes (Excited wide open) */}
            <g className="mascot-outline fill-white">
              <ellipse cx="78" cy="88" rx="14" ry="16" />
              <ellipse cx="122" cy="88" rx="14" ry="16" />
            </g>
            {/* Irises */}
            <g fill="#1e293b">
              <circle cx="82" cy="88" r="7" />
              <circle cx="118" cy="88" r="7" />
            </g>
            {/* Highlights */}
            <g fill="#ffffff">
              <circle cx="84" cy="85" r="2.5" />
              <circle cx="116" cy="85" r="2.5" />
            </g>

            {/* High arched Eyebrows */}
            <path className="mascot-outline" d="M62,68 Q75,55 88,65" fill="none" strokeWidth="5.5" strokeLinecap="round" />
            <path className="mascot-outline" d="M112,65 Q125,55 138,68" fill="none" strokeWidth="5.5" strokeLinecap="round" />

            {/* Nose */}
            <path className="mascot-outline" d="M96,98 Q100,108 106,102" fill="none" strokeWidth="4.5" strokeLinecap="round" />

            {/* Big Open Mouth Smile */}
            <g className="mascot-outline fill-[#7f1d1d]">
              <path d="M70,112 Q100,155 130,112 Q100,120 70,112 Z" />
            </g>
            {/* Teeth */}
            <path className="mascot-outline fill-white" d="M72,114 Q100,128 128,114 Q100,122 72,114 Z" />
            {/* Tongue */}
            <path className="mascot-outline fill-[#fca5a5]" d="M85,128 Q100,145 115,128 Q100,132 85,128 Z" />

            {/* Action Lines (Expressing energy around fist) */}
            <path className="mascot-outline" d="M150,20 L160,10" fill="none" strokeWidth="4" />
            <path className="mascot-outline" d="M175,25 L190,15" fill="none" strokeWidth="4" />
            <path className="mascot-outline" d="M185,55 L200,55" fill="none" strokeWidth="4" />

          </svg>
        </div>
      </div>
    </div>
  );
}
