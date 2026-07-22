import { Layout } from "@/components/layout";
import { FadeIn } from "@/components/motion";
import {
  useListAttendance,
  useBulkMixedCreateAttendance,
  useUpdateAttendanceRecord,
  useDeleteAttendanceRecord,
  useGetAttendanceRekap,
  useBulkDeleteAttendanceByKelas,
  useListSubjects,
  useListStudents,
} from "@workspace/api-client-react";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import {
  CalendarCheck2,
  Trash2,
  X,
  CheckCircle2,
  Thermometer,
  Mail,
  AlertTriangle,
  Search,
  Check,
  Users,
  History,
  Calendar,
} from "lucide-react";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import { useQueryClient } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

type AttendanceStatus = "hadir" | "izin" | "sakit" | "alpa";

const STATUS_OPTIONS: { value: AttendanceStatus; label: string }[] = [
  { value: "hadir", label: "Hadir" },
  { value: "sakit", label: "Sakit" },
  { value: "izin", label: "Izin" },
  { value: "alpa", label: "Alpa" },
];

const statusColors: Record<AttendanceStatus, string> = {
  hadir: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
  izin: "bg-blue-500/10 text-blue-600 border-blue-500/20",
  sakit: "bg-amber-500/10 text-amber-600 border-amber-500/20",
  alpa: "bg-rose-500/10 text-rose-600 border-rose-500/20",
};

const statusActiveClass: Record<AttendanceStatus, string> = {
  hadir: "bg-emerald-500 text-white shadow-sm",
  sakit: "bg-orange-500 text-white shadow-sm",
  izin: "bg-blue-500 text-white shadow-sm",
  alpa: "bg-red-500 text-white shadow-sm",
};

const STATUS_BUTTON_ORDER: AttendanceStatus[] = ["hadir", "sakit", "izin", "alpa"];
const STATUS_LABELS: Record<AttendanceStatus, string> = {
  hadir: "Hadir",
  sakit: "Sakit",
  izin: "Izin",
  alpa: "Alpa",
};

function todayStr() {
  return new Date().toISOString().split("T")[0];
}

