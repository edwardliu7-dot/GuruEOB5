import React from 'react';
import { 
  ChevronRight, 
  MessageCircle, 
  BookOpen, 
  CalendarCheck, 
  Users, 
  ChevronDown, 
  CheckCircle2, 
  AlertTriangle,
  Clock,
  Search,
  Filter,
  Copy,
  Share2
} from 'lucide-react';

const SUBJECTS_DATA = [
  {
    id: 1,
    name: "Matematika",
    kelas: "VII-A",
    teacher: "Budi Santoso, S.Pd",
    topic: "Persamaan Linear Satu Variabel",
    attendance: "28/30",
    attendancePercentage: 93,
    status: "recorded",
    color: "blue",
    time: "Senin, 08:00 - 09:30"
  },
  {
    id: 2,
    name: "Bahasa Indonesia",
    kelas: "VII-A",
    teacher: "Siti Aminah, M.Pd",
    topic: "Teks Deskripsi dan Strukturnya",
    attendance: "30/30",
    attendancePercentage: 100,
    status: "recorded",
    color: "rose",
    time: "Senin, 10:00 - 11:30"
  },
  {
    id: 3,
    name: "Ilmu Pengetahuan Alam",
    kelas: "VII-A",
    teacher: "Dr. Ahmad Fauzi",
    topic: "Klasifikasi Makhluk Hidup",
    attendance: "29/30",
    attendancePercentage: 96,
    status: "recorded",
    color: "emerald",
    time: "Selasa, 08:00 - 09:30"
  },
  {
    id: 4,
    name: "Pendidikan Pancasila",
    kelas: "VII-A",
    teacher: "Rina Kusuma, S.Pd",
    topic: "Sejarah Perumusan Pancasila",
    attendance: "30/30",
    attendancePercentage: 100,
    status: "recorded",
    color: "amber",
    time: "Rabu, 08:00 - 09:30"
  },
  {
    id: 5,
    name: "Bahasa Inggris",
    kelas: "VII-A",
    teacher: "Diana Fitri, S.Pd",
    topic: "Belum mengisi jurnal",
    attendance: "-",
    attendancePercentage: 0,
    status: "missing",
    color: "indigo",
    time: "Kamis, 08:00 - 09:30"
  },
  {
    id: 6,
    name: "Seni Budaya",
    kelas: "VII-A",
    teacher: "Reza Rahadian, S.Sn",
    topic: "Menggambar Flora dan Fauna",
    attendance: "30/30",
    attendancePercentage: 100,
    status: "recorded",
    color: "pink",
    time: "Jumat, 08:00 - 09:30"
  }
];

