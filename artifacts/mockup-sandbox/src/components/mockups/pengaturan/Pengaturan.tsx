import React, { useState } from 'react';
import { 
  CheckCircle2, 
  Save, 
  Moon, 
  Sparkles, 
  Palette, 
  Type, 
  Settings2,
  ChevronRight,
  Home
} from 'lucide-react';

export function Pengaturan() {
  const [activeTheme, setActiveTheme] = useState('Default');
  const [activeFontSize, setActiveFontSize] = useState('Normal');
  const [animationsEnabled, setAnimationsEnabled] = useState(true);

  const themes = [
    { name: 'Default', color: 'bg-indigo-500', hex: '#6366f1' },
    { name: 'Biru Laut', color: 'bg-sky-500', hex: '#0ea5e9' },
    { name: 'Hijau Alam', color: 'bg-emerald-500', hex: '#10b981' },
    { name: 'Ungu Tenang', color: 'bg-purple-500', hex: '#a855f7' },
    { name: 'Jingga Hangat', color: 'bg-orange-500', hex: '#f97316' },
    { name: 'Merah Marun', color: 'bg-rose-600', hex: '#e11d48' },
  ];

  const fontSizes = [
    { name: 'Kecil', sizeClass: 'text-sm', preview: 'Aa' },
    { name: 'Normal', sizeClass: 'text-base', preview: 'Aa' },
    { name: 'Besar', sizeClass: 'text-lg', preview: 'Aa' },
  ];

  return (
    <div className="bg-[#f5f5f4] min-h-screen font-sans text-slate-800 p-6">
      {/* Top Section */}
      <div className="mb-8">
        <div className="flex items-center text-xs text-slate-400 mb-2">
          <Home className="w-3 h-3 mr-1" />
          <span>Beranda</span>
          <ChevronRight className="w-3 h-3 mx-1" />
          <span className="text-slate-600 font-medium">Pengaturan</span>
        </div>
        
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
              <Settings2 className="w-6 h-6 text-indigo-600" />
              Pengaturan
            </h1>
            <p className="text-sm text-slate-500 mt-1">Personalisasi tampilan dan preferensi aplikasi</p>
          </div>
          <div className="flex items-center gap-3">
            <button className="rounded-full bg-slate-800 text-white px-5 py-2 text-sm font-medium flex items-center gap-2 hover:bg-slate-700 transition-colors shadow-sm">
              <Save className="w-4 h-4" />
              Simpan Perubahan
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto space-y-8 pb-12">
        {/* Tema Warna Section */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <Palette className="w-4 h-4 text-slate-400" />
            <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Tema Warna</h2>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {themes.map((theme) => {
              const isActive = activeTheme === theme.name;
              return (
                <div 
                  key={theme.name}
                  onClick={() => setActiveTheme(theme.name)}
                  className={`bg-white rounded-xl border p-3 cursor-pointer transition-all duration-200 relative overflow-hidden group
                    ${isActive ? 'border-slate-800 shadow-md ring-1 ring-slate-800' : 'border-slate-200 shadow-sm hover:border-slate-300'}
                  `}
                >
                  <div className={`w-full h-20 rounded-lg ${theme.color} mb-3 shadow-inner relative overflow-hidden flex items-center justify-center`}>
                    {/* Decorative pattern inside the swatch */}
                    <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white to-transparent"></div>
                    {isActive && (
                      <div className="bg-white/20 backdrop-blur-sm rounded-full p-1.5 shadow-sm">
                        <CheckCircle2 className="w-6 h-6 text-white" />
                      </div>
                    )}
                  </div>
                  <div className="flex items-center justify-between px-1">
                    <span className={`text-sm font-medium ${isActive ? 'text-slate-800' : 'text-slate-600'}`}>
                      {theme.name}
                    </span>
                    <div 
                      className={`w-3 h-3 rounded-full ${isActive ? theme.color : 'bg-transparent'}`} 
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Ukuran Font Section */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <Type className="w-4 h-4 text-slate-400" />
            <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Ukuran Font</h2>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {fontSizes.map((font) => {
              const isActive = activeFontSize === font.name;
              return (
                <div 
                  key={font.name}
                  onClick={() => setActiveFontSize(font.name)}
                  className={`bg-white rounded-xl border p-4 cursor-pointer transition-all duration-200 flex items-center justify-between
                    ${isActive ? 'border-slate-800 shadow-md ring-1 ring-slate-800' : 'border-slate-200 shadow-sm hover:border-slate-300'}
                  `}
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center bg-slate-50 border border-slate-100 ${font.sizeClass} font-medium text-slate-700`}>
                      {font.preview}
                    </div>
                    <div>
                      <div className="text-sm font-medium text-slate-800">{font.name}</div>
                      <div className="text-xs text-slate-500">Pratinjau teks</div>
                    </div>
                  </div>
                  
                  {/* Radio button indicator */}
                  <div className={`w-5 h-5 rounded-full border flex items-center justify-center
                    ${isActive ? 'border-slate-800 bg-slate-800' : 'border-slate-300'}
                  `}>
                    {isActive && <div className="w-2 h-2 rounded-full bg-white" />}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Preferensi Lainnya Section */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <Settings2 className="w-4 h-4 text-slate-400" />
            <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Preferensi Lainnya</h2>
          </div>
          
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm divide-y divide-slate-100">
            {/* Animasi Transisi */}
            <div className="p-4 flex items-center justify-between cursor-pointer hover:bg-slate-50 transition-colors" onClick={() => setAnimationsEnabled(!animationsEnabled)}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-sm font-medium text-slate-800">Animasi Transisi</div>
                  <div className="text-xs text-slate-500 mt-0.5">Aktifkan efek animasi pada antarmuka</div>
                </div>
              </div>
              
              {/* Toggle switch */}
              <div className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${animationsEnabled ? 'bg-indigo-500' : 'bg-slate-200'}`}>
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${animationsEnabled ? 'translate-x-6' : 'translate-x-1'}`} />
              </div>
            </div>

            {/* Mode Gelap */}
            <div className="p-4 flex items-center justify-between opacity-60">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center">
                  <Moon className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <div className="text-sm font-medium text-slate-800">Mode Gelap</div>
                    <span className="rounded-full bg-slate-100 text-slate-500 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider">Segera Hadir</span>
                  </div>
                  <div className="text-xs text-slate-500 mt-0.5">Ganti ke tampilan latar belakang gelap</div>
                </div>
              </div>
              
              {/* Toggle switch (disabled) */}
              <div className="relative inline-flex h-6 w-11 items-center rounded-full bg-slate-200 cursor-not-allowed">
                <span className="inline-block h-4 w-4 transform rounded-full bg-white translate-x-1" />
              </div>
            </div>
          </div>
        </section>

        {/* Bottom Actions */}
        <div className="pt-4 border-t border-slate-200 flex justify-end">
          <button className="rounded-full bg-slate-800 text-white px-8 py-2.5 text-sm font-medium flex items-center gap-2 hover:bg-slate-700 transition-colors shadow-sm w-full md:w-auto justify-center">
            <Save className="w-4 h-4" />
            Simpan Pengaturan
          </button>
        </div>
      </div>
    </div>
  );
}