export default function Absensi() {
  const { data: subjects } = useListSubjects();
  const { data: students } = useListStudents();
  const [selectedSubject, setSelectedSubject] = useState<string>("");
  const [activeTab, setActiveTab] = useState("riwayat");
  const [search, setSearch] = useState("");

  const subjectFilter = selectedSubject && selectedSubject !== "all" ? selectedSubject : undefined;
  const { data: attendanceList, isLoading } = useListAttendance(
    { subjectId: subjectFilter },
    { query: { queryKey: ["/api/attendance", subjectFilter ?? ""] } }
  );

  const { data: rekapData, isLoading: rekapLoading } = useGetAttendanceRekap();

  const bulkMixedAttendance = useBulkMixedCreateAttendance();
  const updateAttendance = useUpdateAttendanceRecord();
  const deleteAttendance = useDeleteAttendanceRecord();
  const bulkDeleteByKelas = useBulkDeleteAttendanceByKelas();

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // ---- Catat Serentak state ----
  const [isBulkMode, setIsBulkMode] = useState(false);
  const [bulkKelas, setBulkKelas] = useState<string>("");
  const [bulkSubjectId, setBulkSubjectId] = useState<string>("");
  const [bulkTanggal, setBulkTanggal] = useState<string>(todayStr());
  const [bulkRows, setBulkRows] = useState<Record<string, AttendanceStatus>>({});

  const kelasList = useMemo(
    () => [...new Set((students ?? []).map((s: any) => s.kelas))].sort(),
    [students],
  );

  useEffect(() => {
    if (!bulkKelas && kelasList.length > 0) setBulkKelas(kelasList[0]);
  }, [kelasList, bulkKelas]);

  const bulkStudents = useMemo(
    () => (students ?? []).filter((s: any) => !bulkKelas || s.kelas === bulkKelas),
    [students, bulkKelas],
  );

  useEffect(() => {
    setBulkRows((prev) => {
      const next: Record<string, AttendanceStatus> = {};
      for (const s of bulkStudents as any[]) {
        next[s.id] = prev[s.id] ?? "hadir";
      }
      return next;
    });
  }, [bulkStudents]);

  const filteredBulkStudents = useMemo(() => {
    if (!search.trim()) return bulkStudents as any[];
    const q = search.toLowerCase();
    return (bulkStudents as any[]).filter(
      (s) =>
        s.namaLengkap?.toLowerCase().includes(q) ||
        s.namaPanggilan?.toLowerCase().includes(q)
    );
  }, [bulkStudents, search]);

  const stats = useMemo(() => {
    const list = bulkStudents as any[];
    return {
      hadir: list.filter((s) => bulkRows[s.id] === "hadir").length,
      sakit: list.filter((s) => bulkRows[s.id] === "sakit").length,
      izin: list.filter((s) => bulkRows[s.id] === "izin").length,
      alpa: list.filter((s) => bulkRows[s.id] === "alpa").length,
    };
  }, [bulkRows, bulkStudents]);

  const totalStudents = (bulkStudents as any[]).length;

  const setAllBulkStatus = (status: AttendanceStatus) => {
    setBulkRows((prev) => {
      const next = { ...prev };
      for (const s of bulkStudents as any[]) next[s.id] = status;
      return next;
    });
  };

  const invalidateAttendance = () => {
    queryClient.invalidateQueries({ queryKey: ["/api/attendance"] });
    queryClient.invalidateQueries({ queryKey: ["/api/attendance/rekap"] });
  };

  const handleBulkSave = async () => {
    if (!bulkSubjectId) {
      toast({ variant: "destructive", title: "Gagal", description: "Pilih mata pelajaran terlebih dahulu" });
      return;
    }
    if ((bulkStudents as any[]).length === 0) {
      toast({ variant: "destructive", title: "Gagal", description: "Tidak ada siswa pada kelas ini" });
      return;
    }
    try {
      const entries = (bulkStudents as any[]).map((s) => ({
        studentId: s.id,
        status: bulkRows[s.id] ?? "hadir",
      }));
      const result = await bulkMixedAttendance.mutateAsync({
        data: { subjectId: bulkSubjectId, tanggal: bulkTanggal, entries },
      });
      toast({ title: "Berhasil", description: `Kehadiran ${result.count} siswa dicatat` });
      setIsBulkMode(false);
      invalidateAttendance();
    } catch {
      toast({ variant: "destructive", title: "Gagal", description: "Terjadi kesalahan saat menyimpan" });
    }
  };

  const handleStatusChange = async (id: string, status: string) => {
    try {
      await updateAttendance.mutateAsync({ id, data: { status: status as any } });
      invalidateAttendance();
      toast({ title: "Berhasil", description: "Status kehadiran diperbarui" });
    } catch {
      toast({ variant: "destructive", title: "Gagal", description: "Terjadi kesalahan" });
    }
  };

  const handleDeleteAttendance = async (id: string) => {
    if (!confirm("Hapus catatan kehadiran ini?")) return;
    try {
      await deleteAttendance.mutateAsync({ id });
      invalidateAttendance();
      toast({ title: "Berhasil", description: "Catatan kehadiran dihapus" });
    } catch {
      toast({ variant: "destructive", title: "Gagal", description: "Terjadi kesalahan" });
    }
  };

  const handleHapusAbsensiKelas = async (group: { kelas: string; subjectId: string; tanggal: string; subjectName: string }) => {
    if (!confirm(`Hapus semua absensi kelas ${group.kelas} mapel ${group.subjectName} tanggal ${group.tanggal}?`)) return;
    try {
      const result = await bulkDeleteByKelas.mutateAsync({
        data: { kelas: group.kelas, subjectId: group.subjectId, tanggal: group.tanggal },
      });
      toast({ title: "Berhasil", description: `${result.count} catatan kehadiran dihapus` });
      invalidateAttendance();
    } catch {
      toast({ variant: "destructive", title: "Gagal", description: "Terjadi kesalahan saat menghapus" });
    }
  };

  const groupedByDate = (() => {
    const groups = new Map<string, any[]>();
    for (const a of (attendanceList ?? []) as any[]) {
      const list = groups.get(a.tanggal) ?? [];
      list.push(a);
      groups.set(a.tanggal, list);
    }
    return [...groups.entries()].sort((a, b) => (a[0] < b[0] ? 1 : -1));
  })();

  const rekapByDate = useMemo(() => {
    if (!rekapData?.groups) return [];
    const map = new Map<string, typeof rekapData.groups>();
    for (const g of rekapData.groups) {
      const list = map.get(g.tanggal) ?? [];
      list.push(g);
      map.set(g.tanggal, list);
    }
    return [...map.entries()].sort((a, b) => (a[0] < b[0] ? 1 : -1));
  }, [rekapData]);

  // Recent history for the sidebar panel (last 4 date groups)
  const recentHistory = rekapByDate.slice(0, 4);

  return (
    <Layout>
      <div className="space-y-6">

        {/* ── Page header ── */}
        <FadeIn className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold font-serif">Absensi</h1>
            <p className="text-muted-foreground mt-1">Pencatatan kehadiran siswa per sesi.</p>
          </div>
          <Button
            variant={isBulkMode ? "secondary" : "default"}
            onClick={() => setIsBulkMode((v) => !v)}
            className="w-full sm:w-auto"
          >
            {isBulkMode ? (
              <><X className="w-4 h-4 mr-2" />Tutup Entri</>
            ) : (
              <><CalendarCheck2 className="w-4 h-4 mr-2" />Catat Serentak</>
            )}
          </Button>
        </FadeIn>

        {/* ══════════════════════════════════════════
            BULK ENTRY MODE — redesigned with mockup UI
           ══════════════════════════════════════════ */}
        {isBulkMode && (
          <FadeIn className="space-y-5">

            {/* Selectors row */}
            <div className="bg-card border border-border rounded-xl p-4 flex flex-wrap gap-3 items-end shadow-sm">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Kelas</label>
                <Select value={bulkKelas} onValueChange={setBulkKelas}>
                  <SelectTrigger className="w-[180px] bg-background"><SelectValue placeholder="Pilih Kelas" /></SelectTrigger>
                  <SelectContent>
                    {kelasList.map((k) => <SelectItem key={k} value={k}>{k}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Mata Pelajaran</label>
                <Select value={bulkSubjectId} onValueChange={setBulkSubjectId}>
                  <SelectTrigger className="w-[220px] bg-background"><SelectValue placeholder="Pilih Mapel" /></SelectTrigger>
                  <SelectContent>
                    {subjects?.map((s: any) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Tanggal</label>
                <div className="flex items-center gap-2 bg-background border border-input rounded-md px-3 py-2 text-sm font-medium text-foreground shadow-sm">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <input
                    type="date"
                    className="bg-transparent focus:outline-none text-sm"
                    value={bulkTanggal}
                    onChange={(e) => setBulkTanggal(e.target.value)}
                  />
                </div>
              </div>
              <div className="ml-auto flex gap-2 items-end">
                <Button
                  onClick={handleBulkSave}
                  disabled={bulkMixedAttendance.isPending}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  <CalendarCheck2 className="w-4 h-4 mr-2" />
                  {bulkMixedAttendance.isPending ? "Menyimpan..." : `Simpan ${(bulkStudents as any[]).length} Siswa`}
                </Button>
              </div>
            </div>

            {/* Stat Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {/* Hadir */}
              <div className="bg-card rounded-xl border border-emerald-100 p-4 shadow-sm flex items-center gap-4 relative overflow-hidden">
                <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-600 flex-shrink-0">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-3xl font-black text-emerald-700">{stats.hadir}</div>
                  <div className="text-xs font-bold text-emerald-600/80 uppercase tracking-wide">Hadir</div>
                </div>
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-emerald-100">
                  <div
                    className="h-full bg-emerald-500 transition-all duration-500"
                    style={{ width: totalStudents ? `${(stats.hadir / totalStudents) * 100}%` : "0%" }}
                  />
                </div>
              </div>
              {/* Sakit */}
              <div className="bg-card rounded-xl border border-orange-100 p-4 shadow-sm flex items-center gap-4 relative overflow-hidden">
                <div className="w-12 h-12 rounded-xl bg-orange-100 flex items-center justify-center text-orange-500 flex-shrink-0">
                  <Thermometer className="w-6 h-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-3xl font-black text-orange-600">{stats.sakit}</div>
                  <div className="text-xs font-bold text-orange-500/80 uppercase tracking-wide">Sakit</div>
                </div>
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-orange-100">
                  <div
                    className="h-full bg-orange-500 transition-all duration-500"
                    style={{ width: totalStudents ? `${(stats.sakit / totalStudents) * 100}%` : "0%" }}
                  />
                </div>
              </div>
              {/* Izin */}
              <div className="bg-card rounded-xl border border-blue-100 p-4 shadow-sm flex items-center gap-4 relative overflow-hidden">
                <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600 flex-shrink-0">
                  <Mail className="w-6 h-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-3xl font-black text-blue-700">{stats.izin}</div>
                  <div className="text-xs font-bold text-blue-600/80 uppercase tracking-wide">Izin</div>
                </div>
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-blue-100">
                  <div
                    className="h-full bg-blue-500 transition-all duration-500"
                    style={{ width: totalStudents ? `${(stats.izin / totalStudents) * 100}%` : "0%" }}
                  />
                </div>
              </div>
              {/* Alpa */}
              <div className="bg-card rounded-xl border border-red-100 p-4 shadow-sm flex items-center gap-4 relative overflow-hidden">
                <div className="w-12 h-12 rounded-xl bg-red-100 flex items-center justify-center text-red-600 flex-shrink-0">
                  <AlertTriangle className="w-6 h-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-3xl font-black text-red-600">{stats.alpa}</div>
                  <div className="text-xs font-bold text-red-500/80 uppercase tracking-wide">Alpa</div>
                </div>
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-red-100">
                  <div
                    className="h-full bg-red-500 transition-all duration-500"
                    style={{ width: totalStudents ? `${(stats.alpa / totalStudents) * 100}%` : "0%" }}
                  />
                </div>
              </div>
            </div>

            {/* Action Bar */}
            <div className="flex flex-col sm:flex-row items-center gap-3">
              <div className="relative flex-1 max-w-md w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Cari nama siswa..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 bg-muted text-muted-foreground rounded-full text-xs font-semibold border border-border">
                <CheckCircle2 className="w-3.5 h-3.5" />
                {totalStudents} / {totalStudents} tercatat
              </div>
              <Button
                variant="outline"
                size="sm"
                className="bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100"
                onClick={() => setAllBulkStatus("hadir")}
              >
                <Check className="w-4 h-4 mr-1.5" />
                Set Semua Hadir
              </Button>
            </div>

            {/* Table + History Panel */}
            <div className="flex flex-col lg:flex-row gap-5 items-start">

              {/* Student Table */}
              <div className="flex-1 bg-card border border-border rounded-xl shadow-sm overflow-hidden w-full">
                <div className="px-5 py-4 border-b border-border">
                  <h2 className="font-bold text-foreground flex items-center gap-2 text-sm">
                    <Users className="w-4 h-4 text-muted-foreground" />
                    Daftar Siswa
                    {bulkKelas && <Badge variant="secondary" className="text-xs ml-1">{bulkKelas}</Badge>}
                  </h2>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left min-w-[500px]">
                    <thead className="text-xs text-muted-foreground bg-muted/40 border-b border-border">
                      <tr>
                        <th className="px-5 py-3 font-semibold uppercase tracking-wider w-14">No</th>
                        <th className="px-5 py-3 font-semibold uppercase tracking-wider">Nama Siswa</th>
                        <th className="px-5 py-3 font-semibold uppercase tracking-wider text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {filteredBulkStudents.length === 0 ? (
                        <tr>
                          <td colSpan={3} className="h-24 text-center text-muted-foreground text-sm">
                            {totalStudents === 0
                              ? "Belum ada data siswa pada kelas ini."
                              : "Tidak ada siswa yang sesuai pencarian."}
                          </td>
                        </tr>
                      ) : (
                        filteredBulkStudents.map((s: any, idx: number) => {
                          const status = bulkRows[s.id] ?? "hadir";
                          return (
                            <tr
                              key={s.id}
                              className={`hover:bg-muted/30 transition-colors ${idx % 2 === 1 ? "bg-muted/10" : ""}`}
                            >
                              <td className="px-5 py-3 text-muted-foreground font-medium">{idx + 1}</td>
                              <td className="px-5 py-3">
                                <div className="font-semibold text-foreground">{s.namaLengkap}</div>
                                {s.namaPanggilan && (
                                  <div className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                                    <span className="px-1.5 py-0.5 bg-muted rounded text-xs font-medium">
                                      {s.namaPanggilan}
                                    </span>
                                    {s.jenisKelamin && (
                                      <><span>&bull;</span><span>{s.jenisKelamin}</span></>
                                    )}
                                  </div>
                                )}
                              </td>
                              <td className="px-5 py-3">
                                <div className="flex items-center justify-center">
                                  <div className="inline-flex items-center bg-muted rounded-lg p-0.5 border border-border">
                                    {STATUS_BUTTON_ORDER.map((st) => (
                                      <button
                                        key={st}
                                        onClick={() =>
                                          setBulkRows((prev) => ({ ...prev, [s.id]: st }))
                                        }
                                        className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                                          status === st
                                            ? statusActiveClass[st]
                                            : "text-muted-foreground hover:bg-background/60"
                                        }`}
                                      >
                                        {STATUS_LABELS[st]}
                                      </button>
                                    ))}
                                  </div>
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* History Panel */}
              <div className="w-full lg:w-[300px] bg-card border border-border rounded-xl shadow-sm flex flex-col shrink-0">
                <div className="px-5 py-4 border-b border-border flex items-center gap-2">
                  <History className="w-4 h-4 text-muted-foreground" />
                  <h2 className="font-bold text-foreground text-sm uppercase tracking-wide">Rekap Riwayat</h2>
                </div>
                <div className="p-5 space-y-5">
                  {rekapLoading ? (
                    Array(3).fill(0).map((_, i) => (
                      <div key={i} className="pl-4 border-l-2 border-border space-y-2">
                        <Skeleton className="h-3 w-24" />
                        <Skeleton className="h-5 w-16 rounded" />
                      </div>
                    ))
                  ) : recentHistory.length === 0 ? (
                    <p className="text-xs text-muted-foreground text-center py-4">Belum ada riwayat absensi.</p>
                  ) : (
                    recentHistory.map(([tanggal, groups]) => {
                      const totalHadir = groups.reduce((acc: number, g: any) => acc + (g.hadir ?? 0), 0);
                      const totalSiswa = groups.reduce((acc: number, g: any) => acc + (g.total ?? 0), 0);
                      const tidakHadir = totalSiswa - totalHadir;
                      const allHadir = tidakHadir === 0;
                      return (
                        <div
                          key={tanggal}
                          className={`relative pl-4 border-l-2 ${allHadir ? "border-emerald-200" : "border-orange-200"}`}
                        >
                          <div
                            className={`absolute w-2.5 h-2.5 rounded-full -left-[6px] top-1.5 ring-4 ring-background ${
                              allHadir ? "bg-emerald-400" : "bg-orange-400"
                            }`}
                          />
                          <div className="flex items-center justify-between mb-1">
                            <div className="text-xs font-bold text-muted-foreground">
                              {format(new Date(tanggal), "EEE, dd MMM", { locale: idLocale })}
                            </div>
                            <div
                              className={`text-xs font-semibold ${allHadir ? "text-emerald-600" : "text-muted-foreground"}`}
                            >
                              {totalHadir}/{totalSiswa}
                            </div>
                          </div>
                          {allHadir ? (
                            <div className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-600 border border-emerald-100">
                              Semua Hadir
                            </div>
                          ) : (
                            <div className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-red-50 text-red-600 border border-red-100">
                              {tidakHadir} Tidak Hadir
                            </div>
                          )}
                          {groups.length > 0 && (
                            <div className="mt-1.5 flex flex-wrap gap-1">
                              {groups.map((g: any) => (
                                <span
                                  key={g.subjectId}
                                  className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground font-medium border border-border"
                                >
                                  {g.subjectName} · {g.kelas}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
                <div className="mt-auto border-t border-border px-5 py-3 text-center">
                  <button
                    className="text-sm font-semibold text-primary hover:opacity-80 transition-opacity w-full"
                    onClick={() => {
                      setIsBulkMode(false);
                      setActiveTab("rekap");
                    }}
                  >
                    Lihat Riwayat Lengkap →
                  </button>
                </div>
              </div>

            </div>
          </FadeIn>
        )}

        {/* ══════════════════════════════════════════
            NORMAL MODE — Tabs: Riwayat & Rekap
           ══════════════════════════════════════════ */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="riwayat">Riwayat Per Siswa</TabsTrigger>
            <TabsTrigger value="rekap">Rekap Per Kelas</TabsTrigger>
          </TabsList>

          {/* ─── Tab: Riwayat ─── */}
          <TabsContent value="riwayat">
            <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
              <div className="p-4 border-b border-border bg-muted/30 flex gap-4">
                <Select value={selectedSubject} onValueChange={setSelectedSubject}>
                  <SelectTrigger className="w-[250px] bg-card"><SelectValue placeholder="Semua Mata Pelajaran" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Mata Pelajaran</SelectItem>
                    {subjects?.map((s: any) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/30">
                    <TableHead>Nama Siswa</TableHead>
                    <TableHead>Mata Pelajaran</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    Array(3).fill(0).map((_, i) => (
                      <TableRow key={i}>
                        <TableCell colSpan={4}><Skeleton className="h-6 w-full" /></TableCell>
                      </TableRow>
                    ))
                  ) : !attendanceList?.length ? (
                    <TableRow>
                      <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                        Belum ada data kehadiran.
                      </TableCell>
                    </TableRow>
                  ) : (
                    groupedByDate.map(([tanggal, records]) => (
                      <>
                        <TableRow key={`date-${tanggal}`} className="bg-muted/30 hover:bg-muted/30">
                          <TableCell colSpan={4} className="font-semibold text-sm py-2">
                            {format(new Date(tanggal), "EEEE, dd MMMM yyyy", { locale: idLocale })}
                            <span className="ml-2 font-normal text-muted-foreground">({records.length} siswa)</span>
                          </TableCell>
                        </TableRow>
                        {records.map((a: any) => (
                          <TableRow key={a.id}>
                            <TableCell className="font-medium">
                              {students?.find((s: any) => s.id === a.studentId)?.namaLengkap}
                            </TableCell>
                            <TableCell>
                              {subjects?.find((s: any) => s.id === a.subjectId)?.name}
                            </TableCell>
                            <TableCell>
                              <Select value={a.status} onValueChange={(status) => handleStatusChange(a.id, status)}>
                                <SelectTrigger className="w-[110px] h-8">
                                  <Badge variant="outline" className={`${statusColors[a.status as AttendanceStatus]} capitalize`}>
                                    {a.status}
                                  </Badge>
                                </SelectTrigger>
                                <SelectContent>
                                  {STATUS_OPTIONS.map((o) => (
                                    <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </TableCell>
                            <TableCell className="text-right">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="text-destructive"
                                onClick={() => handleDeleteAttendance(a.id)}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          {/* ─── Tab: Rekap Per Kelas ─── */}
          <TabsContent value="rekap">
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Rekapitulasi kehadiran per sesi (tanggal · kelas · mata pelajaran). Klik{" "}
                <strong>Hapus Absensi</strong> untuk menghapus seluruh sesi dan mengulang input dari awal.
              </p>

              {rekapLoading ? (
                <div className="space-y-3">
                  {Array(4).fill(0).map((_, i) => <Skeleton key={i} className="h-16 w-full rounded-xl" />)}
                </div>
              ) : !rekapByDate.length ? (
                <div className="bg-card border border-border rounded-xl shadow-sm h-32 flex items-center justify-center text-muted-foreground">
                  Belum ada data absensi untuk ditampilkan.
                </div>
              ) : (
                rekapByDate.map(([tanggal, groups]) => (
                  <div key={tanggal} className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
                    <div className="px-4 py-2.5 bg-muted/30 border-b border-border">
                      <p className="font-semibold text-sm">
                        {format(new Date(tanggal), "EEEE, dd MMMM yyyy", { locale: idLocale })}
                      </p>
                    </div>
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-muted/20 text-xs">
                          <TableHead>Mata Pelajaran</TableHead>
                          <TableHead>Kelas</TableHead>
                          <TableHead className="text-center text-emerald-600">Hadir</TableHead>
                          <TableHead className="text-center text-blue-600">Izin</TableHead>
                          <TableHead className="text-center text-amber-600">Sakit</TableHead>
                          <TableHead className="text-center text-rose-600">Alpa</TableHead>
                          <TableHead className="text-center">Total</TableHead>
                          <TableHead className="text-right">Aksi</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {groups.map((g: any) => (
                          <TableRow key={`${g.tanggal}|${g.kelas}|${g.subjectId}`}>
                            <TableCell className="font-medium">{g.subjectName}</TableCell>
                            <TableCell>
                              <Badge variant="secondary" className="text-xs">{g.kelas}</Badge>
                            </TableCell>
                            <TableCell className="text-center font-semibold text-emerald-600">{g.hadir}</TableCell>
                            <TableCell className="text-center font-semibold text-blue-600">{g.izin}</TableCell>
                            <TableCell className="text-center font-semibold text-amber-600">{g.sakit}</TableCell>
                            <TableCell className="text-center font-semibold text-rose-600">{g.alpa}</TableCell>
                            <TableCell className="text-center text-muted-foreground">{g.total}</TableCell>
                            <TableCell className="text-right">
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-destructive border-destructive/30 hover:bg-destructive/5 text-xs"
                                disabled={bulkDeleteByKelas.isPending}
                                onClick={() => handleHapusAbsensiKelas({
                                  kelas: g.kelas,
                                  subjectId: g.subjectId,
                                  tanggal: g.tanggal,
                                  subjectName: g.subjectName,
                                })}
                              >
                                <Trash2 className="w-3 h-3 mr-1" />
                                Hapus Absensi
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ))
              )}
            </div>
          </TabsContent>
        </Tabs>

      </div>
    </Layout>
  );
}
