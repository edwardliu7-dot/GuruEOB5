import React, { useState } from 'react';
import { 
  ChevronRight, 
  Plus, 
  TrendingUp, 
  TrendingDown, 
  BarChart, 
  Trophy, 
  AlertCircle,
  MoreVertical,
  History,
  Users
} from 'lucide-react';

export function PoinSiswa() {
  const [activeTab, setActiveTab] = useState('Riwayat');

  const stats = [
    {
      title: 'Poin Masuk',
      value: '425',
      icon: <TrendingUp className="w-6 h-6" />,
      color: 'emerald',
      bgColor: 'bg-emerald-100',
      textColor: 'text-emerald-600',
      barColor: 'bg-emerald-500',
    },
    {
      title: 'Poin Keluar',
      value: '-185',
      icon: <TrendingDown className="w-6 h-6" />,
      color: 'rose',
      bgColor: 'bg-rose-100',
      textColor: 'text-rose-600',
      barColor: 'bg-rose-500',
    },
    {
      title: 'Saldo Bersih',
      value: '240',
      icon: <BarChart className="w-6 h-6" />,
      color: 'blue',
      bgColor: 'bg-blue-100',
      textColor: 'text-blue-600',
      barColor: 'bg-blue-500',
    }
  ];

  const recentHistory = [
    { id: 1, date: '12 Okt 2023', student: 'Budi Santoso', initials: 'BS', avatarBg: 'bg-blue-100 text-blue-700', description: 'Terlambat lebih dari 15 menit', type: 'negative', points: -15 },
    { id: 2, date: '12 Okt 2023', student: 'Siti Aminah', initials: 'SA', avatarBg: 'bg-rose-100 text-rose-700', description: 'Juara 1 Lomba Cerdas Cermat', type: 'positive', points: +50 },
    { id: 3, date: '11 Okt 2023', student: 'Andi Saputra', initials: 'AS', avatarBg: 'bg-amber-100 text-amber-700', description: 'Seragam tidak lengkap', type: 'negative', points: -5 },
    { id: 4, date: '10 Okt 2023', student: 'Dewi Lestari', initials: 'DL', avatarBg: 'bg-emerald-100 text-emerald-700', description: 'Membantu guru membawa buku', type: 'positive', points: +10 },
    { id: 5, date: '09 Okt 2023', student: 'Rizky Pratama', initials: 'RP', avatarBg: 'bg-indigo-100 text-indigo-700', description: 'Mengerjakan PR di sekolah', type: 'negative', points: -10 },
    { id: 6, date: '08 Okt 2023', student: 'Nisa Khasanah', initials: 'NK', avatarBg: 'bg-purple-100 text-purple-700', description: 'Piket kelas tepat waktu', type: 'positive', points: +5 },
    { id: 7, date: '08 Okt 2023', student: 'Eko Prasetyo', initials: 'EP', avatarBg: 'bg-orange-100 text-orange-700', description: 'Bertengkar dengan teman', type: 'negative', points: -25 },
    { id: 8, date: '07 Okt 2023', student: 'Ayu Wandira', initials: 'AW', avatarBg: 'bg-pink-100 text-pink-700', description: 'Juara kelas paruh waktu', type: 'positive', points: +25 },
  ];

  const topPelanggaran = [
    { id: 1, student: 'Eko Prasetyo', initials: 'EP', avatarBg: 'bg-orange-100 text-orange-700', points: -45, count: 3 },
    { id: 2, student: 'Budi Santoso', initials: 'BS', avatarBg: 'bg-blue-100 text-blue-700', points: -30, count: 2 },
    { id: 3, student: 'Rizky Pratama', initials: 'RP', avatarBg: 'bg-indigo-100 text-indigo-700', points: -20, count: 2 },
  ];

  const topPrestasi = [
    { id: 1, student: 'Siti Aminah', initials: 'SA', avatarBg: 'bg-rose-100 text-rose-700', points: +85, count: 3 },
    { id: 2, student: 'Ayu Wandira', initials: 'AW', avatarBg: 'bg-pink-100 text-pink-700', points: +40, count: 2 },
    { id: 3, student: 'Dewi Lestari', initials: 'DL', avatarBg: 'bg-emerald-100 text-emerald-700', points: +35, count: 4 },
  ];

  return (
    <div className="min-h-screen bg-[#f5f5f4] p-6 font-sans text-slate-800">
      
      {/* Top Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <div className="flex items-center text-xs text-slate-400 mb-2">
            <span>Beranda</span>
            <ChevronRight className="w-3 h-3 mx-1" />
            <span>Kesiswaan</span>
            <ChevronRight className="w-3 h-3 mx-1" />
            <span className="text-slate-600 font-medium">Poin Siswa</span>
          </div>
          <h1 className="text-xl font-bold text-slate-800">Poin Siswa</h1>
          <p className="text-sm text-slate-500">Rekap poin tata tertib kelas perwalian IX-A</p>
        </div>
        
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 rounded-full bg-slate-800 text-white px-4 py-2 text-sm font-medium hover:bg-slate-700 transition-colors shadow-sm">
            <Plus className="w-4 h-4" />
            Tambah Poin
          </button>
        </div>
      </div>

      {/* Pill-group switcher */}
      <div className="flex items-center gap-2 mb-8 bg-slate-200/50 p-1 rounded-full w-max">
        {['Riwayat', 'Rekap Siswa'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
              activeTab === tab 
                ? 'bg-white text-slate-800 shadow-sm' 
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            {tab === 'Riwayat' && <History className="w-4 h-4" />}
            {tab === 'Rekap Siswa' && <Users className="w-4 h-4" />}
            {tab}
          </button>
        ))}
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
        {stats.map((stat, idx) => (
          <div key={idx} className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 flex items-center gap-4 relative overflow-hidden">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${stat.bgColor} ${stat.textColor}`}>
              {stat.icon}
            </div>
            <div>
              <div className="text-xs uppercase tracking-wide text-slate-500 font-semibold mb-1">{stat.title}</div>
              <div className="text-3xl font-black text-slate-800">{stat.value}</div>
            </div>
            <div className={`h-1 absolute bottom-0 left-0 right-0 ${stat.barColor}`} />
          </div>
        ))}
      </div>

      {/* Main Content Area */}
      <div className="flex flex-col lg:flex-row gap-5">
        
        {/* Left Column - Table */}
        <div className="flex-1">
          <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Riwayat Poin Terbaru</h2>
          
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-xs uppercase text-slate-500 border-b border-slate-200">
                    <th className="font-semibold p-4">Tanggal</th>
                    <th className="font-semibold p-4">Siswa</th>
                    <th className="font-semibold p-4">Keterangan</th>
                    <th className="font-semibold p-4 text-right">Poin</th>
                    <th className="font-semibold p-4 w-10"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {recentHistory.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="p-4 text-slate-500 whitespace-nowrap">{item.date}</td>
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${item.avatarBg}`}>
                            {item.initials}
                          </div>
                          <span className="font-medium text-slate-700">{item.student}</span>
                        </div>
                      </td>
                      <td className="p-4 text-slate-600">{item.description}</td>
                      <td className="p-4 text-right">
                        <span className={`inline-flex items-center justify-center rounded-full px-2.5 py-0.5 text-xs font-bold ${
                          item.type === 'positive' 
                            ? 'bg-emerald-100 text-emerald-700' 
                            : 'bg-rose-100 text-rose-700'
                        }`}>
                          {item.points > 0 ? `+${item.points}` : item.points}
                        </span>
                      </td>
                      <td className="p-4">
                        <button className="text-slate-400 hover:text-slate-600 rounded-full p-1 hover:bg-slate-100 transition-colors">
                          <MoreVertical className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            <div className="border-t border-slate-200 p-4 flex justify-center bg-slate-50">
              <button className="text-sm font-medium text-slate-600 hover:text-slate-800 transition-colors">
                Lihat Semua Riwayat
              </button>
            </div>
          </div>
        </div>

        {/* Right Column - Sidebars */}
        <div className="w-full lg:w-72 flex flex-col gap-5">
          
          {/* Top Pelanggaran */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
            <div className="p-4 border-b border-slate-100 flex items-center gap-3 bg-rose-50/30">
              <div className="w-8 h-8 rounded-lg bg-rose-100 text-rose-600 flex items-center justify-center">
                <AlertCircle className="w-4 h-4" />
              </div>
              <h3 className="font-bold text-slate-800 text-sm">Top Pelanggaran</h3>
            </div>
            
            <div className="p-4 flex flex-col gap-4">
              {topPelanggaran.map((item, idx) => (
                <div key={item.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-bold text-slate-400 w-4">{idx + 1}</span>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${item.avatarBg}`}>
                      {item.initials}
                    </div>
                    <div>
                      <div className="font-medium text-slate-700 text-sm">{item.student}</div>
                      <div className="text-xs text-slate-400">{item.count} catatan</div>
                    </div>
                  </div>
                  <span className="inline-flex rounded-full bg-rose-100 text-rose-700 px-2 py-0.5 text-xs font-bold">
                    {item.points}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Prestasi Tertinggi */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
            <div className="p-4 border-b border-slate-100 flex items-center gap-3 bg-emerald-50/30">
              <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center">
                <Trophy className="w-4 h-4" />
              </div>
              <h3 className="font-bold text-slate-800 text-sm">Prestasi Tertinggi</h3>
            </div>
            
            <div className="p-4 flex flex-col gap-4">
              {topPrestasi.map((item, idx) => (
                <div key={item.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-bold text-slate-400 w-4">{idx + 1}</span>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${item.avatarBg}`}>
                      {item.initials}
                    </div>
                    <div>
                      <div className="font-medium text-slate-700 text-sm">{item.student}</div>
                      <div className="text-xs text-slate-400">{item.count} apresiasi</div>
                    </div>
                  </div>
                  <span className="inline-flex rounded-full bg-emerald-100 text-emerald-700 px-2 py-0.5 text-xs font-bold">
                    +{item.points}
                  </span>
                </div>
              ))}
            </div>
          </div>

        </div>
        
      </div>
    </div>
  );
}
