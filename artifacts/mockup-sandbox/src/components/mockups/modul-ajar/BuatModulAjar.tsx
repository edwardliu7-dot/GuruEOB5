import React, { useState } from 'react';
import { 
  ChevronRight, 
  Sparkles, 
  Download, 
  BookOpen, 
  ChevronDown,
  ChevronUp,
  Clock,
  FileText,
  History,
  List,
  Target,
  BookMarked
} from 'lucide-react';

export function BuatModulAjar() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [hasGenerated, setHasGenerated] = useState(true);
  const [expandedSection, setExpandedSection] = useState<string | null>('tujuan');

  const historyItems = [
    {
      id: 1,
      title: 'Persamaan Linear Satu Variabel',
      subject: 'Matematika',
      phase: 'Fase D',
      date: 'Hari ini, 09:30'
    },
    {
      id: 2,
      title: 'Teks Prosedur Kompleks',
      subject: 'B. Indonesia',
      phase: 'Fase E',
      date: 'Kemarin, 14:15'
    },
    {
      id: 3,
      title: 'Sel dan Organel',
      subject: 'Biologi',
      phase: 'Fase F',
      date: '12 Okt 2023'
    },
    {
      id: 4,
      title: 'Zaman Praaksara',
      subject: 'Sejarah',
      phase: 'Fase E',
      date: '10 Okt 2023'
    },
    {
      id: 5,
      title: 'Gaya dan Gerak',
      subject: 'Fisika',
      phase: 'Fase F',
      date: '08 Okt 2023'
    }
  ];

  const handleGenerate = (e: React.FormEvent) => {
    e.preventDefault();
    setIsGenerating(true);
    setTimeout(() => {
      setIsGenerating(false);
      setHasGenerated(true);
    }, 1500);
  };

  const toggleSection = (section: string) => {
    setExpandedSection(prev => prev === section ? null : section);
  };

  return (
    <div className="min-h-screen bg-[#f5f5f4] p-6 font-sans text-slate-800">
      {/* Top Section */}
      <div className="mb-6">
        <div className="flex items-center gap-2 text-xs text-slate-400 mb-2">
          <span>Akademik</span>
          <ChevronRight className="w-3 h-3" />
          <span>Modul Ajar</span>
          <ChevronRight className="w-3 h-3" />
          <span className="text-slate-600 font-medium">Buat Modul Ajar</span>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-slate-800">Buat Modul Ajar AI</h1>
            <p className="text-sm text-slate-500">Generate modul ajar Kurikulum Merdeka secara otomatis.</p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex gap-5 items-start">
        {/* Left Panel (Form + Preview) */}
        <div className="flex-1 flex flex-col gap-5">
          {/* Form Card */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
            <h2 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-500" />
              Parameter Modul
            </h2>
            <form onSubmit={handleGenerate} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Mata Pelajaran</label>
                  <select className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-800/20 focus:border-slate-800">
                    <option>Matematika</option>
                    <option>Bahasa Indonesia</option>
                    <option>Ilmu Pengetahuan Alam</option>
                    <option>Ilmu Pengetahuan Sosial</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Fase / Kelas</label>
                  <select className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-800/20 focus:border-slate-800">
                    <option>Fase D (Kelas 7-9)</option>
                    <option>Fase E (Kelas 10)</option>
                    <option>Fase F (Kelas 11-12)</option>
                  </select>
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-2 space-y-1.5">
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Topik / Materi</label>
                  <input 
                    type="text" 
                    defaultValue="Persamaan Linear Satu Variabel"
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-800/20 focus:border-slate-800"
                    placeholder="Contoh: Sistem Pencernaan Manusia"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Alokasi Waktu</label>
                  <div className="relative">
                    <input 
                      type="number" 
                      defaultValue={2}
                      className="w-full rounded-lg border border-slate-200 bg-white pl-3 pr-10 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-800/20 focus:border-slate-800"
                    />
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-slate-400 text-sm font-medium">
                      JP
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Capaian Pembelajaran (Opsional)</label>
                <textarea 
                  rows={3}
                  defaultValue="Peserta didik dapat menyelesaikan persamaan dan pertidaksamaan linear satu variabel dan sistem persamaan linear dua variabel dengan beberapa cara..."
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-800/20 focus:border-slate-800 resize-none"
                  placeholder="Tempelkan teks capaian pembelajaran (CP) jika ada..."
                />
              </div>

              <button 
                type="submit"
                disabled={isGenerating}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-slate-800 to-slate-700 text-white px-4 py-3 text-sm font-bold shadow-sm hover:from-slate-700 hover:to-slate-600 transition-all disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isGenerating ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                    <span>Memproses dengan AI...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Generate Modul Ajar</span>
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Generated Preview */}
          {hasGenerated && (
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
              <div className="p-5 border-b border-slate-100 bg-slate-50/50">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="rounded-full bg-blue-100 text-blue-700 px-2.5 py-0.5 text-xs font-medium">Matematika</span>
                      <span className="rounded-full bg-slate-100 text-slate-600 px-2.5 py-0.5 text-xs font-medium">Fase D</span>
                      <span className="rounded-full bg-slate-100 text-slate-600 px-2.5 py-0.5 text-xs font-medium">2 JP</span>
                    </div>
                    <h3 className="text-lg font-bold text-slate-800">Modul Ajar: Persamaan Linear Satu Variabel</h3>
                  </div>
                </div>
              </div>
              
              <div className="p-5 flex-1 space-y-3">
                {/* Collapsible Sections */}
                {[
                  { id: 'tujuan', title: 'Tujuan Pembelajaran', icon: Target, content: (
                    <ul className="list-disc pl-5 space-y-1.5 text-sm text-slate-600">
                      <li>Peserta didik mampu memahami konsep persamaan linear satu variabel.</li>
                      <li>Peserta didik dapat memodelkan masalah sehari-hari ke dalam bentuk PLSV.</li>
                      <li>Peserta didik mampu menyelesaikan persamaan linear satu variabel dengan operasi bentuk aljabar.</li>
                    </ul>
                  )},
                  { id: 'materi', title: 'Materi Inti', icon: BookMarked, content: (
                    <div className="text-sm text-slate-600 space-y-2">
                      <p><strong>Persamaan Linear Satu Variabel (PLSV)</strong> adalah kalimat terbuka yang dihubungkan tanda sama dengan (=) dan hanya mempunyai satu variabel berpangkat satu.</p>
                      <p>Bentuk umum: ax + b = c, dengan a ≠ 0</p>
                    </div>
                  )},
                  { id: 'langkah', title: 'Langkah Pembelajaran', icon: List, content: (
                    <div className="space-y-3">
                      <div>
                        <h4 className="text-xs font-bold text-slate-700 mb-1">Pendahuluan (15 Menit)</h4>
                        <p className="text-sm text-slate-600">Apersepsi: Mengingat kembali materi bentuk aljabar. Guru memberikan masalah pemantik terkait timbangan yang seimbang.</p>
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-slate-700 mb-1">Kegiatan Inti (50 Menit)</h4>
                        <p className="text-sm text-slate-600">Siswa dibagi dalam kelompok (4-5 orang). Diberikan LKPD untuk menemukan konsep penyelesaian PLSV menggunakan model timbangan.</p>
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-slate-700 mb-1">Penutup (15 Menit)</h4>
                        <p className="text-sm text-slate-600">Siswa menyimpulkan pelajaran. Guru memberikan evaluasi singkat dan tugas mandiri.</p>
                      </div>
                    </div>
                  )},
                  { id: 'penilaian', title: 'Penilaian (Asesmen)', icon: FileText, content: (
                    <ul className="list-disc pl-5 space-y-1.5 text-sm text-slate-600">
                      <li><strong>Sikap:</strong> Observasi selama diskusi kelompok (Profil Pelajar Pancasila: Gotong Royong, Bernalar Kritis).</li>
                      <li><strong>Pengetahuan:</strong> Tes tertulis (Uraian singkat 3 soal PLSV).</li>
                      <li><strong>Keterampilan:</strong> Rubrik penilaian presentasi hasil LKPD.</li>
                    </ul>
                  )}
                ].map((section) => (
                  <div key={section.id} className="border border-slate-200 rounded-lg overflow-hidden">
                    <button 
                      onClick={() => toggleSection(section.id)}
                      className="w-full flex items-center justify-between p-3.5 bg-white hover:bg-slate-50 transition-colors"
                    >
                      <div className="flex items-center gap-2.5 text-sm font-semibold text-slate-700">
                        <section.icon className="w-4 h-4 text-slate-400" />
                        {section.title}
                      </div>
                      {expandedSection === section.id ? (
                        <ChevronUp className="w-4 h-4 text-slate-400" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-slate-400" />
                      )}
                    </button>
                    {expandedSection === section.id && (
                      <div className="p-4 border-t border-slate-100 bg-slate-50/30">
                        {section.content}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <div className="p-5 border-t border-slate-100 bg-slate-50/50 mt-auto">
                <button className="w-full flex items-center justify-center gap-2 rounded-full bg-white border border-slate-300 text-slate-700 px-4 py-2.5 text-sm font-medium hover:bg-slate-50 transition-colors shadow-sm">
                  <Download className="w-4 h-4" />
                  <span>Download DOCX</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Right Sidebar */}
        <div className="w-72 bg-white rounded-xl border border-slate-200 shadow-sm p-4 flex flex-col h-[calc(100vh-8rem)] sticky top-6">
          <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-100">
            <History className="w-4 h-4 text-slate-500" />
            <h3 className="text-sm font-bold text-slate-800">Riwayat Modul</h3>
          </div>
          
          <div className="flex-1 overflow-y-auto -mx-2 px-2 space-y-1 custom-scrollbar">
            {historyItems.map((item) => (
              <div 
                key={item.id} 
                className="group flex flex-col gap-1.5 p-3 rounded-lg hover:bg-slate-50 cursor-pointer transition-colors border border-transparent hover:border-slate-100 relative"
              >
                <div className="flex items-start gap-2.5">
                  <div className="mt-0.5 bg-blue-50 p-1.5 rounded-md text-blue-600 shrink-0">
                    <BookOpen className="w-3.5 h-3.5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="text-sm font-semibold text-slate-700 truncate group-hover:text-slate-900">{item.title}</h4>
                    <div className="flex flex-wrap items-center gap-1.5 mt-1">
                      <span className="text-[10px] font-medium text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">{item.subject}</span>
                      <span className="text-[10px] font-medium text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">{item.phase}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between mt-1 pl-[2.2rem]">
                  <div className="flex items-center gap-1 text-[10px] text-slate-400">
                    <Clock className="w-3 h-3" />
                    <span>{item.date}</span>
                  </div>
                  <button className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-slate-600 transition-opacity p-1">
                    <Download className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
          
          <div className="pt-3 border-t border-slate-100 mt-2">
            <button className="w-full text-xs font-medium text-slate-500 hover:text-slate-700 py-1.5">
              Lihat Semua Riwayat
            </button>
          </div>
        </div>
      </div>
      
      <style dangerouslySetInnerHTML={{__html: `
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #e2e8f0;
          border-radius: 4px;
        }
        .custom-scrollbar:hover::-webkit-scrollbar-thumb {
          background: #cbd5e1;
        }
      `}} />
    </div>
  );
}
