import React, { useState } from 'react';
import { 
  FileText, BookOpen, Users, CheckCircle, TrendingUp, 
  ChevronDown, ChevronUp, Download, Clock, AlertCircle,
  FileBadge, MoreVertical, Search, Filter
} from 'lucide-react';

const stats = [
  { label: 'Total Guru', value: '18', icon: Users, colorClasses: { bg: 'bg-blue-100', text: 'text-blue-600', bar: 'bg-blue-500' } },
  { label: 'Dokumen Lengkap', value: '14/18', icon: CheckCircle, colorClasses: { bg: 'bg-emerald-100', text: 'text-emerald-600', bar: 'bg-emerald-500' } },
  { label: 'Rata-rata Kepatuhan', value: '78%', icon: TrendingUp, colorClasses: { bg: 'bg-violet-100', text: 'text-violet-600', bar: 'bg-violet-500' } },
];

const teachers = [
  {
    id: 1,
    name: 'Budi Santoso, S.Pd',
    subject: 'Matematika',
    avatar: 'BS',
    color: 'bg-blue-100 text-blue-700',
    docCount: 14,
    progress: 100,
    documents: [
      { id: 101, name: 'Silabus Matematika Kelas X', date: '12 Aug 2023', size: '2.4 MB', status: 'verified' },
      { id: 102, name: 'RPP Semester 1', date: '15 Aug 2023', size: '4.1 MB', status: 'verified' },
      { id: 103, name: 'Program Tahunan (Prota)', date: '18 Aug 2023', size: '1.2 MB', status: 'verified' },
      { id: 104, name: 'Program Semester (Promes)', date: '20 Aug 2023', size: '1.5 MB', status: 'verified' },
    ]
  },
  {
    id: 2,
    name: 'Siti Aminah, M.Pd',
    subject: 'Bahasa Indonesia',
    avatar: 'SA',
    color: 'bg-rose-100 text-rose-700',
    docCount: 12,
    progress: 85,
    documents: []
  },
  {
    id: 3,
    name: 'Drs. Wahyu Hidayat',
    subject: 'Fisika',
    avatar: 'WH',
    color: 'bg-amber-100 text-amber-700',
    docCount: 8,
    progress: 57,
    documents: []
  }
];

const recentJournals = [
  { id: 1, date: 'Hari ini, 10:30', class: 'X MIPA 1', topic: 'Persamaan Kuadrat', teacher: 'Budi Santoso' },
  { id: 2, date: 'Hari ini, 08:15', class: 'XI IPS 2', topic: 'Teks Eksplanasi', teacher: 'Siti Aminah' },
  { id: 3, date: 'Kemarin, 13:00', class: 'XII MIPA 3', topic: 'Hukum Newton', teacher: 'Wahyu Hidayat' },
  { id: 4, date: 'Kemarin, 09:45', class: 'X IPS 1', topic: 'Pancasila & Kewarganegaraan', teacher: 'Rina Herawati' },
  { id: 5, date: '14 Okt, 11:20', class: 'XI MIPA 2', topic: 'Trigonometri Lanjut', teacher: 'Budi Santoso' },
];

