import React from 'react';
import { 
  ChevronRight, 
  Plus, 
  Calendar, 
  ChevronDown, 
  Edit2, 
  Trash2, 
  BookOpen, 
  CheckCircle2, 
  Clock,
  Filter
} from 'lucide-react';

export function JurnalMengajar() {
  const entries = [
    { id: 1, date: '18 Okt', class: '10-A', subject: 'Matematika Wajib', topic: 'Fungsi Komposisi & Invers', present: 28, total: 30, note: 'Siswa aktif sesi tanya jawab, 2 sakit.' },
    { id: 2, date: '18 Okt', class: '10-B', subject: 'Matematika Wajib', topic: 'Fungsi Komposisi & Invers', present: 30, total: 30, note: 'Materi tersampaikan dengan baik.' },
    { id: 3, date: '17 Okt', class: '11-IPA 1', subject: 'Matematika Minat', topic: 'Persamaan Trigonometri', present: 32, total: 32, note: 'Quiz di awal pertemuan lancar.' },
    { id: 4, date: '16 Okt', class: '10-A', subject: 'Matematika Wajib', topic: 'Pengenalan Fungsi', present: 29, total: 30, note: '1 siswa izin keluarga. Tugas diberikan.' },
    { id: 5, date: '16 Okt', class: '10-C', subject: 'Matematika Wajib', topic: 'Pengenalan Fungsi', present: 30, total: 30, note: 'Diskusi kelompok kecil sangat efektif.' },
    { id: 6, date: '13 Okt', class: '11-IPA 1', subject: 'Matematika Minat', topic: 'Review Sudut Rangkap', present: 31, total: 32, note: 'Banyak pertanyaan, butuh review tambahan.' }
  ];

  const prosem = [
    { id: 1, subject: 'Mat. Wajib 10', topic: 'Fungsi Komposisi & Invers', status: 'done' },
    { id: 2, subject: 'Mat. Minat 11', topic: 'Persamaan Trigonometri', status: 'done' },
    { id: 3, subject: 'Mat. Wajib 10', topic: 'Fungsi Invers (Lanjutan)', status: 'pending' },
  ];

  return (
    <div className="bg-[#f5f5f4] min-h-screen font-sans text-slate-800 p-6">
      {/* Top Section */}
      <div className="mb-6 flex justify-between items-end">
        <div>
          <div className="flex items-center text-xs text-slate-400 mb-2 font-medium">
            <span>Beranda</span>
            <ChevronRight className="w-3 h-3 mx-1" />
            <span>Akademik</span>
            <ChevronRight className="w-3 h-3 mx-1" />
            <span className="text-slate-600">Jurnal Mengajar</span>
          </div>
          <h1 className="text-xl font-bold text-slate-800">Jurnal Mengajar</h1>
          <p className="text-sm text-slate-500 mt-0.5">18 entri bulan ini</p>
        </div>
        <button className="rounded-full bg-slate-800 text-white px-4 py-2 text-sm font-medium flex items-center gap-2 hover:bg-slate-700 transition-colors shadow-sm">
          <Plus className="w-4 h-4" />
          Tambah Entri
        </button>
      </div>

      <div className="flex gap-5">
        {/* Left Column */}
        <div className="flex-1 flex flex-col gap-5">
          
          {/* Progress Card & Filter Bar (Side by Side optionally, but let's stack them to give table more vertical room) */}
          <div className="grid grid-cols-3 gap-5">
            {/* Progress Card (occupies 1 col) */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 relative overflow-hidden flex flex-col justify-between">
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-blue-500"></div>
              
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                    <Calendar className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-[10px] uppercase tracking-wide font-bold text-slate-500 mb-0.5">Progres Pekan Ini</h3>
                    <p className="text-xs text-slate-600 font-medium">3 dari 5 hari tercatat</p>
                  </div>
                </div>
                <div className="text-2xl font-black text-slate-800 leading-none">60<span className="text-sm text-slate-400">%</span></div>
              </div>
              
              <div className="flex gap-1.5 mt-auto">
                {['Sen', 'Sel', 'Rab', 'Kam', 'Jum'].map((day, idx) => (
                  <div key={day} className="flex-1 flex flex-col gap-1.5 items-center">
                    <div className={`w-full h-1.5 rounded-full ${idx < 3 ? 'bg-blue-500' : 'bg-slate-100'}`}></div>
                    <span className={`text-[9px] uppercase font-bold tracking-wider ${idx < 3 ? 'text-blue-700' : 'text-slate-400'}`}>{day}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Filter Bar (occupies 2 cols) */}
            <div className="col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm p-5 flex gap-4 items-end">
              <div className="flex-1">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 block">Mata Pelajaran</label>
                <div className="relative">
                  <select className="w-full appearance-none bg-slate-50 border border-slate-200 rounded-lg pl-3 pr-8 py-2.5 text-sm text-slate-700 font-medium focus:outline-none focus:border-slate-300 focus:bg-white transition-colors cursor-pointer">
                    <option>Semua Mata Pelajaran</option>
                    <option>Matematika Wajib</option>
                    <option>Matematika Minat</option>
                  </select>
                  <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-3 pointer-events-none" />
                </div>
              </div>
              <div className="w-32">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 block">Kelas</label>
                <div className="relative">
                  <select className="w-full appearance-none bg-slate-50 border border-slate-200 rounded-lg pl-3 pr-8 py-2.5 text-sm text-slate-700 font-medium focus:outline-none focus:border-slate-300 focus:bg-white transition-colors cursor-pointer">
                    <option>Semua Kelas</option>
                    <option>10-A</option>
                    <option>10-B</option>
                    <option>10-C</option>
                    <option>11-IPA 1</option>
                  </select>
                  <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-3 pointer-events-none" />
                </div>
              </div>
              <div className="w-44">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 block">Bulan</label>
                <div className="relative">
                  <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                  <select className="w-full appearance-none bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-8 py-2.5 text-sm text-slate-700 font-medium focus:outline-none focus:border-slate-300 focus:bg-white transition-colors cursor-pointer">
                    <option>Oktober 2023</option>
                    <option>September 2023</option>
                  </select>
                  <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-3 pointer-events-none" />
                </div>
              </div>
              <button className="h-10 w-10 shrink-0 rounded-lg bg-slate-50 border border-slate-200 text-slate-600 flex items-center justify-center hover:bg-slate-100 transition-colors mb-px">
                <Filter className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Table Card */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex-1 flex flex-col">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-[11px] font-bold uppercase text-slate-500 tracking-wider">
                    <th className="p-4 border-b border-slate-200 font-semibold">Tanggal</th>
                    <th className="p-4 border-b border-slate-200 font-semibold">Kelas</th>
                    <th className="p-4 border-b border-slate-200 font-semibold">Mata Pelajaran</th>
                    <th className="p-4 border-b border-slate-200 font-semibold">Materi/Topik</th>
                    <th className="p-4 border-b border-slate-200 font-semibold">Kehadiran</th>
                    <th className="p-4 border-b border-slate-200 font-semibold">Catatan</th>
                    <th className="p-4 border-b border-slate-200 font-semibold text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {entries.map(entry => (
                    <tr key={entry.id} className="hover:bg-slate-50 group transition-colors">
                      <td className="p-4 align-top whitespace-nowrap">
                        <span className="font-semibold text-slate-800">{entry.date}</span>
                      </td>
                      <td className="p-4 align-top whitespace-nowrap">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-600 border border-slate-200/60">
                          {entry.class}
                        </span>
                      </td>
                      <td className="p-4 align-top whitespace-nowrap">
                        <span className="text-slate-600 font-medium">{entry.subject}</span>
                      </td>
                      <td className="p-4 align-top">
                        <span className="font-semibold text-slate-800 block truncate max-w-[180px]">{entry.topic}</span>
                      </td>
                      <td className="p-4 align-top whitespace-nowrap">
                        <div className="flex flex-col gap-1.5 w-24">
                          <div className="flex justify-between text-[11px]">
                            <span className="font-bold text-slate-700">{entry.present}/{entry.total} <span className="font-normal text-slate-500">siswa</span></span>
                          </div>
                          <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                            <div 
                              className={`h-full rounded-full transition-all duration-500 ${entry.present === entry.total ? 'bg-emerald-500' : 'bg-amber-500'}`}
                              style={{ width: `${(entry.present/entry.total)*100}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="p-4 align-top">
                        <p className="text-slate-500 text-sm truncate max-w-[200px]" title={entry.note}>
                          {entry.note}
                        </p>
                      </td>
                      <td className="p-4 align-top text-center">
                        <div className="flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button className="text-slate-400 hover:text-blue-600 hover:bg-blue-50 h-8 w-8 rounded-lg flex items-center justify-center transition-colors" title="Edit">
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button className="text-slate-400 hover:text-red-600 hover:bg-red-50 h-8 w-8 rounded-lg flex items-center justify-center transition-colors" title="Hapus">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            <div className="p-4 border-t border-slate-100 bg-slate-50 mt-auto flex items-center justify-between text-xs text-slate-500">
              <span>Menampilkan 6 dari 18 entri bulan ini</span>
              <div className="flex gap-1">
                <button className="px-3 py-1 rounded bg-white border border-slate-200 text-slate-400 cursor-not-allowed">Sebelumnya</button>
                <button className="px-3 py-1 rounded bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 font-medium">Selanjutnya</button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Sidebar */}
        <div className="w-72 bg-white rounded-xl border border-slate-200 shadow-sm p-5 h-fit sticky top-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center shrink-0">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-800 leading-tight">Rencana Prosem</h2>
              <p className="text-xs text-slate-500 mt-0.5 font-medium">Pekan ke-3 Oktober</p>
            </div>
          </div>

          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-3">Topik Terjadwal Pekan Ini</div>
          
          <div className="flex flex-col gap-3">
             {prosem.map(item => (
               <div key={item.id} className="p-3 rounded-xl border border-slate-100 bg-slate-50/50 flex flex-col gap-2.5 hover:border-slate-200 transition-colors cursor-default">
                 <div className="flex justify-between items-start gap-2">
                   <span className="inline-flex px-2 py-0.5 rounded text-[10px] font-bold bg-white border border-slate-200 text-slate-600 uppercase tracking-wide">
                     {item.subject}
                   </span>
                   {item.status === 'done' ? (
                     <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700">
                       <CheckCircle2 className="w-3 h-3" />
                       Dicatat
                     </span>
                   ) : (
                     <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-700">
                       <Clock className="w-3 h-3" />
                       Belum
                     </span>
                   )}
                 </div>
                 <p className="text-sm font-semibold text-slate-800 leading-snug">
                   {item.topic}
                 </p>
               </div>
             ))}
          </div>

          <div className="mt-6 pt-5 border-t border-slate-100">
            <button className="w-full py-2.5 rounded-lg border border-dashed border-slate-300 text-slate-500 text-sm font-semibold hover:border-slate-400 hover:text-slate-700 transition-colors flex items-center justify-center gap-2">
              Lihat Prosem Lengkap
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
