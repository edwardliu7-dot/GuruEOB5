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

export function Variasi1() {
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
        
        <div className="h-px bg-white/10 w-full" />

        <div className="px-5 py-4">
          <div className="text-[10px] font-semibold text-white/50 mb-2 tracking-widest uppercase">Kelas Aktif</div>
          <button className="flex w-full items-center justify-between bg-white/10 hover:bg-white/20 transition-colors rounded-lg px-3 py-2 text-sm text-left">
            <span className="font-medium truncate">VII Ibnu Battutah</span>
            <ChevronDown className="w-4 h-4 opacity-70 flex-shrink-0" />
          </button>
        </div>

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

        <div className="p-4 flex items-center justify-center gap-2 border-t border-white/10 text-white/60 text-xs transition-opacity hover:text-white/80">
          <div className="w-5 h-5 bg-white/10 rounded-full flex items-center justify-center">
            <GraduationCap className="w-3 h-3" />
          </div>
          <span className="font-medium">By GuruEOB5</span>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 shadow-sm z-0 shrink-0">
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
            <div className="flex items-center gap-3">
              <div className="w-1.5 h-6 bg-[#4a2c17] rounded-full"></div>
              <div>
                <h1 className="text-xl font-bold text-slate-800 leading-tight">Presensi Harian Siswa</h1>
                <p className="text-sm text-slate-500 mt-0.5">Pencatatan kehadiran kelas aktif</p>
              </div>
            </div>
            <div className="flex items-center gap-2 bg-white border border-slate-200 px-4 py-2 rounded-full shadow-sm text-sm font-medium text-slate-700 ml-auto sm:ml-0">
              <Calendar className="w-4 h-4 text-slate-400" />
              <span>22/07/2026</span>
            </div>
          </div>

          {/* Stat Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-xl border border-slate-200 border-l-4 border-l-emerald-500 p-4 shadow-sm flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600 shrink-0">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <div className="text-3xl font-bold text-emerald-700 leading-none mb-1">{stats.Hadir}</div>
                <div className="flex items-center gap-1.5">
                  <div className="text-xs font-bold text-emerald-600/80 uppercase tracking-wide">Hadir</div>
                  <span className="text-[10px] text-slate-400 font-medium">siswa</span>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-xl border border-slate-200 border-l-4 border-l-orange-500 p-4 shadow-sm flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-orange-50 flex items-center justify-center text-orange-500 shrink-0">
                <Thermometer className="w-5 h-5" />
              </div>
              <div>
                <div className="text-3xl font-bold text-orange-600 leading-none mb-1">{stats.Sakit}</div>
                <div className="flex items-center gap-1.5">
                  <div className="text-xs font-bold text-orange-500/80 uppercase tracking-wide">Sakit</div>
                  <span className="text-[10px] text-slate-400 font-medium">siswa</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 border-l-4 border-l-blue-500 p-4 shadow-sm flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 shrink-0">
                <Mail className="w-5 h-5" />
              </div>
              <div>
                <div className="text-3xl font-bold text-blue-700 leading-none mb-1">{stats.Izin}</div>
                <div className="flex items-center gap-1.5">
                  <div className="text-xs font-bold text-blue-600/80 uppercase tracking-wide">Izin</div>
                  <span className="text-[10px] text-slate-400 font-medium">siswa</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 border-l-4 border-l-red-500 p-4 shadow-sm flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center text-red-600 shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <div className="text-3xl font-bold text-red-600 leading-none mb-1">{stats.Alpa}</div>
                <div className="flex items-center gap-1.5">
                  <div className="text-xs font-bold text-red-500/80 uppercase tracking-wide">Alpa</div>
                  <span className="text-[10px] text-slate-400 font-medium">siswa</span>
                </div>
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
            <button
              onClick={handleSetAllHadir}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-medium transition-colors shadow-sm w-full sm:w-auto shrink-0"
            >
              <Check className="w-4 h-4" />
              Set Semua Hadir
            </button>
            <span className="text-sm text-slate-500 hidden lg:inline-block">
              &bull; Klik status untuk langsung menyimpan
            </span>
          </div>

          {/* Table and History Container */}
          <div className="flex flex-col xl:flex-row gap-6 items-start">
            
            {/* Main Table Card */}
            <div className="flex-1 bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden w-full">
              <div className="px-5 py-4 border-b border-slate-100">
                <h2 className="font-bold text-slate-800 flex items-center gap-2 text-sm">
                  <Users className="w-4 h-4 text-slate-400" />
                  DAFTAR SISWA
                </h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left min-w-[550px]">
                  <thead className="text-[11px] text-slate-500 bg-slate-50 border-b border-slate-100">
                    <tr>
                      <th className="px-5 py-3 font-semibold uppercase tracking-wider w-12 text-center">No</th>
                      <th className="px-5 py-3 font-semibold uppercase tracking-wider">Nama Lengkap</th>
                      <th className="px-5 py-3 font-semibold uppercase tracking-wider text-center">Status Kehadiran</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {students.map((s) => (
                      <tr key={s.id} className="hover:bg-slate-50/50 transition-colors group">
                        <td className="px-5 py-3 text-slate-400 font-medium text-center">
                          {s.id}
                        </td>
                        <td className="px-5 py-3">
                          <div className="font-semibold text-slate-800">{s.name}</div>
                          <div className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                            <span className="px-1.5 py-0.5 bg-slate-100 rounded text-slate-600 font-medium">
                              {s.nickname}
                            </span>
                            <span className="text-slate-300">&bull;</span>
                            <span>{s.gender}</span>
                          </div>
                        </td>
                        <td className="px-5 py-3">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => handleStatusChange(s.id, "Hadir")}
                              className={`px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all ${
                                s.status === "Hadir"
                                  ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-500 shadow-sm"
                                  : "bg-white text-slate-500 ring-1 ring-slate-200 hover:bg-slate-50"
                              }`}
                            >
                              {s.status === "Hadir" && <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />}
                              Hadir
                            </button>
                            <button
                              onClick={() => handleStatusChange(s.id, "Sakit")}
                              className={`px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all ${
                                s.status === "Sakit"
                                  ? "bg-orange-50 text-orange-700 ring-1 ring-orange-500 shadow-sm"
                                  : "bg-white text-slate-500 ring-1 ring-slate-200 hover:bg-slate-50"
                              }`}
                            >
                              {s.status === "Sakit" && <div className="w-1.5 h-1.5 rounded-full bg-orange-500" />}
                              Sakit
                            </button>
                            <button
                              onClick={() => handleStatusChange(s.id, "Izin")}
                              className={`px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all ${
                                s.status === "Izin"
                                  ? "bg-blue-50 text-blue-700 ring-1 ring-blue-500 shadow-sm"
                                  : "bg-white text-slate-500 ring-1 ring-slate-200 hover:bg-slate-50"
                              }`}
                            >
                              {s.status === "Izin" && <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />}
                              Izin
                            </button>
                            <button
                              onClick={() => handleStatusChange(s.id, "Alpa")}
                              className={`px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all ${
                                s.status === "Alpa"
                                  ? "bg-red-50 text-red-700 ring-1 ring-red-500 shadow-sm"
                                  : "bg-white text-slate-500 ring-1 ring-slate-200 hover:bg-slate-50"
                              }`}
                            >
                              {s.status === "Alpa" && <div className="w-1.5 h-1.5 rounded-full bg-red-500" />}
                              Alpa
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Right History Panel */}
            <div className="w-full xl:w-[320px] bg-white border border-slate-200 rounded-xl shadow-sm flex flex-col shrink-0">
              <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2">
                <History className="w-4 h-4 text-slate-400" />
                <h2 className="font-bold text-slate-800 text-[11px] uppercase tracking-wider">REKAP RIWAYAT</h2>
              </div>
              <div className="p-5 space-y-6">
                
                {/* History Item 1 */}
                <div className="relative pl-4 border-l-4 border-orange-200">
                  <div className="absolute w-2.5 h-2.5 bg-orange-400 rounded-full -left-[7px] top-1.5 ring-4 ring-white"></div>
                  <div className="text-[11px] font-bold text-slate-500 mb-1 tracking-wide uppercase">Rab, 22 Jul</div>
                  <div className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-red-50 text-red-600 border border-red-100 mb-2">
                    1 Tidak Hadir
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded bg-orange-50 border border-orange-100 text-[11px] text-orange-700 font-medium">
                      <div className="w-4 h-4 rounded bg-orange-200 text-orange-700 flex items-center justify-center text-[8px] font-bold">K</div>
                      Khansa (Sakit)
                    </span>
                  </div>
                </div>

                {/* History Item 2 */}
                <div className="relative pl-4 border-l-4 border-emerald-200">
                  <div className="absolute w-2.5 h-2.5 bg-emerald-400 rounded-full -left-[7px] top-1.5 ring-4 ring-white"></div>
                  <div className="text-[11px] font-bold text-slate-500 mb-1 tracking-wide uppercase">Sel, 21 Jul</div>
                  <div className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-600 border border-emerald-100">
                    Semua Hadir
                  </div>
                </div>

                {/* History Item 3 */}
                <div className="relative pl-4 border-l-4 border-orange-200">
                  <div className="absolute w-2.5 h-2.5 bg-orange-400 rounded-full -left-[7px] top-1.5 ring-4 ring-white"></div>
                  <div className="text-[11px] font-bold text-slate-500 mb-1 tracking-wide uppercase">Sen, 20 Jul</div>
                  <div className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-red-50 text-red-600 border border-red-100 mb-2">
                    2 Tidak Hadir
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded bg-orange-50 border border-orange-100 text-[11px] text-orange-700 font-medium">
                      <div className="w-4 h-4 rounded bg-orange-200 text-orange-700 flex items-center justify-center text-[8px] font-bold">A</div>
                      Adelia (Sakit)
                    </span>
                    <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded bg-red-50 border border-red-100 text-[11px] text-red-700 font-medium">
                      <div className="w-4 h-4 rounded bg-red-200 text-red-700 flex items-center justify-center text-[8px] font-bold">F</div>
                      Farhan (Alpa)
                    </span>
                  </div>
                </div>

              </div>
              <div className="mt-auto border-t border-slate-100 px-5 py-3 text-center bg-slate-50 rounded-b-xl">
                <button className="text-[13px] font-semibold text-[#4a2c17] hover:text-[#6b4423] transition-colors w-full">
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
