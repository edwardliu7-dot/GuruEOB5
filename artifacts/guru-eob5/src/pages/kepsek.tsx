import { useState } from "react";
import { Layout } from "@/components/layout";
import { useGetKepsekOverview, useGetKepsekJurnal } from "@workspace/api-client-react";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Users,
  CheckSquare,
  FileText,
  AlertCircle,
  Search,
  Clock,
  BookOpen,
  ChevronRight,
} from "lucide-react";
import { format } from "date-fns";
import { id } from "date-fns/locale";

const getStatusLabel = (pct: number): string => {
  if (pct >= 90) return "Sangat Baik";
  if (pct >= 75) return "Baik";
  if (pct >= 50) return "Cukup";
  return "Perlu Perhatian";
};

const getStatusBadge = (status: string): string => {
  switch (status) {
    case "Sangat Baik": return "bg-emerald-100 text-emerald-700";
    case "Baik": return "bg-blue-100 text-blue-700";
    case "Cukup": return "bg-amber-100 text-amber-700";
    case "Perlu Perhatian": return "bg-red-100 text-red-700";
    default: return "bg-slate-100 text-slate-700";
  }
};

const getProgressBarColor = (percentage: number): string => {
  if (percentage >= 90) return "bg-emerald-500";
  if (percentage >= 75) return "bg-blue-500";
  if (percentage >= 50) return "bg-amber-500";
  return "bg-red-500";
};

const avatarColors = [
  "bg-blue-100 text-blue-700",
  "bg-emerald-100 text-emerald-700",
  "bg-violet-100 text-violet-700",
  "bg-rose-100 text-rose-700",
  "bg-amber-100 text-amber-700",
  "bg-indigo-100 text-indigo-700",
  "bg-cyan-100 text-cyan-700",
  "bg-fuchsia-100 text-fuchsia-700",
];

function getInitials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0])
    .join("")
    .toUpperCase();
}

function getAvatarColor(index: number): string {
  return avatarColors[index % avatarColors.length];
}

