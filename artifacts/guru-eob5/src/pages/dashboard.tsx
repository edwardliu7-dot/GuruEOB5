import { Layout } from "@/components/layout";
import { useAuth } from "@/lib/auth";
import { useGetDashboardSummary } from "@workspace/api-client-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "wouter";
import {
  Users,
  PenLine,
  FileText,
  CheckCircle,
  ChevronRight,
  TrendingUp,
  Calendar,
} from "lucide-react";
import { NumberTicker } from "@/components/motion";

// ── Sub-components ────────────────────────────────────────────────────────────

interface StatCardProps {
  title: string;
  value: React.ReactNode;
  color: "blue" | "violet" | "amber" | "emerald";
  icon: React.ReactNode;
  progress: number;
}

const COLOR_MAP = {
  blue:    { iconBg: "bg-blue-100", iconText: "text-blue-600", bar: "bg-blue-500" },
  violet:  { iconBg: "bg-violet-100", iconText: "text-violet-600", bar: "bg-violet-500" },
  amber:   { iconBg: "bg-amber-100", iconText: "text-amber-600", bar: "bg-amber-500" },
  emerald: { iconBg: "bg-emerald-100", iconText: "text-emerald-600", bar: "bg-emerald-500" },
};

function StatCard({ title, value, color, icon, progress }: StatCardProps) {
  const c = COLOR_MAP[color];
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 relative overflow-hidden">
      <div className="flex items-center gap-4">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${c.iconBg} ${c.iconText}`}>
          {icon}
        </div>
        <div>
          <div className="text-3xl font-black text-slate-800 tracking-tight leading-none mb-1">
            {value}
          </div>
          <div className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">{title}</div>
        </div>
      </div>
      <div className="h-1 absolute bottom-0 left-0 right-0 bg-slate-100">
        <div className={`h-full ${c.bar}`} style={{ width: `${progress}%` }} />
      </div>
    </div>
  );
}

function BarChart({ data }: { data: { minggu: string; jumlah: number }[] }) {
  const max = Math.max(...data.map((d) => d.jumlah), 1);
  // Show last 5 entries
  const visible = data.slice(-5);

  return (
    <div className="h-56 flex items-end gap-6 mt-8 pb-2 px-4">
      {visible.map((d, i) => {
        const pct = (d.jumlah / max) * 100;
        const isFull = pct >= 100;
        return (
          <div key={i} className="flex-1 flex flex-col items-center gap-3 group h-full justify-end">
            <div className="w-full bg-slate-100 rounded-t-lg relative h-full flex items-end overflow-hidden">
              <div
                className={`w-full rounded-t-lg transition-all duration-500 ${isFull ? "bg-slate-800" : "bg-slate-300"}`}
                style={{ height: `${pct}%` }}
              />
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900/40 backdrop-blur-sm rounded-t-lg">
                <span className="text-white text-xs font-bold">{d.jumlah}</span>
              </div>
            </div>
            <span className="text-xs font-bold text-slate-500 truncate max-w-full text-center">{d.minggu}</span>
          </div>
        );
      })}
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function Dashboard() {
  const { user } = useAuth();
  const { data: summary, isLoading } = useGetDashboardSummary();

  const firstName = user?.name?.split(" ")[0] ?? "Guru";
  const totalSiswa = summary?.totalSiswa ?? 0;
  const totalDokumen = summary?.totalDokumen ?? 0;
  const jurnalData = summary?.progresJurnalBulanIni ?? [];
  const jurnalCount = jurnalData.reduce((s, d) => s + d.jumlah, 0);
  const kelengkapan = summary?.kelengkapanAdministrasiPersen ?? 0;

  return (
    <Layout>
      <div className="min-h-screen p-0 font-sans text-slate-800">
        {/* Header */}
        <div className="flex justify-between items-end mb-6">
          <div>
            <div className="text-xs text-slate-400 mb-2 flex items-center gap-1">
              <span>Dashboard</span>
              <ChevronRight className="w-3 h-3" />
              <span className="text-slate-600 font-medium">Overview</span>
            </div>
            <h1 className="text-xl font-bold text-slate-800">Overview</h1>
            {isLoading ? (
              <Skeleton className="h-4 w-52 mt-1" />
            ) : (
              <p className="text-sm text-slate-500 mt-1">
                Selamat datang kembali, {firstName}
              </p>
            )}
          </div>
          <div>
            <Link href="/jurnal">
              <button className="rounded-full bg-slate-800 text-white px-4 py-2 text-sm font-medium hover:bg-slate-700 transition-colors">
                Tulis Jurnal
              </button>
            </Link>
          </div>
        </div>

        {/* Pill Switcher */}
        <div className="flex items-center gap-2 mb-6">
          <button className="px-4 py-1.5 rounded-full bg-slate-800 text-white text-sm font-medium shadow-sm">
            Ringkasan
          </button>
          <Link href="/jadwal">
            <button className="px-4 py-1.5 rounded-full bg-white border border-slate-200 text-slate-600 text-sm font-medium hover:bg-slate-50 shadow-sm transition-colors">
              Jadwal Mengajar
            </button>
          </Link>
          <Link href="/nilai">
            <button className="px-4 py-1.5 rounded-full bg-white border border-slate-200 text-slate-600 text-sm font-medium hover:bg-slate-50 shadow-sm transition-colors">
              Tugas & Nilai
            </button>
          </Link>
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 mb-6">
          {isLoading ? (
            Array(4).fill(0).map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)
          ) : (
            <>
              <StatCard
                title="Total Siswa"
                value={<NumberTicker value={totalSiswa} />}
                color="blue"
                icon={<Users className="w-6 h-6" />}
                progress={100}
              />
              <StatCard
                title="Jurnal Bulan Ini"
                value={jurnalCount}
                color="violet"
                icon={<PenLine className="w-6 h-6" />}
                progress={Math.min(kelengkapan, 100)}
              />
              <StatCard
                title="Total Dokumen"
                value={<NumberTicker value={totalDokumen} />}
                color="amber"
                icon={<FileText className="w-6 h-6" />}
                progress={65}
              />
              <StatCard
                title="Kelengkapan Adm."
                value={`${kelengkapan}%`}
                color="emerald"
                icon={<CheckCircle className="w-6 h-6" />}
                progress={kelengkapan}
              />
            </>
          )}
        </div>

        {/* Main Content */}
        <div className="flex flex-col lg:flex-row gap-5 items-start">
          {/* Left Column */}
          <div className="flex-1 flex flex-col gap-5 min-w-0">
            {/* Chart Section */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 relative overflow-hidden">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-base font-bold text-slate-800">Progres Jurnal Mengajar</h2>
                  {isLoading ? (
                    <Skeleton className="h-4 w-52 mt-1" />
                  ) : (
                    <p className="text-sm text-slate-500 mt-0.5">
                      {jurnalData.length} pekan tercatat pada semester ini
                    </p>
                  )}
                </div>
                {!isLoading && kelengkapan >= 80 && (
                  <div className="flex items-center gap-2">
                    <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-100 px-3 py-1 rounded-full">
                      <TrendingUp className="w-3.5 h-3.5" /> Sesuai Target
                    </span>
                  </div>
                )}
              </div>
              {isLoading ? (
                <Skeleton className="h-56 w-full mt-8" />
              ) : jurnalData.length > 0 ? (
                <BarChart data={jurnalData} />
              ) : (
                <div className="h-56 flex items-center justify-center text-slate-400 text-sm">
                  Belum ada data jurnal bulan ini
                </div>
              )}
            </div>

            {/* Academic Info */}
            {!isLoading && summary && (
              <div className="bg-slate-800 rounded-xl shadow-sm p-6 text-white relative overflow-hidden">
                <div className="absolute -top-4 -right-4 opacity-10">
                  <Calendar className="w-32 h-32" />
                </div>
                <div className="relative z-10">
                  <div className="flex items-center gap-2 mb-3">
                    <Calendar className="w-4 h-4 text-slate-300" />
                    <h2 className="text-xs uppercase tracking-wider font-bold text-slate-300">Kalender Akademik</h2>
                  </div>
                  <p className="text-2xl font-black mb-1">Semester {summary.semester}</p>
                  <p className="text-slate-400 text-sm mb-5">Tahun Ajaran {summary.tahunAjaran}</p>
                  <div className="bg-white/10 rounded-xl p-3.5 backdrop-blur-sm border border-white/10">
                    <p className="text-xs text-slate-300 mb-1.5 font-medium">{summary.schoolName}</p>
                    <p className="text-sm font-bold text-white">
                      {summary.totalGuru} Guru · {summary.totalSiswa} Siswa
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right Column */}
          <div className="w-full lg:w-72 flex-shrink-0 flex flex-col gap-5">
            {/* Summary Stats */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
              <h2 className="text-sm font-bold text-slate-800 mb-4 pb-3 border-b border-slate-100">
                Ringkasan Kinerja
              </h2>
              {isLoading ? (
                <div className="space-y-4">
                  {Array(3).fill(0).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
                </div>
              ) : (
                <div className="flex flex-col gap-4">
                  <SummaryRow
                    label="Total Siswa"
                    value={String(totalSiswa)}
                    sub="terdaftar"
                    color="blue"
                  />
                  <SummaryRow
                    label="Total Guru"
                    value={String(summary?.totalGuru ?? 0)}
                    sub="pendidik"
                    color="violet"
                  />
                  <SummaryRow
                    label="Kelengkapan Adm."
                    value={`${kelengkapan}%`}
                    sub={kelengkapan >= 80 ? "Sangat Baik" : kelengkapan >= 50 ? "Cukup" : "Perlu Perhatian"}
                    color="emerald"
                  />
                  <SummaryRow
                    label="Total Dokumen"
                    value={String(totalDokumen)}
                    sub="berkas"
                    color="amber"
                  />
                </div>
              )}
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
              <h2 className="text-sm font-bold text-slate-800 mb-4">Aksi Cepat</h2>
              <div className="flex flex-col gap-2">
                <Link href="/jurnal">
                  <button className="w-full text-left px-3 py-2.5 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors text-sm font-medium text-slate-700 flex items-center justify-between">
                    <span>Tulis Jurnal Hari Ini</span>
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  </button>
                </Link>
                <Link href="/absensi">
                  <button className="w-full text-left px-3 py-2.5 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors text-sm font-medium text-slate-700 flex items-center justify-between">
                    <span>Input Absensi</span>
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  </button>
                </Link>
                <Link href="/nilai">
                  <button className="w-full text-left px-3 py-2.5 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors text-sm font-medium text-slate-700 flex items-center justify-between">
                    <span>Input Nilai</span>
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  </button>
                </Link>
                <Link href="/administrasi">
                  <button className="w-full text-left px-3 py-2.5 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors text-sm font-medium text-slate-700 flex items-center justify-between">
                    <span>Kelola Dokumen</span>
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  </button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}

function SummaryRow({
  label,
  value,
  sub,
  color,
}: {
  label: string;
  value: string;
  sub: string;
  color: "blue" | "violet" | "amber" | "emerald";
}) {
  const c = COLOR_MAP[color];
  return (
    <div className="flex items-center gap-3.5">
      <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${c.iconBg} ${c.iconText}`}>
        <div className="w-2 h-2 rounded-full bg-current" />
      </div>
      <div className="flex-1 min-w-0 pt-0.5">
        <div className="flex justify-between items-baseline gap-2 mb-0.5">
          <h4 className="text-sm font-bold text-slate-800 truncate">{label}</h4>
          <span className="text-xs font-bold text-slate-700 whitespace-nowrap">{value}</span>
        </div>
        <p className="text-xs text-slate-500 truncate">{sub}</p>
      </div>
    </div>
  );
}
