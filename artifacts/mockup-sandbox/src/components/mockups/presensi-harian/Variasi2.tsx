import React, { useState } from "react";
import {
  Grid,
  Users,
  ClipboardCheck,
  BookOpen,
  Calendar,
  Star,
  PenLine,
  Bell,
  FileText,
  ChevronDown,
  Thermometer,
  Mail,
  AlertTriangle,
  Search,
  CheckCircle2,
  History,
  Check,
  GraduationCap
} from "lucide-react";

type AttendanceStatus = "Hadir" | "Sakit" | "Izin" | "Alpa";

interface Student {
  id: number;
  name: string;
  nickname: string;
  gender: "Laki-laki" | "Perempuan";
  status: AttendanceStatus;
}

export function Variasi2() {
  const [students, setStudents] = useState<Student[]>([
    { id: 1, name: "Adelia Khaira Hakim", nickname: "Adelia", gender: "Perempuan", status: "Hadir" },
    { id: 2, name: "Aldi Ardiansyah", nickname: "Aldi", gender: "Laki-laki", status: "Hadir" },
    { id: 3, name: "Bagas Sakti Wiguna", nickname: "Bagas", gender: "Laki-laki", status: "Hadir" },
    { id: 4, name: "Diash Shabri Rizky", nickname: "Diash", gender: "Laki-laki", status: "Hadir" },
    { id: 5, name: "Khansa Adiba Putri", nickname: "Khansa", gender: "Perempuan", status: "Sakit" },
    { id: 6, name: "Muhammad Farhan", nickname: "Farhan", gender: "Laki-laki", status: "Alpa" },
  ]);

  const stats = {
    Hadir: students.filter((s) => s.status === "Hadir").length,
    Sakit: students.filter((s) => s.status === "Sakit").length,
    Izin: students.filter((s) => s.status === "Izin").length,
    Alpa: students.filter((s) => s.status === "Alpa").length,
  };

  const totalStudents = students.length;
  const recordedCount = students.length; // All have status assigned
  const unrecordedCount = totalStudents - recordedCount;

  const handleStatusChange = (id: number, newStatus: AttendanceStatus) => {
    setStudents((prev) =>
      prev.map((s) => (s.id === id ? { ...s, status: newStatus } : s))
    );
  };

  const handleSetAllHadir = () => {
    setStudents((prev) => prev.map((s) => ({ ...s, status: "Hadir" })));
  };

  return (
    <div className="flex min-h-screen bg-[#f5f5f4] font-sans text-slate-800">
      {/* Sidebar */}
      <aside className="w-[240px] flex-shrink-0 bg-[#4a2c17] text-white flex flex-col shadow-xl z-10 relative">
        <div className="p-5 flex items-center gap-3">
          <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center">
            <GraduationCap className="text-white w-6 h-6" />
          </div>
          <div>
            <div className="font-bold tracking-wider text-sm">GURU EOB5</div>
            <div className="text-[10px] text-white/60 tracking-widest uppercase">Sistem Administrasi</div>
          </div>
        </div>

        <div className="px-5 py-4 border-t border-white/10">
          <div className="text-[10px] font-semibold text-white/50 mb-2 tracking-widest uppercase">Kelas Aktif</div>
          <button className="flex w-full items-center justify-between bg-white/10 hover:bg-white/20 transition-colors rounded-lg px-3 py-2 text-sm text-left">
            <span className="font-medium truncate">VII Ibnu Battutah</span>
            <ChevronDown className="w-4 h-4 opacity-70 flex-shrink-0" />
          </button>
        </div>

        {/* Hari ini section */}
        {unrecordedCount > 0 && (
          <div className="px-5 py-3 border-t border-white/10">
            <div className="text-[10px] font-semibold text-white/50 mb-2 tracking-widest uppercase">Hari ini</div>
            <div className="flex items-center gap-2 bg-amber-500/20 border border-amber-400/30 rounded-lg px-3 py-2">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-300 flex-shrink-0" />
              <span className="text-xs font-medium text-amber-100">{unrecordedCount} siswa belum dicatat</span>
            </div>
          </div>
        )}

        <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto [&::-webkit-scrollbar]:hidden [scrollbar-width:none]">
          {[
            { name: "Dashboard", icon: Grid },
            { name: "Data Siswa", icon: Users },
            { name: "Absensi", icon: ClipboardCheck, active: true },
            { name: "Buku Nilai", icon: BookOpen },
            { name: "Jadwal Pelajaran", icon: Calendar },
            { name: "Poin Siswa", icon: Star },
            { name: "Jurnal Mengajar", icon: PenLine },
            { name: "Info Pekanan", icon: Bell },
            { name: "Bahan Ajar", icon: FileText },
          ].map((item) => (
            <a
              key={item.name}
              href="#"
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                item.active
                  ? "bg-[#6b4423] text-white font-medium shadow-sm"
                  : "text-white/70 hover:bg-white/5 hover:text-white"
              }`}
            >
              <item.icon className={`w-4 h-4 ${item.active ? "opacity-100" : "opacity-70"}`} />
              {item.name}
            </a>
          ))}
        </nav>

        <div className="p-4 text-center text-xs text-white/50 border-t border-white/10 font-medium">
          By GuruEOB5
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 shadow-sm z-0">
          <div className="text-sm font-medium text-slate-500">
            Tahun Ajaran 2024/2025 &bull; IPA
          </div>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2 text-xs font-medium text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-100">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              Auto-save aktif
            </div>
            <div className="flex items-center gap-3 pl-6 border-l border-slate-200">
              <div className="text-right hidden sm:block">
                <div className="text-sm font-bold text-slate-700">Koko Komarudin</div>
                <div className="text-xs text-slate-500">Guru Mapel</div>
              </div>
              <div className="w-9 h-9 rounded-full bg-[#4a2c17] text-white flex items-center justify-center text-sm font-bold shadow-sm">
                KK
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-6 overflow-y-auto">
          {/* Title & Date */}
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
            <div>
              <div className="text-xs text-slate-500 mb-1 font-medium">Kelas / Absensi</div>
              <h1 className="text-xl font-semibold text-slate-800">Presensi Harian Siswa</h1>
              <p className="text-slate-500 mt-1 text-sm">Pencatatan kehadiran kelas aktif</p>
            </div>
            <div className="flex items-center gap-2 bg-white border border-slate-200 px-4 py-2 rounded-full shadow-sm text-sm font-medium text-slate-700">
              <Calendar className="w-4 h-4 text-slate-400" />
              <span>22/07/2026</span>
            </div>
          </div>

          {/* Stat Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-xl border border-emerald-100 p-4 shadow-sm flex items-center gap-4 relative overflow-hidden group">
              <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-600 flex-shrink-0">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-3xl font-black text-emerald-700">{stats.Hadir}</div>
                <div className="text-xs font-bold text-emerald-600/80 uppercase tracking-wide">Hadir</div>
              </div>
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-emerald-100">
                <div 
                  className="h-full bg-emerald-500 transition-all duration-500"
                  style={{ width: `${(stats.Hadir / totalStudents) * 100}%` }}
                ></div>
              </div>
            </div>
            
            <div className="bg-white rounded-xl border border-orange-100 p-4 shadow-sm flex items-center gap-4 relative overflow-hidden group">
              <div className="w-12 h-12 rounded-xl bg-orange-100 flex items-center justify-center text-orange-500 flex-shrink-0">
                <Thermometer className="w-6 h-6" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-3xl font-black text-orange-600">{stats.Sakit}</div>
                <div className="text-xs font-bold text-orange-500/80 uppercase tracking-wide">Sakit</div>
              </div>
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-orange-100">
                <div 
                  className="h-full bg-orange-500 transition-all duration-500"
                  style={{ width: `${(stats.Sakit / totalStudents) * 100}%` }}
                ></div>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-blue-100 p-4 shadow-sm flex items-center gap-4 relative overflow-hidden group">
              <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600 flex-shrink-0">
                <Mail className="w-6 h-6" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-3xl font-black text-blue-700">{stats.Izin}</div>
                <div className="text-xs font-bold text-blue-600/80 uppercase tracking-wide">Izin</div>
              </div>
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-blue-100">
                <div 
                  className="h-full bg-blue-500 transition-all duration-500"
                  style={{ width: `${(stats.Izin / totalStudents) * 100}%` }}
                ></div>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-red-100 p-4 shadow-sm flex items-center gap-4 relative overflow-hidden group">
              <div className="w-12 h-12 rounded-xl bg-red-100 flex items-center justify-center text-red-600 flex-shrink-0">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-3xl font-black text-red-600">{stats.Alpa}</div>
                <div className="text-xs font-bold text-red-500/80 uppercase tracking-wide">Alpa</div>
              </div>
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-red-100">
                <div 
                  className="h-full bg-red-500 transition-all duration-500"
                  style={{ width: `${(stats.Alpa / totalStudents) * 100}%` }}
                ></div>
              </div>
            </div>
          </div>

          {/* Action Bar */}
          <div className="flex flex-col sm:flex-row items-center gap-4 mb-4">
            <div className="relative flex-1 max-w-md w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Cari nama siswa..."
                className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#4a2c17] focus:border-transparent transition-all shadow-sm"
              />
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 text-slate-600 rounded-full text-xs font-semibold border border-slate-200">
              <CheckCircle2 className="w-3.5 h-3.5" />
              {recordedCount} / {totalStudents} tercatat
            </div>
            <button
              onClick={handleSetAllHadir}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-medium transition-colors shadow-sm w-full sm:w-auto"
            >
              <Check className="w-4 h-4" />
              Set Semua Hadir
            </button>
          </div>

          {/* Table and History Container */}
          <div className="flex flex-col lg:flex-row gap-6 items-start">
            
            {/* Main Table Card */}
            <div className="flex-1 bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden w-full">
              <div className="px-5 py-4 border-b border-slate-100">
                <h2 className="font-bold text-slate-800 flex items-center gap-2">
                  <Users className="w-4 h-4 text-slate-400" />
                  Daftar Siswa
                </h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left min-w-[600px]">
                  <thead className="text-xs text-slate-500 bg-slate-50 border-b border-slate-100">
                    <tr>
                      <th className="px-5 py-3 font-semibold uppercase tracking-wider w-16">No</th>
                      <th className="px-5 py-3 font-semibold uppercase tracking-wider">Nama Lengkap</th>
                      <th className="px-5 py-3 font-semibold uppercase tracking-wider text-center">STATUS</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {students.map((s, idx) => (
                      <tr key={s.id} className={`hover:bg-slate-50 transition-colors ${idx % 2 === 1 ? 'bg-slate-50/50' : ''}`}>
                        <td className="px-5 py-3 text-slate-400 font-medium">
                          {s.id}
                        </td>
                        <td className="px-5 py-3">
                          <div className="font-semibold text-slate-800">{s.name}</div>
                          <div className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                            <span className="px-1.5 py-0.5 bg-slate-100 rounded text-slate-600 font-medium">
                              {s.nickname}
                            </span>
                            <span>&bull;</span>
                            <span>{s.gender}</span>
                          </div>
                        </td>
                        <td className="px-5 py-3">
                          <div className="flex items-center justify-center">
                            <div className="inline-flex items-center bg-slate-100 rounded-lg p-0.5 border border-slate-200">
                              <button
                                onClick={() => handleStatusChange(s.id, "Hadir")}
                                className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                                  s.status === "Hadir"
                                    ? "bg-emerald-500 text-white shadow-sm"
                                    : "text-slate-600 hover:bg-slate-200/50"
                                }`}
                              >
                                Hadir
                              </button>
                              <button
                                onClick={() => handleStatusChange(s.id, "Sakit")}
                                className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                                  s.status === "Sakit"
                                    ? "bg-orange-500 text-white shadow-sm"
                                    : "text-slate-600 hover:bg-slate-200/50"
                                }`}
                              >
                                Sakit
                              </button>
                              <button
                                onClick={() => handleStatusChange(s.id, "Izin")}
                                className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                                  s.status === "Izin"
                                    ? "bg-blue-500 text-white shadow-sm"
                                    : "text-slate-600 hover:bg-slate-200/50"
                                }`}
                              >
                                Izin
                              </button>
                              <button
                                onClick={() => handleStatusChange(s.id, "Alpa")}
                                className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                                  s.status === "Alpa"
                                    ? "bg-red-500 text-white shadow-sm"
                                    : "text-slate-600 hover:bg-slate-200/50"
                                }`}
                              >
                                Alpa
                              </button>
                            </div>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Right History Panel */}
            <div className="w-full lg:w-[320px] bg-white border border-slate-200 rounded-xl shadow-sm flex flex-col shrink-0">
              <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2">
                <History className="w-4 h-4 text-slate-400" />
                <h2 className="font-bold text-slate-800 text-sm uppercase tracking-wide">Rekap Riwayat</h2>
              </div>
              <div className="p-5 space-y-6">
                
                {/* History Item 1 */}
                <div className="relative pl-4 border-l-2 border-orange-200">
                  <div className="absolute w-2.5 h-2.5 bg-orange-400 rounded-full -left-[6px] top-1.5 ring-4 ring-white"></div>
                  <div className="flex items-center justify-between mb-1">
                    <div className="text-xs font-bold text-slate-500">Rab, 22 Jul</div>
                    <div className="text-xs text-slate-400 font-medium">4/6</div>
                  </div>
                  <div className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-red-50 text-red-600 border border-red-100 mb-2">
                    1 Tidak Hadir
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded bg-orange-50 border border-orange-100 text-xs text-orange-700">
                      <div className="w-4 h-4 rounded bg-orange-200 text-orange-700 flex items-center justify-center text-[8px] font-bold">K</div>
                      Khansa (Sakit)
                    </span>
                  </div>
                </div>

                {/* History Item 2 */}
                <div className="relative pl-4 border-l-2 border-emerald-200">
                  <div className="absolute w-2.5 h-2.5 bg-emerald-400 rounded-full -left-[6px] top-1.5 ring-4 ring-white"></div>
                  <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-gradient-to-b from-emerald-400/20 to-transparent"></div>
                  <div className="flex items-center justify-between mb-1">
                    <div className="text-xs font-bold text-slate-500">Sel, 21 Jul</div>
                    <div className="text-xs text-emerald-600 font-semibold">6/6</div>
                  </div>
                  <div className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-600 border border-emerald-100">
                    Semua Hadir
                  </div>
                </div>

                {/* History Item 3 */}
                <div className="relative pl-4 border-l-2 border-orange-200">
                  <div className="absolute w-2.5 h-2.5 bg-orange-400 rounded-full -left-[6px] top-1.5 ring-4 ring-white"></div>
                  <div className="flex items-center justify-between mb-1">
                    <div className="text-xs font-bold text-slate-500">Sen, 20 Jul</div>
                    <div className="text-xs text-slate-400 font-medium">4/6</div>
                  </div>
                  <div className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-red-50 text-red-600 border border-red-100 mb-2">
                    2 Tidak Hadir
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded bg-orange-50 border border-orange-100 text-xs text-orange-700">
                      <div className="w-4 h-4 rounded bg-orange-200 text-orange-700 flex items-center justify-center text-[8px] font-bold">A</div>
                      Adelia (Sakit)
                    </span>
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded bg-red-50 border border-red-100 text-xs text-red-700">
                      <div className="w-4 h-4 rounded bg-red-200 text-red-700 flex items-center justify-center text-[8px] font-bold">F</div>
                      Farhan (Alpa)
                    </span>
                  </div>
                </div>

              </div>
              <div className="mt-auto border-t border-slate-100 px-5 py-3 text-center">
                <button className="text-sm font-semibold text-[#4a2c17] hover:text-[#6b4423] transition-colors w-full">
                  Lihat Riwayat Lengkap &rarr;
                </button>
              </div>
            </div>

          </div>

        </main>
      </div>
    </div>
  );
}
