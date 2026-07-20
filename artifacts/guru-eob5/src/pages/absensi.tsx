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
import { CalendarCheck2, Trash2, X } from "lucide-react";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import { useQueryClient } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

type AttendanceStatus = "hadir" | "izin" | "sakit" | "alpa";

const STATUS_OPTIONS: { value: AttendanceStatus; label: string }[] = [
  { value: "hadir", label: "Hadir" },
  { value: "izin", label: "Izin" },
  { value: "sakit", label: "Sakit" },
  { value: "alpa", label: "Alpa" },
];

const statusColors: Record<AttendanceStatus, string> = {
  hadir: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
  izin: "bg-blue-500/10 text-blue-600 border-blue-500/20",
  sakit: "bg-amber-500/10 text-amber-600 border-amber-500/20",
  alpa: "bg-rose-500/10 text-rose-600 border-rose-500/20",
};

const statusTextColors: Record<AttendanceStatus, string> = {
  hadir: "text-emerald-600",
  izin: "text-blue-600",
  sakit: "text-amber-600",
  alpa: "text-rose-600",
};

function todayStr() {
  return new Date().toISOString().split("T")[0];
}

export default function Absensi() {
  const { data: subjects } = useListSubjects();
  const { data: students } = useListStudents();
  const [selectedSubject, setSelectedSubject] = useState<string>("");
  const [activeTab, setActiveTab] = useState("riwayat");

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

  // Group rekap by date for display
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

  return (
    <Layout>
      <div className="space-y-6">
        <FadeIn className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold font-serif">Absensi</h1>
            <p className="text-muted-foreground mt-1">Kelola kehadiran siswa.</p>
          </div>
          <div className="flex gap-2">
            <Button
              variant={isBulkMode ? "secondary" : "outline"}
              onClick={() => setIsBulkMode((v) => !v)}
            >
              <CalendarCheck2 className="w-4 h-4 mr-2" />
              Catat Serentak
            </Button>
          </div>
        </FadeIn>

        {/* ---- Catat Serentak panel ---- */}
        {isBulkMode && (
          <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
            <div className="p-4 border-b border-border bg-muted/40 flex flex-wrap gap-3 items-end">
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Kelas</label>
                <Select value={bulkKelas} onValueChange={setBulkKelas}>
                  <SelectTrigger className="w-[180px] bg-card"><SelectValue placeholder="Pilih Kelas" /></SelectTrigger>
                  <SelectContent>
                    {kelasList.map((k) => <SelectItem key={k} value={k}>{k}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Mata Pelajaran</label>
                <Select value={bulkSubjectId} onValueChange={setBulkSubjectId}>
                  <SelectTrigger className="w-[210px] bg-card"><SelectValue placeholder="Pilih Mapel" /></SelectTrigger>
                  <SelectContent>
                    {subjects?.map((s: any) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Tanggal</label>
                <Input type="date" className="w-[150px] bg-card" value={bulkTanggal} onChange={(e) => setBulkTanggal(e.target.value)} />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Tandai semua</label>
                <div className="flex gap-1">
                  {STATUS_OPTIONS.map((opt) => (
                    <Button key={opt.value} type="button" variant="outline" size="sm" onClick={() => setAllBulkStatus(opt.value)}>
                      {opt.label}
                    </Button>
                  ))}
                </div>
              </div>
              <div className="ml-auto flex gap-2">
                <Button variant="ghost" size="sm" onClick={() => setIsBulkMode(false)}>
                  <X className="w-4 h-4 mr-1" /> Batal
                </Button>
                <Button onClick={handleBulkSave} disabled={bulkMixedAttendance.isPending}>
                  <CalendarCheck2 className="w-4 h-4 mr-2" />
                  {bulkMixedAttendance.isPending ? "Menyimpan..." : `Simpan ${(bulkStudents as any[]).length} Siswa`}
                </Button>
              </div>
            </div>
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40">
                  <TableHead>Nama Siswa</TableHead>
                  <TableHead className="w-[130px]">Status Kehadiran</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(bulkStudents as any[]).length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={2} className="h-24 text-center text-muted-foreground">
                      {kelasList.length === 0 ? "Belum ada data siswa." : "Tidak ada siswa pada kelas ini."}
                    </TableCell>
                  </TableRow>
                ) : (
                  (bulkStudents as any[]).map((s) => {
                    const status = bulkRows[s.id] ?? "hadir";
                    return (
                      <TableRow key={s.id}>
                        <TableCell className="font-medium">{s.namaLengkap}</TableCell>
                        <TableCell>
                          <Select value={status} onValueChange={(v) => setBulkRows((prev) => ({ ...prev, [s.id]: v as AttendanceStatus }))}>
                            <SelectTrigger className={`h-8 w-[110px] font-medium ${statusTextColors[status]}`}>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {STATUS_OPTIONS.map((opt) => (
                                <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        )}

        {/* ---- Tabs: Riwayat & Rekap ---- */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="riwayat">Riwayat Per Siswa</TabsTrigger>
            <TabsTrigger value="rekap">Rekap Per Kelas</TabsTrigger>
          </TabsList>

          {/* ─── Tab: Riwayat ─── */}
          <TabsContent value="riwayat">
            <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden flex flex-col">
              <div className="p-4 border-b border-border bg-muted/40 flex gap-4">
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
                  <TableRow className="bg-muted/40">
                    <TableHead>Nama Siswa</TableHead>
                    <TableHead>Mata Pelajaran</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    Array(3).fill(0).map((_, i) => <TableRow key={i}><TableCell colSpan={4}><Skeleton className="h-6 w-full" /></TableCell></TableRow>)
                  ) : !attendanceList?.length ? (
                    <TableRow><TableCell colSpan={4} className="h-24 text-center text-muted-foreground">Belum ada data kehadiran.</TableCell></TableRow>
                  ) : (
                    groupedByDate.map(([tanggal, records]) => (
                      <>
                        <TableRow key={`date-${tanggal}`} className="bg-gray-100/80 hover:bg-gray-100/80">
                          <TableCell colSpan={4} className="font-semibold text-sm py-2">
                            {format(new Date(tanggal), "EEEE, dd MMMM yyyy", { locale: idLocale })}
                            <span className="ml-2 font-normal text-muted-foreground">({records.length} siswa)</span>
                          </TableCell>
                        </TableRow>
                        {records.map((a: any) => (
                          <TableRow key={a.id}>
                            <TableCell className="font-medium">{students?.find((s: any) => s.id === a.studentId)?.namaLengkap}</TableCell>
                            <TableCell>{subjects?.find((s: any) => s.id === a.subjectId)?.name}</TableCell>
                            <TableCell>
                              <Select value={a.status} onValueChange={(status) => handleStatusChange(a.id, status)}>
                                <SelectTrigger className="w-[110px] h-8">
                                  <Badge variant="outline" className={`${statusColors[a.status as AttendanceStatus]} capitalize`}>
                                    {a.status}
                                  </Badge>
                                </SelectTrigger>
                                <SelectContent>
                                  {STATUS_OPTIONS.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                                </SelectContent>
                              </Select>
                            </TableCell>
                            <TableCell className="text-right">
                              <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleDeleteAttendance(a.id)}>
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
                Rekapitulasi kehadiran per sesi (tanggal · kelas · mata pelajaran). Klik <strong>Hapus Absensi</strong> untuk menghapus seluruh sesi dan mengulang input dari awal.
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
                    <div className="px-4 py-2.5 bg-gray-50/80 border-b border-border">
                      <p className="font-semibold text-sm">
                        {format(new Date(tanggal), "EEEE, dd MMMM yyyy", { locale: idLocale })}
                      </p>
                    </div>
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-gray-50/40 text-xs">
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
                        {groups.map((g) => (
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