export function InfoPekanan() {
  return (
    <div className="bg-[#f5f5f4] min-h-screen font-sans text-slate-800 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Top Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <div className="flex items-center text-xs text-slate-400 mb-2 font-medium">
              <span>Beranda</span>
              <ChevronRight className="w-3 h-3 mx-1" />
              <span>Laporan</span>
              <ChevronRight className="w-3 h-3 mx-1" />
              <span className="text-slate-600">Info Pekanan</span>
            </div>
            <h1 className="text-2xl font-bold text-slate-800 mb-1">Info Pekanan</h1>
            <p className="text-sm text-slate-500">Ringkasan capaian pembelajaran mingguan untuk dibagikan.</p>
          </div>
          
          <div className="flex items-center gap-3">
            <button className="flex items-center justify-center gap-2 rounded-full bg-white border border-slate-200 text-slate-700 px-4 py-2 text-sm font-medium hover:bg-slate-50 transition-colors shadow-sm">
              <Share2 className="w-4 h-4" />
              <span>Salin Tautan</span>
            </button>
            <button className="flex items-center justify-center gap-2 rounded-full bg-emerald-600 text-white px-4 py-2 text-sm font-medium hover:bg-emerald-700 transition-colors shadow-sm">
              <MessageCircle className="w-4 h-4" />
              <span>Bagikan via WhatsApp</span>
            </button>
          </div>
        </div>

        {/* Selector Bar */}
        <div className="flex flex-wrap items-center gap-3 bg-white p-2 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-2 bg-slate-50 px-4 py-2 rounded-lg border border-slate-200 cursor-pointer hover:bg-slate-100 transition-colors">
            <span className="text-sm font-medium text-slate-600">Pekan:</span>
            <span className="text-sm font-bold text-slate-800">Pekan 12 (15-19 Jul)</span>
            <ChevronDown className="w-4 h-4 text-slate-500 ml-1" />
          </div>
          
          <div className="w-px h-6 bg-slate-200 hidden sm:block"></div>
          
          <div className="flex items-center gap-2 bg-slate-50 px-4 py-2 rounded-lg border border-slate-200 cursor-pointer hover:bg-slate-100 transition-colors">
            <span className="text-sm font-medium text-slate-600">Kelas:</span>
            <span className="text-sm font-bold text-slate-800">VII-A</span>
            <ChevronDown className="w-4 h-4 text-slate-500 ml-1" />
          </div>
          
          <div className="flex-1"></div>
          
          <div className="flex items-center bg-slate-50 px-3 py-2 rounded-lg border border-slate-200 text-slate-400 focus-within:ring-2 focus-within:ring-slate-800 focus-within:border-transparent transition-all">
            <Search className="w-4 h-4 mr-2" />
            <input 
              type="text" 
              placeholder="Cari mata pelajaran..." 
              className="bg-transparent border-none outline-none text-sm w-48 text-slate-800 placeholder-slate-400"
            />
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm flex items-center gap-4 p-4 relative overflow-hidden">
            <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
              <BookOpen className="w-6 h-6" />
            </div>
            <div>
              <div className="text-xs uppercase tracking-wide text-slate-500 font-semibold mb-1">Mapel Tercatat</div>
              <div className="text-3xl font-black text-slate-800">5<span className="text-lg text-slate-400 font-bold">/6</span></div>
            </div>
            <div className="h-1 absolute bottom-0 left-0 right-0 bg-slate-100">
              <div className="h-1 bg-blue-500" style={{ width: '83%' }}></div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-sm flex items-center gap-4 p-4 relative overflow-hidden">
            <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
              <CalendarCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="text-xs uppercase tracking-wide text-slate-500 font-semibold mb-1">Pertemuan Terlaksana</div>
              <div className="text-3xl font-black text-slate-800">14<span className="text-lg text-slate-400 font-bold">/15</span></div>
            </div>
            <div className="h-1 absolute bottom-0 left-0 right-0 bg-slate-100">
              <div className="h-1 bg-emerald-500" style={{ width: '93%' }}></div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-sm flex items-center gap-4 p-4 relative overflow-hidden">
            <div className="w-12 h-12 rounded-xl bg-violet-100 text-violet-600 flex items-center justify-center shrink-0">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <div className="text-xs uppercase tracking-wide text-slate-500 font-semibold mb-1">Rata-rata Kehadiran</div>
              <div className="text-3xl font-black text-slate-800">93<span className="text-lg text-slate-400 font-bold">%</span></div>
            </div>
            <div className="h-1 absolute bottom-0 left-0 right-0 bg-slate-100">
              <div className="h-1 bg-violet-500" style={{ width: '93%' }}></div>
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex flex-col lg:flex-row gap-6">
          
          {/* Left Col: Subject Cards */}
          <div className="flex-1 space-y-4">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Jurnal Mengajar Pekan 12</h2>
              <button className="text-xs font-medium text-blue-600 hover:text-blue-700 flex items-center">
                <Filter className="w-3 h-3 mr-1" />
                Filter
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {SUBJECTS_DATA.map((subject) => (
                <div key={subject.id} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col relative group">
                  {/* Color strip on the left */}
                  <div className={`absolute left-0 top-0 bottom-0 w-1.5 bg-${subject.color}-500`}></div>
                  
                  <div className="p-4 pl-5">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-bold text-slate-800 text-base">{subject.name}</h3>
                          <span className="rounded-full px-2 py-0.5 text-[10px] font-bold bg-slate-100 text-slate-600">{subject.kelas}</span>
                        </div>
                        <p className="text-xs text-slate-500 flex items-center">
                          <Clock className="w-3 h-3 mr-1" /> {subject.time}
                        </p>
                      </div>
                      
                      {subject.status === 'recorded' ? (
                        <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center" title="Jurnal Terisi">
                          <CheckCircle2 className="w-5 h-5" />
                        </div>
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-rose-50 text-rose-500 flex items-center justify-center" title="Jurnal Belum Terisi">
                          <AlertTriangle className="w-5 h-5" />
                        </div>
                      )}
                    </div>
                    
                    <div className="bg-slate-50 rounded-lg p-3 mb-3 border border-slate-100">
                      <div className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold mb-1">Materi Pembelajaran</div>
                      <p className={`text-sm ${subject.status === 'missing' ? 'text-slate-400 italic' : 'text-slate-800 font-medium'}`}>
                        {subject.topic}
                      </p>
                    </div>
                    
                    <div className="flex items-center justify-between mt-auto pt-1">
                      <div className="flex items-center gap-2">
                        <div className={`w-6 h-6 rounded-full bg-${subject.color}-100 text-${subject.color}-700 flex items-center justify-center text-[10px] font-bold`}>
                          {subject.teacher.split(' ').map(n => n[0]).join('').substring(0, 2)}
                        </div>
                        <span className="text-xs text-slate-600 font-medium">{subject.teacher}</span>
                      </div>
                      
                      {subject.status === 'recorded' && (
                        <div className="text-xs font-semibold text-slate-700 bg-slate-100 px-2 py-1 rounded-md flex items-center">
                          <Users className="w-3 h-3 mr-1 text-slate-500" />
                          {subject.attendance}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Col: WhatsApp Preview */}
          <div className="w-full lg:w-[400px] flex-shrink-0">
            <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4 flex items-center">
              <MessageCircle className="w-4 h-4 mr-1.5" />
              Preview Pesan WhatsApp
            </h2>
            
            <div className="bg-[#e4ddcb] p-4 rounded-xl border border-[#d6ccb8] shadow-sm relative overflow-hidden" style={{ backgroundImage: 'url("https://www.transparenttextures.com/patterns/cubes.png")', backgroundSize: '60px' }}>
              
              <div className="bg-[#d9fdd3] p-3.5 rounded-xl rounded-tl-none shadow-sm relative mb-2">
                <p className="font-mono text-[13px] text-slate-800 whitespace-pre-wrap leading-relaxed">
*INFO PEKANAN KELAS VII-A*
Pekan 12 (15-19 Juli 2026)

Assalamu'alaikum Bapak/Ibu Wali Murid,
Berikut adalah ringkasan kegiatan belajar mengajar sepekan ini:

*1. Matematika*
Materi: Persamaan Linear Satu Variabel
Kehadiran: 28/30 Siswa

*2. Bahasa Indonesia*
Materi: Teks Deskripsi dan Strukturnya
Kehadiran: 30/30 Siswa

*3. Ilmu Pengetahuan Alam*
Materi: Klasifikasi Makhluk Hidup
Kehadiran: 29/30 Siswa

*4. Pendidikan Pancasila*
Materi: Sejarah Perumusan Pancasila
Kehadiran: 30/30 Siswa

*5. Seni Budaya*
Materi: Menggambar Flora dan Fauna
Kehadiran: 30/30 Siswa

*(Bahasa Inggris belum tercatat di sistem)*

Rata-rata kehadiran kelas pekan ini: *93%*

Terima kasih atas perhatian dan kerjasama Bapak/Ibu.

Wali Kelas VII-A
Budi Santoso, S.Pd
                </p>
                <div className="flex justify-end mt-1 text-[10px] text-emerald-700 items-center gap-1 opacity-70">
                  14:30 <CheckCircle2 className="w-3 h-3" />
                </div>
              </div>
              
              <button className="w-full mt-4 flex items-center justify-center gap-2 bg-white text-slate-700 border border-slate-200 rounded-full py-2.5 text-sm font-medium shadow-sm hover:bg-slate-50 transition-colors">
                <Copy className="w-4 h-4" />
                Salin Teks
              </button>
            </div>
          </div>
          
        </div>
      </div>
    </div>
  );
}
