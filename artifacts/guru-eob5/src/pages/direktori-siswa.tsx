import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Layout } from "@/components/layout";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Search,
  Users,
  UserCheck,
  UserX,
  Star,
  Coins,
  Zap,
  Flame,
} from "lucide-react";

// ── Types ────────────────────────────────────────────────────────────────────

type StudentDirectoryItem = {
  id: string;
  namaLengkap: string;
  kelas: string;
  nisn: string | null;
  jenisKelamin: "L" | "P";
  hasAccount: boolean;
  username: string | null;
  photoUrl: string | null;
  // TOMAT gamification
  coins: number | null;
  level: number | null;
  exp: number | null;
  totalCoinsEarned: number | null;
  bestSurvivalStreak: number | null;
  // BLP progress (current month)
  blpDaysActive: number | null;
  blpActivitiesTotal: number | null;
};

type AppMode = "blp" | "tomat";

// ── Helpers ──────────────────────────────────────────────────────────────────

const KELAS_COLORS = [
  "bg-blue-100 text-blue-700 border-blue-200",
  "bg-violet-100 text-violet-700 border-violet-200",
  "bg-emerald-100 text-emerald-700 border-emerald-200",
  "bg-amber-100 text-amber-700 border-amber-200",
  "bg-rose-100 text-rose-700 border-rose-200",
  "bg-cyan-100 text-cyan-700 border-cyan-200",
  "bg-fuchsia-100 text-fuchsia-700 border-fuchsia-200",
  "bg-orange-100 text-orange-700 border-orange-200",
  "bg-teal-100 text-teal-700 border-teal-200",
  "bg-indigo-100 text-indigo-700 border-indigo-200",
];

