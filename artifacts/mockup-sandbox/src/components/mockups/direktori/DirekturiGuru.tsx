import React from "react";
import {
  Search,
  Filter,
  Users,
  UserCheck,
  Briefcase,
  Mail,
  MoreVertical,
  Plus,
} from "lucide-react";

export function DirekturiGuru() {
  return (
    <div className="bg-[#f5f5f4] min-h-screen font-sans text-slate-800 p-6">
      {/* Top Section */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="text-xs text-slate-400 mb-2 font-medium">
            GuruEOB5 / Akademik / Direktori
          </div>
          <h1 className="text-xl font-bold text-slate-800">Direktori Guru</h1>
          <p className="text-sm text-slate-500 mt-1">
            18 pendidik dan tenaga kependidikan
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 bg-white border border-slate-200 text-slate-700 px-4 py-2 rounded-full text-sm font-medium hover:bg-slate-50 transition-colors">
            <MoreVertical className="w-4 h-4 -ml-1" />
            Lainnya
          </button>
          <button className="flex items-center gap-2 bg-slate-800 text-white px-4 py-2 rounded-full text-sm font-medium hover:bg-slate-700 transition-colors">
            <Plus className="w-4 h-4 -ml-1" />
            Tambah Guru
          </button>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
        {/* Stat 1 */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 relative overflow-hidden flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <div className="text-3xl font-black text-slate-800">18</div>
            <div className="text-xs uppercase tracking-wide text-slate-500 font-semibold mt-0.5">
              Total Guru
            </div>
          </div>
          <div className="h-1 absolute bottom-0 left-0 right-0 bg-blue-500" />
        </div>

        {/* Stat 2 */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 relative overflow-hidden flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
            <UserCheck className="w-6 h-6" />
          </div>
          <div>
            <div className="text-3xl font-black text-slate-800">16</div>
            <div className="text-xs uppercase tracking-wide text-slate-500 font-semibold mt-0.5">
              Guru Aktif
            </div>
          </div>
          <div className="h-1 absolute bottom-0 left-0 right-0 bg-emerald-500" />
        </div>

        {/* Stat 3 */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 relative overflow-hidden flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center shrink-0">
            <Briefcase className="w-6 h-6" />
          </div>
          <div>
            <div className="text-3xl font-black text-slate-800">4</div>
            <div className="text-xs uppercase tracking-wide text-slate-500 font-semibold mt-0.5">
              Staff TU
            </div>
          </div>
          <div className="h-1 absolute bottom-0 left-0 right-0 bg-amber-500" />
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center gap-4 mb-6">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Cari nama guru, NIP..."
            className="w-full bg-white border border-slate-200 rounded-full pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-800 focus:border-transparent transition-all placeholder:text-slate-400"
          />
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <button className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-white border border-slate-200 text-slate-600 px-4 py-2 rounded-full text-sm font-medium hover:bg-slate-50 transition-colors">
            <Filter className="w-4 h-4" />
            Mata Pelajaran
          </button>
          <select className="flex-1 sm:flex-none appearance-none bg-white border border-slate-200 text-slate-600 px-4 py-2 rounded-full text-sm font-medium focus:outline-none hover:bg-slate-50 transition-colors pr-8">
            <option>Semua Status</option>
            <option>Aktif</option>
            <option>Cuti</option>
          </select>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {[
          {
            name: "Budi Santoso, S.Pd",
            role: "Wali Kelas 10A • Guru Matematika",
            initials: "BS",
            color: "bg-blue-100 text-blue-700",
            badges: [
              { label: "Matematika", color: "bg-blue-50 text-blue-600" },
              { label: "Peminatan", color: "bg-indigo-50 text-indigo-600" },
            ],
            jurnal: { current: 14, total: 18, pct: (14 / 18) * 100 },
            dokumen: { current: 8, total: 10, pct: (8 / 10) * 100 },
            email: "budi.s@sekolah.id",
            status: "Aktif",
            statusColor: "bg-emerald-100 text-emerald-700",
          },
          {
            name: "Siti Aminah, M.Pd",
            role: "Guru Bahasa Indonesia",
            initials: "SA",
            color: "bg-rose-100 text-rose-700",
            badges: [
              { label: "B. Indonesia", color: "bg-rose-50 text-rose-600" },
            ],
            jurnal: { current: 18, total: 18, pct: 100 },
            dokumen: { current: 10, total: 10, pct: 100 },
            email: "siti.a@sekolah.id",
            status: "Aktif",
            statusColor: "bg-emerald-100 text-emerald-700",
          },
          {
            name: "Ahmad Riyadi, S.Kom",
            role: "Kepala Lab • Guru TIK",
            initials: "AR",
            color: "bg-violet-100 text-violet-700",
            badges: [
              { label: "TIK", color: "bg-violet-50 text-violet-600" },
              { label: "Prakarya", color: "bg-fuchsia-50 text-fuchsia-600" },
            ],
            jurnal: { current: 12, total: 18, pct: (12 / 18) * 100 },
            dokumen: { current: 5, total: 10, pct: 50 },
            email: "ahmad.r@sekolah.id",
            status: "Aktif",
            statusColor: "bg-emerald-100 text-emerald-700",
          },
          {
            name: "Ratna Sari, S.Pd",
            role: "Guru IPA (Biologi)",
            initials: "RS",
            color: "bg-emerald-100 text-emerald-700",
            badges: [{ label: "Biologi", color: "bg-emerald-50 text-emerald-600" }],
            jurnal: { current: 16, total: 18, pct: (16 / 18) * 100 },
            dokumen: { current: 9, total: 10, pct: 90 },
            email: "ratna.s@sekolah.id",
            status: "Aktif",
            statusColor: "bg-emerald-100 text-emerald-700",
          },
          {
            name: "Drs. Hendra Gunawan",
            role: "Guru Penjasorkes",
            initials: "HG",
            color: "bg-amber-100 text-amber-700",
            badges: [{ label: "Olahraga", color: "bg-amber-50 text-amber-600" }],
            jurnal: { current: 6, total: 18, pct: (6 / 18) * 100 },
            dokumen: { current: 2, total: 10, pct: 20 },
            email: "hendra.g@sekolah.id",
            status: "Cuti",
            statusColor: "bg-slate-100 text-slate-600",
          },
          {
            name: "Fitriani, S.Pd",
            role: "Guru Bahasa Inggris",
            initials: "F",
            color: "bg-cyan-100 text-cyan-700",
            badges: [
              { label: "B. Inggris", color: "bg-cyan-50 text-cyan-600" },
            ],
            jurnal: { current: 17, total: 18, pct: (17 / 18) * 100 },
            dokumen: { current: 10, total: 10, pct: 100 },
            email: "fitriani@sekolah.id",
            status: "Aktif",
            statusColor: "bg-emerald-100 text-emerald-700",
          },
        ].map((teacher, i) => (
          <div
            key={i}
            className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 flex flex-col hover:shadow-md transition-shadow"
          >
            {/* Header: Avatar + Info */}
            <div className="flex items-start gap-4 mb-4">
              <div
                className={`w-14 h-14 rounded-full flex items-center justify-center font-bold text-xl shrink-0 ${teacher.color}`}
              >
                {teacher.initials}
              </div>
              <div className="flex-1 min-w-0 pt-1">
                <h3 className="font-semibold text-slate-800 truncate">
                  {teacher.name}
                </h3>
                <p className="text-sm text-slate-500 truncate mt-0.5">
                  {teacher.role}
                </p>
                <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                  {teacher.badges.map((badge, j) => (
                    <span
                      key={j}
                      className={`px-2 py-0.5 rounded-md text-[10px] font-semibold uppercase tracking-wide ${badge.color}`}
                    >
                      {badge.label}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Progress Bars */}
            <div className="space-y-3 mb-5 flex-1">
              {/* Jurnal */}
              <div>
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="font-medium text-slate-600">Jurnal Mengajar</span>
                  <span className="text-slate-500 font-medium">
                    {teacher.jurnal.current}/{teacher.jurnal.total}
                  </span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                  <div
                    className={`h-full rounded-full ${
                      teacher.jurnal.pct === 100
                        ? "bg-emerald-500"
                        : teacher.jurnal.pct > 50
                        ? "bg-blue-500"
                        : "bg-amber-500"
                    }`}
                    style={{ width: `${teacher.jurnal.pct}%` }}
                  />
                </div>
              </div>

              {/* Dokumen */}
              <div>
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="font-medium text-slate-600">Dokumen Kinerja</span>
                  <span className="text-slate-500 font-medium">
                    {teacher.dokumen.current}/{teacher.dokumen.total}
                  </span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                  <div
                    className={`h-full rounded-full ${
                      teacher.dokumen.pct === 100
                        ? "bg-emerald-500"
                        : teacher.dokumen.pct > 50
                        ? "bg-blue-500"
                        : "bg-amber-500"
                    }`}
                    style={{ width: `${teacher.dokumen.pct}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="pt-4 border-t border-slate-100 flex items-center justify-between mt-auto">
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <Mail className="w-3.5 h-3.5" />
                <span className="truncate max-w-[120px]">{teacher.email}</span>
              </div>
              <span
                className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${teacher.statusColor}`}
              >
                {teacher.status}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
