import React from 'react';

export default function IbuCeria() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 overflow-hidden font-sans">
      <style>{`
        @keyframes mascot-float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-15px); }
        }
        @keyframes mascot-wave {
          0%, 100% { transform: rotate(0deg); }
          25% { transform: rotate(-15deg); }
          75% { transform: rotate(10deg); }
        }
        @keyframes shadow-pulse {
          0%, 100% { transform: scale(1); opacity: 0.6; }
          50% { transform: scale(0.85); opacity: 0.3; }
        }
        .animate-mascot-float {
          animation: mascot-float 3.5s ease-in-out infinite;
        }
        .animate-mascot-wave {
          transform-origin: 110px 125px;
          animation: mascot-wave 2s ease-in-out infinite;
        }
        .animate-shadow-pulse {
          animation: shadow-pulse 3.5s ease-in-out infinite;
        }
      `}</style>
      
      <div className="relative flex flex-col items-center pt-10">
        {/* Speech Bubble */}
        <div 
          className="z-20 mb-3 animate-mascot-float" 
          style={{ animationDelay: '0.2s' }}
        >
          <div className="bg-white px-6 py-4 rounded-3xl shadow-xl shadow-sky-100/50 border-2 border-sky-50 relative flex items-center gap-3 transition-transform hover:scale-105 cursor-default">
            <span className="text-2xl animate-bounce" style={{ animationDuration: '2s' }}>📖</span>
            <p className="text-base font-bold text-slate-700 whitespace-nowrap">
              Yuk isi jurnal mengajar hari ini!
            </p>
            {/* Bubble Tail */}
            <div className="absolute -bottom-2.5 left-1/2 -translate-x-1/2 w-5 h-5 bg-white transform rotate-45 border-b-2 border-r-2 border-sky-50 rounded-br-sm"></div>
          </div>
        </div>

        {/* Mascot Character */}
        <div 
          className="z-10 w-56 md:w-64 h-auto animate-mascot-float cursor-pointer hover:drop-shadow-2xl transition-all duration-300"
          style={{ filter: 'drop-shadow(0 20px 20px rgba(2, 132, 199, 0.15))' }}
        >
          <svg viewBox="0 0 160 200" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
            {/* Left Arm (Relaxed, behind body) */}
            <path d="M50 125 Q25 150 30 185" stroke="#7dd3fc" strokeWidth="14" strokeLinecap="round" fill="none" />
            <circle cx="30" cy="185" r="7" fill="#d2996c" />
            {/* Left Arm sleeve trim */}
            <path d="M24 175 L38 172" stroke="#ffffff" strokeWidth="3" strokeLinecap="round" />

            {/* Body/Uniform */}
            <path d="M50 125 C50 110, 110 110, 110 125 L125 200 L35 200 Z" fill="#bae6fd" />
            
            {/* Collar peeking out */}
            <path d="M55 125 Q80 150 105 125 L80 145 Z" fill="#ffffff" />
            <path d="M80 125 L80 145" stroke="#e0f2fe" strokeWidth="2" strokeLinecap="round" /> {/* Collar split */}

            {/* Name Tag */}
            <rect x="95" y="145" width="16" height="6" rx="2" fill="#f59e0b" />
            <rect x="95" y="151" width="16" height="8" rx="2" fill="#ffffff" />
            <line x1="98" y1="155" x2="108" y2="155" stroke="#cbd5e1" strokeWidth="1.5" strokeLinecap="round" />

            {/* Pocket with Pen */}
            <path d="M48 145 L63 145 L63 160 C63 165, 48 165, 48 160 Z" fill="#7dd3fc" />
            <rect x="51" y="138" width="2" height="7" rx="1" fill="#cbd5e1" />
            <rect x="56" y="135" width="3" height="10" rx="1.5" fill="#ef4444" />
            <path d="M48 145 L63 145" stroke="#bae6fd" strokeWidth="1.5" />

            {/* Hijab Base (Main volume) */}
            <path d="M45 80 C35 15, 125 15, 115 80 C110 125, 95 145, 80 145 C65 145, 50 125, 45 80 Z" fill="#fef3c7" />

            {/* Hijab Inner Cap */}
            <path d="M55 55 Q80 40 105 55 Q95 62 80 62 Q65 62 55 55 Z" fill="#fde68a" />

            {/* Face Base */}
            <circle cx="80" cy="80" r="28" fill="#d2996c" />

            {/* Hijab folds framing the face */}
            <path d="M52 95 Q60 125 80 145" stroke="#fde68a" strokeWidth="3" strokeLinecap="round" fill="none" />
            <path d="M108 95 Q100 125 80 145" stroke="#fde68a" strokeWidth="3" strokeLinecap="round" fill="none" />
            <path d="M80 125 Q80 135 80 145" stroke="#fde68a" strokeWidth="3" strokeLinecap="round" fill="none" />

            {/* Face Features */}
            {/* Eyebrows */}
            <path d="M62 65 Q67 63 72 65" stroke="#57534e" strokeWidth="2" strokeLinecap="round" fill="none" />
            <path d="M88 65 Q93 63 98 65" stroke="#57534e" strokeWidth="2" strokeLinecap="round" fill="none" />

            {/* Eyes (Happy closed arcs) */}
            <path d="M62 76 Q67 68 72 76" stroke="#44403c" strokeWidth="2.5" strokeLinecap="round" fill="none" />
            <path d="M88 76 Q93 68 98 76" stroke="#44403c" strokeWidth="2.5" strokeLinecap="round" fill="none" />

            {/* Cheeks */}
            <ellipse cx="60" cy="84" rx="5" ry="3" fill="#fca5a5" opacity="0.9" />
            <ellipse cx="100" cy="84" rx="5" ry="3" fill="#fca5a5" opacity="0.9" />

            {/* Glasses (Cute round) */}
            <circle cx="67" cy="77" r="10" stroke="#fbbf24" strokeWidth="2" fill="none" opacity="0.8" />
            <circle cx="93" cy="77" r="10" stroke="#fbbf24" strokeWidth="2" fill="none" opacity="0.8" />
            <path d="M77 77 L83 77" stroke="#fbbf24" strokeWidth="2" opacity="0.8" />

            {/* Mouth (Wide smile) */}
            <path d="M74 88 Q80 98 86 88 Z" fill="#ef4444" />
            <path d="M75 88 Q80 93 85 88 Z" fill="#ffffff" />
            <path d="M72 87 Q80 89 88 87" stroke="#44403c" strokeWidth="1.5" strokeLinecap="round" fill="none" />

            {/* Right Arm (Waving, in front) */}
            <g className="animate-mascot-wave">
              <path d="M110 125 Q140 115 135 85" stroke="#bae6fd" strokeWidth="14" strokeLinecap="round" fill="none" />
              <circle cx="135" cy="85" r="7" fill="#d2996c" />
              {/* Sleeve trim */}
              <path d="M129 93 L142 90" stroke="#ffffff" strokeWidth="3" strokeLinecap="round" />
            </g>
          </svg>
        </div>

        {/* Shadow under mascot */}
        <div className="w-40 h-4 bg-slate-300/60 rounded-[100%] mt-4 blur-[2px] animate-shadow-pulse"></div>
      </div>
    </div>
  );
}