const AVATAR_PALETTES = [
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

function kelasColorIdx(kelas: string): number {
  let h = 0;
  for (const c of kelas) h = (h * 31 + c.charCodeAt(0)) & 0xffff;
  return h % KELAS_COLORS.length;
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

// EXP progress within current level (assuming 500 EXP per level)
const EXP_PER_LEVEL = 500;
function expPct(exp: number | null): number {
  if (exp == null || exp <= 0) return 0;
  return Math.min(Math.round((exp % EXP_PER_LEVEL) / EXP_PER_LEVEL * 100), 100);
}

function levelBarColor(level: number | null): string {
  if (!level || level < 3) return "bg-amber-400";
  if (level < 7) return "bg-blue-500";
  return "bg-emerald-500";
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function DirektoriSiswa() {
  const { data = [], isLoading } = useQuery<StudentDirectoryItem[]>({
    queryKey: ["/api/students/directory"],
    queryFn: () =>
      fetch("/api/students/directory", { credentials: "include" }).then((r) => {
        if (!r.ok) throw new Error("Gagal memuat data");
        return r.json();
      }),
    staleTime: 60_000,
  });

  const [query, setQuery] = useState("");
  const [kelasFilter, setKelasFilter] = useState("");
  const [accountFilter, setAccountFilter] = useState<"all" | "yes" | "no">("all");
  const [appMode, setAppMode] = useState<AppMode>("blp");

  const kelasList = useMemo(
    () => [...new Set(data.map((s) => s.kelas))].sort(),
    [data],
  );

  const filtered = useMemo(
    () =>
      data.filter((s) => {
        if (query) {
          const q = query.toLowerCase();
          if (
            !s.namaLengkap.toLowerCase().includes(q) &&
            !(s.nisn ?? "").includes(q) &&
            !s.username?.toLowerCase().includes(q)
          )
            return false;
        }
        if (kelasFilter && s.kelas !== kelasFilter) return false;
        if (accountFilter === "yes" && !s.hasAccount) return false;
        if (accountFilter === "no" && s.hasAccount) return false;
        return true;
      }),
    [data, query, kelasFilter, accountFilter],
  );

  const total = data.length;
  const withAccount = data.filter((s) => s.hasAccount).length;
  const withoutAccount = total - withAccount;

  return (
    <Layout>
      {/* Breadcrumb + Title */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="text-xs text-slate-400 mb-2 font-medium">
            GuruEOB5 / Akademik / Direktori Siswa
          </div>
          <h1 className="text-xl font-bold text-slate-800">Direktori Siswa</h1>
          <p className="text-sm text-slate-500 mt-1">
            {isLoading
              ? "Memuat…"
              : `${total} siswa terdaftar • progres BLP & Tomat`}
          </p>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
        {/* Total */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 relative overflow-hidden flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
            <Users className="w-6 h-6" />
          </div>
          <div>
            {isLoading ? (
              <Skeleton className="h-9 w-12 mb-1" />
            ) : (
              <div className="text-3xl font-black text-slate-800">{total}</div>
            )}
            <div className="text-xs uppercase tracking-wide text-slate-500 font-semibold mt-0.5">
              Total Siswa
            </div>
          </div>
          <div className="h-1 absolute bottom-0 left-0 right-0 bg-blue-500" />
        </div>

        {/* Punya Akun */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 relative overflow-hidden flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
            <UserCheck className="w-6 h-6" />
          </div>
          <div>
            {isLoading ? (
              <Skeleton className="h-9 w-12 mb-1" />
            ) : (
              <div className="text-3xl font-black text-slate-800">
                {withAccount}
              </div>
            )}
            <div className="text-xs uppercase tracking-wide text-slate-500 font-semibold mt-0.5">
              Punya Akun
            </div>
          </div>
          <div className="h-1 absolute bottom-0 left-0 right-0 bg-emerald-500" />
        </div>

        {/* Belum Akun */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 relative overflow-hidden flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center shrink-0">
            <UserX className="w-6 h-6" />
          </div>
          <div>
            {isLoading ? (
              <Skeleton className="h-9 w-12 mb-1" />
            ) : (
              <div className="text-3xl font-black text-slate-800">
                {withoutAccount}
              </div>
            )}
            <div className="text-xs uppercase tracking-wide text-slate-500 font-semibold mt-0.5">
              Belum Akun
            </div>
          </div>
          <div className="h-1 absolute bottom-0 left-0 right-0 bg-amber-500" />
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col gap-3 mb-6">
        {/* Row 1: Search + Kelas + Account */}
        <div className="flex flex-col sm:flex-row items-center gap-3">
          {/* Search */}
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Cari nama, NISN, atau username…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-full pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-800 focus:border-transparent transition-all placeholder:text-slate-400"
            />
          </div>

          {/* Kelas filter */}
          <select
            value={kelasFilter}
            onChange={(e) => setKelasFilter(e.target.value)}
            className="appearance-none bg-white border border-slate-200 text-slate-600 px-4 py-2 rounded-full text-sm font-medium focus:outline-none hover:bg-slate-50 transition-colors pr-8"
          >
            <option value="">Semua Kelas</option>
            {kelasList.map((k) => (
              <option key={k} value={k}>
                {k}
              </option>
            ))}
          </select>

          {/* Account filter */}
          <select
            value={accountFilter}
            onChange={(e) =>
              setAccountFilter(e.target.value as "all" | "yes" | "no")
            }
            className="appearance-none bg-white border border-slate-200 text-slate-600 px-4 py-2 rounded-full text-sm font-medium focus:outline-none hover:bg-slate-50 transition-colors pr-8"
          >
            <option value="all">Semua Status Akun</option>
            <option value="yes">Punya Akun</option>
            <option value="no">Belum Akun</option>
          </select>
        </div>

        {/* Row 2: App Mode Toggle — tepat di bawah kolom search */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400 font-medium mr-1">Tampilkan progres:</span>
          <button
            onClick={() => setAppMode("blp")}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-semibold border transition-all ${
              appMode === "blp"
                ? "bg-blue-600 text-white border-blue-600 shadow-sm shadow-blue-200"
                : "bg-white text-slate-500 border-slate-200 hover:border-blue-300 hover:text-blue-600"
            }`}
          >
            <span className="text-sm leading-none">📘</span>
            BLP
          </button>
          <button
            onClick={() => setAppMode("tomat")}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-semibold border transition-all ${
              appMode === "tomat"
                ? "bg-rose-500 text-white border-rose-500 shadow-sm shadow-rose-200"
                : "bg-white text-slate-500 border-slate-200 hover:border-rose-300 hover:text-rose-500"
            }`}
          >
            <span className="text-sm leading-none">🍅</span>
            TOMAT
          </button>
        </div>
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-56 rounded-xl" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-20 text-center text-slate-400 bg-white rounded-xl border border-dashed border-slate-200">
          <Users className="w-12 h-12 mx-auto mb-3 opacity-20" />
          <p className="font-medium">Tidak ada siswa ditemukan.</p>
          {(query || kelasFilter || accountFilter !== "all") && (
            <p className="text-sm mt-1">Coba ubah filter pencarian.</p>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((s, idx) => {
            const avatarColor = AVATAR_PALETTES[idx % AVATAR_PALETTES.length];
            const kelasColor = KELAS_COLORS[kelasColorIdx(s.kelas)];
            const isActive = s.hasAccount && ((s.level ?? 0) > 0 || (s.blpDaysActive ?? 0) > 0);
            const ep = expPct(s.exp);
            const barColor = levelBarColor(s.level);
            // BLP: days elapsed in current month for progress bar
            const today = new Date();
            const daysInMonthSoFar = today.getDate();
            const blpPct = s.blpDaysActive != null && daysInMonthSoFar > 0
              ? Math.min(Math.round((s.blpDaysActive / daysInMonthSoFar) * 100), 100)
              : 0;

            return (
              <div
                key={s.id}
                className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 flex flex-col hover:shadow-md transition-shadow"
              >
                {/* Header */}
                <div className="flex items-start gap-4 mb-4">
                  <div className={`w-14 h-14 rounded-full shrink-0 overflow-hidden flex items-center justify-center font-bold text-xl ${s.photoUrl ? "" : avatarColor}`}>
                    {s.photoUrl ? (
                      <img src={s.photoUrl} alt={s.namaLengkap} className="w-full h-full object-cover" />
                    ) : (
                      initials(s.namaLengkap)
                    )}
                  </div>
                  <div className="flex-1 min-w-0 pt-0.5">
                    <h3 className="font-semibold text-slate-800 truncate leading-tight">
                      {s.namaLengkap}
                    </h3>
                    <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                      {/* Kelas badge */}
                      <span
                        className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wide border ${kelasColor}`}
                      >
                        {s.kelas}
                      </span>
                      {/* Gender */}
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold uppercase tracking-wide bg-slate-100 text-slate-600">
                        {s.jenisKelamin === "L" ? "Laki-laki" : "Perempuan"}
                      </span>
                    </div>
                    {s.nisn && (
                      <p className="text-[11px] text-slate-400 mt-1 font-mono">
                        NISN {s.nisn}
                      </p>
                    )}
                  </div>
                </div>

                {/* Progress / Account section */}
                <div className="flex-1 space-y-3">
                  {!s.hasAccount ? (
                    /* No account yet */
                    <div className="flex items-center gap-2 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
                      <UserX className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                      <span className="text-xs text-amber-700 font-medium">
                        Belum punya akun {appMode === "blp" ? "BLP" : "TOMAT"}
                      </span>
                    </div>
                  ) : !isActive ? (
                    /* Has account but never logged in */
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 bg-slate-50 border border-slate-100 rounded-lg px-3 py-2">
                        <UserCheck className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="text-xs text-slate-500 font-medium">
                          Akun aktif — belum bermain
                        </span>
                      </div>
                      {s.username && (
                        <p className="text-[11px] text-slate-400 font-mono px-1">
                          @{s.username}
                        </p>
                      )}
                    </div>
                  ) : appMode === "blp" ? (
                    /* BLP progress — daily_records this month */
                    <div className="space-y-2.5">
                      {(s.blpDaysActive == null || s.blpDaysActive === 0) ? (
                        <div className="flex items-center gap-2 bg-slate-50 border border-slate-100 rounded-lg px-3 py-2">
                          <Zap className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="text-xs text-slate-500 font-medium">Belum ada aktivitas BLP bulan ini</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 flex-wrap">
                          <div className="flex items-center gap-1 bg-blue-50 border border-blue-100 rounded-lg px-2.5 py-1.5">
                            <Star className="w-3 h-3 text-blue-500" />
                            <span className="text-xs font-bold text-blue-700">{s.blpDaysActive} hari aktif</span>
                          </div>
                          {s.blpActivitiesTotal != null && s.blpActivitiesTotal > 0 && (
                            <div className="flex items-center gap-1 bg-emerald-50 border border-emerald-100 rounded-lg px-2.5 py-1.5">
                              <Zap className="w-3 h-3 text-emerald-500" />
                              <span className="text-xs font-bold text-emerald-700">{s.blpActivitiesTotal} aktivitas</span>
                            </div>
                          )}
                        </div>
                      )}
                      <div>
                        <div className="flex items-center justify-between text-[10px] mb-1 text-slate-500">
                          <span className="font-medium flex items-center gap-1">
                            <Star className="w-2.5 h-2.5" />
                            Keaktifan bulan ini
                          </span>
                          <span>{blpPct}%</span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                          <div className="h-full rounded-full transition-all bg-blue-500" style={{ width: `${blpPct}%` }} />
                        </div>
                      </div>
                      {s.username && <p className="text-[11px] text-slate-400 font-mono">@{s.username}</p>}
                    </div>
                  ) : (
                    /* TOMAT progress */
                    <div className="space-y-2.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <div className="flex items-center gap-1 bg-rose-50 border border-rose-100 rounded-lg px-2.5 py-1.5">
                          <Star className="w-3 h-3 text-rose-500" />
                          <span className="text-xs font-bold text-rose-700">Lv {s.level}</span>
                        </div>
                        {s.coins != null && (
                          <div className="flex items-center gap-1 bg-amber-50 border border-amber-100 rounded-lg px-2.5 py-1.5">
                            <Coins className="w-3 h-3 text-amber-500" />
                            <span className="text-xs font-bold text-amber-700">{s.coins.toLocaleString("id")}</span>
                          </div>
                        )}
                        {s.bestSurvivalStreak != null && (
                          <div className="flex items-center gap-1 bg-orange-50 border border-orange-100 rounded-lg px-2.5 py-1.5">
                            <Flame className="w-3 h-3 text-orange-500" />
                            <span className="text-xs font-bold text-orange-700">{s.bestSurvivalStreak}🔥</span>
                          </div>
                        )}
                      </div>
                      <div>
                        <div className="flex items-center justify-between text-[10px] mb-1 text-slate-500">
                          <span className="font-medium flex items-center gap-1">
                            <Zap className="w-2.5 h-2.5" />
                            Progres ke Level {(s.level ?? 0) + 1}
                          </span>
                          <span>{ep}%</span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                          <div className="h-full rounded-full transition-all bg-rose-500" style={{ width: `${ep}%` }} />
                        </div>
                      </div>
                      {s.username && <p className="text-[11px] text-slate-400 font-mono">@{s.username}</p>}
                    </div>
                  )}
                </div>

                {/* Footer: account status chip */}
                <div className="pt-4 border-t border-slate-100 mt-4">
                  {s.hasAccount ? (
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-700">
                      ✓ Punya Akun
                    </span>
                  ) : (
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-100 text-amber-700">
                      Belum Akun
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Layout>
  );
}
