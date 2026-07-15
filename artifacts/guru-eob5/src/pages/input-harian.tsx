import { Layout } from "@/components/layout";
import {
  useListSubjects,
  useListStudents,
  useBulkMixedCreateAttendance,
  useBulkMixedCreatePoints,
} from "@workspace/api-client-react";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { CalendarCheck2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

type AttendanceStatus = "hadir" | "izin" | "sakit" | "alpa";
type PoinJenis = "positif" | "negatif";

type RowState = {
  status: AttendanceStatus;
  poinJenis: PoinJenis | "none";
  poinJumlah: string;
  poinKeterangan: string;
};

const STATUS_OPTIONS: { value: AttendanceStatus; label: string }[] = [
  { value: "hadir", label: "Hadir" },
  { value: "izin", label: "Izin" },
  { value: "sakit", label: "Sakit" },
  { value: "alpa", label: "Alpa" },
];

const statusColors: Record<AttendanceStatus, string> = {
  hadir: "text-emerald-600",
  izin: "text-blue-600",
  sakit: "text-amber-600",
  alpa: "text-rose-600",
};

function todayStr(): string {
  return new Date().toISOString().split("T")[0];
}

export default function InputHarian() {
  const { data: subjects } = useListSubjects();
  const { data: students, isLoading: studentsLoading } = useListStudents();

  const [subjectId, setSubjectId] = useState<string>("");
  const [kelasFilter, setKelasFilter] = useState<string>("");
  const [tanggal, setTanggal] = useState<string>(todayStr());
  const [rows, setRows] = useState<Record<string, RowState>>({});
  const { toast } = useToast();

  const bulkAttendance = useBulkMixedCreateAttendance();
  const bulkPoints = useBulkMixedCreatePoints();
  const saving = bulkAttendance.isPending || bulkPoints.isPending;

  const kelasList = useMemo(
    () => [...new Set((students ?? []).map((s: any) => s.kelas))].sort(),
    [students],
  );

  useEffect(() => {
    if (!kelasFilter && kelasList.length > 0) setKelasFilter(kelasList[0]);
  }, [kelasList, kelasFilter]);

  const visibleStudents = useMemo(
    () => (students ?? []).filter((s: any) => !kelasFilter || s.kelas === kelasFilter),
    [students, kelasFilter],
  );

  // Reset the per-student input state whenever the roster in view changes
  // (kelas switched), so leftover entries from a different class don't
  // silently get submitted.
  useEffect(() => {
    setRows((prev) => {
      const next: Record<string, RowState> = {};
      for (const s of visibleStudents as any[]) {
        next[s.id] = prev[s.id] ?? {
          status: "hadir",
          poinJenis: "none",
          poinJumlah: "",
          poinKeterangan: "",
        };
      }
      return next;
    });
  }, [visibleStudents]);

  const updateRow = (studentId: string, patch: Partial<RowState>) => {
    setRows((prev) => ({ ...prev, [studentId]: { ...prev[studentId], ...patch } }));
  };

  const setAllStatus = (status: AttendanceStatus) => {
    setRows((prev) => {
      const next = { ...prev };
      for (const s of visibleStudents as any[]) {
        next[s.id] = { ...next[s.id], status };
      }
      return next;
    });
  };

  const handleSave = async () => {
    if (!subjectId) {
      toast({ variant: "destructive", title: "Gagal", description: "Pilih mata pelajaran terlebih dahulu" });
      return;
    }
    if (visibleStudents.length === 0) {
      toast({ variant: "destructive", title: "Gagal", description: "Tidak ada siswa pada kelas ini" });
      return;
    }

    try {
      const attendanceEntries = (visibleStudents as any[]).map((s) => ({
        studentId: s.id,
        status: rows[s.id]?.status ?? "hadir",
      }));
      const attendanceResult = await bulkAttendance.mutateAsync({
        data: { subjectId, tanggal, entries: attendanceEntries },
      });

      const pointEntries = (visibleStudents as any[])
        .map((s) => {
          const r = rows[s.id];
          if (!r || r.poinJenis === "none") return null;
          const poin = Number(r.poinJumlah);
          if (!poin || poin <= 0 || !r.poinKeterangan.trim()) return null;
          return { studentId: s.id, jenis: r.poinJenis, poin, keterangan: r.poinKeterangan.trim() };
        })
        .filter(Boolean) as { studentId: string; jenis: PoinJenis; poin: number; keterangan: string }[];

      const pointsResult = pointEntries.length > 0
        ? await bulkPoints.mutateAsync({ data: { tanggal, entries: pointEntries } })
        : { count: 0 };

      toast({
        title: "Berhasil disimpan",
        description: `Kehadiran ${attendanceResult.count} siswa dicatat${
          pointsResult.count > 0 ? `, ${pointsResult.count} catatan poin ditambahkan` : ""
        }.`,
      });

      // Clear the point inputs (attendance stays visible so the teacher can
      // see what was just submitted) so accidental re-saves don't duplicate
      // point entries.
      setRows((prev) => {
        const next = { ...prev };
        for (const s of visibleStudents as any[]) {
          next[s.id] = { ...next[s.id], poinJenis: "none", poinJumlah: "", poinKeterangan: "" };
        }
        return next;
      });
    } catch {
      toast({ variant: "destructive", title: "Gagal", description: "Terjadi kesalahan saat menyimpan" });
    }
  };

  return (
    <Layout>
      <div className="space-y-6 animate-in fade-in duration-500">
        <div>
          <h1 className="text-3xl font-bold font-serif">Input Harian</h1>
          <p className="text-muted-foreground mt-1">
            Isi kehadiran dan poin seluruh siswa sekaligus, tanpa bolak-balik buka panel.
          </p>
        </div>

        <div className="bg-white border border-border rounded-xl shadow-sm overflow-hidden">
          <div className="p-4 border-b border-border bg-gray-50/50 flex flex-wrap gap-3 items-end">
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Kelas</label>
              <Select value={kelasFilter} onValueChange={setKelasFilter}>
                <SelectTrigger className="w-[190px] bg-white"><SelectValue placeholder="Pilih Kelas" /></SelectTrigger>
                <SelectContent>
                  {kelasList.map((k) => <SelectItem key={k} value={k}>{k}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Mata Pelajaran</label>
              <Select value={subjectId} onValueChange={setSubjectId}>
                <SelectTrigger className="w-[220px] bg-white"><SelectValue placeholder="Pilih Mapel" /></SelectTrigger>
                <SelectContent>
                  {subjects?.map((s: any) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Tanggal</label>
              <Input type="date" className="w-[160px] bg-white" value={tanggal} onChange={(e) => setTanggal(e.target.value)} />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Tandai semua</label>
              <div className="flex gap-1">
                {STATUS_OPTIONS.map((opt) => (
                  <Button key={opt.value} type="button" variant="outline" size="sm" onClick={() => setAllStatus(opt.value)}>
                    {opt.label}
                  </Button>
                ))}
              </div>
            </div>
            <div className="ml-auto">
              <Button onClick={handleSave} disabled={saving}>
                <CalendarCheck2 className="w-4 h-4 mr-2" />
                {saving ? "Menyimpan..." : "Simpan Semua"}
              </Button>
            </div>
          </div>

          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50/50">
                <TableHead>Nama Siswa</TableHead>
                <TableHead className="w-[130px]">Kehadiran</TableHead>
                <TableHead className="w-[130px]">Jenis Poin</TableHead>
                <TableHead className="w-[90px]">Jumlah</TableHead>
                <TableHead>Keterangan Poin</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {studentsLoading ? (
                Array(5).fill(0).map((_, i) => (
                  <TableRow key={i}><TableCell colSpan={5}><Skeleton className="h-8 w-full" /></TableCell></TableRow>
                ))
              ) : visibleStudents.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                    {kelasList.length === 0 ? "Belum ada data siswa." : "Tidak ada siswa pada kelas ini."}
                  </TableCell>
                </TableRow>
              ) : (
                (visibleStudents as any[]).map((s) => {
                  const row = rows[s.id];
                  if (!row) return null;
                  return (
                    <TableRow key={s.id}>
                      <TableCell className="font-medium">{s.namaLengkap}</TableCell>
                      <TableCell>
                        <Select value={row.status} onValueChange={(v) => updateRow(s.id, { status: v as AttendanceStatus })}>
                          <SelectTrigger className={`h-8 w-[110px] font-medium ${statusColors[row.status]}`}>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {STATUS_OPTIONS.map((opt) => (
                              <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <Select
                          value={row.poinJenis}
                          onValueChange={(v) => updateRow(s.id, { poinJenis: v as PoinJenis | "none" })}
                        >
                          <SelectTrigger className="h-8 w-[110px]"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">—</SelectItem>
                            <SelectItem value="positif">Positif</SelectItem>
                            <SelectItem value="negatif">Negatif</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          min="1"
                          className="h-8 w-[70px]"
                          disabled={row.poinJenis === "none"}
                          value={row.poinJumlah}
                          onChange={(e) => updateRow(s.id, { poinJumlah: e.target.value })}
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          className="h-8"
                          placeholder="Alasan poin (opsional)"
                          disabled={row.poinJenis === "none"}
                          value={row.poinKeterangan}
                          onChange={(e) => updateRow(s.id, { poinKeterangan: e.target.value })}
                        />
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </Layout>
  );
}
