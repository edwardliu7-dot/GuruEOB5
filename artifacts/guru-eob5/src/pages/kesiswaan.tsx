import { Layout } from "@/components/layout";
import { useGetKesiswaanOverview } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useMemo } from "react";
import { Users, UserCheck, AlertCircle, Trophy, TrendingUp, ChevronRight } from "lucide-react";

export default function Kesiswaan() {
  const { data, isLoading } = useGetKesiswaanOverview();

  // ---- Summary stats ----
  const stats = useMemo(() => {
    if (!data?.perKelas?.length) return null;
    const totalSiswa = data.perKelas.reduce((s: number, k: any) => s + k.totalSiswa, 0);
    const totalHadir = data.perKelas.reduce((s: number, k: any) => s + k.hadir, 0);
    const totalSesi = data.perKelas.reduce((s: number, k: any) => s + k.hadir + k.izin + k.sakit + k.alpa, 0);
    const pctHadir = totalSesi > 0 ? Math.round((totalHadir / totalSesi) * 100) : 0;
    const totalPoinPositif = data.perKelas.reduce((s: number, k: any) => s + k.totalPoinPositif, 0);
    const totalPoinNegatif = data.perKelas.reduce((s: number, k: any) => s + k.totalPoinNegatif, 0);
    return { totalSiswa, pctHadir, totalPoinPositif, totalPoinNegatif };
  }, [data]);

  // ---- Kelas terbaik (by hadir %) ----
  const kelasTerbaik = useMemo(() => {
    if (!data?.perKelas?.length) return [];
    return [...data.perKelas]
      .map((k: any) => {
        const total = k.hadir + k.izin + k.sakit + k.alpa;
        const pct = total > 0 ? Math.round((k.hadir / total) * 100) : 0;
        return { ...k, pctHadir: pct };
      })
      .sort((a: any, b: any) => b.pctHadir - a.pctHadir)
      .slice(0, 5);
  }, [data]);

  const AVATAR_COLORS = [
    "bg-blue-100 text-blue-700", "bg-pink-100 text-pink-700",
    "bg-orange-100 text-orange-700", "bg-purple-100 text-purple-700",
    "bg-indigo-100 text-indigo-700", "bg-rose-100 text-rose-700",
    "bg-teal-100 text-teal-700", "bg-emerald-100 text-emerald-700",
  ];
  const getAvatar = (name: string) => AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length];
  const getInitials = (name: string) =>
    name.split(" ").map((p) => p[0]).filter(Boolean).slice(0, 2).join("").toUpperCase();

  return (
    <Layout>
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-slate-400 mb-2">
        <span>Beranda</span>
        <ChevronRight className="w-3 h-3" />
        <span className="text-slate-600 font-medium">Rekap Kesiswaan</span>
      </div>

      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div>
          <h1 className="text-xl font-bold text-slate-800">Rekap Kesiswaan</h1>
          <p className="text-muted-foreground mt-1">
            Rekap absensi dan poin pelanggaran seluruh kelas.
          </p>
        </div>

        {/* Stats Row */}
        {isLoading ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[1,2,3,4].map(i => <Skeleton key={i} className="h-24 w-full rounded-xl" />)}
          </div>
        ) : stats && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 flex items-center gap-4 relative overflow-hidden">
              <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <div className="text-xs uppercase tracking-wide text-slate-500 mb-1">Total Siswa</div>
                <div className="text-3xl font-black text-slate-800">{stats.totalSiswa}</div>
              </div>
              <div className="h-1 absolute bottom-0 left-0 right-0 bg-blue-500" />
            </div>
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 flex items-center gap-4 relative overflow-hidden">
              <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                <UserCheck className="w-6 h-6" />
              </div>
              <div>
                <div className="text-xs uppercase tracking-wide text-slate-500 mb-1">Rata Kehadiran</div>
                <div className="text-3xl font-black text-slate-800">{stats.pctHadir}%</div>
              </div>
              <div className="h-1 absolute bottom-0 left-0 right-0 bg-emerald-500" style={{ width: `${stats.pctHadir}%` }} />
            </div>
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 flex items-center gap-4 relative overflow-hidden">
              <div className="w-12 h-12 rounded-xl bg-violet-100 text-violet-600 flex items-center justify-center shrink-0">
                <Trophy className="w-6 h-6" />
              </div>
              <div>
                <div className="text-xs uppercase tracking-wide text-slate-500 mb-1">Poin Positif</div>
                <div className="text-3xl font-black text-slate-800">{stats.totalPoinPositif}</div>
              </div>
              <div className="h-1 absolute bottom-0 left-0 right-0 bg-violet-500" />
            </div>
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 flex items-center gap-4 relative overflow-hidden">
              <div className="w-12 h-12 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                <AlertCircle className="w-6 h-6" />
              </div>
              <div>
                <div className="text-xs uppercase tracking-wide text-slate-500 mb-1">Poin Negatif</div>
                <div className="text-3xl font-black text-slate-800">{stats.totalPoinNegatif}</div>
              </div>
              <div className="h-1 absolute bottom-0 left-0 right-0 bg-rose-500" />
            </div>
          </div>
        )}

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2].map((i) => (
              <Skeleton key={i} className="h-40 w-full" />
            ))}
          </div>
        ) : (
          <div className="flex flex-col lg:flex-row gap-5">
            {/* Left: Per-kelas table */}
            <div className="flex-1 min-w-0 space-y-5">
              <Card className="border-none shadow-sm ring-1 ring-black/5">
                <CardHeader>
                  <CardTitle className="text-lg font-serif">Rekap per Kelas</CardTitle>
                </CardHeader>
                <CardContent>
                  {!data?.perKelas?.length ? (
                    <p className="text-center text-muted-foreground py-8">Belum ada data siswa.</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Kelas</TableHead>
                            <TableHead className="text-center">Siswa</TableHead>
                            <TableHead className="text-center text-emerald-600">Hadir</TableHead>
                            <TableHead className="text-center">Izin</TableHead>
                            <TableHead className="text-center">Sakit</TableHead>
                            <TableHead className="text-center text-red-600">Alpa</TableHead>
                            <TableHead className="text-center">Poin +</TableHead>
                            <TableHead className="text-center">Poin −</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {data.perKelas.map((k: any) => {
                            const total = k.hadir + k.izin + k.sakit + k.alpa;
                            const pct = total > 0 ? Math.round((k.hadir / total) * 100) : 0;
                            return (
                              <TableRow key={k.kelas}>
                                <TableCell className="font-medium">{k.kelas}</TableCell>
                                <TableCell className="text-center">{k.totalSiswa}</TableCell>
                                <TableCell className="text-center">
                                  <span className="text-emerald-600 font-semibold">{k.hadir}</span>
                                  <span className="text-xs text-slate-400 ml-1">({pct}%)</span>
                                </TableCell>
                                <TableCell className="text-center">{k.izin}</TableCell>
                                <TableCell className="text-center">{k.sakit}</TableCell>
                                <TableCell className="text-center text-red-600">{k.alpa}</TableCell>
                                <TableCell className="text-center text-green-600">{k.totalPoinPositif}</TableCell>
                                <TableCell className="text-center text-red-600">{k.totalPoinNegatif}</TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Right: Sidebars */}
            <div className="w-full lg:w-72 flex flex-col gap-5">
              {/* Kelas Terbaik */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-4 border-b border-slate-100 flex items-center gap-3 bg-emerald-50/30">
                  <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center">
                    <TrendingUp className="w-4 h-4" />
                  </div>
                  <h3 className="font-bold text-slate-800 text-sm">Kelas Terbaik</h3>
                  <span className="ml-auto text-xs text-slate-400">by kehadiran</span>
                </div>
                <div className="p-4 flex flex-col gap-3">
                  {!kelasTerbaik.length ? (
                    <p className="text-xs text-slate-400 text-center py-2">Belum ada data</p>
                  ) : kelasTerbaik.map((k: any, idx: number) => (
                    <div key={k.kelas}>
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-400 w-4">{idx + 1}</span>
                          <span className="font-semibold text-slate-700 text-sm">{k.kelas}</span>
                          <span className="text-xs text-slate-400">{k.totalSiswa} siswa</span>
                        </div>
                        <span className="text-xs font-bold text-emerald-600">{k.pctHadir}%</span>
                      </div>
                      <div className="ml-6 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${k.pctHadir >= 85 ? "bg-emerald-500" : k.pctHadir >= 70 ? "bg-amber-500" : "bg-rose-500"}`}
                          style={{ width: `${k.pctHadir}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Top Pelanggaran */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-4 border-b border-slate-100 flex items-center gap-3 bg-rose-50/30">
                  <div className="w-8 h-8 rounded-lg bg-rose-100 text-rose-600 flex items-center justify-center">
                    <AlertCircle className="w-4 h-4" />
                  </div>
                  <h3 className="font-bold text-slate-800 text-sm">Top Pelanggaran</h3>
                </div>
                <div className="p-4 flex flex-col gap-4">
                  {!data?.siswaPoinTerbanyak?.length ? (
                    <p className="text-xs text-slate-400 text-center py-2">Belum ada catatan poin pelanggaran.</p>
                  ) : data.siswaPoinTerbanyak.map((s: any, idx: number) => (
                    <div key={s.studentId} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-bold text-slate-400 w-4">{idx + 1}</span>
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${getAvatar(s.namaLengkap)}`}>
                          {getInitials(s.namaLengkap)}
                        </div>
                        <div>
                          <div className="font-medium text-slate-700 text-sm">{s.namaLengkap}</div>
                          <div className="text-xs text-slate-400">{s.kelas}</div>
                        </div>
                      </div>
                      <Badge variant="destructive">{s.totalPoin}</Badge>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
