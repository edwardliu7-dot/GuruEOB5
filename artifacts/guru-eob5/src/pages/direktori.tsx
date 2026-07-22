import { useState } from "react";
import { Layout } from "@/components/layout";
import { useListTeachers, useListTeachersProgress } from "@workspace/api-client-react";
import { Skeleton } from "@/components/ui/skeleton";
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
import { JABATAN_LABELS } from "@/lib/options";

const JABATAN_ORDER = ["kepala_sekolah", "wakasek", "wali_kelas", "guru"];

function primaryJabatan(jabatan: string[]): string {
  for (const j of JABATAN_ORDER) if (jabatan.includes(j)) return j;
  return jabatan[0] ?? "guru";
}

const JABATAN_BADGE: Record<string, { bg: string; text: string }> = {
  kepala_sekolah: { bg: "bg-amber-50 text-amber-600", text: "" },
  wakasek:        { bg: "bg-violet-50 text-violet-600", text: "" },
  wali_kelas:     { bg: "bg-emerald-50 text-emerald-600", text: "" },
  guru:           { bg: "bg-blue-50 text-blue-600", text: "" },
};

const AVATAR_COLORS = [
  "bg-blue-100 text-blue-700",
  "bg-rose-100 text-rose-700",
  "bg-violet-100 text-violet-700",
  "bg-emerald-100 text-emerald-700",
  "bg-amber-100 text-amber-700",
  "bg-cyan-100 text-cyan-700",
  "bg-fuchsia-100 text-fuchsia-700",
  "bg-orange-100 text-orange-700",
  "bg-teal-100 text-teal-700",
  "bg-indigo-100 text-indigo-700",
];

function getAvatarColor(idx: number) {
  return AVATAR_COLORS[idx % AVATAR_COLORS.length];
}

