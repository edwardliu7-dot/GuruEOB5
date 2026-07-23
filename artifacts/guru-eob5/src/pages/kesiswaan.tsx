import { Layout } from "@/components/layout";
import { useGetKesiswaanOverview, useGetKesiswaanAbsensiSiswa } from "@workspace/api-client-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useMemo, useState } from "react";
import {
  Users,
  UserCheck,
  AlertTriangle,
  AlertCircle,
  ChevronRight,
  Download,
  Filter,
  TrendingDown,
  Award,
  MoreHorizontal,
  Star,
  Search,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

function getProgressColor(pct: number) {
  if (pct >= 93) return "bg-emerald-500";
  if (pct >= 90) return "bg-amber-500";
  return "bg-red-500";
}

function getStatusColor(status: string) {
  if (status === "Baik") return "bg-emerald-100 text-emerald-700";
  if (status === "Perhatian") return "bg-amber-100 text-amber-700";
  if (status === "Kritis") return "bg-red-100 text-red-700";
  return "bg-slate-100 text-slate-700";
}

function getInitials(name: string) {
  return name
    .split(" ")
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

const AVATAR_COLORS = [
  "bg-blue-100 text-blue-700",
  "bg-pink-100 text-pink-700",
  "bg-orange-100 text-orange-700",
  "bg-purple-100 text-purple-700",
  "bg-indigo-100 text-indigo-700",
  "bg-rose-100 text-rose-700",
  "bg-teal-100 text-teal-700",
  "bg-emerald-100 text-emerald-700",
];
function getAvatar(name: string) {
  return AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length];
}

export default function Kesiswaan() {
  const { data, isLoading } = useGetKesiswaanOverview();
  const { data: siswaAbsensi, isLoading: isLoadingSiswa } = useGetKesiswaanAbsensiSiswa();
  const [activeTab, setActiveTab] = useState<"ringkasan" | "siswa">("ringkasan");
  const [searchSiswa, setSearchSiswa] = useState("");
  const [filterKelas, setFilterKelas] = useState<string>("semua");

  const summary = useMemo(() => {
    if (!data?.perKelas?.length) return null;
    const totalSiswa = data.perKelas.reduce((s: number, k: any) => s + k.totalSiswa, 0);
    const totalHadir = data.perKelas.reduce((s: number, k: any) => s + k.hadir, 0);
    const totalSesi = data.perKelas.reduce(
      (s: number, k: any) => s + k.hadir + k.izin + k.sakit + k.alpa,
      0
    );
    const pctHadir = totalSesi > 0 ? Math.round((totalHadir / totalSesi) * 100) : 0;
    const totalPoinNegatif = data.perKelas.reduce(
      (s: number, k: any) => s + k.totalPoinNegatif,
      0
    );
    const siswaKritis = data.perKelas.filter((k: any) => {
      const total = k.hadir + k.izin + k.sakit + k.alpa;
      const pct = total > 0 ? Math.round((k.hadir / total) * 100) : 0;
      return pct < 75 || k.totalPoinNegatif > 100;
    }).length;
    return { totalSiswa, pctHadir, totalPoinNegatif, siswaKritis };
  }, [data]);

  const enrichedKelas = useMemo(() => {
    if (!data?.perKelas?.length) return [];
    return data.perKelas
      .map((k: any) => {
        const total = k.hadir + k.izin + k.sakit + k.alpa;
        const pctHadir = total > 0 ? Math.round((k.hadir / total) * 100) : 0;
        const status =
          pctHadir >= 93 && k.totalPoinNegatif <= 50
            ? "Baik"
            : pctHadir < 85 || k.totalPoinNegatif > 100
            ? "Kritis"
            : "Perhatian";
        return { ...k, pctHadir, status };
      })
      .sort((a: any, b: any) => a.kelas.localeCompare(b.kelas, "id"));
  }, [data]);

  const kelasOptions = useMemo(() => {
    if (!siswaAbsensi?.length) return [];
    return [...new Set((siswaAbsensi as any[]).map((s: any) => s.kelas))].sort((a, b) =>
      a.localeCompare(b, "id"),
    );
  }, [siswaAbsensi]);

  const topPelanggaran = (data?.siswaPoinTerbanyak ?? []).slice(0, 6);
  const topPrestasi = (data?.siswaPoinPositifTerbanyak ?? []).slice(0, 6);

  const stats = [
    {
      title: "Total Siswa",
      value: summary?.totalSiswa ?? 0,
      icon: Users,
      bg: "bg-blue-100",
      iconColor: "text-blue-600",
      bar: "bg-blue-500",
    },
    {
      title: "Rata-rata Kehadiran",
      value: summary ? `${summary.pctHadir}%` : "—",
      icon: UserCheck,
      bg: "bg-emerald-100",
      iconColor: "text-emerald-600",
      bar: "bg-emerald-500",
    },
    {
      title: "Total Poin Pelanggaran",
      value: summary?.totalPoinNegatif ?? 0,
      icon: TrendingDown,
      bg: "bg-red-100",
      iconColor: "text-red-600",
      bar: "bg-red-500",
    },
    {
      title: "Kelas Kritis",
      value: summary?.siswaKritis ?? 0,
      icon: AlertTriangle,
      bg: "bg-amber-100",
      iconColor: "text-amber-600",
      bar: "bg-amber-500",
    },
  ];

  return (
    <Layout>
      {/* Top Section */}
      <div className="flex justify-between items-end mb-6">
        <div>
          <div className="flex items-center text-xs text-slate-400 mb-2 font-medium">
            <span>Dashboard</span>
            <ChevronRight size={12} className="mx-1" />
            <span className="text-slate-600">Kesiswaan</span>
          </div>
          <h1 className="text-xl font-bold text-slate-800">Rekap Kesiswaan</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Monitoring absensi dan poin pelanggaran siswa seluruh kelas
          </p>
        </div>
        <div className="flex gap-2">
          <button className="flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-slate-200 text-slate-600 text-sm font-medium hover:bg-slate-50 transition-colors shadow-sm">
            <Filter size={16} />
            Filter
          </button>
          <button className="flex items-center gap-2 px-4 py-2 rounded-full bg-slate-800 text-white text-sm font-medium hover:bg-slate-700 transition-colors shadow-sm">
            <Download size={16} />
            Export Laporan
          </button>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 mb-6">
        {stats.map((stat, i) => (
          <div
            key={i}
            className="relative bg-white rounded-xl border border-slate-200 shadow-sm p-5 flex items-center gap-4 overflow-hidden"
          >
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${stat.bg}`}>
              <stat.icon size={24} className={stat.iconColor} />
            </div>
            <div>
              {isLoading ? (
                <Skeleton className="h-8 w-16 mb-1" />
              ) : (
                <div className="text-3xl font-black text-slate-800 leading-none mb-1">
                  {stat.value}
                </div>
              )}
              <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                {stat.title}
              </div>
            </div>
            <div className={`h-1 absolute bottom-0 left-0 right-0 ${stat.bar}`} />
          </div>
        ))}
      </div>

      {/* Tab Navigation */}
      <div className="flex bg-slate-100/50 p-1 rounded-full w-max mb-5 border border-slate-200/50 shadow-sm">
        <button
          onClick={() => setActiveTab("ringkasan")}
          className={`px-5 py-2 text-sm font-medium rounded-full transition-all ${activeTab === "ringkasan" ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
        >
          Ringkasan Kelas
        </button>
        <button
          onClick={() => setActiveTab("siswa")}
          className={`px-5 py-2 text-sm font-medium rounded-full transition-all ${activeTab === "siswa" ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
        >
          Rekap Per Siswa
        </button>
      </div>

      {activeTab === "siswa" && (
        <div>
          <div className="flex items-center gap-3 mb-4 flex-wrap">
            <div className="relative flex-1 min-w-48 max-w-sm">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <Input
                placeholder="Cari nama siswa..."
                className="pl-8 h-9 rounded-full"
                value={searchSiswa}
                onChange={(e) => setSearchSiswa(e.target.value)}
              />
            </div>
            {kelasOptions.length > 0 && (
              <Select value={filterKelas} onValueChange={setFilterKelas}>
                <SelectTrigger className="h-9 w-52 rounded-full">
                  <SelectValue placeholder="Semua Kelas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="semua">Semua Kelas</SelectItem>
                  {kelasOptions.map((k: string) => (
                    <SelectItem key={k} value={k}>{k}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  <th className="p-4 font-semibold">Nama Siswa</th>
                  <th className="p-4 font-semibold">Kelas</th>
                  <th className="p-4 font-semibold text-center">Hadir</th>
                  <th className="p-4 font-semibold text-center">Izin</th>
                  <th className="p-4 font-semibold text-center">Sakit</th>
                  <th className="p-4 font-semibold text-center">Alpa</th>
                  <th className="p-4 font-semibold w-36">Kehadiran</th>
                  <th className="p-4 font-semibold text-center">Poin +</th>
                  <th className="p-4 font-semibold text-center">Poin −</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {isLoadingSiswa ? (
                  Array.from({ length: 8 }).map((_, i) => (
                    <tr key={i}><td colSpan={9} className="p-4"><Skeleton className="h-5 w-full" /></td></tr>
                  ))
                ) : !siswaAbsensi?.length ? (
                  <tr><td colSpan={9} className="p-12 text-center text-slate-400">Belum ada data siswa.</td></tr>
                ) : (
                  siswaAbsensi
                    .filter((s: any) =>
                      (filterKelas === "semua" || s.kelas === filterKelas) &&
                      (!searchSiswa || s.namaLengkap.toLowerCase().includes(searchSiswa.toLowerCase()) || s.kelas.toLowerCase().includes(searchSiswa.toLowerCase()))
                    )
                    .map((s: any) => (
                      <tr key={s.studentId} className="hover:bg-slate-50 transition-colors">
                        <td className="p-4 font-medium text-slate-800">{s.namaLengkap}</td>
                        <td className="p-4 text-slate-600">{s.kelas}</td>
                        <td className="p-4 text-center text-emerald-600 font-semibold">{s.hadir}</td>
                        <td className="p-4 text-center text-slate-500">{s.izin}</td>
                        <td className="p-4 text-center text-slate-500">{s.sakit}</td>
                        <td className="p-4 text-center text-red-500 font-semibold">{s.alpa}</td>
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold w-9">{s.pctHadir}%</span>
                            <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                              <div className={`h-full rounded-full ${getProgressColor(s.pctHadir)}`} style={{ width: `${s.pctHadir}%` }} />
                            </div>
                          </div>
                        </td>
                        <td className="p-4 text-center font-semibold text-emerald-600">{s.totalPoinPositif > 0 ? s.totalPoinPositif : <span className="text-slate-400">-</span>}</td>
                        <td className="p-4 text-center font-semibold">{s.totalPoinNegatif > 0 ? <span className={s.totalPoinNegatif > 50 ? "text-red-600" : "text-slate-700"}>{s.totalPoinNegatif}</span> : <span className="text-slate-400">-</span>}</td>
                      </tr>
                    ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === "ringkasan" && (
      <div className="flex gap-5 items-start">
        {/* Left Column - Table */}
        <div className="flex-1">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 px-1">
            Ringkasan Per Kelas
          </div>
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  <th className="p-4 font-semibold">Kelas</th>
                  <th className="p-4 font-semibold text-center">Jml Siswa</th>
                  <th className="p-4 font-semibold w-44">Kehadiran</th>
                  <th className="p-4 font-semibold text-center">Poin −</th>
                  <th className="p-4 font-semibold text-center">Poin +</th>
                  <th className="p-4 font-semibold text-center">Status</th>
                  <th className="p-4 w-10" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i}>
                      <td colSpan={7} className="p-4">
                        <Skeleton className="h-5 w-full" />
                      </td>
                    </tr>
                  ))
                ) : !enrichedKelas.length ? (
                  <tr>
                    <td colSpan={7} className="p-12 text-center text-slate-400">
                      Belum ada data siswa.
                    </td>
                  </tr>
                ) : (
                  enrichedKelas.map((k: any, i: number) => (
                    <tr key={i} className="hover:bg-slate-50 transition-colors group">
                      <td className="p-4 font-bold text-slate-800 whitespace-nowrap">
                        {k.kelas}
                      </td>
                      <td className="p-4 text-center text-slate-600">{k.totalSiswa}</td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-slate-700 w-9 text-xs">
                            {k.pctHadir}%
                          </span>
                          <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${getProgressColor(k.pctHadir)}`}
                              style={{ width: `${k.pctHadir}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="p-4 text-center font-semibold">
                        {k.totalPoinNegatif > 0 ? (
                          <span className={k.totalPoinNegatif > 100 ? "text-red-600" : "text-slate-700"}>
                            {k.totalPoinNegatif}
                          </span>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>
                      <td className="p-4 text-center font-semibold text-emerald-600">
                        {k.totalPoinPositif > 0 ? k.totalPoinPositif : (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>
                      <td className="p-4 text-center">
                        <span
                          className={`inline-flex items-center justify-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${getStatusColor(k.status)}`}
                        >
                          {k.status}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <button className="text-slate-400 hover:text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity">
                          <MoreHorizontal size={16} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Column - Sidebars */}
        <div className="w-72 flex flex-col gap-5 shrink-0">
          {/* Top Pelanggaran */}
          <div>
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 px-1">
              Top Pelanggaran
            </div>
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
              <div className="p-4 border-b border-slate-100 flex items-center gap-2 bg-slate-50/50">
                <AlertCircle size={18} className="text-red-500" />
                <span className="font-semibold text-sm text-slate-800">Perlu Perhatian Khusus</span>
              </div>
              <div className="p-2 flex flex-col gap-1">
                {isLoading ? (
                  Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="p-2">
                      <Skeleton className="h-10 w-full" />
                    </div>
                  ))
                ) : !topPelanggaran.length ? (
                  <p className="text-xs text-slate-400 text-center py-4">
                    Belum ada catatan pelanggaran.
                  </p>
                ) : (
                  topPelanggaran.map((siswa: any, i: number) => (
                    <div
                      key={siswa.studentId ?? i}
                      className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${getAvatar(siswa.namaLengkap)}`}
                        >
                          {getInitials(siswa.namaLengkap)}
                        </div>
                        <div className="flex flex-col">
                          <span className="text-sm font-semibold text-slate-800 leading-tight">
                            {siswa.namaLengkap}
                          </span>
                          <span className="text-xs text-slate-500">{siswa.kelas}</span>
                        </div>
                      </div>
                      <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-full bg-red-100 text-red-700 text-xs font-bold min-w-[36px]">
                        {siswa.totalPoin}
                      </span>
                    </div>
                  ))
                )}
              </div>
              {topPelanggaran.length > 0 && (
                <div className="p-3 border-t border-slate-100">
                  <button className="w-full text-center text-xs font-medium text-slate-500 hover:text-slate-800 py-1 transition-colors">
                    Lihat Semua Data
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Top Prestasi */}
          <div>
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 px-1">
              Top Prestasi
            </div>
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
              <div className="p-4 border-b border-slate-100 flex items-center gap-2 bg-slate-50/50">
                <Star size={18} className="text-amber-500" />
                <span className="font-semibold text-sm text-slate-800">Poin Positif Tertinggi</span>
              </div>
              <div className="p-2 flex flex-col gap-1">
                {isLoading ? (
                  Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="p-2"><Skeleton className="h-10 w-full" /></div>
                  ))
                ) : !topPrestasi.length ? (
                  <p className="text-xs text-slate-400 text-center py-4">Belum ada poin positif.</p>
                ) : (
                  topPrestasi.map((siswa: any, i: number) => (
                    <div key={siswa.studentId ?? i} className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 transition-colors">
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-bold text-slate-400 w-4">{i + 1}</span>
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${getAvatar(siswa.namaLengkap)}`}>
                          {getInitials(siswa.namaLengkap)}
                        </div>
                        <div className="flex flex-col">
                          <span className="text-sm font-semibold text-slate-800 leading-tight">{siswa.namaLengkap}</span>
                          <span className="text-xs text-slate-500">{siswa.kelas}</span>
                        </div>
                      </div>
                      <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 text-xs font-bold min-w-[36px]">
                        +{siswa.totalPoin}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Kelas Terbaik */}
          <div>
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 px-1">
              Kelas Terbaik
            </div>
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
              <div className="p-4 border-b border-slate-100 flex items-center gap-2 bg-slate-50/50">
                <Award size={18} className="text-emerald-500" />
                <span className="font-semibold text-sm text-slate-800">Kehadiran Tertinggi</span>
              </div>
              <div className="p-2 flex flex-col gap-1">
                {isLoading ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="p-2"><Skeleton className="h-10 w-full" /></div>
                  ))
                ) : !enrichedKelas.length ? (
                  <p className="text-xs text-slate-400 text-center py-4">Belum ada data.</p>
                ) : (
                  [...enrichedKelas]
                    .sort((a: any, b: any) => b.pctHadir - a.pctHadir)
                    .slice(0, 5)
                    .map((k: any, i: number) => (
                      <div key={k.kelas} className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 transition-colors">
                        <div className="flex items-center gap-3">
                          <span className="text-xs font-bold text-slate-400 w-4">{i + 1}</span>
                          <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold bg-emerald-100 text-emerald-700">
                            {k.kelas.replace(/\s/g, "").slice(0, 3)}
                          </div>
                          <div className="flex flex-col">
                            <span className="text-sm font-semibold text-slate-800 leading-tight">{k.kelas}</span>
                            <span className="text-xs text-slate-500">{k.totalSiswa} siswa</span>
                          </div>
                        </div>
                        <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-xs font-bold">
                          {k.pctHadir}%
                        </span>
                      </div>
                    ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      )}
    </Layout>
  );
}