export default function Kepsek() {
  const [activeTab, setActiveTab] = useState("Kinerja Guru");
  const [search, setSearch] = useState("");

  const { data, isLoading } = useGetKepsekOverview();
  const { data: jurnalData, isLoading: jurnalLoading } = useGetKepsekJurnal();

  const teachers = data?.teachers ?? [];

  const filteredTeachers = teachers.filter((t) =>
    t.name.toLowerCase().includes(search.toLowerCase()) ||
    (t.mapel ?? []).some((m) => m.toLowerCase().includes(search.toLowerCase()))
  );

  // Stats computed from real data
  const totalGuru = teachers.length;
  const jurnalLengkap = teachers.filter((t) => t.jurnalBulanIni >= 1).length;
  const dokumenLengkap = teachers.filter(
    (t) => t.dokumenSelesai >= t.dokumenTotal && t.dokumenTotal > 0
  ).length;
  const perluPerhatian = teachers.filter((t) => t.kelengkapanPersen < 50).length;

  const stats = [
    { label: "Total Guru", value: String(totalGuru), icon: Users, iconBg: "bg-blue-100", iconText: "text-blue-600", bar: "bg-blue-500", progress: 100 },
    { label: "Jurnal Lengkap", value: String(jurnalLengkap), icon: CheckSquare, iconBg: "bg-emerald-100", iconText: "text-emerald-600", bar: "bg-emerald-500", progress: totalGuru > 0 ? Math.round((jurnalLengkap / totalGuru) * 100) : 0 },
    { label: "Dokumen Lengkap", value: String(dokumenLengkap), icon: FileText, iconBg: "bg-violet-100", iconText: "text-violet-600", bar: "bg-violet-500", progress: totalGuru > 0 ? Math.round((dokumenLengkap / totalGuru) * 100) : 0 },
    { label: "Perlu Perhatian", value: String(perluPerhatian), icon: AlertCircle, iconBg: "bg-amber-100", iconText: "text-amber-600", bar: "bg-amber-500", progress: totalGuru > 0 ? Math.round((perluPerhatian / totalGuru) * 100) : 0 },
  ];

  const recentJournals = (jurnalData?.entries ?? []).slice(0, 5);

  return (
    <Layout>
      <div className="text-slate-800">
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
          </div>

          {/* Pill Group Switcher */}
          <div className="flex items-center gap-2 mt-6">
            {["Kinerja Guru", "Jurnal Sekolah"].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  activeTab === tab
                    ? "bg-slate-800 text-white shadow-sm"
                    : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
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
            <div
              key={index}
              className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 relative overflow-hidden flex items-center gap-4"
            >
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${stat.iconBg} ${stat.iconText}`}>
                <stat.icon size={24} />
              </div>
              <div>
                {isLoading ? (
                  <Skeleton className="h-8 w-12 mb-1" />
                ) : (
                  <div className="text-3xl font-black text-slate-800 leading-tight">
                    {stat.value}
                  </div>
                )}
                <div className="text-xs uppercase tracking-wide text-slate-500 font-semibold">
                  {stat.label}
                </div>
              </div>
              {/* Bottom Progress Bar */}
              <div className="h-1 absolute bottom-0 left-0 right-0 bg-slate-100">
                <div
                  className={`h-full ${stat.bar}`}
                  style={{ width: `${stat.progress}%` }}
                />
              </div>
            </div>
          ))}
        </div>

        {/* Tab Content */}
        {activeTab === "Kinerja Guru" && (
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
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
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
                      <th className="p-4 font-semibold whitespace-nowrap">Jurnal (Bln ini)</th>
                      <th className="p-4 font-semibold whitespace-nowrap">Dokumen</th>
                      <th className="p-4 font-semibold whitespace-nowrap text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {isLoading ? (
                      Array.from({ length: 5 }).map((_, i) => (
                        <tr key={i}>
                          <td className="p-4"><Skeleton className="h-8 w-40" /></td>
                          <td className="p-4"><Skeleton className="h-4 w-24" /></td>
                          <td className="p-4"><Skeleton className="h-4 w-32" /></td>
                          <td className="p-4"><Skeleton className="h-4 w-32" /></td>
                          <td className="p-4 text-right"><Skeleton className="h-5 w-20 ml-auto" /></td>
                        </tr>
                      ))
                    ) : filteredTeachers.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="p-8 text-center text-slate-500 text-sm">
                          {search ? "Guru tidak ditemukan." : "Belum ada data guru."}
                        </td>
                      </tr>
                    ) : (
                      filteredTeachers.map((teacher, idx) => {
                        const docPercent =
                          teacher.dokumenTotal > 0
                            ? Math.round((teacher.dokumenSelesai / teacher.dokumenTotal) * 100)
                            : 0;
                        const status = getStatusLabel(teacher.kelengkapanPersen);

                        return (
                          <tr
                            key={teacher.username}
                            className="hover:bg-slate-50 transition-colors group cursor-pointer"
                          >
                            <td className="p-4">
                              <div className="flex items-center gap-3">
                                <div
                                  className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${getAvatarColor(idx)}`}
                                >
                                  {getInitials(teacher.name)}
                                </div>
                                <span className="font-medium text-sm text-slate-800 whitespace-nowrap">
                                  {teacher.name}
                                </span>
                              </div>
                            </td>
                            <td className="p-4">
                              <span className="text-sm text-slate-600">
                                {(teacher.mapel ?? []).join(", ") || "-"}
                              </span>
                            </td>
                            <td className="p-4 min-w-[140px]">
                              <div className="flex items-center justify-between text-xs mb-1">
                                <span className="text-slate-600 font-medium">{teacher.jurnalBulanIni}</span>
                              </div>
                              <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                <div
                                  className={`h-full rounded-full ${getProgressBarColor(teacher.kelengkapanPersen)}`}
                                  style={{ width: `${Math.min(teacher.jurnalBulanIni * 10, 100)}%` }}
                                />
                              </div>
                            </td>
                            <td className="p-4 min-w-[140px]">
                              <div className="flex items-center justify-between text-xs mb-1">
                                <span className="text-slate-600 font-medium">
                                  {teacher.dokumenSelesai}/{teacher.dokumenTotal}
                                </span>
                                <span className="text-slate-400">{docPercent}%</span>
                              </div>
                              <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                <div
                                  className={`h-full rounded-full ${getProgressBarColor(docPercent)}`}
                                  style={{ width: `${docPercent}%` }}
                                />
                              </div>
                            </td>
                            <td className="p-4 text-right">
                              <span
                                className={`inline-flex items-center justify-center rounded-full px-2.5 py-0.5 text-xs font-medium whitespace-nowrap ${getStatusBadge(status)}`}
                              >
                                {status}
                              </span>
                            </td>
                          </tr>
                        );
                      })
                    )}
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
                  {jurnalLoading ? (
                    Array.from({ length: 4 }).map((_, i) => (
                      <div key={i} className="flex gap-3">
                        <Skeleton className="w-8 h-8 rounded-full shrink-0" />
                        <div className="flex-1 space-y-1.5">
                          <Skeleton className="h-3.5 w-32" />
                          <Skeleton className="h-3 w-24" />
                          <Skeleton className="h-3 w-20" />
                        </div>
                      </div>
                    ))
                  ) : recentJournals.length === 0 ? (
                    <p className="text-sm text-slate-500 text-center py-4">
                      Belum ada jurnal terbaru.
                    </p>
                  ) : (
                    recentJournals.map((journal, idx) => (
                      <div key={journal.id} className="flex gap-3 group cursor-pointer">
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5 ${getAvatarColor(idx)}`}
                        >
                          {getInitials(journal.teacherName)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-slate-800 truncate">
                            {journal.teacherName}
                          </p>
                          <div className="flex items-center gap-1.5 mt-0.5 mb-1 text-xs text-slate-500">
                            <span className="font-medium text-slate-600">{journal.kelas}</span>
                            <span className="w-1 h-1 rounded-full bg-slate-300" />
                            <span className="truncate">{journal.materi}</span>
                          </div>
                          <div className="text-[11px] text-slate-400 flex items-center gap-1">
                            <Clock size={10} />
                            {format(new Date(journal.tanggal), "dd MMM yyyy", { locale: id })}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
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
              </div>
            </div>
          </div>
        )}

        {activeTab === "Jurnal Sekolah" && (
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center gap-2">
              <BookOpen className="text-slate-500" size={18} />
              <h2 className="font-semibold text-sm text-slate-800">Jurnal Mengajar Semua Guru</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-xs uppercase text-slate-500 border-b border-slate-200">
                    <th className="p-4 font-semibold whitespace-nowrap">Tanggal</th>
                    <th className="p-4 font-semibold whitespace-nowrap">Guru</th>
                    <th className="p-4 font-semibold whitespace-nowrap">Mata Pelajaran</th>
                    <th className="p-4 font-semibold whitespace-nowrap">Kelas</th>
                    <th className="p-4 font-semibold whitespace-nowrap">Materi</th>
                    <th className="p-4 font-semibold whitespace-nowrap">Catatan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {jurnalLoading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <tr key={i}>
                        {Array.from({ length: 6 }).map((__, j) => (
                          <td key={j} className="p-4">
                            <Skeleton className="h-4 w-24" />
                          </td>
                        ))}
                      </tr>
                    ))
                  ) : !jurnalData?.entries.length ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-slate-500 text-sm">
                        Belum ada jurnal yang tercatat.
                      </td>
                    </tr>
                  ) : (
                    jurnalData.entries.map((e) => (
                      <tr key={e.id} className="hover:bg-slate-50 transition-colors">
                        <td className="p-4 text-sm text-slate-500 whitespace-nowrap">
                          {format(new Date(e.tanggal), "dd MMM yyyy", { locale: id })}
                        </td>
                        <td className="p-4 text-sm font-medium text-slate-800">{e.teacherName}</td>
                        <td className="p-4 text-sm text-slate-600">{e.subjectName}</td>
                        <td className="p-4">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600">
                            {e.kelas || "-"}
                          </span>
                        </td>
                        <td className="p-4 text-sm text-slate-700 max-w-[240px] truncate">{e.materi}</td>
                        <td className="p-4 text-sm text-slate-500 max-w-[180px] truncate">
                          {e.catatan || "-"}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
