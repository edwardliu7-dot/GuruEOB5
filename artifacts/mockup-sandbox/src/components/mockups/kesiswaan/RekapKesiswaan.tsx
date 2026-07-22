import React from "react";
import { 
  Users, 
  UserCheck, 
  AlertTriangle, 
  AlertCircle, 
  ChevronRight, 
  Download,
  Filter,
  TrendingDown,
  TrendingUp,
  Award,
  MoreHorizontal
} from "lucide-react";

export function RekapKesiswaan() {
  const stats = [
    {
      title: "Total Siswa",
      value: "128",
      icon: <Users size={24} className="text-blue-600" />,
      bg: "bg-blue-100",
      bar: "bg-blue-500",
    },
    {
      title: "Rata-rata Kehadiran",
      value: "91%",
      icon: <UserCheck size={24} className="text-emerald-600" />,
      bg: "bg-emerald-100",
      bar: "bg-emerald-500",
    },
    {
      title: "Total Poin Pelanggaran",
      value: "380",
      icon: <TrendingDown size={24} className="text-red-600" />,
      bg: "bg-red-100",
      bar: "bg-red-500",
    },
    {
      title: "Siswa Kritis",
      value: "7",
      icon: <AlertTriangle size={24} className="text-amber-600" />,
      bg: "bg-amber-100",
      bar: "bg-amber-500",
    },
  ];

  const classes = [
    { id: "VII A", wali: "Siti Aminah, S.Pd", total: 32, kehadiran: 94, poin: 45, kritis: 1, status: "Baik" },
    { id: "VII B", wali: "Budi Santoso, M.Pd", total: 31, kehadiran: 92, poin: 60, kritis: 2, status: "Perhatian" },
    { id: "VIII A", wali: "Rina Wati, S.Pd", total: 32, kehadiran: 85, poin: 150, kritis: 3, status: "Kritis" },
    { id: "VIII B", wali: "Joko Susilo, S.Kom", total: 33, kehadiran: 95, poin: 30, kritis: 0, status: "Baik" },
    { id: "IX A", wali: "Sri Wahyuni, S.Pd", total: 30, kehadiran: 90, poin: 85, kritis: 1, status: "Perhatian" },
    { id: "IX B", wali: "Agus Setiawan, S.Pd", total: 31, kehadiran: 96, poin: 20, kritis: 0, status: "Baik" },
    { id: "IX C", wali: "Dian Pratiwi, M.Pd", total: 30, kehadiran: 89, poin: 95, kritis: 2, status: "Kritis" },
  ];

  const topPelanggaran = [
    { name: "Andi Pratama", kelas: "VIII A", poin: 150, initials: "AP", bg: "bg-slate-200 text-slate-700" },
    { name: "Bima Sakti", kelas: "VIII A", poin: 120, initials: "BS", bg: "bg-slate-200 text-slate-700" },
    { name: "Citra Kirana", kelas: "IX C", poin: 95, initials: "CK", bg: "bg-slate-200 text-slate-700" },
    { name: "Deni Saputra", kelas: "VII B", poin: 85, initials: "DS", bg: "bg-slate-200 text-slate-700" },
    { name: "Eka Prasetya", kelas: "VIII A", poin: 80, initials: "EP", bg: "bg-slate-200 text-slate-700" },
    { name: "Fajar Hidayat", kelas: "VII A", poin: 75, initials: "FH", bg: "bg-slate-200 text-slate-700" },
  ];

  const topPrestasi = [
    { name: "Giselda Anissa", kelas: "IX B", poin: "+150", initials: "GA", bg: "bg-emerald-100 text-emerald-700" },
    { name: "Hani Safitri", kelas: "VIII B", poin: "+120", initials: "HS", bg: "bg-emerald-100 text-emerald-700" },
    { name: "Ihsan Kamil", kelas: "VII A", poin: "+100", initials: "IK", bg: "bg-emerald-100 text-emerald-700" },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Baik":
        return "bg-emerald-100 text-emerald-700";
      case "Perhatian":
        return "bg-amber-100 text-amber-700";
      case "Kritis":
        return "bg-red-100 text-red-700";
      default:
        return "bg-slate-100 text-slate-700";
    }
  };

  const getProgressColor = (kehadiran: number) => {
    if (kehadiran >= 93) return "bg-emerald-500";
    if (kehadiran >= 90) return "bg-amber-500";
    return "bg-red-500";
  };

  return (
    <div className="min-h-screen bg-[#f5f5f4] font-sans text-slate-800 p-6">
      {/* Top Section */}
      <div className="flex justify-between items-end mb-6">
        <div>
          <div className="flex items-center text-xs text-slate-400 mb-2 font-medium">
            <span>Dashboard</span>
            <ChevronRight size={12} className="mx-1" />
            <span className="text-slate-600">Kesiswaan</span>
          </div>
          <h1 className="text-xl font-bold text-slate-800">Rekap Kesiswaan</h1>
          <p className="text-sm text-slate-500 mt-0.5">Monitoring absensi dan poin pelanggaran siswa seluruh kelas</p>
        </div>
        <div className="flex gap-2">
          <button className="flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-slate-200 text-slate-600 text-sm font-medium hover:bg-slate-50 transition-colors">
            <Filter size={16} />
            Filter
          </button>
          <button className="flex items-center gap-2 px-4 py-2 rounded-full bg-slate-800 text-white text-sm font-medium hover:bg-slate-700 transition-colors">
            <Download size={16} />
            Export Laporan
          </button>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-4 gap-5 mb-6">
        {stats.map((stat, i) => (
          <div key={i} className="relative bg-white rounded-xl border border-slate-200 shadow-sm p-5 flex items-center gap-4 overflow-hidden">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${stat.bg}`}>
              {stat.icon}
            </div>
            <div>
              <div className="text-3xl font-black text-slate-800 leading-none mb-1">{stat.value}</div>
              <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{stat.title}</div>
            </div>
            <div className={`h-1 absolute bottom-0 left-0 right-0 ${stat.bar}`} />
          </div>
        ))}
      </div>

      {/* Main Two-Column Layout */}
      <div className="flex gap-5 items-start">
        {/* Left Column - Table */}
        <div className="flex-1">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 px-1">Ringkasan Per Kelas</div>
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  <th className="p-4 font-semibold">Kelas</th>
                  <th className="p-4 font-semibold">Wali Kelas</th>
                  <th className="p-4 font-semibold text-center">Jml Siswa</th>
                  <th className="p-4 font-semibold w-40">Kehadiran</th>
                  <th className="p-4 font-semibold text-center">Total Poin</th>
                  <th className="p-4 font-semibold text-center">Kritis</th>
                  <th className="p-4 font-semibold text-center">Status</th>
                  <th className="p-4 w-10"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {classes.map((cls, i) => (
                  <tr key={i} className="hover:bg-slate-50 transition-colors group">
                    <td className="p-4 font-bold text-slate-800 whitespace-nowrap">{cls.id}</td>
                    <td className="p-4 text-slate-600 whitespace-nowrap">{cls.wali}</td>
                    <td className="p-4 text-center text-slate-600">{cls.total}</td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-700 w-8">{cls.kehadiran}%</span>
                        <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div 
                            className={`h-full rounded-full ${getProgressColor(cls.kehadiran)}`}
                            style={{ width: `${cls.kehadiran}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="p-4 text-center font-semibold text-slate-700">
                      {cls.poin > 0 ? (
                        <span className={cls.poin > 100 ? "text-red-600" : "text-slate-700"}>{cls.poin}</span>
                      ) : (
                        "-"
                      )}
                    </td>
                    <td className="p-4 text-center">
                      {cls.kritis > 0 ? (
                        <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-red-100 text-red-700 font-bold text-xs">
                          {cls.kritis}
                        </span>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>
                    <td className="p-4 text-center">
                      <span className={`inline-flex items-center justify-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${getStatusColor(cls.status)}`}>
                        {cls.status}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <button className="text-slate-400 hover:text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity">
                        <MoreHorizontal size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Column - Sidebars */}
        <div className="w-72 flex flex-col gap-5">
          {/* Top Pelanggaran */}
          <div>
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 px-1">Top Pelanggaran</div>
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
              <div className="p-4 border-b border-slate-100 flex items-center gap-2 bg-slate-50/50">
                <AlertCircle size={18} className="text-red-500" />
                <span className="font-semibold text-sm text-slate-800">Perlu Perhatian Khusus</span>
              </div>
              <div className="p-2 flex flex-col gap-1">
                {topPelanggaran.map((siswa, i) => (
                  <div key={i} className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${siswa.bg}`}>
                        {siswa.initials}
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm font-semibold text-slate-800 leading-tight">{siswa.name}</span>
                        <span className="text-xs text-slate-500">{siswa.kelas}</span>
                      </div>
                    </div>
                    <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-full bg-red-100 text-red-700 text-xs font-bold min-w-[36px]">
                      {siswa.poin}
                    </span>
                  </div>
                ))}
              </div>
              <div className="p-3 border-t border-slate-100">
                <button className="w-full text-center text-xs font-medium text-slate-500 hover:text-slate-800 py-1 transition-colors">
                  Lihat Semua Data
                </button>
              </div>
            </div>
          </div>

          {/* Siswa Berprestasi */}
          <div>
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 px-1">Top Prestasi</div>
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
              <div className="p-4 border-b border-slate-100 flex items-center gap-2 bg-slate-50/50">
                <Award size={18} className="text-emerald-500" />
                <span className="font-semibold text-sm text-slate-800">Siswa Berprestasi</span>
              </div>
              <div className="p-2 flex flex-col gap-1">
                {topPrestasi.map((siswa, i) => (
                  <div key={i} className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${siswa.bg}`}>
                        {siswa.initials}
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm font-semibold text-slate-800 leading-tight">{siswa.name}</span>
                        <span className="text-xs text-slate-500">{siswa.kelas}</span>
                      </div>
                    </div>
                    <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-xs font-bold">
                      {siswa.poin}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
