import { Layout } from "@/components/layout";
import { FadeIn } from "@/components/motion";
import {
  useListAttendance,
  useBulkMixedCreateAttendance,
  useGetAttendanceRekap,
  useBulkDeleteAttendanceByKelas,
  useListSubjects,
  useListStudents,
  listAttendance,
} from "@workspace/api-client-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import {
  CalendarCheck2,
  Trash2,
  CheckCircle2,
  Thermometer,
  Mail,
  AlertTriangle,
  Search,
  Check,
  Users,
  History,
  Calendar,
  Loader2,
} from "lucide-react";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import { useQueryClient } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

type AttendanceStatus = "hadir" | "izin" | "sakit" | "alpa";

const STATUS_BUTTON_ORDER: AttendanceStatus[] = ["hadir", "sakit", "izin", "alpa"];

const STATUS_LABELS: Record<AttendanceStatus, string> = {
  hadir: "Hadir",
  sakit: "Sakit",
  izin: "Izin",
  alpa: "Alpa",
};

const statusActiveClass: Record<AttendanceStatus, string> = {
  hadir: "bg-emerald-500 text-white shadow-sm",
  sakit: "bg-orange-500 text-white shadow-sm",
  izin: "bg-blue-500 text-white shadow-sm",
  alpa: "bg-red-500 text-white shadow-sm",
};

const absentBadgeClass: Record<Exclude<AttendanceStatus, "hadir">, string> = {
  sakit: "bg-orange-50 border-orange-100 text-orange-700",
  izin: "bg-blue-50 border-blue-100 text-blue-700",
  alpa: "bg-red-50 border-red-100 text-red-700",
};

function todayStr() {
  return new Date().toISOString().split("T")[0];
}