function initials(name: string): string {
  return name
    .split(" ")
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function buildRoleText(t: any): string {
  const jabatan: string[] = t.jabatan ?? [];
  const mapel: string[] = t.mapel ?? [];
  const parts: string[] = [];
  if (jabatan.includes("wali_kelas") && t.waliKelasKelas) {
    parts.push(`Wali Kelas ${t.waliKelasKelas}`);
  }
  if (mapel.length > 0) {
    parts.push(`Guru ${mapel.slice(0, 2).join(" & ")}`);
  } else if (jabatan.includes("kepala_sekolah")) {
    parts.push("Kepala Sekolah");
  } else if (jabatan.includes("wakasek")) {
    parts.push("Wakasek");
  } else if (jabatan.includes("guru")) {
    parts.push("Guru");
  }
  return parts.join(" • ") || (JABATAN_LABELS[jabatan[0] ?? ""] ?? "Pendidik");
}

function progressBarColor(pct: number): string {
  if (pct === 100) return "bg-emerald-500";
  if (pct > 50) return "bg-blue-500";
  return "bg-amber-500";
}

export default function Direktori() {
  const { data: teachers, isLoading: loadingTeachers } = useListTeachers();
  const { data: progressList, isLoading: loadingProgress } = useListTeachersProgress();
  const [query, setQuery] = useState("");

  const isLoading = loadingTeachers || loadingProgress;

  const progressById = new Map((progressList ?? []).map((p: any) => [p.teacherId, p]));

  const filtered = (teachers ?? []).filter((t: any) => {
    if (!query.trim()) return true;
    const q = query.toLowerCase();
    return (
      t.name?.toLowerCase().includes(q) ||
      t.mapel?.some((m: string) => m.toLowerCase().includes(q)) ||
      t.jabatan?.some((j: string) => (JABATAN_LABELS[j] ?? j).toLowerCase().includes(q))
    );
  });

  const total = (teachers ?? []).length;
  const guruAktif = (teachers ?? []).filter((t: any) =>
    (t.jabatan as string[] ?? []).some((j) => ["guru", "wali_kelas", "kepala_sekolah", "wakasek"].includes(j))
  ).length;
  const staffTU = total - guruAktif;

  return (
    <Layout>
      {/* Top Section */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="text-xs text-slate-400 mb-2 font-medium">
            GuruEOB5 / Akademik / Direktori
          </div>
          <h1 className="text-xl font-bold text-slate-800">Direktori Guru</h1>
          <p className="text-sm text-slate-500 mt-1">
            {isLoading ? "Memuat..." : `${total} pendidik dan tenaga kependidikan`}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 bg-white border border-slate-200 text-slate-700 px-4 py-2 rounded-full text-sm font-medium hover:bg-slate-50 transition-colors">
            <MoreVertical className="w-4 h-4" />
            Lainnya
          </button>
          <button className="flex items-center gap-2 bg-slate-800 text-white px-4 py-2 rounded-full text-sm font-medium hover:bg-slate-700 transition-colors">
            <Plus className="w-4 h-4" />
            Tambah Guru
          </button>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 relative overflow-hidden flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
            <Users className="w-6 h-6" />
          </div>
          <div>
            {isLoading ? <Skeleton className="h-9 w-12 mb-1" /> : (
              <div className="text-3xl font-black text-slate-800">{total}</div>
            )}
            <div className="text-xs uppercase tracking-wide text-slate-500 font-semibold mt-0.5">Total Guru</div>
          </div>
          <div className="h-1 absolute bottom-0 left-0 right-0 bg-blue-500" />
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 relative overflow-hidden flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
            <UserCheck className="w-6 h-6" />
          </div>
          <div>
            {isLoading ? <Skeleton className="h-9 w-12 mb-1" /> : (
              <div className="text-3xl font-black text-slate-800">{guruAktif}</div>
            )}
            <div className="text-xs uppercase tracking-wide text-slate-500 font-semibold mt-0.5">Guru Aktif</div>
          </div>
          <div className="h-1 absolute bottom-0 left-0 right-0 bg-emerald-500" />
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 relative overflow-hidden flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center shrink-0">
            <Briefcase className="w-6 h-6" />
          </div>
          <div>
            {isLoading ? <Skeleton className="h-9 w-12 mb-1" /> : (
              <div className="text-3xl font-black text-slate-800">{staffTU}</div>
            )}
            <div className="text-xs uppercase tracking-wide text-slate-500 font-semibold mt-0.5">Staff TU</div>
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
            value={query}
            onChange={(e) => setQuery(e.target.value)}
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

      {/* Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-64 rounded-xl" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-20 text-center text-slate-400 bg-white rounded-xl border border-dashed border-slate-200">
          <Users className="w-12 h-12 mx-auto mb-3 opacity-20" />
          <p className="font-medium">Tidak ada guru ditemukan.</p>
          {query && <p className="text-sm mt-1">Coba kata kunci lain.</p>}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((t: any, idx: number) => {
            const prog = progressById.get(t.id);
            const jurnalCurrent = prog?.jurnalBulanIni ?? 0;
            const jurnalTotal = 18;
            const jurnalPct = Math.min(Math.round((jurnalCurrent / jurnalTotal) * 100), 100);
            const dokumenCurrent = prog?.dokumenSelesai ?? 0;
            const dokumenTotal = prog?.dokumenTotal ?? 10;
            const dokumenPct = dokumenTotal > 0 ? Math.min(Math.round((dokumenCurrent / dokumenTotal) * 100), 100) : 0;
            const jabatan: string[] = t.jabatan ?? [];
            const pjab = primaryJabatan(jabatan);
            const badgeClass = JABATAN_BADGE[pjab]?.bg ?? "bg-slate-50 text-slate-600";
            const roleText = buildRoleText(t);
            const avatarColor = getAvatarColor(idx);
            const emailDisplay = t.username ? `${t.username}@sekolah.id` : "";

            return (
              <div
                key={t.id}
                className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 flex flex-col hover:shadow-md transition-shadow"
              >
                {/* Header: Avatar + Info */}
                <div className="flex items-start gap-4 mb-4">
                  <div className={`w-14 h-14 rounded-full flex items-center justify-center font-bold text-xl shrink-0 ${avatarColor}`}>
                    {t.photoUrl ? (
                      <img src={t.photoUrl} alt={t.name} className="w-14 h-14 rounded-full object-cover" />
                    ) : (
                      initials(t.name ?? "?")
                    )}
                  </div>
                  <div className="flex-1 min-w-0 pt-1">
                    <h3 className="font-semibold text-slate-800 truncate">{t.name}</h3>
                    <p className="text-sm text-slate-500 truncate mt-0.5">{roleText}</p>
                    <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                      {jabatan.slice(0, 2).map((j: string) => {
                        const bc = JABATAN_BADGE[j]?.bg ?? "bg-slate-50 text-slate-600";
                        return (
                          <span
                            key={j}
                            className={`px-2 py-0.5 rounded-md text-[10px] font-semibold uppercase tracking-wide ${bc}`}
                          >
                            {JABATAN_LABELS[j] ?? j}
                          </span>
                        );
                      })}
                      {(t.mapel ?? []).slice(0, 1).map((m: string) => (
                        <span
                          key={m}
                          className="px-2 py-0.5 rounded-md text-[10px] font-semibold uppercase tracking-wide bg-slate-100 text-slate-600"
                        >
                          {m}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Progress Bars */}
                <div className="space-y-3 mb-5 flex-1">
                  <div>
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <span className="font-medium text-slate-600">Jurnal Mengajar</span>
                      <span className="text-slate-500 font-medium">{jurnalCurrent}/{jurnalTotal}</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                      <div
                        className={`h-full rounded-full ${progressBarColor(jurnalPct)}`}
                        style={{ width: `${jurnalPct}%` }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <span className="font-medium text-slate-600">Dokumen Kinerja</span>
                      <span className="text-slate-500 font-medium">{dokumenCurrent}/{dokumenTotal}</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                      <div
                        className={`h-full rounded-full ${progressBarColor(dokumenPct)}`}
                        style={{ width: `${dokumenPct}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Footer */}
                <div className="pt-4 border-t border-slate-100 flex items-center justify-between mt-auto">
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <Mail className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate max-w-[140px]">{emailDisplay || t.username || "—"}</span>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-700">
                    Aktif
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Layout>
  );
}
