import { useState, useMemo } from "react";
import { Layout } from "@/components/layout";
import { useGetWaliKelasRekap, useGetWaliKelasJurnal } from "@workspace/api-client-react";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Users, BookOpen, AlertTriangle, Activity, ChevronRight,
  Download, Printer, Clock, Search, Filter, MoreVertical, UserCheck, Award, AlertCircle,
} from "lucide-react";
import { format } from "date-fns";
import { id } from "date-fns/locale";

const AVATAR_COLORS = [
  "bg-blue-100 text-blue-700", "bg-pink-100 text-pink-700",
  "bg-emerald-100 text-emerald-700", "bg-purple-100 text-purple-700",
  "bg-amber-100 text-amber-700", "bg-indigo-100 text-indigo-700",
  "bg-rose-100 text-rose-700", "bg-teal-100 text-teal-700",
  "bg-cyan-100 text-cyan-700", "bg-orange-100 text-orange-700",
];
function getAvatarColor(name: string) {
  const idx = (name?.charCodeAt(0) ?? 0) % AVATAR_COLORS.length;
  return AVATAR_COLORS[idx];
}
function getInitials(name: string) {
  return (name ?? "?").split(" ").map((p) => p[0]).filter(Boolean).slice(0, 2).join("").toUpperCase();
}

function getStatusBadge(pctHadir: number, totalPoin: number) {
  if (pctHadir < 75 || totalPoin < -30) return { label: "Kritis", cls: "bg-red-100 text-red-700" };
  if (pctHadir < 85 || totalPoin < -15) return { label: "Perlu Perhatian", cls: "bg-amber-100 text-amber-700" };
  return { label: "Baik", cls: "bg-emerald-100 text-emerald-700" };
}

function getAttendanceBarColor(pct: number) {
  if (pct >= 90) return "bg-emerald-500";
  if (pct >= 80) return "bg-amber-500";
  return "bg-red-500";
}

function getPointsBadge(poin: number) {
  if (poin === 0) return "bg-slate-100 text-slate-500";
  if (Math.abs(poin) < 20) return "bg-amber-50 text-amber-600 border border-amber-200";
  return "bg-red-50 text-red-600 border border-red-200";
}