export default function Absensi() {
  const { data: subjects } = useListSubjects();
  const { data: students } = useListStudents();
  const { data: rekapData, isLoading: rekapLoading } = useGetAttendanceRekap();
  const bulkMixedAttendance = useBulkMixedCreateAttendance();
  const bulkDeleteByKelas = useBulkDeleteAttendanceByKelas();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // ── Form state ──
  const [bulkKelas, setBulkKelas] = useState<string>("");
  const [bulkSubjectId, setBulkSubjectId] = useState<string>("");
  const [bulkTanggal, setBulkTanggal] = useState<string>(todayStr());
  const [bulkRows, setBulkRows] = useState<Record<string, AttendanceStatus>>({});
  const [search, setSearch] = useState("");
  const [loadingSession, setLoadingSession] = useState(false);

  // Ref to hold pre-fetched session records so the bulkStudents useEffect can apply them
  const pendingSessionRef = useRef<any[] | null>(null);

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

  // Reset rows when the student list changes, but if a session was pre-fetched apply that instead
  useEffect(() => {
    if (pendingSessionRef.current !== null) {
      const records = pendingSessionRef.current;
      pendingSessionRef.current = null;
      setBulkRows(() => {
        const next: Record<string, AttendanceStatus> = {};
        for (const s of bulkStudents as any[]) {
          const rec = records.find((r: any) => r.studentId === s.id);
          next[s.id] = rec ? (rec.status as AttendanceStatus) : "hadir";
        }
        return next;
      });
      return;
    }
    setBulkRows((prev) => {
      const next: Record<string, AttendanceStatus> = {};
      for (const s of bulkStudents as any[]) {
        next[s.id] = prev[s.id] ?? "hadir";
      }
      return next;
    });
  }, [bulkStudents]);

  const filteredStudents = useMemo(() => {
    if (!search.trim()) return bulkStudents as any[];
    const q = search.toLowerCase();
    return (bulkStudents as any[]).filter(
      (s) =>
        s.namaLengkap?.toLowerCase().includes(q) ||
        s.namaPanggilan?.toLowerCase().includes(q),
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

  const setAllStatus = (status: AttendanceStatus) => {
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

  const handleSave = async () => {
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
      invalidateAttendance();
    } catch {
      toast({ variant: "destructive", title: "Gagal", description: "Terjadi kesalahan saat menyimpan" });
    }
  };

  // Click a history session → load its data into the form in-place
  const handleLoadSession = async (group: {
    kelas: string;
    subjectId: string;
    tanggal: string;
  }) => {
    setLoadingSession(true);
    try {
      const records = await queryClient.fetchQuery({
        queryKey: ["/api/attendance", "session", group.subjectId, group.tanggal, group.kelas],
        queryFn: () =>
          listAttendance({ subjectId: group.subjectId, date: group.tanggal, kelas: group.kelas }),
        staleTime: 0,
      });
      // Store records in ref BEFORE changing kelas (which triggers bulkStudents useEffect)
      pendingSessionRef.current = records as any[];
      setBulkSubjectId(group.subjectId);
      setBulkTanggal(group.tanggal);
      setBulkKelas(group.kelas);
    } catch {
      toast({ variant: "destructive", title: "Gagal", description: "Gagal memuat data sesi" });
    } finally {
      setLoadingSession(false);
    }
  };

  const handleHapusSesi = async (group: {
    kelas: string;
    subjectId: string;
    tanggal: string;
    subjectName: string;
  }) => {
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

  // ── Build history with per-session absent student names ──
  // We fetch all attendance records once and cross-reference with students
  const { data: allAttendance } = useListAttendance(
    {},
    { query: { queryKey: ["/api/attendance", "all"] } },
  );

  const historyWithNames = useMemo(() => {
    if (!rekapData?.groups || !students) return [];
    const studentMap = new Map((students as any[]).map((s: any) => [s.id, s]));

    return rekapData.groups.map((g: any) => {
      const absentStudents = (allAttendance ?? [])
        .filter(
          (r: any) =>
            r.tanggal === g.tanggal &&
            r.subjectId === g.subjectId &&
            r.status !== "hadir",
        )
        .map((r: any) => {
          const stu = studentMap.get(r.studentId);
          return stu
            ? { name: stu.namaPanggilan || stu.namaLengkap, status: r.status as Exclude<AttendanceStatus, "hadir"> }
            : null;
        })
        .filter(Boolean) as { name: string; status: Exclude<AttendanceStatus, "hadir"> }[];

      return { ...g, absentStudents };
    });
  }, [rekapData, allAttendance, students]);

  // Group history by date
  const historyByDate = useMemo(() => {
    const map = new Map<string, typeof historyWithNames>();
    for (const g of historyWithNames) {
      const list = map.get(g.tanggal) ?? [];
      list.push(g);
      map.set(g.tanggal, list);
    }
    return [...map.entries()].sort(([a], [b]) => (a < b ? 1 : -1));
  }, [historyWithNames]);

  return (
    <Layout>
      <div className="space-y-5">

        {/* ── Header ── */}
        <FadeIn className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold font-serif">Absensi</h1>
            <p className="text-muted-foreground mt-1">Pencatatan kehadiran siswa per sesi.</p>
          </div>
        </FadeIn>

        {/* ── Selectors ── */}
        <FadeIn className="bg-card border border-border rounded-xl p-4 flex flex-wrap gap-3 items-end shadow-sm">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Kelas</label>
            <Select value={bulkKelas} onValueChange={setBulkKelas}>
              <SelectTrigger className="w-[180px] bg-background">
                <SelectValue placeholder="Pilih Kelas" />
              </SelectTrigger>
              <SelectContent>
                {kelasList.map((k) => <SelectItem key={k} value={k}>{k}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Mata Pelajaran</label>
            <Select value={bulkSubjectId} onValueChange={setBulkSubjectId}>
              <SelectTrigger className="w-[220px] bg-background">
                <SelectValue placeholder="Pilih Mapel" />
              </SelectTrigger>
              <SelectContent>
                {subjects?.map((s: any) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Tanggal</label>
            <div className="flex items-center gap-2 bg-background border border-input rounded-md px-3 py-2 text-sm font-medium shadow-sm">
              <Calendar className="w-4 h-4 text-muted-foreground" />
              <input
                type="date"
                className="bg-transparent focus:outline-none text-sm"
                value={bulkTanggal}
                onChange={(e) => setBulkTanggal(e.target.value)}
              />
            </div>
          </div>
          <div className="ml-auto">
            <Button
              onClick={handleSave}
              disabled={bulkMixedAttendance.isPending}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              <CalendarCheck2 className="w-4 h-4 mr-2" />
              {bulkMixedAttendance.isPending
                ? "Menyimpan..."
                : `Simpan ${totalStudents} Siswa`}
            </Button>
          </div>
        </FadeIn>

        {/* ── Stat Cards ── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-card rounded-xl border border-emerald-100 p-4 shadow-sm flex items-center gap-4 relative overflow-hidden">
            <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-600 flex-shrink-0">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-3xl font-black text-emerald-700">{stats.hadir}</div>
              <div className="text-xs font-bold text-emerald-600/80 uppercase tracking-wide">Hadir</div>
            </div>
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-emerald-100">
              <div className="h-full bg-emerald-500 transition-all duration-500"
                style={{ width: totalStudents ? `${(stats.hadir / totalStudents) * 100}%` : "0%" }} />
            </div>
          </div>
          <div className="bg-card rounded-xl border border-orange-100 p-4 shadow-sm flex items-center gap-4 relative overflow-hidden">
            <div className="w-12 h-12 rounded-xl bg-orange-100 flex items-center justify-center text-orange-500 flex-shrink-0">
              <Thermometer className="w-6 h-6" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-3xl font-black text-orange-600">{stats.sakit}</div>
              <div className="text-xs font-bold text-orange-500/80 uppercase tracking-wide">Sakit</div>
            </div>
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-orange-100">
              <div className="h-full bg-orange-500 transition-all duration-500"
                style={{ width: totalStudents ? `${(stats.sakit / totalStudents) * 100}%` : "0%" }} />
            </div>
          </div>
          <div className="bg-card rounded-xl border border-blue-100 p-4 shadow-sm flex items-center gap-4 relative overflow-hidden">
            <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600 flex-shrink-0">
              <Mail className="w-6 h-6" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-3xl font-black text-blue-700">{stats.izin}</div>
              <div className="text-xs font-bold text-blue-600/80 uppercase tracking-wide">Izin</div>
            </div>
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-blue-100">
              <div className="h-full bg-blue-500 transition-all duration-500"
                style={{ width: totalStudents ? `${(stats.izin / totalStudents) * 100}%` : "0%" }} />
            </div>
          </div>
          <div className="bg-card rounded-xl border border-red-100 p-4 shadow-sm flex items-center gap-4 relative overflow-hidden">
            <div className="w-12 h-12 rounded-xl bg-red-100 flex items-center justify-center text-red-600 flex-shrink-0">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-3xl font-black text-red-600">{stats.alpa}</div>
              <div className="text-xs font-bold text-red-500/80 uppercase tracking-wide">Alpa</div>
            </div>
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-red-100">
              <div className="h-full bg-red-500 transition-all duration-500"
                style={{ width: totalStudents ? `${(stats.alpa / totalStudents) * 100}%` : "0%" }} />
            </div>
          </div>
        </div>

        {/* ── Action Bar ── */}
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
            {totalStudents} siswa
            {bulkKelas && <Badge variant="secondary" className="text-xs ml-1">{bulkKelas}</Badge>}
          </div>
          <Button
            variant="outline"
            size="sm"
            className="bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100"
            onClick={() => setAllStatus("hadir")}
          >
            <Check className="w-4 h-4 mr-1.5" />
            Set Semua Hadir
          </Button>
        </div>

        {/* ── Table + History Panel ── */}
        <div className="flex flex-col lg:flex-row gap-5 items-start">

          {/* Student table */}
          <div className="flex-1 bg-card border border-border rounded-xl shadow-sm overflow-hidden w-full">
            <div className="px-5 py-4 border-b border-border">
              <h2 className="font-bold text-foreground flex items-center gap-2 text-sm">
                <Users className="w-4 h-4 text-muted-foreground" />
                Daftar Siswa
                {loadingSession && <Loader2 className="w-3.5 h-3.5 animate-spin text-muted-foreground ml-1" />}
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left min-w-[480px]">
                <thead className="text-xs text-muted-foreground bg-muted/40 border-b border-border">
                  <tr>
                    <th className="px-5 py-3 font-semibold uppercase tracking-wider w-12">No</th>
                    <th className="px-5 py-3 font-semibold uppercase tracking-wider">Nama Siswa</th>
                    <th className="px-5 py-3 font-semibold uppercase tracking-wider text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredStudents.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="h-24 text-center text-muted-foreground text-sm">
                        {totalStudents === 0
                          ? "Belum ada data siswa pada kelas ini."
                          : "Tidak ada siswa yang sesuai pencarian."}
                      </td>
                    </tr>
                  ) : (
                    filteredStudents.map((s: any, idx: number) => {
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
                                <span className="px-1.5 py-0.5 bg-muted rounded text-xs font-medium">{s.namaPanggilan}</span>
                                {s.jenisKelamin && <><span>&bull;</span><span>{s.jenisKelamin}</span></>}
                              </div>
                            )}
                          </td>
                          <td className="px-5 py-3">
                            <div className="flex items-center justify-center">
                              <div className="inline-flex items-center bg-muted rounded-lg p-0.5 border border-border">
                                {STATUS_BUTTON_ORDER.map((st) => (
                                  <button
                                    key={st}
                                    onClick={() => setBulkRows((prev) => ({ ...prev, [s.id]: st }))}
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
          <div className="w-full lg:w-[300px] bg-card border border-border rounded-xl shadow-sm flex flex-col shrink-0 max-h-[600px] flex-col">
            <div className="px-5 py-4 border-b border-border flex items-center gap-2">
              <History className="w-4 h-4 text-muted-foreground" />
              <h2 className="font-bold text-foreground text-sm uppercase tracking-wide">Rekap Riwayat</h2>
            </div>

            <div className="flex-1 overflow-y-auto [&::-webkit-scrollbar]:hidden [scrollbar-width:none]">
              {rekapLoading ? (
                <div className="p-5 space-y-5">
                  {Array(3).fill(0).map((_, i) => (
                    <div key={i} className="pl-4 border-l-2 border-border space-y-2">
                      <Skeleton className="h-3 w-24" />
                      <Skeleton className="h-5 w-20 rounded" />
                    </div>
                  ))}
                </div>
              ) : historyByDate.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-8 px-5">
                  Belum ada riwayat absensi.
                </p>
              ) : (
                <div className="p-5 space-y-6">
                  {historyByDate.map(([tanggal, groups]) => (
                    <div key={tanggal}>
                      {/* Date header */}
                      <div className="text-xs font-bold text-muted-foreground mb-3 uppercase tracking-wider">
                        {format(new Date(tanggal), "EEE, dd MMM yyyy", { locale: idLocale })}
                      </div>

                      {/* Sessions for this date */}
                      <div className="space-y-3">
                        {groups.map((g: any) => {
                          const allHadir = g.alpa === 0 && g.sakit === 0 && g.izin === 0;
                          const tidakHadir = g.total - g.hadir;
                          const isActive =
                            bulkSubjectId === g.subjectId &&
                            bulkTanggal === g.tanggal &&
                            bulkKelas === g.kelas;

                          return (
                            <div
                              key={`${g.subjectId}|${g.kelas}`}
                              className={`relative pl-4 border-l-2 cursor-pointer group ${
                                isActive
                                  ? "border-primary"
                                  : allHadir
                                  ? "border-emerald-200"
                                  : "border-orange-200"
                              }`}
                              onClick={() => handleLoadSession({ kelas: g.kelas, subjectId: g.subjectId, tanggal: g.tanggal })}
                            >
                              <div
                                className={`absolute w-2.5 h-2.5 rounded-full -left-[6px] top-1.5 ring-4 ring-background ${
                                  isActive
                                    ? "bg-primary"
                                    : allHadir
                                    ? "bg-emerald-400"
                                    : "bg-orange-400"
                                }`}
                              />

                              <div className="flex items-start justify-between gap-2 mb-1">
                                <div className="text-xs font-bold text-foreground leading-tight group-hover:text-primary transition-colors">
                                  {g.subjectName}
                                  <span className="ml-1 font-normal text-muted-foreground">· {g.kelas}</span>
                                </div>
                                <div className={`text-xs font-semibold shrink-0 ${allHadir ? "text-emerald-600" : "text-muted-foreground"}`}>
                                  {g.hadir}/{g.total}
                                </div>
                              </div>

                              {allHadir ? (
                                <div className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-600 border border-emerald-100 mb-1">
                                  Semua Hadir
                                </div>
                              ) : (
                                <div className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-red-50 text-red-600 border border-red-100 mb-2">
                                  {tidakHadir} Tidak Hadir
                                </div>
                              )}

                              {/* Absent student names */}
                              {g.absentStudents.length > 0 && (
                                <div className="flex flex-wrap gap-1 mt-1">
                                  {g.absentStudents.map(
                                    (stu: { name: string; status: Exclude<AttendanceStatus, "hadir"> }, i: number) => (
                                      <span
                                        key={i}
                                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded border text-[10px] font-semibold ${absentBadgeClass[stu.status]}`}
                                      >
                                        <span className="w-3.5 h-3.5 rounded bg-current/20 flex items-center justify-center text-[8px] font-bold">
                                          {stu.name.charAt(0)}
                                        </span>
                                        {stu.name} ({STATUS_LABELS[stu.status]})
                                      </span>
                                    ),
                                  )}
                                </div>
                              )}

                              {/* Delete button */}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleHapusSesi({ kelas: g.kelas, subjectId: g.subjectId, tanggal: g.tanggal, subjectName: g.subjectName });
                                }}
                                className="mt-2 flex items-center gap-1 text-[10px] text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <Trash2 className="w-3 h-3" />
                                Hapus sesi
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </Layout>
  );
}
