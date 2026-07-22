import React, { useState } from 'react';
import { 
  Users, 
  CheckSquare, 
  FileText, 
  AlertCircle, 
  Search, 
  Download, 
  Clock,
  BookOpen,
  ChevronRight,
  Filter
} from 'lucide-react';

export function ProgressKinerjaGuru() {
  const [activeTab, setActiveTab] = useState('Kinerja Guru');

  // Hardcoded Data
  const stats = [
    { label: 'Total Guru', value: '18', icon: Users, color: 'blue', progress: 100 },
    { label: 'Jurnal Lengkap', value: '14', icon: CheckSquare, color: 'emerald', progress: 77 },
    { label: 'Dokumen Lengkap', value: '16', icon: FileText, color: 'violet', progress: 88 },
    { label: 'Perlu Perhatian', value: '4', icon: AlertCircle, color: 'amber', progress: 22 },
  ];

  const teachers = [
    { 
      id: 1, 
      name: 'Budi Santoso, S.Pd', 
      subject: 'Matematika', 
      initials: 'BS', 
      avatarColor: 'bg-blue-100 text-blue-700',
      jurnalCount: 18, 
      jurnalTotal: 18, 
      docCount: 5, 
      docTotal: 5, 
      status: 'Sangat Baik' 
    },
    { 
      id: 2, 
      name: 'Siti Aminah, M.Pd', 
      subject: 'Bahasa Indonesia', 
      initials: 'SA', 
      avatarColor: 'bg-emerald-100 text-emerald-700',
      jurnalCount: 18, 
      jurnalTotal: 18, 
      docCount: 5, 
      docTotal: 5, 
      status: 'Sangat Baik' 
    },
    { 
      id: 3, 
      name: 'Ahmad Faisal, S.Pd', 
      subject: 'IPA Terpadu', 
      initials: 'AF', 
      avatarColor: 'bg-violet-100 text-violet-700',
      jurnalCount: 16, 
      jurnalTotal: 18, 
      docCount: 4, 
      docTotal: 5, 
      status: 'Baik' 
    },
    { 
      id: 4, 
      name: 'Rina Wahyuni, S.Pd', 
      subject: 'Bahasa Inggris', 
      initials: 'RW', 
      avatarColor: 'bg-rose-100 text-rose-700',
      jurnalCount: 17, 
      jurnalTotal: 18, 
      docCount: 5, 
      docTotal: 5, 
      status: 'Baik' 
    },
    { 
      id: 5, 
      name: 'Joko Widodo, S.Pd', 
      subject: 'PJOK', 
      initials: 'JW', 
      avatarColor: 'bg-amber-100 text-amber-700',
      jurnalCount: 12, 
      jurnalTotal: 18, 
      docCount: 3, 
      docTotal: 5, 
      status: 'Cukup' 
    },
    { 
      id: 6, 
      name: 'Dewi Lestari, S.Kom', 
      subject: 'Informatika', 
      initials: 'DL', 
      avatarColor: 'bg-indigo-100 text-indigo-700',
      jurnalCount: 18, 
      jurnalTotal: 18, 
      docCount: 4, 
      docTotal: 5, 
      status: 'Baik' 
    },
    { 
      id: 7, 
      name: 'Hendra Gunawan, S.Pd', 
      subject: 'IPS Terpadu', 
      initials: 'HG', 
      avatarColor: 'bg-cyan-100 text-cyan-700',
      jurnalCount: 8, 
      jurnalTotal: 18, 
      docCount: 2, 
      docTotal: 5, 
      status: 'Perlu Perhatian' 
    },
    { 
      id: 8, 
      name: 'Nia Ramadhani, S.Pd', 
      subject: 'Seni Budaya', 
      initials: 'NR', 
      avatarColor: 'bg-fuchsia-100 text-fuchsia-700',
      jurnalCount: 15, 
      jurnalTotal: 18, 
      docCount: 5, 
      docTotal: 5, 
      status: 'Baik' 
    },
  ];

  const recentJournals = [
    {
      id: 1,
      teacher: 'Budi Santoso, S.Pd',
      initials: 'BS',
      avatarColor: 'bg-blue-100 text-blue-700',
      class: 'Kelas 9A',
      topic: 'Persamaan Kuadrat',
      date: 'Hari ini, 10:30'
    },
    {
      id: 2,
      teacher: 'Siti Aminah, M.Pd',
      initials: 'SA',
      avatarColor: 'bg-emerald-100 text-emerald-700',
      class: 'Kelas 8B',
      topic: 'Teks Eksposisi',
      date: 'Hari ini, 09:15'
    },
    {
      id: 3,
      teacher: 'Rina Wahyuni, S.Pd',
      initials: 'RW',
      avatarColor: 'bg-rose-100 text-rose-700',
      class: 'Kelas 7C',
      topic: 'Descriptive Text',
      date: 'Kemarin, 14:00'
    },
    {
      id: 4,
      teacher: 'Ahmad Faisal, S.Pd',
      initials: 'AF',
      avatarColor: 'bg-violet-100 text-violet-700',
      class: 'Kelas 9C',
      topic: 'Sistem Reproduksi',
      date: 'Kemarin, 11:45'
    },
    {
      id: 5,
      teacher: 'Dewi Lestari, S.Kom',
      initials: 'DL',
      avatarColor: 'bg-indigo-100 text-indigo-700',
      class: 'Kelas 7A',
      topic: 'Berpikir Komputasional',
      date: 'Kemarin, 08:30'
    }
  ];

  // Helper functions
  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'Sangat Baik': return 'bg-emerald-100 text-emerald-700';
      case 'Baik': return 'bg-blue-100 text-blue-700';
      case 'Cukup': return 'bg-amber-100 text-amber-700';
      case 'Perlu Perhatian': return 'bg-red-100 text-red-700';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  const getProgressBarColor = (percentage: number) => {
    if (percentage >= 90) return 'bg-emerald-500';
    if (percentage >= 75) return 'bg-blue-500';
    if (percentage >= 50) return 'bg-amber-500';
    return 'bg-red-500';
  };

  return (
    <div className="bg-[#f5f5f4] min-h-screen font-sans text-slate-800 p-6">
      
      {/* Top Section */}
      <div className="mb-8">
        <div className="text-xs text-slate-400 mb-2">
          Dashboard &gt; Kepala Sekolah &gt; Progres Kinerja
        </div>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-slate-800">Progres Kinerja Guru</h1>
            <p className="text-sm text-slate-500 mt-1">Pemantauan kinerja seluruh pendidik</p>
          </div>
          <div className="flex items-center gap-3">
            <button className="flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors shadow-sm">
              <Download size={16} />
              <span>Unduh Laporan</span>
            </button>
            <button className="flex items-center gap-2 px-4 py-2 rounded-full bg-slate-800 text-white text-sm font-medium hover:bg-slate-700 transition-colors shadow-sm">
              <Filter size={16} />
              <span>Filter Periode</span>
            </button>
          </div>
        </div>
        
        {/* Pill Group Switcher */}
        <div className="flex items-center gap-2 mt-6">
          {['Kinerja Guru', 'Jurnal Sekolah'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                activeTab === tab 
                  ? 'bg-slate-800 text-white shadow-sm' 
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        {stats.map((stat, index) => (
          <div key={index} className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 relative overflow-hidden flex items-center gap-4">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 bg-${stat.color}-100 text-${stat.color}-600`}>
              <stat.icon size={24} />
            </div>
            <div>
              <div className="text-3xl font-black text-slate-800 leading-tight">
                {stat.value}
              </div>
              <div className="text-xs uppercase tracking-wide text-slate-500 font-semibold">
                {stat.label}
              </div>
            </div>
            {/* Bottom Progress Bar */}
            <div className="h-1 absolute bottom-0 left-0 right-0 bg-slate-100">
              <div 
                className={`h-full bg-${stat.color}-500`} 
                style={{ width: `${stat.progress}%` }}
              ></div>
            </div>
          </div>
        ))}
      </div>

      {/* Main Two-Column Layout */}
      <div className="flex flex-col lg:flex-row gap-5 items-start">
        
        {/* Left Column - Main Table */}
        <div className="flex-1 w-full">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Rekap Kinerja
            </h2>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
              <input 
                type="text" 
                placeholder="Cari guru..." 
                className="pl-9 pr-4 py-1.5 text-sm rounded-full border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-slate-800 focus:border-transparent w-48 transition-all shadow-sm"
              />
            </div>
          </div>
          
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-xs uppercase text-slate-500 border-b border-slate-200">
                  <th className="p-4 font-semibold whitespace-nowrap">Guru</th>
                  <th className="p-4 font-semibold whitespace-nowrap">Mata Pelajaran</th>
                  <th className="p-4 font-semibold whitespace-nowrap">Jurnal</th>
                  <th className="p-4 font-semibold whitespace-nowrap">Dokumen</th>
                  <th className="p-4 font-semibold whitespace-nowrap text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {teachers.map(teacher => {
                  const jurnalPercent = (teacher.jurnalCount / teacher.jurnalTotal) * 100;
                  const docPercent = (teacher.docCount / teacher.docTotal) * 100;
                  
                  return (
                    <tr key={teacher.id} className="hover:bg-slate-50 transition-colors group cursor-pointer">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${teacher.avatarColor}`}>
                            {teacher.initials}
                          </div>
                          <span className="font-medium text-sm text-slate-800 whitespace-nowrap">
                            {teacher.name}
                          </span>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className="text-sm text-slate-600">
                          {teacher.subject}
                        </span>
                      </td>
                      <td className="p-4 min-w-[140px]">
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span className="text-slate-600 font-medium">{teacher.jurnalCount}/{teacher.jurnalTotal}</span>
                          <span className="text-slate-400">{Math.round(jurnalPercent)}%</span>
                        </div>
                        <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div 
                            className={`h-full rounded-full ${getProgressBarColor(jurnalPercent)}`}
                            style={{ width: `${jurnalPercent}%` }}
                          ></div>
                        </div>
                      </td>
                      <td className="p-4 min-w-[140px]">
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span className="text-slate-600 font-medium">{teacher.docCount}/{teacher.docTotal}</span>
                          <span className="text-slate-400">{Math.round(docPercent)}%</span>
                        </div>
                        <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div 
                            className={`h-full rounded-full ${getProgressBarColor(docPercent)}`}
                            style={{ width: `${docPercent}%` }}
                          ></div>
                        </div>
                      </td>
                      <td className="p-4 text-right">
                        <span className={`inline-flex items-center justify-center rounded-full px-2.5 py-0.5 text-xs font-medium whitespace-nowrap ${getStatusBadge(teacher.status)}`}>
                          {teacher.status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Sidebar - Recent Journals */}
        <div className="w-full lg:w-72 shrink-0">
          <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
            Aktivitas Terkini
          </h2>
          
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
            <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-100">
              <Clock className="text-slate-400" size={18} />
              <h3 className="font-semibold text-sm text-slate-800">Jurnal Terbaru</h3>
            </div>
            
            <div className="flex flex-col gap-4">
              {recentJournals.map(journal => (
                <div key={journal.id} className="flex gap-3 group cursor-pointer">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5 ${journal.avatarColor}`}>
                    {journal.initials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-800 truncate">
                      {journal.teacher}
                    </p>
                    <div className="flex items-center gap-1.5 mt-0.5 mb-1 text-xs text-slate-500">
                      <span className="font-medium text-slate-600">{journal.class}</span>
                      <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                      <span className="truncate">{journal.topic}</span>
                    </div>
                    <div className="text-[11px] text-slate-400 flex items-center gap-1">
                      <Clock size={10} />
                      {journal.date}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            <button className="w-full mt-5 py-2 text-sm text-slate-600 font-medium border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors flex items-center justify-center gap-1">
              <span>Lihat Semua</span>
              <ChevronRight size={16} />
            </button>
          </div>
          
          {/* Quick Info Box */}
          <div className="bg-slate-800 rounded-xl shadow-sm p-4 mt-5 text-white">
            <div className="flex items-center gap-2 mb-2">
              <BookOpen className="text-blue-300" size={18} />
              <h3 className="font-semibold text-sm">Jadwal Supervisi</h3>
            </div>
            <p className="text-xs text-slate-300 mb-3 leading-relaxed">
              Supervisi akademik periode ganjil akan dimulai pada minggu pertama bulan depan.
            </p>
            <button className="text-xs font-medium text-white bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-lg transition-colors w-full">
              Atur Jadwal
            </button>
          </div>
        </div>
        
      </div>
    </div>
  );
}
