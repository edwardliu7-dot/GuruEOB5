import React, { useState } from "react";
import { 
  ChevronRight, 
  Wand2, 
  Download, 
  ClipboardList, 
  Settings2,
  FileText,
  Clock,
  History,
  CheckCircle2,
  Sparkles
} from "lucide-react";

export function SoalOtomatis() {
  const [tipeSoal, setTipeSoal] = useState("Pilihan Ganda");
  const [kesulitan, setKesulitan] = useState("Sedang");
  const [isGenerating, setIsGenerating] = useState(false);
  const [hasGenerated, setHasGenerated] = useState(true);

  const riwayatSoal = [
    { id: 1, title: "Fisika Dasar: Gaya & Gerak", count: 20, type: "Pilihan Ganda", date: "Hari ini, 09:30", color: "bg-blue-100 text-blue-700" },
    { id: 2, title: "Sejarah: Kemerdekaan RI", count: 5, type: "Esai", date: "Kemarin, 14:15", color: "bg-orange-100 text-orange-700" },
    { id: 3, title: "Biologi: Sistem Pencernaan", count: 15, type: "Pilihan Ganda", date: "12 Okt 2023", color: "bg-green-100 text-green-700" },
    { id: 4, title: "Matematika: Aljabar", count: 10, type: "Pilihan Ganda", date: "10 Okt 2023", color: "bg-indigo-100 text-indigo-700" },
    { id: 5, title: "B. Indonesia: Teks Eksposisi", count: 10, type: "Esai", date: "08 Okt 2023", color: "bg-rose-100 text-rose-700" },
  ];

  return (
    <div className="min-h-screen bg-[#f5f5f4] font-sans text-slate-800 p-6">
      {/* Top Section */}
      <div className="mb-6 flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-400 mb-2">
            <span>Dashboard</span>
            <ChevronRight className="w-3 h-3" />
            <span>Akademik</span>
            <ChevronRight className="w-3 h-3" />
            <span className="text-slate-600 font-medium">Soal Otomatis (AI)</span>
          </div>
          <h1 className="text-xl font-bold text-slate-800">Soal Otomatis</h1>
          <p className="text-sm text-slate-500 mt-1">Buat soal latihan dan ujian dalam hitungan detik menggunakan AI.</p>
        </div>
        <div className="flex gap-2">
          <button className="rounded-full bg-white border border-slate-200 text-slate-600 px-4 py-2 text-sm font-medium hover:bg-slate-50 flex items-center gap-2 shadow-sm">
            <Settings2 className="w-4 h-4" />
            Pengaturan AI
          </button>
        </div>
      </div>

      <div className="flex gap-5 items-start">
        {/* Left Panel */}
        <div className="flex-1 flex flex-col gap-5">
          {/* Form Card */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
            <h2 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-purple-500" />
              Parameter Pembuatan Soal
            </h2>
            
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Mata Pelajaran</label>
                <select className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-800/20">
                  <option>Matematika</option>
                  <option>Bahasa Indonesia</option>
                  <option>Ilmu Pengetahuan Alam</option>
                  <option>Ilmu Pengetahuan Sosial</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Kelas</label>
                <select className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-800/20">
                  <option>VII (Tujuh)</option>
                  <option>VIII (Delapan)</option>
                  <option>IX (Sembilan)</option>
                </select>
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Topik / Materi Spesifik</label>
              <input type="text" defaultValue="Aljabar Linear dan Persamaan Satu Variabel" className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-800/20" placeholder="Misal: Sistem pencernaan manusia..." />
            </div>

            <div className="grid grid-cols-3 gap-4 mb-6">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Jumlah Soal</label>
                <input type="number" defaultValue={10} min={1} max={50} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-800/20" />
              </div>
              <div className="col-span-2 flex gap-4">
                <div className="flex-1">
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Tipe Soal</label>
                  <div className="flex bg-slate-100/50 p-1 rounded-lg border border-slate-200">
                    {["Pilihan Ganda", "Esai"].map(t => (
                      <button 
                        key={t}
                        onClick={() => setTipeSoal(t)}
                        className={`flex-1 rounded-md py-1.5 text-xs font-medium transition-colors ${tipeSoal === t ? 'bg-white shadow-sm text-slate-800 border border-slate-200/50' : 'text-slate-500 hover:text-slate-700'}`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex-1">
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Kesulitan</label>
                  <div className="flex bg-slate-100/50 p-1 rounded-lg border border-slate-200">
                    {["Mudah", "Sedang", "Sulit"].map(k => (
                      <button 
                        key={k}
                        onClick={() => setKesulitan(k)}
                        className={`flex-1 rounded-md py-1.5 text-xs font-medium transition-colors ${kesulitan === k ? 'bg-white shadow-sm text-slate-800 border border-slate-200/50' : 'text-slate-500 hover:text-slate-700'}`}
                      >
                        {k}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <button 
              className="w-full rounded-full bg-slate-800 text-white px-4 py-2.5 text-sm font-medium hover:bg-slate-700 flex items-center justify-center gap-2 transition-all shadow-sm group"
              onClick={() => {
                setIsGenerating(true);
                setTimeout(() => { setIsGenerating(false); setHasGenerated(true); }, 1500);
              }}
            >
              {isGenerating ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Wand2 className="w-4 h-4 group-hover:rotate-12 transition-transform" />
              )}
              {isGenerating ? "Menyusun Soal..." : "Generate Soal dengan AI"}
            </button>
          </div>

          {/* Generated Preview Card */}
          {hasGenerated && (
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
              <div className="bg-slate-50 border-b border-slate-200 p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-800">Pilihan Ganda — Matematika Kelas VII</h3>
                    <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-2">
                      <span>Topik: Aljabar Linear</span>
                      <span className="w-1 h-1 rounded-full bg-slate-300" />
                      <span>Sedang</span>
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-slate-100 border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-600">
                    10 Soal
                  </span>
                  <button className="rounded-full bg-white border border-slate-200 text-slate-700 px-3 py-1.5 text-xs font-medium hover:bg-slate-50 flex items-center gap-1.5 shadow-sm">
                    <Download className="w-3.5 h-3.5" />
                    DOCX
                  </button>
                </div>
              </div>
              
              <div className="p-5 flex flex-col gap-6">
                {/* Question 1 */}
                <div>
                  <p className="text-sm font-medium text-slate-800 mb-3 flex gap-2">
                    <span className="text-slate-400">1.</span>
                    <span>Berapakah nilai <span className="italic">x</span> yang memenuhi persamaan <span className="font-mono bg-slate-100 px-1 rounded">3x + 5 = 20</span>?</span>
                  </p>
                  <div className="pl-5 grid grid-cols-2 gap-2 text-sm">
                    <div className="border border-slate-200 rounded-lg p-2.5 flex items-center gap-3">
                      <div className="w-6 h-6 rounded-md bg-slate-100 text-slate-500 text-xs flex items-center justify-center font-medium">A</div>
                      <span>4</span>
                    </div>
                    <div className="border border-green-500 bg-green-50 rounded-lg p-2.5 flex items-center gap-3 relative overflow-hidden">
                      <div className="absolute left-0 top-0 bottom-0 w-1 bg-green-500" />
                      <div className="w-6 h-6 rounded-md bg-green-200 text-green-800 text-xs flex items-center justify-center font-medium">B</div>
                      <span className="font-medium text-green-900">5</span>
                      <CheckCircle2 className="w-4 h-4 text-green-500 ml-auto" />
                    </div>
                    <div className="border border-slate-200 rounded-lg p-2.5 flex items-center gap-3">
                      <div className="w-6 h-6 rounded-md bg-slate-100 text-slate-500 text-xs flex items-center justify-center font-medium">C</div>
                      <span>6</span>
                    </div>
                    <div className="border border-slate-200 rounded-lg p-2.5 flex items-center gap-3">
                      <div className="w-6 h-6 rounded-md bg-slate-100 text-slate-500 text-xs flex items-center justify-center font-medium">D</div>
                      <span>15</span>
                    </div>
                  </div>
                </div>

                {/* Question 2 */}
                <div>
                  <p className="text-sm font-medium text-slate-800 mb-3 flex gap-2">
                    <span className="text-slate-400">2.</span>
                    <span>Jika Budi membeli 3 buah apel dengan total harga Rp 15.000, maka model matematika yang tepat untuk satu buah apel (a) adalah...</span>
                  </p>
                  <div className="pl-5 grid grid-cols-2 gap-2 text-sm">
                    <div className="border border-green-500 bg-green-50 rounded-lg p-2.5 flex items-center gap-3 relative overflow-hidden">
                      <div className="absolute left-0 top-0 bottom-0 w-1 bg-green-500" />
                      <div className="w-6 h-6 rounded-md bg-green-200 text-green-800 text-xs flex items-center justify-center font-medium">A</div>
                      <span className="font-medium text-green-900 font-mono">3a = 15.000</span>
                      <CheckCircle2 className="w-4 h-4 text-green-500 ml-auto" />
                    </div>
                    <div className="border border-slate-200 rounded-lg p-2.5 flex items-center gap-3">
                      <div className="w-6 h-6 rounded-md bg-slate-100 text-slate-500 text-xs flex items-center justify-center font-medium">B</div>
                      <span className="font-mono">a + 3 = 15.000</span>
                    </div>
                    <div className="border border-slate-200 rounded-lg p-2.5 flex items-center gap-3">
                      <div className="w-6 h-6 rounded-md bg-slate-100 text-slate-500 text-xs flex items-center justify-center font-medium">C</div>
                      <span className="font-mono">a / 3 = 15.000</span>
                    </div>
                    <div className="border border-slate-200 rounded-lg p-2.5 flex items-center gap-3">
                      <div className="w-6 h-6 rounded-md bg-slate-100 text-slate-500 text-xs flex items-center justify-center font-medium">D</div>
                      <span className="font-mono">3 + a = 15.000</span>
                    </div>
                  </div>
                </div>

                {/* Question 3 */}
                <div>
                  <p className="text-sm font-medium text-slate-800 mb-3 flex gap-2">
                    <span className="text-slate-400">3.</span>
                    <span>Sebuah segitiga memiliki alas <span className="font-mono bg-slate-100 px-1 rounded">(2x - 1)</span> cm dan tinggi 6 cm. Jika luasnya 27 cm², maka nilai x adalah...</span>
                  </p>
                  <div className="pl-5 grid grid-cols-2 gap-2 text-sm">
                    <div className="border border-slate-200 rounded-lg p-2.5 flex items-center gap-3">
                      <div className="w-6 h-6 rounded-md bg-slate-100 text-slate-500 text-xs flex items-center justify-center font-medium">A</div>
                      <span>3</span>
                    </div>
                    <div className="border border-slate-200 rounded-lg p-2.5 flex items-center gap-3">
                      <div className="w-6 h-6 rounded-md bg-slate-100 text-slate-500 text-xs flex items-center justify-center font-medium">B</div>
                      <span>4</span>
                    </div>
                    <div className="border border-green-500 bg-green-50 rounded-lg p-2.5 flex items-center gap-3 relative overflow-hidden">
                      <div className="absolute left-0 top-0 bottom-0 w-1 bg-green-500" />
                      <div className="w-6 h-6 rounded-md bg-green-200 text-green-800 text-xs flex items-center justify-center font-medium">C</div>
                      <span className="font-medium text-green-900">5</span>
                      <CheckCircle2 className="w-4 h-4 text-green-500 ml-auto" />
                    </div>
                    <div className="border border-slate-200 rounded-lg p-2.5 flex items-center gap-3">
                      <div className="w-6 h-6 rounded-md bg-slate-100 text-slate-500 text-xs flex items-center justify-center font-medium">D</div>
                      <span>6</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="bg-slate-50 p-3 border-t border-slate-200 text-center">
                <button className="text-xs font-semibold text-slate-500 hover:text-slate-800 uppercase tracking-wider">
                  Lihat 7 Soal Lainnya ↓
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Right Sidebar */}
        <div className="w-72 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col shrink-0">
          <div className="p-4 border-b border-slate-200 flex items-center gap-2 bg-slate-50/50">
            <History className="w-4 h-4 text-slate-500" />
            <h2 className="text-sm font-bold text-slate-800">Riwayat Soal</h2>
          </div>
          
          <div className="flex flex-col divide-y divide-slate-100">
            {riwayatSoal.map((item) => (
              <button key={item.id} className="p-4 text-left hover:bg-slate-50 transition-colors group flex items-start gap-3">
                <div className={`mt-0.5 w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${item.color}`}>
                  {item.type === "Pilihan Ganda" ? <ClipboardList className="w-4 h-4" /> : <FileText className="w-4 h-4" />}
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-slate-800 group-hover:text-indigo-600 transition-colors line-clamp-2 leading-tight">
                    {item.title}
                  </h3>
                  <div className="flex items-center gap-2 mt-1.5">
                    <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">{item.type}</span>
                    <span className="w-1 h-1 rounded-full bg-slate-300" />
                    <span className="text-[10px] font-medium text-slate-500">{item.count} Soal</span>
                  </div>
                  <div className="flex items-center gap-1 mt-1 text-xs text-slate-400">
                    <Clock className="w-3 h-3" />
                    {item.date}
                  </div>
                </div>
              </button>
            ))}
          </div>
          
          <div className="p-3 border-t border-slate-200 text-center bg-slate-50/50 mt-auto">
            <button className="text-xs font-semibold text-slate-500 hover:text-slate-800 uppercase tracking-wider">
              Lihat Semua Riwayat
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}