export default function WaliKelas() {
  const { data, isLoading } = useGetWaliKelasRekap();
  const { data: jurnalData, isLoading: jurnalLoading } = useGetWaliKelasJurnal();
  const [activeTab, setActiveTab] = useState<"Rekap Siswa" | "Jurnal Kelas">("Rekap Siswa");
  const [search, setSearch] = useState("");

  // ---- Stats computed from siswa list ----
  const stats = useMemo(() => {
    if (!data?.siswa?.length) return null;
    const siswa = data.siswa;
    const totalSesi = siswa.reduce((s: number, x: any) => s + (x.hadir ?? 0) + (x.izin ?? 0) + (x.sakit ?? 0) + (x.alpa ?? 0), 0);
    const totalHadir = siswa.reduce((s: number, x: any) => s + (x.hadir ?? 0), 0);
    const avgHadir = totalSesi > 0 ? Math.round((totalHadir / totalSesi) * 100) : 0;
    const withNilai = siswa.filter((x: any) => x.rataNilai != null);
    const avgNilai = withNilai.length > 0
      ? (withNilai.reduce((s: number, x: any) => s + (x.rataNilai ?? 0), 0) / withNilai.length).toFixed(1)
      : null;
    const poinPelanggaran = siswa.reduce((s: number, x: any) => {
      const p = x.totalPoin ?? 0;
      return s + (p < 0 ? Math.abs(p) : 0);
    }, 0);
    const perluPerhatian = siswa.filter((x: any) => (x.alpa ?? 0) >= 3 || (x.totalPoin ?? 0) < -20).length;
    return { avgHadir, avgNilai, poinPelanggaran, perluPerhatian };
  }, [data]);

  // ---- Filtered siswa ----
  const filteredSiswa = useMemo(() => {
    const list = (data?.siswa ?? []) as any[];
    if (!search.trim()) return list;
    const q = search.toLowerCase();
    return list.filter((s) => s.namaLengkap?.toLowerCase().includes(q) || s.nisn?.includes(q));
  }, [data, search]);

  const statCards = [
    {
      label: "Hadir Rata-rata", value: stats ? `${stats.avgHadir}%` : "—",
      Icon: UserCheck, color: "emerald",
      bg: "bg-emerald-100", text: "text-emerald-600", bar: "bg-emerald-500",
    },
    {
      label: "Rata-rata Nilai", value: stats?.avgNilai ?? "—",
      Icon: Activity, color: "blue",
      bg: "bg-blue-100", text: "text-blue-600", bar: "bg-blue-500",
    },
    {
      label: "Poin Pelanggaran", value: stats ? String(stats.poinPelanggaran) : "—",
      Icon: AlertTriangle, color: "red",
      bg: "bg-red-100", text: "text-red-600", bar: "bg-red-500",
    },
    {
      label: "Perlu Perhatian", value: stats ? String(stats.perluPerhatian) : "—",
      Icon: Clock, color: "amber",
      bg: "bg-amber-100", text: "text-amber-600", bar: "bg-amber-500",
    },
  ];

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="mb-2">
          <div className="flex items-center text-xs text-slate-400 mb-2 font-medium">
            <span>Dashboard</span>
            <ChevronRight className="w-3 h-3 mx-1" />
            <span>Wali Kelas</span>
            <ChevronRight className="w-3 h-3 mx-1" />
            <span className="text-slate-600">{isLoading ? "..." : data?.kelas ?? ""}</span>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <h1 className="text-xl font-bold text-slate-800 mb-1">
                Rekap Wali Kelas{data?.kelas ? ` — ${data.kelas}` : ""}
              </h1>
              <p className="text-sm text-slate-500">
                {isLoading
                  ? <Skeleton className="h-4 w-48 inline-block" />
                  : `${data?.siswa?.length ?? 0} Siswa`}
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
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

        {/* Pill Switcher */}
        <div className="flex items-center gap-1 bg-white p-1 rounded-full border border-slate-200 w-max shadow-sm">
          {(["Rekap Siswa", "Jurnal Kelas"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                activeTab === tab
                  ? "bg-slate-800 text-white"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Stats Row */}
        {isLoading ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[1,2,3,4].map(i => <Skeleton key={i} className="h-24 w-full rounded-xl" />)}
          </div>
        ) : stats && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {statCards.map(({ label, value, Icon, bg, text, bar }) => (
              <div key={label} className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 relative overflow-hidden flex items-center gap-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${bg} ${text}`}>
                  <Icon className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-slate-500 font-semibold mb-0.5">{label}</p>
                  <h3 className="text-2xl font-black text-slate-800">{value}</h3>
                </div>
                <div className={`h-1 absolute bottom-0 left-0 right-0 ${bar}`} />
              </div>
            ))}
          </div>
        )}

        {/* Main Content Layout */}
        <div className="flex flex-col lg:flex-row gap-5">
          {/* Left: Main Table or Journal */}
          <div className="flex-1 min-w-0">
            {activeTab === "Rekap Siswa" && (
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
                {/* Table toolbar */}
                <div className="p-4 border-b border-slate-100 flex items-center justify-between gap-3">
                  <h2 className="text-sm font-bold text-slate-800">Rekap Komprehensif Siswa</h2>
                  <div className="flex items-center gap-2">
                    <div className="relative">
                      <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        placeholder="Cari siswa..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-9 pr-4 py-1.5 bg-slate-50 border border-slate-200 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-slate-800/20 focus:border-slate-400 w-44 transition-all"
                      />
                    </div>
                    <button className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-lg transition-colors border border-slate-200">
                      <Filter className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {isLoading ? (
                  <div className="p-4 space-y-3">
                    {[1,2,3,4,5].map(i => <Skeleton key={i} className="h-12 w-full" />)}
                  </div>
                ) : filteredSiswa.length === 0 ? (
                  <div className="py-16 text-center text-slate-400 text-sm">
                    <Users className="w-12 h-12 mx-auto mb-3 opacity-20" />
                    <p>{search ? "Tidak ada siswa ditemukan." : "Belum ada siswa terdaftar di kelas ini."}</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-200">
                          <th className="p-4 text-xs font-semibold text-slate-500 uppercase tracking-wider w-12 text-center">No</th>
                          <th className="p-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Nama Siswa</th>
                          <th className="p-4 text-xs font-semibold text-slate-500 uppercase tracking-wider w-36">Kehadiran</th>
                          <th className="p-4 text-xs font-semibold text-slate-500 uppercase tracking-wider w-24 text-center">Nilai</th>
                          <th className="p-4 text-xs font-semibold text-slate-500 uppercase tracking-wider w-20 text-center">Poin</th>
                          <th className="p-4 text-xs font-semibold text-slate-500 uppercase tracking-wider w-36">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {filteredSiswa.map((s: any, idx: number) => {
                          const totalSesi = (s.hadir ?? 0) + (s.izin ?? 0) + (s.sakit ?? 0) + (s.alpa ?? 0);
                          const pctHadir = totalSesi > 0 ? Math.round(((s.hadir ?? 0) / totalSesi) * 100) : 0;
                          const poin = s.totalPoin ?? 0;
                          const status = getStatusBadge(pctHadir, poin);
                          return (
                            <tr key={s.studentId} className="hover:bg-slate-50/50 transition-colors group">
                              <td className="p-4 text-sm text-slate-500 text-center font-medium">{idx + 1}</td>
                              <td className="p-4">
                                <div className="flex items-center gap-3">
                                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${getAvatarColor(s.namaLengkap)}`}>
                                    {getInitials(s.namaLengkap)}
                                  </div>
                                  <div>
                                    <p className="text-sm font-medium text-slate-800 group-hover:text-blue-600 transition-colors">{s.namaLengkap}</p>
                                    <p className="text-xs text-slate-400">{s.nisn ? `NISN: ${s.nisn}` : s.kelas}</p>
                                  </div>
                                </div>
                              </td>
                              <td className="p-4">
                                <div className="flex items-center gap-2">
                                  <span className="text-sm font-medium text-slate-700 w-9 shrink-0">{pctHadir}%</span>
                                  <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                    <div
                                      className={`h-full rounded-full ${getAttendanceBarColor(pctHadir)}`}
                                      style={{ width: `${pctHadir}%` }}
                                    />
                                  </div>
                                </div>
                              </td>
                              <td className="p-4 text-center">
                                {s.rataNilai != null ? (
                                  <span className={`text-sm font-bold ${s.rataNilai >= 75 ? "text-emerald-600" : "text-rose-600"}`}>
                                    {Number(s.rataNilai).toFixed(1)}
                                  </span>
                                ) : (
                                  <span className="text-slate-400 text-sm">—</span>
                                )}
                              </td>
                              <td className="p-4 text-center">
                                <span className={`inline-flex items-center justify-center px-2 py-0.5 rounded-full text-xs font-semibold min-w-[2rem] ${getPointsBadge(poin)}`}>
                                  {poin > 0 ? `+${poin}` : poin}
                                </span>
                              </td>
                              <td className="p-4">
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${status.cls}`}>
                                  {status.label}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Table footer */}
                <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between text-xs text-slate-500">
                  <span>
                    Menampilkan {filteredSiswa.length}
                    {search && ` dari ${data?.siswa?.length ?? 0}`} siswa
                  </span>
                </div>
              </div>
            )}

            {activeTab === "Jurnal Kelas" && (
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-4 border-b border-slate-100 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center shrink-0">
                    <BookOpen className="w-4 h-4" />
                  </div>
                  <h2 className="text-sm font-bold text-slate-800">Jurnal Mengajar — Kelas {data?.kelas ?? ""}</h2>
                </div>

                {jurnalLoading ? (
                  <div className="p-4 space-y-3">
                    {[1,2,3,4].map(i => <Skeleton key={i} className="h-10 w-full" />)}
                  </div>
                ) : !jurnalData?.entries?.length ? (
                  <div className="py-16 text-center text-slate-400 text-sm">
                    <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-20" />
                    <p>Belum ada jurnal untuk kelas ini.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-200">
                          <th className="p-4 text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">Tanggal</th>
                          <th className="p-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Guru</th>
                          <th className="p-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Mata Pelajaran</th>
                          <th className="p-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Materi</th>
                          <th className="p-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Catatan</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-sm">
                        {jurnalData.entries.map((e: any) => (
                          <tr key={e.id} className="hover:bg-slate-50/50 transition-colors">
                            <td className="p-4 text-slate-500 whitespace-nowrap">
                              {format(new Date(e.tanggal), "EEEE, dd MMM yyyy", { locale: id })}
                            </td>
                            <td className="p-4">
                              <div className="flex items-center gap-2">
                                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${getAvatarColor(e.teacherName ?? "")}`}>
                                  {getInitials(e.teacherName ?? "")}
                                </div>
                                <span className="font-medium text-slate-700 text-sm">{e.teacherName}</span>
                              </div>
                            </td>
                            <td className="p-4 text-slate-600 font-medium">{e.subjectName}</td>
                            <td className="p-4 max-w-[260px]">
                              <p className="text-slate-700 font-medium truncate">{e.materi}</p>
                            </td>
                            <td className="p-4 max-w-[180px]">
                              <p className="text-slate-500 truncate">{e.catatan || "—"}</p>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right Sidebar — Catatan Jurnal Kelas */}
          <div className="w-full lg:w-72 shrink-0">
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 flex flex-col">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center shrink-0">
                  <BookOpen className="w-4 h-4" />
                </div>
                <h2 className="text-sm font-bold text-slate-800">Catatan Jurnal Kelas</h2>
              </div>

              {jurnalLoading ? (
                <div className="space-y-4">
                  {[1,2,3].map(i => <Skeleton key={i} className="h-16 w-full" />)}
                </div>
              ) : !jurnalData?.entries?.length ? (
                <p className="text-xs text-slate-400 text-center py-6">Belum ada jurnal</p>
              ) : (
                <div className="flex-1 space-y-4">
                  {jurnalData.entries.slice(0, 5).map((j: any) => (
                    <div key={j.id} className="relative pl-4 border-l-2 border-slate-100 pb-2 last:pb-0">
                      <div className="absolute w-2.5 h-2.5 rounded-full bg-slate-200 border-2 border-white -left-[7px] top-1" />
                      <div className="mb-1">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                          {format(new Date(j.tanggal), "dd MMM yyyy")}
                        </span>
                      </div>
                      <h4 className="text-sm font-semibold text-slate-800 mb-0.5">{j.subjectName}</h4>
                      <p className="text-xs text-slate-600 mb-1 leading-relaxed line-clamp-2">{j.materi}</p>
                      <div className="flex items-center gap-1.5 mt-1">
                        <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold shrink-0 ${getAvatarColor(j.teacherName ?? "")}`}>
                          {getInitials(j.teacherName ?? "")}
                        </div>
                        <span className="text-xs text-slate-500 font-medium">{j.teacherName}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {(jurnalData?.entries?.length ?? 0) > 5 && (
                <button
                  className="mt-4 w-full py-2 bg-slate-50 hover:bg-slate-100 text-slate-600 text-xs font-semibold rounded-lg transition-colors border border-slate-200 flex items-center justify-center gap-1.5"
                  onClick={() => setActiveTab("Jurnal Kelas")}
                >
                  <span>Lihat Semua Jurnal</span>
                  <ChevronRight className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
