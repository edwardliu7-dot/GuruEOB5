import React, { useState, useMemo, useCallback } from "react";
import { Layout } from "@/components/layout";
import {
  useGetRekapAbsensi,
  useGetRekapNilai,
  useGetKesiswaanOverview,
} from "@workspace/api-client-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { BarChart2, CheckCircle2, Info, AlertCircle, XCircle, ChevronRight, Download } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from "recharts";

// ── CSV download helper ───────────────────────────────────────────────────────
function downloadCSV(filename: string, rows: string[][]): void {
  const csv = rows
    .map((row) =>
      row.map((cell) => (cell.includes(",") || cell.includes('"') ? `"${cell.replace(/"/g, '""')}"` : cell)).join(",")
    )
    .join("\n");
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

const formatMonth = (yyyyMM: string) => {
  if (!yyyyMM) return "";
  const parts = yyyyMM.split("-");
  if (parts.length < 2) return yyyyMM;
  const date = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, 1);
  return date.toLocaleString("id-ID", { month: "short" });
};

function AbsensiTab() {
  const { data, isLoading, error } = useGetRekapAbsensi();
  const { data: kesiswaanData } = useGetKesiswaanOverview();
  const [selectedKelas, setSelectedKelas] = useState("all");

  const kelasOptions = data?.kelasOptions || [];

  // Kelas Terbaik: aggregate per-kelas across all months, sort by hadir %
  const kelasTerbaik = useMemo(() => {
    if (!data?.data) return [];
    const byKelas = data.data.reduce((acc, curr) => {
      if (!acc[curr.kelas]) acc[curr.kelas] = { kelas: curr.kelas, hadir: 0, total: 0 };
      acc[curr.kelas].hadir += curr.hadir;
      acc[curr.kelas].total += curr.hadir + curr.izin + curr.sakit + curr.alpa;
      return acc;
    }, {} as Record<string, { kelas: string; hadir: number; total: number }>);
    return Object.values(byKelas)
      .map((k) => ({ ...k, pctHadir: k.total > 0 ? Math.round((k.hadir / k.total) * 100) : 0 }))
      .sort((a, b) => b.pctHadir - a.pctHadir)
      .slice(0, 5);
  }, [data]);

  const aggregatedAbsensi = useMemo(() => {
    if (!data?.data) return [];
    const filtered =
      selectedKelas === "all"
        ? data.data
        : data.data.filter((d) => d.kelas === selectedKelas);

    const byMonth = filtered.reduce((acc, curr) => {
      if (!acc[curr.bulan]) {
        acc[curr.bulan] = {
          bulan: curr.bulan,
          label: formatMonth(curr.bulan),
          hadir: 0,
          izin: 0,
          sakit: 0,
          alpa: 0,
          total: 0,
        };
      }
      acc[curr.bulan].hadir += curr.hadir;
      acc[curr.bulan].izin += curr.izin;
      acc[curr.bulan].sakit += curr.sakit;
      acc[curr.bulan].alpa += curr.alpa;
      acc[curr.bulan].total += curr.total;
      return acc;
    }, {} as Record<string, { bulan: string; label: string; hadir: number; izin: number; sakit: number; alpa: number; total: number }>);

    return Object.values(byMonth).sort((a, b) =>
      a.bulan.localeCompare(b.bulan)
    );
  }, [data, selectedKelas]);

  const totals = useMemo(() => {
    return aggregatedAbsensi.reduce(
      (acc, curr) => {
        acc.hadir += curr.hadir;
        acc.izin += curr.izin;
        acc.sakit += curr.sakit;
        acc.alpa += curr.alpa;
        return acc;
      },
      { hadir: 0, izin: 0, sakit: 0, alpa: 0 }
    );
  }, [aggregatedAbsensi]);

  const handleExport = useCallback(() => {
    const header = ["Bulan", "Kelas", "Hadir", "Izin", "Sakit", "Alpa", "Total"];
    const filtered = selectedKelas === "all" ? (data?.data ?? []) : (data?.data ?? []).filter((d) => d.kelas === selectedKelas);
    const rows = filtered.map((r) => [r.bulan, r.kelas, String(r.hadir), String(r.izin), String(r.sakit), String(r.alpa), String(r.total)]);
    downloadCSV(`rekap-absensi-${selectedKelas === "all" ? "semua" : selectedKelas}.csv`, [header, ...rows]);
  }, [data, selectedKelas]);

  if (isLoading) {
    return <Skeleton className="h-[400px] w-full" />;
  }

  if (error || !data) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center text-muted-foreground border rounded-lg border-dashed">
        <AlertCircle className="h-8 w-8 mb-4 text-muted-foreground/50" />
        <p>Gagal memuat data absensi.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center gap-4">
        <p className="text-sm font-medium text-muted-foreground">Filter Kelas:</p>
        <Select value={selectedKelas} onValueChange={setSelectedKelas}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Pilih Kelas" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Kelas</SelectItem>
            {kelasOptions.map((k) => (
              <SelectItem key={k} value={k}>
                {k}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {aggregatedAbsensi.length > 0 && (
          <button
            onClick={handleExport}
            className="ml-auto flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 shadow-sm hover:bg-slate-50 transition-colors"
          >
            <Download className="h-3.5 w-3.5" />
            Ekspor CSV
          </button>
        )}
      </div>

      <Card className="border-none shadow-sm ring-1 ring-black/5">
        <CardHeader>
          <CardTitle>Tren Absensi Bulanan</CardTitle>
          <CardDescription>
            {selectedKelas === "all"
              ? "Agregasi kehadiran seluruh kelas."
              : `Kehadiran untuk kelas ${selectedKelas}.`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {aggregatedAbsensi.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center text-muted-foreground">
              <BarChart2 className="h-12 w-12 mb-4 text-muted-foreground/30" />
              <p>Belum ada data absensi</p>
            </div>
          ) : (
            <div className="h-[350px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={aggregatedAbsensi} margin={{ top: 20, right: 0, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis
                    dataKey="label"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12 }}
                    dy={10}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12 }}
                  />
                  <Tooltip
                    cursor={{ fill: "transparent" }}
                    contentStyle={{ borderRadius: "8px", border: "none", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)" }}
                  />
                  <Legend iconType="circle" wrapperStyle={{ paddingTop: "20px" }} />
                  <Bar dataKey="hadir" name="Hadir" stackId="a" fill="#10b981" />
                  <Bar dataKey="izin" name="Izin" stackId="a" fill="#3b82f6" />
                  <Bar dataKey="sakit" name="Sakit" stackId="a" fill="#f59e0b" />
                  <Bar
                    dataKey="alpa"
                    name="Alpa"
                    stackId="a"
                    fill="#f43f5e"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>

      {aggregatedAbsensi.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="border-none shadow-sm ring-1 ring-black/5">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-3 bg-emerald-100 text-emerald-600 rounded-full dark:bg-emerald-500/20 dark:text-emerald-400">
                <CheckCircle2 className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Hadir</p>
                <p className="text-2xl font-bold">{totals.hadir}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-none shadow-sm ring-1 ring-black/5">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-3 bg-blue-100 text-blue-600 rounded-full dark:bg-blue-500/20 dark:text-blue-400">
                <Info className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Izin</p>
                <p className="text-2xl font-bold">{totals.izin}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-none shadow-sm ring-1 ring-black/5">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-3 bg-amber-100 text-amber-600 rounded-full dark:bg-amber-500/20 dark:text-amber-400">
                <AlertCircle className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Sakit</p>
                <p className="text-2xl font-bold">{totals.sakit}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-none shadow-sm ring-1 ring-black/5">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-3 bg-rose-100 text-rose-600 rounded-full dark:bg-rose-500/20 dark:text-rose-400">
                <XCircle className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Alpa</p>
                <p className="text-2xl font-bold">{totals.alpa}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Bottom: Kelas Terbaik & Siswa Perlu Perhatian */}
      {(kelasTerbaik.length > 0 || (kesiswaanData?.siswaPoinTerbanyak?.length ?? 0) > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {kelasTerbaik.length > 0 && (
            <Card className="border-none shadow-sm ring-1 ring-black/5">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <span className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center">
                    <CheckCircle2 className="w-4 h-4" />
                  </span>
                  Kelas Terbaik
                </CardTitle>
                <CardDescription>Berdasarkan persentase kehadiran</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {kelasTerbaik.map((k, idx) => (
                  <div key={k.kelas}>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-muted-foreground w-4">{idx + 1}</span>
                        <span className="font-medium text-sm">{k.kelas}</span>
                        <span className="text-xs text-muted-foreground">{k.total} sesi</span>
                      </div>
                      <span className={`text-xs font-bold ${k.pctHadir >= 85 ? "text-emerald-600" : k.pctHadir >= 70 ? "text-amber-600" : "text-rose-600"}`}>
                        {k.pctHadir}%
                      </span>
                    </div>
                    <div className="ml-6 h-1.5 bg-muted rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${k.pctHadir >= 85 ? "bg-emerald-500" : k.pctHadir >= 70 ? "bg-amber-500" : "bg-rose-500"}`}
                        style={{ width: `${k.pctHadir}%` }}
                      />
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {(kesiswaanData?.siswaPoinTerbanyak?.length ?? 0) > 0 && (
            <Card className="border-none shadow-sm ring-1 ring-black/5">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <span className="w-7 h-7 rounded-lg bg-amber-100 text-amber-600 flex items-center justify-center">
                    <AlertCircle className="w-4 h-4" />
                  </span>
                  Siswa Perlu Perhatian
                </CardTitle>
                <CardDescription>Poin pelanggaran terbanyak lintas kelas</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {kesiswaanData!.siswaPoinTerbanyak.slice(0, 5).map((s: any, idx: number) => (
                  <div key={s.studentId} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-bold text-muted-foreground w-4">{idx + 1}</span>
                      <div>
                        <div className="font-medium text-sm">{s.namaLengkap}</div>
                        <div className="text-xs text-muted-foreground">{s.kelas}</div>
                      </div>
                    </div>
                    <span className="inline-flex rounded-full bg-rose-100 text-rose-700 px-2.5 py-0.5 text-xs font-bold">
                      -{s.totalPoin} poin
                    </span>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}

function NilaiTab() {
  const { data, isLoading, error } = useGetRekapNilai();
  const [selectedKelas, setSelectedKelas] = useState("all");

  const kelasOptions = data?.kelasOptions || [];

  const filteredSubjects = useMemo(() => {
    if (!data?.subjects) return [];
    if (selectedKelas === "all") return data.subjects;
    return data.subjects.filter((s) => s.kelas === selectedKelas);
  }, [data, selectedKelas]);

  // ← Hook harus dipanggil SEBELUM early return (Rules of Hooks)
  const handleExportNilai = useCallback(() => {
    const header = ["Mata Pelajaran", "Kelas", "Rata-rata", "Min", "Max", "Jumlah Nilai"];
    const rows = filteredSubjects.map((s) => [
      s.subjectName,
      s.kelas,
      s.rataRata != null ? String(s.rataRata) : "-",
      s.nilaiMin != null ? String(s.nilaiMin) : "-",
      s.nilaiMax != null ? String(s.nilaiMax) : "-",
      String(s.jumlahNilai),
    ]);
    downloadCSV(`rekap-nilai-${selectedKelas === "all" ? "semua" : selectedKelas}.csv`, [header, ...rows]);
  }, [filteredSubjects, selectedKelas]);

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Skeleton className="h-[250px] w-full" />
        <Skeleton className="h-[250px] w-full" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center text-muted-foreground border rounded-lg border-dashed">
        <AlertCircle className="h-8 w-8 mb-4 text-muted-foreground/50" />
        <p>Gagal memuat data nilai.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center gap-3 flex-wrap">
        <p className="text-sm font-medium text-muted-foreground">Filter Kelas:</p>
        <Select value={selectedKelas} onValueChange={setSelectedKelas}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Pilih Kelas" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Kelas</SelectItem>
            {kelasOptions.map((k) => (
              <SelectItem key={k} value={k}>
                {k}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {filteredSubjects.length > 0 && (
          <button
            onClick={handleExportNilai}
            className="ml-auto flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 shadow-sm hover:bg-slate-50 transition-colors"
          >
            <Download className="h-3.5 w-3.5" />
            Ekspor CSV
          </button>
        )}
      </div>

      {filteredSubjects.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center text-muted-foreground border rounded-lg border-dashed">
          <BarChart2 className="h-12 w-12 mb-4 text-muted-foreground/30" />
          <p>Belum ada data mata pelajaran untuk kelas ini.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredSubjects.map((subject, idx) => {
            const rata = subject.rataRata ?? 0;
            const colorClass =
              rata >= 75
                ? "text-emerald-600 dark:text-emerald-400"
                : rata >= 60
                ? "text-amber-600 dark:text-amber-400"
                : "text-rose-600 dark:text-rose-400";

            return (
              <Card
                key={`${subject.subjectId}-${idx}`}
                className="border-none shadow-sm ring-1 ring-black/5 overflow-hidden flex flex-col"
              >
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-4">
                    <CardTitle className="text-base leading-tight">
                      {subject.subjectName}
                    </CardTitle>
                    <Badge variant="secondary" className="shrink-0">
                      {subject.kelas}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col justify-between">
                  {subject.jumlahNilai === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center py-8 text-center text-muted-foreground">
                      <p className="text-sm">Belum ada nilai</p>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-end justify-between mb-6">
                        <div>
                          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">
                            Rata-rata
                          </p>
                          <p className={`text-3xl font-bold ${colorClass}`}>
                            {subject.rataRata?.toFixed(1)}
                          </p>
                        </div>
                        <div className="flex gap-4 text-right">
                          <div>
                            <p className="text-xs text-muted-foreground mb-1">
                              Min / Max
                            </p>
                            <p className="text-sm font-medium">
                              {subject.nilaiMin} / {subject.nilaiMax}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground mb-1">
                              Total Nilai
                            </p>
                            <p className="text-sm font-medium">
                              {subject.jumlahNilai}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="h-[120px] w-full mt-auto">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={subject.distribusi}>
                            <Tooltip
                              cursor={{ fill: "transparent" }}
                              contentStyle={{
                                fontSize: "12px",
                                borderRadius: "6px",
                                border: "none",
                                boxShadow: "0 2px 4px -1px rgb(0 0 0 / 0.1)",
                              }}
                              formatter={(value: number) => [value, "Siswa"]}
                              labelFormatter={(label) => `Nilai ${label}`}
                            />
                            <XAxis
                              dataKey="range"
                              axisLine={false}
                              tickLine={false}
                              tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                              dy={5}
                            />
                            <Bar
                              dataKey="jumlah"
                              fill="hsl(var(--primary))"
                              radius={[4, 4, 0, 0]}
                              maxBarSize={40}
                            />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function RekapPage() {
  const [activeTab, setActiveTab] = useState<"absensi" | "nilai">("absensi");

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <div className="flex items-center text-xs text-slate-400 mb-2">
              <span>Dashboard</span>
              <ChevronRight className="w-3 h-3 mx-1" />
              <span className="text-slate-600">Rekap & Analitik</span>
            </div>
            <h1 className="text-xl font-bold text-slate-800">Rekap & Analitik</h1>
            <p className="text-sm text-slate-500 mt-1">Data agregat absensi dan nilai semester ini.</p>
          </div>
          <div />
        </div>

        {/* Pill Switcher */}
        <div className="flex gap-2">
          {(["absensi", "nilai"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-5 py-2 rounded-full text-sm font-medium transition-colors ${
                activeTab === tab
                  ? "bg-slate-800 text-white shadow-sm"
                  : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
              }`}
            >
              {tab === "absensi" ? "Absensi" : "Nilai"}
            </button>
          ))}
        </div>

        {activeTab === "absensi" && <AbsensiTab />}
        {activeTab === "nilai" && <NilaiTab />}
      </div>
    </Layout>
  );
}
