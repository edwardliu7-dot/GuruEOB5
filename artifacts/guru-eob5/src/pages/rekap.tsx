import React, { useState, useMemo } from "react";
import { Layout } from "@/components/layout";
import {
  useGetRekapAbsensi,
  useGetRekapNilai,
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
import { BarChart2, CheckCircle2, Info, AlertCircle, XCircle } from "lucide-react";
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

const formatMonth = (yyyyMM: string) => {
  if (!yyyyMM) return "";
  const parts = yyyyMM.split("-");
  if (parts.length < 2) return yyyyMM;
  const date = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, 1);
  return date.toLocaleString("id-ID", { month: "short" });
};

function AbsensiTab() {
  const { data, isLoading, error } = useGetRekapAbsensi();
  const [selectedKelas, setSelectedKelas] = useState("all");

  const kelasOptions = data?.kelasOptions || [];

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
  return (
    <Layout>
      <div className="max-w-5xl mx-auto py-8 px-4 md:px-8">
        <header className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight mb-2">
            Rekap & Analitik
          </h1>
          <p className="text-muted-foreground">
            Tren absensi dan distribusi nilai mata pelajaranmu.
          </p>
        </header>

        <Tabs defaultValue="absensi" className="space-y-8">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="absensi">Absensi</TabsTrigger>
            <TabsTrigger value="nilai">Nilai</TabsTrigger>
          </TabsList>

          <TabsContent value="absensi" className="m-0">
            <AbsensiTab />
          </TabsContent>

          <TabsContent value="nilai" className="m-0">
            <NilaiTab />
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
