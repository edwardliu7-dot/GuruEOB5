import { Layout } from "@/components/layout";
import { useGetWaliKelasRekap, useGetWaliKelasJurnal } from "@workspace/api-client-react";
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
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { BookOpen, UserCheck, Award, AlertCircle, Users } from "lucide-react";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { useMemo } from "react";

export default function WaliKelas() {
  const { data, isLoading } = useGetWaliKelasRekap();
  const { data: jurnalData, isLoading: jurnalLoading } = useGetWaliKelasJurnal();

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

    const poinNegatifTotal = siswa
      .filter((x: any) => (x.totalPoin ?? 0) < 0)
      .reduce((s: number, x: any) => s + Math.abs(x.totalPoin ?? 0), 0);

    // "Perlu perhatian" = alpa >= 3 OR poin < -20
    const perluPerhatian = siswa.filter((x: any) => (x.alpa ?? 0) >= 3 || (x.totalPoin ?? 0) < -20).length;

    return { avgHadir, avgNilai, poinNegatifTotal, perluPerhatian };
  }, [data]);

  return (
    <Layout>
      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div>
          <h1 className="text-xl font-bold text-slate-800">Rekap Wali Kelas</h1>
          <p className="text-muted-foreground mt-1">
            {isLoading ? (
              <Skeleton className="h-5 w-48" />
            ) : (
              `Rekap absensi, nilai, poin, dan jurnal mengajar kelas ${data?.kelas ?? ""}`
            )}
          </p>
        </div>

        {/* Stats Cards */}
        {isLoading ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[1,2,3,4].map(i => <Skeleton key={i} className="h-24 w-full rounded-xl" />)}
          </div>
        ) : stats && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 flex items-center gap-4 relative overflow-hidden">
              <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                <UserCheck className="w-6 h-6" />
              </div>
              <div>
                <div className="text-xs uppercase tracking-wide text-slate-500 mb-1">Hadir Rata-rata</div>
                <div className="text-3xl font-black text-slate-800">{stats.avgHadir}%</div>
              </div>
              <div className="h-1 absolute bottom-0 left-0 right-0 bg-emerald-500" style={{ width: `${stats.avgHadir}%` }} />
            </div>
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 flex items-center gap-4 relative overflow-hidden">
              <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                <Award className="w-6 h-6" />
              </div>
              <div>
                <div className="text-xs uppercase tracking-wide text-slate-500 mb-1">Rata-rata Nilai</div>
                <div className="text-3xl font-black text-slate-800">{stats.avgNilai ?? "—"}</div>
              </div>
              <div className="h-1 absolute bottom-0 left-0 right-0 bg-blue-500" style={{ width: `${(parseFloat(stats.avgNilai ?? "0") / 100) * 100}%` }} />
            </div>
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 flex items-center gap-4 relative overflow-hidden">
              <div className="w-12 h-12 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                <AlertCircle className="w-6 h-6" />
              </div>
              <div>
                <div className="text-xs uppercase tracking-wide text-slate-500 mb-1">Poin Pelanggaran</div>
                <div className="text-3xl font-black text-slate-800">{stats.poinNegatifTotal}</div>
              </div>
              <div className="h-1 absolute bottom-0 left-0 right-0 bg-rose-500" />
            </div>
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 flex items-center gap-4 relative overflow-hidden">
              <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center shrink-0">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <div className="text-xs uppercase tracking-wide text-slate-500 mb-1">Perlu Perhatian</div>
                <div className="text-3xl font-black text-slate-800">{stats.perluPerhatian}</div>
                <div className="text-xs text-slate-400">siswa</div>
              </div>
              <div className="h-1 absolute bottom-0 left-0 right-0 bg-amber-500" />
            </div>
          </div>
        )}

        <Tabs defaultValue="siswa">
          <TabsList>
            <TabsTrigger value="siswa">Data Siswa</TabsTrigger>
            <TabsTrigger value="jurnal">Jurnal Mengajar</TabsTrigger>
          </TabsList>

          <TabsContent value="siswa">
            <Card className="border-none shadow-sm ring-1 ring-black/5">
              <CardHeader>
                <CardTitle className="text-lg font-serif">Daftar Siswa — {isLoading ? "..." : data?.kelas}</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                      <Skeleton key={i} className="h-12 w-full" />
                    ))}
                  </div>
                ) : data?.siswa.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    Belum ada siswa terdaftar di kelas ini.
                  </p>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>NISN</TableHead>
                          <TableHead>Nama</TableHead>
                          <TableHead className="text-center">L/P</TableHead>
                          <TableHead>Kehadiran</TableHead>
                          <TableHead className="text-center">I/S/A</TableHead>
                          <TableHead className="text-center">Rata-rata Nilai</TableHead>
                          <TableHead className="text-right">Poin</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {data?.siswa.map((s: any) => {
                          const totalSesi = (s.hadir ?? 0) + (s.izin ?? 0) + (s.sakit ?? 0) + (s.alpa ?? 0);
                          const pctHadir = totalSesi > 0 ? Math.round(((s.hadir ?? 0) / totalSesi) * 100) : 0;
                          const isPerluPerhatian = (s.alpa ?? 0) >= 3 || (s.totalPoin ?? 0) < -20;
                          return (
                            <TableRow key={s.studentId} className={isPerluPerhatian ? "bg-amber-50/50" : ""}>
                              <TableCell className="text-muted-foreground text-xs">{s.nisn || "-"}</TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <span className="font-medium">{s.namaLengkap}</span>
                                  {isPerluPerhatian && (
                                    <span className="text-xs rounded-full bg-amber-100 text-amber-700 px-1.5 py-0.5 font-medium">Perhatian</span>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell className="text-center">{s.jenisKelamin}</TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <div className="flex-1 min-w-16 h-2 bg-slate-100 rounded-full overflow-hidden">
                                    <div
                                      className={`h-full rounded-full ${pctHadir >= 85 ? "bg-emerald-500" : pctHadir >= 70 ? "bg-amber-500" : "bg-rose-500"}`}
                                      style={{ width: `${pctHadir}%` }}
                                    />
                                  </div>
                                  <span className="text-xs text-slate-500 w-8 shrink-0">{pctHadir}%</span>
                                </div>
                              </TableCell>
                              <TableCell className="text-center text-xs text-slate-500">
                                {s.izin}/{s.sakit}/{s.alpa}
                              </TableCell>
                              <TableCell className="text-center">
                                {s.rataNilai != null ? (
                                  <span className={`font-semibold ${s.rataNilai >= 75 ? "text-emerald-600" : "text-rose-600"}`}>
                                    {s.rataNilai}
                                  </span>
                                ) : (
                                  <span className="text-slate-400">—</span>
                                )}
                              </TableCell>
                              <TableCell className="text-right">
                                {s.totalPoin === 0 ? (
                                  <Badge variant="secondary">{s.totalPoin}</Badge>
                                ) : s.totalPoin > 0 ? (
                                  <Badge className="bg-green-100 text-green-800 hover:bg-green-100 border border-green-200">
                                    +{s.totalPoin}
                                  </Badge>
                                ) : (
                                  <Badge variant="destructive">{s.totalPoin}</Badge>
                                )}
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="jurnal">
            <Card className="border-none shadow-sm ring-1 ring-black/5">
              <CardHeader>
                <CardTitle className="text-lg font-serif flex items-center gap-2">
                  <BookOpen className="w-5 h-5" />
                  Jurnal Mengajar — Kelas {data?.kelas ?? ""}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {jurnalLoading ? (
                  <div className="space-y-3">
                    {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-10 w-full" />)}
                  </div>
                ) : !jurnalData?.entries.length ? (
                  <p className="text-center text-muted-foreground py-8">
                    Belum ada jurnal untuk kelas ini.
                  </p>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Tanggal</TableHead>
                          <TableHead>Guru</TableHead>
                          <TableHead>Mata Pelajaran</TableHead>
                          <TableHead>Materi</TableHead>
                          <TableHead>Catatan</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {jurnalData.entries.map((e: any) => (
                          <TableRow key={e.id}>
                            <TableCell className="text-muted-foreground whitespace-nowrap">
                              {format(new Date(e.tanggal), "EEEE, dd MMM yyyy", { locale: id })}
                            </TableCell>
                            <TableCell className="font-medium">{e.teacherName}</TableCell>
                            <TableCell>{e.subjectName}</TableCell>
                            <TableCell className="max-w-[260px] truncate">{e.materi}</TableCell>
                            <TableCell className="max-w-[180px] truncate text-muted-foreground">
                              {e.catatan || "-"}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
