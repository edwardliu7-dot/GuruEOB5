import React, { useState } from 'react';
import { 
  Users, 
  BookOpen, 
  AlertTriangle, 
  Activity, 
  ChevronRight, 
  Download, 
  Printer, 
  FileText, 
  Clock, 
  Search, 
  Filter, 
  MoreVertical 
} from 'lucide-react';

// Hardcoded Data
const stats = [
  { label: 'Hadir Rata-rata', value: '92%', icon: Users, color: 'emerald', trend: '+2%' },
  { label: 'Rata-rata Nilai', value: '79.4', icon: Activity, color: 'blue', trend: '+1.2' },
  { label: 'Poin Pelanggaran', value: '145', icon: AlertTriangle, color: 'red', trend: '+15' },
  { label: 'Perlu Perhatian', value: '4', icon: Clock, color: 'amber', trend: '-1' },
];

const students = [
  { id: 1, name: 'Ahmad Fauzi', avatarBg: 'bg-blue-100 text-blue-700', attendance: 95, grade: 82.5, points: 0, status: 'Baik' },
  { id: 2, name: 'Bunga Lestari', avatarBg: 'bg-pink-100 text-pink-700', attendance: 98, grade: 88.0, points: 5, status: 'Baik' },
  { id: 3, name: 'Citra Kirana', avatarBg: 'bg-purple-100 text-purple-700', attendance: 85, grade: 76.5, points: 15, status: 'Perlu Perhatian' },
  { id: 4, name: 'Deni Saputra', avatarBg: 'bg-emerald-100 text-emerald-700', attendance: 75, grade: 65.0, points: 50, status: 'Kritis' },
  { id: 5, name: 'Eka Pratama', avatarBg: 'bg-amber-100 text-amber-700', attendance: 92, grade: 79.0, points: 10, status: 'Baik' },
  { id: 6, name: 'Fikri Ramadhan', avatarBg: 'bg-indigo-100 text-indigo-700', attendance: 88, grade: 74.5, points: 25, status: 'Perlu Perhatian' },
  { id: 7, name: 'Gita Savitri', avatarBg: 'bg-rose-100 text-rose-700', attendance: 96, grade: 91.0, points: 0, status: 'Baik' },
  { id: 8, name: 'Hadi Wijaya', avatarBg: 'bg-cyan-100 text-cyan-700', attendance: 90, grade: 78.5, points: 5, status: 'Baik' },
  { id: 9, name: 'Intan Permata', avatarBg: 'bg-fuchsia-100 text-fuchsia-700', attendance: 94, grade: 85.0, points: 0, status: 'Baik' },
  { id: 10, name: 'Joko Widodo', avatarBg: 'bg-orange-100 text-orange-700', attendance: 82, grade: 71.0, points: 35, status: 'Perlu Perhatian' },
];

const journals = [
  { id: 1, date: '12 Okt 2023', subject: 'Matematika', topic: 'Aljabar Linear', teacher: 'Pak Budi' },
  { id: 2, date: '12 Okt 2023', subject: 'Bahasa Indonesia', topic: 'Teks Eksposisi', teacher: 'Bu Ani' },
  { id: 3, date: '11 Okt 2023', subject: 'IPA Terpadu', topic: 'Sistem Pencernaan', teacher: 'Pak Cipto' },
  { id: 4, date: '11 Okt 2023', subject: 'Pendidikan Agama', topic: 'Sejarah Nabi', teacher: 'Ust. Hasan' },
  { id: 5, date: '10 Okt 2023', subject: 'Bahasa Inggris', topic: 'Narrative Text', teacher: 'Miss Dina' },
];

