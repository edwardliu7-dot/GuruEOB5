import { useState } from "react";
import { Layout } from "@/components/layout";
import { useGetKurikulumOverview, useGetKurikulumJurnal } from "@workspace/api-client-react";
import { Skeleton } from "@/components/ui/skeleton";
import {
  FileText,
  BookOpen,
  Users,
  CheckCircle,
  TrendingUp,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  FileBadge,
  Search,
  Clock,
  Download,
} from "lucide-react";
import { format } from "date-fns";
import { id } from "date-fns/locale";

const avatarColors = [
  "bg-blue-100 text-blue-700",
  "bg-rose-100 text-rose-700",
  "bg-amber-100 text-amber-700",
  "bg-violet-100 text-violet-700",
  "bg-emerald-100 text-emerald-700",
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

export default function Kurikulum() {
  const [activeTab, setActiveTab] = useState("dokumen");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const { data, isLoading } = useGetKurikulumOverview();
  const { data: jurnalData, isLoading: jurnalLoading } = useGetKurikulumJurnal();

  const teachers = data?.teachers ?? [];

  const filteredTeachers = teachers.filter(
    (t) =>
      t.name.toLowerCase().includes(search.toLowerCase()) ||
      (t.mapel ?? []).some((m) => m.toLowerCase().includes(search.toLowerCase()))
  );

  // Stats computed from real data
  const totalGuru = teachers.length;
  const dokumenLengkap = teachers.filter((t) =>
    t.subjects.some((s) => s.documents.length > 0)
  ).length;
  const totalDocs = teachers.reduce(
    (sum, t) => sum + t.subjects.reduce((s2, s) => s2 + s.documents.length, 0),
    0
  );
  const avgKepatuhan =
    totalGuru > 0 ? Math.round((dokumenLengkap / totalGuru) * 100) : 0;

  const stats = [
    {
      label: "Total Guru",
      value: String(totalGuru),
      icon: Users,
      colorClasses: { bg: "bg-blue-100", text: "text-blue-600", bar: "bg-blue-500" },
    },
    {
      label: "Dokumen Lengkap",
      value: `${dokumenLengkap}/${totalGuru}`,
      icon: CheckCircle,
      colorClasses: { bg: "bg-emerald-100", text: "text-emerald-600", bar: "bg-emerald-500" },
    },
    {
      label: "Total Dokumen",
      value: String(totalDocs),
      icon: TrendingUp,
      colorClasses: { bg: "bg-violet-100", text: "text-violet-600", bar: "bg-violet-500" },
    },
  ];

  const recentJournals = (jurnalData?.entries ?? []).slice(0, 5);

  const toggleExpand = (username: string) => {
    setExpandedId(expandedId === username ? null : username);
  };

  return (
    <Layout>
      <div className="text-slate-800">
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
            <p className="text-sm text-slate-500 mt-1">
              Monitoring dokumen administrasi dan jurnal mengajar seluruh guru
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <div className="flex bg-white rounded-full border border-slate-200 p-1">
              <button
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  activeTab === "dokumen"
                    ? "bg-slate-800 text-white"
                    : "text-slate-600 hover:bg-slate-50"
                }`}
                onClick={() => setActiveTab("dokumen")}
              >
                Dokumen
              </button>
              <button
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  activeTab === "jurnal"
                    ? "bg-slate-800 text-white"
                    : "text-slate-600 hover:bg-slate-50"
                }`}
                onClick={() => setActiveTab("jurnal")}
              >
                Jurnal
              </button>
            </div>
            <button className="rounded-full bg-slate-800 text-white px-4 py-2 text-sm font-medium flex items-center gap-2 hover:bg-slate-700 transition-colors shadow-sm">
              <Download className="w-4 h-4" />
              Export Laporan
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-6">
          {stats.map((stat, i) => (
            <div
              key={i}
              className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 flex items-center gap-4 relative overflow-hidden"
            >
              <div
                className={`w-12 h-12 rounded-xl flex items-center justify-center ${stat.colorClasses.bg} ${stat.colorClasses.text}`}
              >
                <stat.icon className="w-6 h-6" />
              </div>
              <div>
                {isLoading ? (
                  <Skeleton className="h-8 w-16 mb-1" />
                ) : (
                  <div className="text-3xl font-black text-slate-800">{stat.value}</div>
                )}
                <div className="text-xs uppercase tracking-wide text-slate-500 font-semibold mt-0.5">
                  {stat.label}
                </div>
              </div>
              <div className={`h-1 absolute bottom-0 left-0 right-0 ${stat.colorClasses.bar}`} />
            </div>
          ))}
        </div>

        <div className="flex flex-col lg:flex-row gap-5">
          {/* Left Column - Main Content */}
          {activeTab === "dokumen" && (
            <div className="flex-1 flex flex-col gap-4">
              <div className="flex items-center justify-between mb-2">
                <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Status Dokumen Guru
                </div>
                <div className="flex items-center gap-2">
                  <div className="relative hidden sm:block">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Cari guru..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="pl-9 pr-4 py-1.5 text-sm border border-slate-200 rounded-full focus:outline-none focus:border-slate-400 focus:ring-1 focus:ring-slate-400 bg-white w-48"
                    />
                  </div>
                </div>
              </div>

              {isLoading ? (
                <div className="flex flex-col gap-3">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <Skeleton key={i} className="h-20 w-full rounded-xl" />
                  ))}
                </div>
              ) : filteredTeachers.length === 0 ? (
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-8 text-center text-slate-500 text-sm">
                  {search ? "Guru tidak ditemukan." : "Belum ada data guru."}
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {filteredTeachers.map((teacher, idx) => {
                    const totalDocs = teacher.subjects.reduce(
                      (sum, s) => sum + s.documents.length,
                      0
                    );
                    const progress =
                      teacher.subjects.length > 0
                        ? Math.min(Math.round((totalDocs / Math.max(teacher.subjects.length * 3, 1)) * 100), 100)
                        : 0;
                    const isExpanded = expandedId === teacher.username;

                    return (
                      <div
                        key={teacher.username}
                        className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden"
                      >
                        <div
                          className="p-4 flex flex-col sm:flex-row sm:items-center gap-4 cursor-pointer hover:bg-slate-50 transition-colors select-none"
                          onClick={() => toggleExpand(teacher.username)}
                        >
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <div
                              className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${getAvatarColor(idx)}`}
                            >
                              {getInitials(teacher.name)}
                            </div>

                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-semibold text-slate-800 truncate">
                                  {teacher.name}
                                </span>
                                {(teacher.mapel ?? []).length > 0 && (
                                  <span className="rounded-full px-2 py-0.5 text-[10px] font-medium bg-slate-100 text-slate-600 shrink-0">
                                    {(teacher.mapel ?? []).join(", ")}
                                  </span>
                                )}
                              </div>

                              <div className="flex items-center gap-3">
                                <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden flex max-w-[160px]">
                                  <div
                                    className={`h-full rounded-full transition-all duration-500 ${
                                      progress === 100
                                        ? "bg-emerald-500"
                                        : progress > 60
                                        ? "bg-blue-500"
                                        : "bg-amber-500"
                                    }`}
                                    style={{ width: `${progress}%` }}
                                  />
                                </div>
                                <span className="text-xs text-slate-500 font-medium">
                                  {progress}%
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-4 mt-2 sm:mt-0 ml-12 sm:ml-0">
                            <div className="flex items-center gap-1.5 text-slate-500 bg-slate-50 px-3 py-1 rounded-full border border-slate-100">
                              <FileBadge className="w-4 h-4" />
                              <span className="text-xs font-medium">{totalDocs} Dokumen</span>
                            </div>

                            <button className="w-8 h-8 flex items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors">
                              {isExpanded ? (
                                <ChevronUp className="w-5 h-5" />
                              ) : (
                                <ChevronDown className="w-5 h-5" />
                              )}
                            </button>
                          </div>
                        </div>

                        {/* Expanded Content */}
                        {isExpanded && (
                          <div className="border-t border-slate-100 bg-slate-50/50 p-4">
                            {teacher.subjects.length === 0 ? (
                              <div className="flex flex-col items-center justify-center py-6 gap-2 text-slate-400">
                                <AlertCircle className="w-8 h-8 text-slate-300" />
                                <span className="text-sm">Belum ada mata pelajaran yang didaftarkan.</span>
                              </div>
                            ) : (
                              teacher.subjects.map((subject) => (
                                <div key={subject.subjectId} className="mb-4 last:mb-0">
                                  <div className="flex items-center gap-2 mb-2">
                                    <span className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
                                      {subject.subjectName}
                                    </span>
                                  </div>
                                  <div className="bg-white rounded-lg border border-slate-200 overflow-hidden overflow-x-auto">
                                    <table className="w-full text-left text-sm whitespace-nowrap">
                                      <thead className="bg-slate-50 text-xs uppercase text-slate-500 font-medium border-b border-slate-200">
                                        <tr>
                                          <th className="px-4 py-3">Nama Dokumen</th>
                                          <th className="px-4 py-3">Keterangan</th>
                                        </tr>
                                      </thead>
                                      <tbody className="divide-y divide-slate-100">
                                        {subject.documents.length > 0 ? (
                                          subject.documents.map((doc) => (
                                            <tr
                                              key={doc.id}
                                              className="hover:bg-slate-50 transition-colors"
                                            >
                                              <td className="px-4 py-3">
                                                <div className="flex items-center gap-2">
                                                  <FileText className="w-4 h-4 text-slate-400" />
                                                  <span className="font-medium text-slate-700">
                                                    {doc.name}
                                                  </span>
                                                  <CheckCircle className="w-3.5 h-3.5 text-emerald-500 ml-1" />
                                                </div>
                                              </td>
                                              <td className="px-4 py-3 text-slate-500">
                                                {doc.description || "-"}
                                              </td>
                                            </tr>
                                          ))
                                        ) : (
                                          <tr>
                                            <td
                                              colSpan={2}
                                              className="px-4 py-8 text-center text-slate-500"
                                            >
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
                              ))
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {activeTab === "jurnal" && (
            <div className="flex-1">
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
                Jurnal Mengajar Semua Guru
              </div>
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
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
                            <td className="p-4 text-sm text-slate-700 max-w-[240px] truncate">
                              {e.materi}
                            </td>
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
            </div>
          )}

          {/* Right Column - Sidebar: always show for dokumen tab */}
          {activeTab === "dokumen" && (
            <div className="w-full lg:w-72 shrink-0 flex flex-col gap-4">
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                Aktivitas Mengajar
              </div>

              <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
                <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-100">
                  <div className="bg-indigo-100 text-indigo-600 p-1.5 rounded-lg">
                    <BookOpen className="w-4 h-4" />
                  </div>
                  <h3 className="font-bold text-slate-800 text-sm">Jurnal Terbaru</h3>
                </div>

                <div className="flex flex-col gap-4">
                  {jurnalLoading ? (
                    Array.from({ length: 4 }).map((_, i) => (
                      <div key={i} className="relative pl-4">
                        <Skeleton className="h-16 w-full" />
                      </div>
                    ))
                  ) : recentJournals.length === 0 ? (
                    <p className="text-sm text-slate-500 text-center py-4">
                      Belum ada jurnal terbaru.
                    </p>
                  ) : (
                    recentJournals.map((journal, idx) => (
                      <div key={journal.id} className="relative pl-4">
                        {/* Timeline line */}
                        {idx !== recentJournals.length - 1 && (
                          <div className="absolute left-[7px] top-5 bottom-[-16px] w-[2px] bg-slate-100" />
                        )}
                        {/* Timeline dot */}
                        <div className="absolute left-0 top-1.5 w-4 h-4 rounded-full border-2 border-white bg-indigo-400 shadow-sm" />

                        <div className="flex flex-col gap-1">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-semibold text-slate-500 flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {format(new Date(journal.tanggal), "dd MMM yyyy", { locale: id })}
                            </span>
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                              {journal.kelas}
                            </span>
                          </div>
                          <div className="text-sm font-semibold text-slate-800 leading-tight">
                            {journal.materi}
                          </div>
                          <div className="text-xs text-slate-500 mt-0.5">
                            Oleh:{" "}
                            <span className="font-medium text-slate-700">{journal.teacherName}</span>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <button className="w-full mt-5 py-2 text-xs font-semibold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors">
                  Lihat Semua Jurnal
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Avg kepatuhan stat note */}
        {!isLoading && totalGuru > 0 && (
          <div className="mt-4 text-xs text-slate-400 text-right">
            Rata-rata kepatuhan dokumen: {avgKepatuhan}%
          </div>
        )}
      </div>
    </Layout>
  );
}