export function SupervisiKurikulum() {
  const [activeTab, setActiveTab] = useState('dokumen');
  const [expandedId, setExpandedId] = useState<number | null>(1);

  const toggleExpand = (id: number) => {
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <div className="bg-[#f5f5f4] min-h-screen font-sans text-slate-800 p-6">
      {/* Header */}
      <div className="mb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="text-xs text-slate-400 mb-2 flex items-center gap-2">
            <span>Dashboard</span>
            <span>/</span>
            <span>Kurikulum</span>
            <span>/</span>
            <span className="text-slate-600 font-medium">Supervisi</span>
          </div>
          <h1 className="text-xl font-bold text-slate-800">Supervisi Kurikulum</h1>
          <p className="text-sm text-slate-500 mt-1">Monitoring dokumen administrasi dan jurnal mengajar seluruh guru</p>
        </div>
        
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="flex bg-white rounded-full border border-slate-200 p-1">
            <button 
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${activeTab === 'dokumen' ? 'bg-slate-800 text-white' : 'text-slate-600 hover:bg-slate-50'}`}
              onClick={() => setActiveTab('dokumen')}
            >
              Dokumen
            </button>
            <button 
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${activeTab === 'jurnal' ? 'bg-slate-800 text-white' : 'text-slate-600 hover:bg-slate-50'}`}
              onClick={() => setActiveTab('jurnal')}
            >
              Jurnal
            </button>
          </div>
          <button className="rounded-full bg-slate-800 text-white px-4 py-2 text-sm font-medium flex items-center gap-2 hover:bg-slate-700 transition-colors">
            <Download className="w-4 h-4" />
            Export Laporan
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-6">
        {stats.map((stat, i) => (
          <div key={i} className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 flex items-center gap-4 relative overflow-hidden">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${stat.colorClasses.bg} ${stat.colorClasses.text}`}>
              <stat.icon className="w-6 h-6" />
            </div>
            <div>
              <div className="text-3xl font-black text-slate-800">{stat.value}</div>
              <div className="text-xs uppercase tracking-wide text-slate-500 font-semibold mt-0.5">{stat.label}</div>
            </div>
            <div className={`h-1 absolute bottom-0 left-0 right-0 ${stat.colorClasses.bar}`} />
          </div>
        ))}
      </div>

      <div className="flex flex-col lg:flex-row gap-5">
        {/* Left Column - Main Content */}
        <div className="flex-1 flex flex-col gap-4">
          <div className="flex items-center justify-between mb-2">
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Status Dokumen Guru</div>
            <div className="flex items-center gap-2">
              <div className="relative hidden sm:block">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input 
                  type="text" 
                  placeholder="Cari guru..." 
                  className="pl-9 pr-4 py-1.5 text-sm border border-slate-200 rounded-full focus:outline-none focus:border-slate-400 focus:ring-1 focus:ring-slate-400 bg-white w-48"
                />
              </div>
              <button className="p-1.5 bg-white border border-slate-200 rounded-full text-slate-600 hover:bg-slate-50 transition-colors">
                <Filter className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            {teachers.map((teacher) => (
              <div key={teacher.id} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div 
                  className="p-4 flex flex-col sm:flex-row sm:items-center gap-4 cursor-pointer hover:bg-slate-50 transition-colors select-none"
                  onClick={() => toggleExpand(teacher.id)}
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${teacher.color}`}>
                      {teacher.avatar}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-slate-800 truncate">{teacher.name}</span>
                        <span className="rounded-full px-2 py-0.5 text-[10px] font-medium bg-slate-100 text-slate-600 shrink-0">
                          {teacher.subject}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden flex max-w-[160px]">
                          <div 
                            className={`h-full rounded-full transition-all duration-500 ${teacher.progress === 100 ? 'bg-emerald-500' : teacher.progress > 60 ? 'bg-blue-500' : 'bg-amber-500'}`}
                            style={{ width: `${teacher.progress}%` }}
                          />
                        </div>
                        <span className="text-xs text-slate-500 font-medium">{teacher.progress}%</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4 mt-2 sm:mt-0 ml-12 sm:ml-0">
                    <div className="flex items-center gap-1.5 text-slate-500 bg-slate-50 px-3 py-1 rounded-full border border-slate-100">
                      <FileBadge className="w-4 h-4" />
                      <span className="text-xs font-medium">{teacher.docCount} Dokumen</span>
                    </div>
                    
                    <button className="w-8 h-8 flex items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors">
                      {expandedId === teacher.id ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                {/* Expanded Content */}
                {expandedId === teacher.id && (
                  <div className="border-t border-slate-100 bg-slate-50/50 p-4">
                    <div className="bg-white rounded-lg border border-slate-200 overflow-hidden overflow-x-auto">
                      <table className="w-full text-left text-sm whitespace-nowrap">
                        <thead className="bg-slate-50 text-xs uppercase text-slate-500 font-medium border-b border-slate-200">
                          <tr>
                            <th className="px-4 py-3">Nama Dokumen</th>
                            <th className="px-4 py-3">Tgl Upload</th>
                            <th className="px-4 py-3">Ukuran</th>
                            <th className="px-4 py-3 text-right">Aksi</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {teacher.documents.length > 0 ? (
                            teacher.documents.map((doc) => (
                              <tr key={doc.id} className="hover:bg-slate-50 transition-colors group">
                                <td className="px-4 py-3">
                                  <div className="flex items-center gap-2">
                                    <FileText className="w-4 h-4 text-slate-400" />
                                    <span className="font-medium text-slate-700">{doc.name}</span>
                                    {doc.status === 'verified' && (
                                      <CheckCircle className="w-3.5 h-3.5 text-emerald-500 ml-1" />
                                    )}
                                  </div>
                                </td>
                                <td className="px-4 py-3 text-slate-500">{doc.date}</td>
                                <td className="px-4 py-3 text-slate-500">{doc.size}</td>
                                <td className="px-4 py-3 text-right">
                                  <button className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors inline-flex items-center justify-center">
                                    <Download className="w-4 h-4" />
                                  </button>
                                  <button className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded transition-colors inline-flex items-center justify-center ml-1">
                                    <MoreVertical className="w-4 h-4" />
                                  </button>
                                </td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td colSpan={4} className="px-4 py-8 text-center text-slate-500">
                                <div className="flex flex-col items-center justify-center gap-2">
                                  <AlertCircle className="w-8 h-8 text-slate-300" />
                                  <span>Belum ada dokumen yang diunggah.</span>
                                </div>
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Right Column - Sidebar */}
        <div className="w-full lg:w-72 shrink-0 flex flex-col gap-4">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Aktivitas Mengajar</div>
          
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
            <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-100">
              <div className="bg-indigo-100 text-indigo-600 p-1.5 rounded-lg">
                <BookOpen className="w-4 h-4" />
              </div>
              <h3 className="font-bold text-slate-800 text-sm">Jurnal Terbaru</h3>
            </div>
            
            <div className="flex flex-col gap-4">
              {recentJournals.map((journal, idx) => (
                <div key={journal.id} className="relative pl-4">
                  {/* Timeline line */}
                  {idx !== recentJournals.length - 1 && (
                    <div className="absolute left-[7px] top-5 bottom-[-16px] w-[2px] bg-slate-100"></div>
                  )}
                  {/* Timeline dot */}
                  <div className="absolute left-0 top-1.5 w-4 h-4 rounded-full border-2 border-white bg-indigo-400 shadow-sm"></div>
                  
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-semibold text-slate-500 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {journal.date}
                      </span>
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                        {journal.class}
                      </span>
                    </div>
                    <div className="text-sm font-semibold text-slate-800 leading-tight">
                      {journal.topic}
                    </div>
                    <div className="text-xs text-slate-500 mt-0.5">
                      Oleh: <span className="font-medium text-slate-700">{journal.teacher}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            <button className="w-full mt-5 py-2 text-xs font-semibold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors">
              Lihat Semua Jurnal
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