export function RekapWaliKelas() {
  const [activeTab, setActiveTab] = useState('Rekap Siswa');

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Baik':
        return 'bg-emerald-100 text-emerald-700';
      case 'Perlu Perhatian':
        return 'bg-amber-100 text-amber-700';
      case 'Kritis':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-slate-100 text-slate-700';
    }
  };

  const getPointsBadge = (points: number) => {
    if (points === 0) return 'bg-slate-100 text-slate-500';
    if (points < 20) return 'bg-amber-50 text-amber-600 border border-amber-200';
    return 'bg-red-50 text-red-600 border border-red-200';
  };

  const getAttendanceColor = (att: number) => {
    if (att >= 90) return 'bg-emerald-500';
    if (att >= 80) return 'bg-amber-500';
    return 'bg-red-500';
  };

  return (
    <div className="bg-[#f5f5f4] min-h-screen font-sans text-slate-800 p-6">
      {/* Top Section */}
      <div className="mb-6">
        <div className="flex items-center text-xs text-slate-400 mb-2 font-medium">
          <span>Dashboard</span>
          <ChevronRight className="w-3 h-3 mx-1" />
          <span>Wali Kelas</span>
          <ChevronRight className="w-3 h-3 mx-1" />
          <span className="text-slate-600">VII Ibnu Battutah</span>
        </div>
        
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-slate-800 mb-1">Rekap Wali Kelas — VII Ibnu Battutah</h1>
            <p className="text-sm text-slate-500">Tahun Ajaran 2023/2024 • 32 Siswa</p>
          </div>
          
          <div className="flex items-center gap-2">
            <button className="flex items-center gap-2 px-3 py-2 bg-white border border-slate-200 rounded-full text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors shadow-sm">
              <Printer className="w-4 h-4" />
              <span>Cetak</span>
            </button>
            <button className="flex items-center gap-2 px-3 py-2 bg-white border border-slate-200 rounded-full text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors shadow-sm">
              <Download className="w-4 h-4" />
              <span>Unduh PDF</span>
            </button>
            <button className="flex items-center gap-2 px-4 py-2 bg-slate-800 rounded-full text-sm font-medium text-white hover:bg-slate-700 transition-colors shadow-sm">
              <MoreVertical className="w-4 h-4" />
              <span>Aksi Lainnya</span>
            </button>
          </div>
        </div>
      </div>

      {/* Switcher */}
      <div className="flex items-center gap-2 mb-6 bg-white p-1 rounded-full border border-slate-200 inline-flex shadow-sm">
        {['Rekap Siswa', 'Jurnal Kelas'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
              activeTab === tab 
                ? 'bg-slate-800 text-white' 
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-6">
        {stats.map((stat, idx) => {
          const Icon = stat.icon;
          const colorMap: Record<string, string> = {
            emerald: 'bg-emerald-100 text-emerald-600 border-emerald-500',
            blue: 'bg-blue-100 text-blue-600 border-blue-500',
            red: 'bg-red-100 text-red-600 border-red-500',
            amber: 'bg-amber-100 text-amber-600 border-amber-500',
          };
          
          const barColorMap: Record<string, string> = {
            emerald: 'bg-emerald-500',
            blue: 'bg-blue-500',
            red: 'bg-red-500',
            amber: 'bg-amber-500',
          };

          return (
            <div key={idx} className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 relative overflow-hidden flex items-center gap-4">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${colorMap[stat.color].split(' ').slice(0,2).join(' ')}`}>
                <Icon className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-500 font-semibold mb-0.5">{stat.label}</p>
                <div className="flex items-baseline gap-2">
                  <h3 className="text-2xl font-black text-slate-800">{stat.value}</h3>
                  <span className={`text-xs font-medium ${stat.trend.startsWith('+') ? 'text-emerald-600' : 'text-slate-500'}`}>
                    {stat.trend}
                  </span>
                </div>
              </div>
              <div className={`h-1 absolute bottom-0 left-0 right-0 ${barColorMap[stat.color]}`}></div>
            </div>
          );
        })}
      </div>

      {/* Main Content Layout */}
      <div className="flex flex-col lg:flex-row gap-5">
        
        {/* Left Column - Main Table */}
        <div className="flex-1 min-w-0">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-full">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-800">Rekap Komprehensif Siswa</h2>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input 
                    type="text" 
                    placeholder="Cari siswa..." 
                    className="pl-9 pr-4 py-1.5 bg-slate-50 border border-slate-200 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-slate-800 focus:border-transparent w-48 transition-all"
                  />
                </div>
                <button className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-lg transition-colors border border-slate-200">
                  <Filter className="w-4 h-4" />
                </button>
              </div>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="p-4 text-xs font-semibold text-slate-500 uppercase tracking-wider w-12 text-center">No</th>
                    <th className="p-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Nama Siswa</th>
                    <th className="p-4 text-xs font-semibold text-slate-500 uppercase tracking-wider w-32">Kehadiran</th>
                    <th className="p-4 text-xs font-semibold text-slate-500 uppercase tracking-wider w-24 text-center">Nilai</th>
                    <th className="p-4 text-xs font-semibold text-slate-500 uppercase tracking-wider w-24 text-center">Poin</th>
                    <th className="p-4 text-xs font-semibold text-slate-500 uppercase tracking-wider w-32">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {students.map((student, idx) => (
                    <tr key={student.id} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="p-4 text-sm text-slate-500 text-center font-medium">{idx + 1}</td>
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${student.avatarBg}`}>
                            {student.name.split(' ').map(n => n[0]).join('')}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-slate-800 group-hover:text-blue-600 transition-colors">{student.name}</p>
                            <p className="text-xs text-slate-400">NIS: 100{student.id + 20}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-slate-700 w-8">{student.attendance}%</span>
                          <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div 
                              className={`h-full rounded-full ${getAttendanceColor(student.attendance)}`} 
                              style={{ width: `${student.attendance}%` }}
                            ></div>
                          </div>
                        </div>
                      </td>
                      <td className="p-4 text-center">
                        <span className="text-sm font-bold text-slate-700">{student.grade.toFixed(1)}</span>
                      </td>
                      <td className="p-4 text-center">
                        <span className={`inline-flex items-center justify-center px-2 py-0.5 rounded-full text-xs font-semibold min-w-[2rem] ${getPointsBadge(student.points)}`}>
                          {student.points}
                        </span>
                      </td>
                      <td className="p-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${getStatusBadge(student.status)}`}>
                          {student.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {/* Pagination Info */}
            <div className="p-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 bg-slate-50/50 mt-auto">
              <span>Menampilkan 1-10 dari 32 siswa</span>
              <div className="flex items-center gap-1">
                <button className="px-2 py-1 rounded border border-slate-200 bg-white text-slate-400 cursor-not-allowed">Seb</button>
                <button className="px-2 py-1 rounded border border-slate-800 bg-slate-800 text-white">1</button>
                <button className="px-2 py-1 rounded border border-slate-200 bg-white hover:bg-slate-50">2</button>
                <button className="px-2 py-1 rounded border border-slate-200 bg-white hover:bg-slate-50">3</button>
                <button className="px-2 py-1 rounded border border-slate-200 bg-white hover:bg-slate-50">Lanjut</button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Sidebar */}
        <div className="w-full lg:w-72 shrink-0 flex flex-col gap-5">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 flex flex-col h-full">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center shrink-0">
                <BookOpen className="w-4 h-4" />
              </div>
              <h2 className="text-sm font-bold text-slate-800">Catatan Jurnal Kelas</h2>
            </div>
            
            <div className="flex-1 space-y-4">
              {journals.map((journal) => (
                <div key={journal.id} className="relative pl-4 border-l-2 border-slate-100 pb-2 last:pb-0">
                  <div className="absolute w-2.5 h-2.5 rounded-full bg-slate-200 border-2 border-white -left-[7px] top-1"></div>
                  <div className="mb-1 flex items-center justify-between">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{journal.date}</span>
                  </div>
                  <h4 className="text-sm font-semibold text-slate-800 mb-0.5">{journal.subject}</h4>
                  <p className="text-xs text-slate-600 mb-1 leading-relaxed">{journal.topic}</p>
                  <div className="flex items-center gap-1.5 mt-2">
                    <div className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center text-[9px] font-bold text-slate-500">
                      {journal.teacher.split(' ').map(n => n[0]).join('').substring(0, 2)}
                    </div>
                    <span className="text-xs text-slate-500 font-medium">{journal.teacher}</span>
                  </div>
                </div>
              ))}
            </div>
            
            <button className="mt-5 w-full py-2 bg-slate-50 hover:bg-slate-100 text-slate-600 text-xs font-semibold rounded-lg transition-colors border border-slate-200 flex items-center justify-center gap-1.5">
              <span>Lihat Semua Jurnal</span>
              <ChevronRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
