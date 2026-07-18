import { Layout } from "@/components/layout";
import {
  useListPoints,
  useBulkCreatePoints,
  useBulkMixedCreatePoints,
  useUpdatePoint,
  useDeletePoint,
  useListStudents,
} from "@workspace/api-client-react";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { ArrowDownRight, ArrowUpRight, Layers, Pencil, Plus, Trash2, X } from "lucide-react";
import { format } from "date-fns";
import { useQueryClient } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";

// Preset saran poin: pelanggaran & prestasi umum
type PoinPreset = { label: string; jenis: "positif" | "negatif"; poin: number };
const SARAN_NEGATIF: PoinPreset[] = [
  { label: "Terlambat", jenis: "negatif", poin: 5 },
  { label: "Tidak bawa buku", jenis: "negatif", poin: 3 },
  { label: "Tidak kerjakan PR", jenis: "negatif", poin: 5 },
  { label: "Tidak pakai seragam", jenis: "negatif", poin: 5 },
  { label: "Menyontek", jenis: "negatif", poin: 15 },
  { label: "Bolos", jenis: "negatif", poin: 20 },
];
const SARAN_POSITIF: PoinPreset[] = [
  { label: "Aktif menjawab", jenis: "positif", poin: 5 },
  { label: "Membantu teman", jenis: "positif", poin: 5 },
  { label: "Nilai ujian terbaik", jenis: "positif", poin: 10 },
  { label: "Juara kelas", jenis: "positif", poin: 20 },
  { label: "Mewakili lomba", jenis: "positif", poin: 15 },
];

type PoinJenis = "positif" | "negatif";

type BulkRow = {
  jenis: PoinJenis | "none";
  jumlah: string;
  keterangan: string;
};

const pointSchema = z.object({
  studentIds: z.array(z.string()).min(1, "Pilih minimal satu siswa"),
  jenis: z.enum(["positif", "negatif"]),
  poin: z.coerce.number().min(1, "Poin harus lebih dari 0"),
  keterangan: z.string().min(1, "Keterangan harus diisi"),
  tanggal: z.string().min(1, "Tanggal harus diisi"),
});

const editPointSchema = z.object({
  jenis: z.enum(["positif", "negatif"]),
  poin: z.coerce.number().min(1, "Poin harus lebih dari 0"),
  keterangan: z.string().min(1, "Keterangan harus diisi"),
  tanggal: z.string().min(1, "Tanggal harus diisi"),
});

function todayStr() {
  return new Date().toISOString().split("T")[0];
}

export default function Poin() {
  const { data: students } = useListStudents();
  const { data: pointsList, isLoading } = useListPoints();
  const bulkCreatePoints = useBulkCreatePoints();
  const bulkMixedPoints = useBulkMixedCreatePoints();
  const updatePoint = useUpdatePoint();
  const deletePoint = useDeletePoint();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [kelasFilter, setKelasFilter] = useState<string>("all");
  const [rekapKelasFilter, setRekapKelasFilter] = useState<string>("all");
  const [editingPoint, setEditingPoint] = useState<string | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // ---- Input Serentak state ----
  const [isBulkMode, setIsBulkMode] = useState(false);
  const [bulkKelas, setBulkKelas] = useState<string>("");
  const [bulkTanggal, setBulkTanggal] = useState<string>(todayStr());
  const [bulkRows, setBulkRows] = useState<Record<string, BulkRow>>({});

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
      const next: Record<string, BulkRow> = {};
      for (const s of bulkStudents as any[]) {
        next[s.id] = prev[s.id] ?? { jenis: "none", jumlah: "", keterangan: "" };
      }
      return next;
    });
  }, [bulkStudents]);

  const updateBulkRow = (studentId: string, patch: Partial<BulkRow>) => {
    setBulkRows((prev) => ({ ...prev, [studentId]: { ...prev[studentId], ...patch } }));
  };

  const invalidatePoints = () => queryClient.invalidateQueries({ queryKey: ["/api/points"] });

  const handleBulkSave = async () => {
    const entries = (bulkStudents as any[])
      .map((s) => {
        const r = bulkRows[s.id];
        if (!r || r.jenis === "none") return null;
        const poin = Number(r.jumlah);
        if (!poin || poin <= 0) return null;
        return { studentId: s.id, jenis: r.jenis as PoinJenis, poin, keterangan: r.keterangan.trim() || "-" };
      })
      .filter(Boolean) as { studentId: string; jenis: PoinJenis; poin: number; keterangan: string }[];

    if (entries.length === 0) {
      toast({ variant: "destructive", title: "Gagal", description: "Belum ada poin yang diisi" });
      return;
    }
    try {
      const result = await bulkMixedPoints.mutateAsync({ data: { tanggal: bulkTanggal, entries } });
      toast({ title: "Berhasil", description: `${result.count} catatan poin ditambahkan` });
      // Clear jumlah & keterangan after save, keep jenis so teacher can re-use
      setBulkRows((prev) => {
        const next = { ...prev };
        for (const s of bulkStudents as any[]) {
          next[s.id] = { ...next[s.id], jumlah: "", keterangan: "" };
        }
        return next;
      });
      setIsBulkMode(false);
      invalidatePoints();
    } catch {
      toast({ variant: "destructive", title: "Gagal", description: "Terjadi kesalahan saat menyimpan" });
    }
  };

  // ---- Edit dialog ----
  const editForm = useForm<z.infer<typeof editPointSchema>>({
    resolver: zodResolver(editPointSchema),
    defaultValues: { jenis: "positif", poin: 5, keterangan: "", tanggal: todayStr() },
  });

  const openEditPoint = (p: any) => {
    setEditingPoint(p.id);
    editForm.reset({ jenis: p.jenis, poin: p.poin, keterangan: p.keterangan, tanggal: p.tanggal });
  };

  const onSubmitEdit = async (data: z.infer<typeof editPointSchema>) => {
    if (!editingPoint) return;
    try {
      await updatePoint.mutateAsync({ id: editingPoint, data });
      toast({ title: "Berhasil", description: "Poin diperbarui" });
      setEditingPoint(null);
      invalidatePoints();
    } catch {
      toast({ variant: "destructive", title: "Gagal", description: "Terjadi kesalahan" });
    }
  };

  const handleDeletePoint = async (id: string) => {
    if (!confirm("Hapus catatan poin ini?")) return;
    try {
      await deletePoint.mutateAsync({ id });
      invalidatePoints();
      toast({ title: "Berhasil", description: "Catatan poin dihapus" });
    } catch {
      toast({ variant: "destructive", title: "Gagal", description: "Terjadi kesalahan" });
    }
  };

  // ---- Input Poin dialog (same poin for selected students) ----
  const form = useForm<z.infer<typeof pointSchema>>({
    resolver: zodResolver(pointSchema),
    defaultValues: { studentIds: [], jenis: "positif", poin: 5, keterangan: "", tanggal: todayStr() },
  });

  const visibleStudents = (students ?? []).filter(
    (s: any) => kelasFilter === "all" || s.kelas === kelasFilter,
  );

  const onSubmit = async (data: z.infer<typeof pointSchema>) => {
    try {
      const result = await bulkCreatePoints.mutateAsync({ data });
      toast({ title: "Berhasil", description: `Poin dicatat untuk ${result.count} siswa` });
      setIsDialogOpen(false);
      form.reset();
      setKelasFilter("all");
      queryClient.invalidateQueries({ queryKey: ["/api/points"] });
    } catch {
      toast({ variant: "destructive", title: "Gagal", description: "Terjadi kesalahan" });
    }
  };

  // ---- Rekap ----
  const rekapRows = useMemo(() => {
    if (!students || !pointsList) return [];
    const map = new Map<string, { positif: number; negatif: number }>();
    for (const p of pointsList as any[]) {
      const cur = map.get(p.studentId) ?? { positif: 0, negatif: 0 };
      if (p.jenis === "positif") cur.positif += p.poin;
      else cur.negatif += p.poin;
      map.set(p.studentId, cur);
    }
    return (students as any[])
      .filter((s) => rekapKelasFilter === "all" || s.kelas === rekapKelasFilter)
      .map((s) => {
        const acc = map.get(s.id) ?? { positif: 0, negatif: 0 };
        return { ...s, positif: acc.positif, negatif: acc.negatif, saldo: acc.positif - acc.negatif };
      })
      .sort((a, b) => b.negatif - a.negatif);
  }, [students, pointsList, rekapKelasFilter]);

  return (
    <Layout>
      <div className="space-y-6 animate-in fade-in duration-500">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold font-serif">Poin Siswa</h1>
            <p className="text-muted-foreground mt-1">Buku catatan poin pelanggaran dan prestasi.</p>
          </div>
          <div className="flex gap-2">
            {/* Input Serentak — per-student different poin */}
            <Button
              variant={isBulkMode ? "secondary" : "outline"}
              onClick={() => setIsBulkMode((v) => !v)}
            >
              <Layers className="w-4 h-4 mr-2" />
              Input Serentak
            </Button>

            {/* Input Poin — same poin for selected students */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button><Plus className="w-4 h-4 mr-2" /> Input Poin</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Input Poin</DialogTitle></DialogHeader>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField control={form.control} name="studentIds" render={({ field }) => {
                      const visibleIds = visibleStudents.map((s: any) => s.id);
                      const allVisibleSelected = visibleIds.length > 0 && visibleIds.every((id: string) => field.value.includes(id));
                      return (
                        <FormItem>
                          <div className="flex items-center justify-between">
                            <FormLabel>Siswa ({field.value.length} dipilih)</FormLabel>
                            <Select value={kelasFilter} onValueChange={setKelasFilter}>
                              <SelectTrigger className="w-[150px] h-8"><SelectValue placeholder="Semua Kelas" /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="all">Semua Kelas</SelectItem>
                                {kelasList.map((k) => <SelectItem key={k} value={k}>{k}</SelectItem>)}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="border rounded-md max-h-48 overflow-y-auto">
                            <label className="flex items-center gap-2 px-3 py-2 border-b bg-gray-50/50 cursor-pointer text-sm font-medium">
                              <Checkbox
                                checked={allVisibleSelected}
                                onCheckedChange={(checked) => {
                                  if (checked) field.onChange([...new Set([...field.value, ...visibleIds])]);
                                  else field.onChange(field.value.filter((id: string) => !visibleIds.includes(id)));
                                }}
                              />
                              Pilih Semua {kelasFilter !== "all" ? `(${kelasFilter})` : ""}
                            </label>
                            {visibleStudents.length === 0 ? (
                              <p className="px-3 py-4 text-sm text-muted-foreground text-center">Tidak ada siswa.</p>
                            ) : (
                              visibleStudents.map((s: any) => (
                                <label key={s.id} className="flex items-center gap-2 px-3 py-1.5 cursor-pointer hover:bg-gray-50 text-sm">
                                  <Checkbox
                                    checked={field.value.includes(s.id)}
                                    onCheckedChange={(checked) => {
                                      field.onChange(
                                        checked ? [...field.value, s.id] : field.value.filter((id: string) => id !== s.id),
                                      );
                                    }}
                                  />
                                  <span className="flex-1">{s.namaLengkap}</span>
                                  <span className="text-xs text-muted-foreground">{s.kelas}</span>
                                </label>
                              ))
                            )}
                          </div>
                          <FormMessage />
                        </FormItem>
                      );
                    }} />
                    <div className="grid grid-cols-2 gap-4">
                      <FormField control={form.control} name="jenis" render={({ field }) => (
                        <FormItem><FormLabel>Jenis Poin</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl><SelectTrigger><SelectValue placeholder="Pilih Jenis" /></SelectTrigger></FormControl>
                            <SelectContent>
                              <SelectItem value="positif">Positif (Prestasi)</SelectItem>
                              <SelectItem value="negatif">Negatif (Pelanggaran)</SelectItem>
                            </SelectContent>
                          </Select><FormMessage />
                        </FormItem>
                      )} />
                      <FormField control={form.control} name="poin" render={({ field }) => (
                        <FormItem><FormLabel>Jumlah Poin</FormLabel><FormControl><Input type="number" min="1" {...field} /></FormControl><FormMessage /></FormItem>
                      )} />
                    </div>
                    {/* Saran poin: preset tombol cepat */}
                    <div className="space-y-1.5">
                      <p className="text-sm font-medium leading-none">Saran Cepat</p>
                      <div className="flex flex-wrap gap-1.5">
                        {SARAN_NEGATIF.map((s) => (
                          <button
                            key={s.label}
                            type="button"
                            onClick={() => {
                              form.setValue("jenis", s.jenis);
                              form.setValue("poin", s.poin);
                              form.setValue("keterangan", s.label);
                            }}
                            className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100 transition-colors"
                          >
                            <ArrowDownRight className="w-3 h-3" />{s.label} ({s.poin})
                          </button>
                        ))}
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {SARAN_POSITIF.map((s) => (
                          <button
                            key={s.label}
                            type="button"
                            onClick={() => {
                              form.setValue("jenis", s.jenis);
                              form.setValue("poin", s.poin);
                              form.setValue("keterangan", s.label);
                            }}
                            className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors"
                          >
                            <ArrowUpRight className="w-3 h-3" />{s.label} ({s.poin})
                          </button>
                        ))}
                      </div>
                    </div>
                    <FormField control={form.control} name="keterangan" render={({ field }) => (
                      <FormItem><FormLabel>Keterangan</FormLabel><FormControl><Textarea placeholder="Alasan" {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={form.control} name="tanggal" render={({ field }) => (
                      <FormItem><FormLabel>Tanggal</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <DialogFooter><Button type="submit" disabled={bulkCreatePoints.isPending}>Simpan</Button></DialogFooter>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* ---- Edit dialog ---- */}
        <Dialog open={!!editingPoint} onOpenChange={(open) => !open && setEditingPoint(null)}>
          <DialogContent>
            <DialogHeader><DialogTitle>Edit Poin</DialogTitle></DialogHeader>
            <Form {...editForm}>
              <form onSubmit={editForm.handleSubmit(onSubmitEdit)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField control={editForm.control} name="jenis" render={({ field }) => (
                    <FormItem><FormLabel>Jenis Poin</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl><SelectTrigger><SelectValue placeholder="Pilih Jenis" /></SelectTrigger></FormControl>
                        <SelectContent>
                          <SelectItem value="positif">Positif (Prestasi)</SelectItem>
                          <SelectItem value="negatif">Negatif (Pelanggaran)</SelectItem>
                        </SelectContent>
                      </Select><FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={editForm.control} name="poin" render={({ field }) => (
                    <FormItem><FormLabel>Jumlah Poin</FormLabel><FormControl><Input type="number" min="1" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                </div>
                <FormField control={editForm.control} name="keterangan" render={({ field }) => (
                  <FormItem><FormLabel>Keterangan</FormLabel><FormControl><Textarea placeholder="Alasan" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={editForm.control} name="tanggal" render={({ field }) => (
                  <FormItem><FormLabel>Tanggal</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <DialogFooter><Button type="submit" disabled={updatePoint.isPending}>Simpan</Button></DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>

        {/* ---- Input Serentak panel ---- */}
        {isBulkMode && (
          <div className="bg-white border border-border rounded-xl shadow-sm overflow-hidden">
            <div className="p-4 border-b border-border bg-gray-50/50 flex flex-wrap gap-3 items-end">
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Kelas</label>
                <Select value={bulkKelas} onValueChange={setBulkKelas}>
                  <SelectTrigger className="w-[180px] bg-white"><SelectValue placeholder="Pilih Kelas" /></SelectTrigger>
                  <SelectContent>
                    {kelasList.map((k) => <SelectItem key={k} value={k}>{k}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Tanggal</label>
                <Input type="date" className="w-[150px] bg-white" value={bulkTanggal} onChange={(e) => setBulkTanggal(e.target.value)} />
              </div>
              <p className="text-xs text-muted-foreground self-end pb-1">
                Isi jenis &amp; jumlah poin per siswa. Siswa tanpa poin dilewati otomatis.
              </p>
              <div className="ml-auto flex gap-2">
                <Button variant="ghost" size="sm" onClick={() => setIsBulkMode(false)}>
                  <X className="w-4 h-4 mr-1" /> Batal
                </Button>
                <Button onClick={handleBulkSave} disabled={bulkMixedPoints.isPending}>
                  <Layers className="w-4 h-4 mr-2" />
                  {bulkMixedPoints.isPending ? "Menyimpan..." : "Simpan Poin"}
                </Button>
              </div>
            </div>
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50/50">
                  <TableHead>Nama Siswa</TableHead>
                  <TableHead className="w-[130px]">Jenis Poin</TableHead>
                  <TableHead className="w-[100px]">Jumlah</TableHead>
                  <TableHead>Keterangan</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(bulkStudents as any[]).length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                      {kelasList.length === 0 ? "Belum ada data siswa." : "Tidak ada siswa pada kelas ini."}
                    </TableCell>
                  </TableRow>
                ) : (
                  (bulkStudents as any[]).map((s) => {
                    const row = bulkRows[s.id] ?? { jenis: "none", jumlah: "", keterangan: "" };
                    return (
                      <TableRow key={s.id}>
                        <TableCell className="font-medium">{s.namaLengkap}</TableCell>
                        <TableCell>
                          <Select
                            value={row.jenis}
                            onValueChange={(v) => updateBulkRow(s.id, { jenis: v as PoinJenis | "none" })}
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
                            className="h-8 w-[75px]"
                            disabled={row.jenis === "none"}
                            value={row.jumlah}
                            onChange={(e) => updateBulkRow(s.id, { jumlah: e.target.value })}
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            className="h-8"
                            placeholder="Keterangan (opsional)"
                            disabled={row.jenis === "none"}
                            value={row.keterangan}
                            onChange={(e) => updateBulkRow(s.id, { keterangan: e.target.value })}
                          />
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        )}

        {/* ---- Tabs: Rekap & Riwayat ---- */}
        <Tabs defaultValue="rekap">
          <TabsList>
            <TabsTrigger value="rekap">Rekap Akumulasi</TabsTrigger>
            <TabsTrigger value="riwayat">Riwayat Catatan</TabsTrigger>
          </TabsList>

          <TabsContent value="rekap">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">Total poin yang terakumulasi per siswa.</p>
                <Select value={rekapKelasFilter} onValueChange={setRekapKelasFilter}>
                  <SelectTrigger className="w-[160px]"><SelectValue placeholder="Semua Kelas" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Kelas</SelectItem>
                    {kelasList.map((k) => <SelectItem key={k} value={k}>{k}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="bg-white border border-border rounded-xl shadow-sm overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50/50">
                      <TableHead>Nama Siswa</TableHead>
                      <TableHead>Kelas</TableHead>
                      <TableHead className="text-emerald-600">Poin Positif</TableHead>
                      <TableHead className="text-rose-600">Poin Negatif</TableHead>
                      <TableHead>Total Poin</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoading ? (
                      Array(5).fill(0).map((_, i) => (
                        <TableRow key={i}><TableCell colSpan={5}><Skeleton className="h-6 w-full" /></TableCell></TableRow>
                      ))
                    ) : rekapRows.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">Belum ada data poin.</TableCell>
                      </TableRow>
                    ) : (
                      rekapRows.map((s: any) => {
                        const saldo = s.saldo;
                        return (
                          <TableRow key={s.id}>
                            <TableCell className="font-medium">{s.namaLengkap}</TableCell>
                            <TableCell className="text-muted-foreground">{s.kelas}</TableCell>
                            <TableCell>
                              {s.positif > 0 ? (
                                <span className="flex items-center gap-1 text-emerald-600 font-semibold">
                                  <ArrowUpRight className="w-4 h-4" />{s.positif}
                                </span>
                              ) : <span className="text-muted-foreground">—</span>}
                            </TableCell>
                            <TableCell>
                              {s.negatif > 0 ? (
                                <span className="flex items-center gap-1 text-rose-600 font-semibold">
                                  <ArrowDownRight className="w-4 h-4" />{s.negatif}
                                </span>
                              ) : <span className="text-muted-foreground">—</span>}
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant="outline"
                                className={
                                  saldo > 0
                                    ? "border-emerald-300 bg-emerald-50 text-emerald-700"
                                    : saldo < 0
                                      ? "border-rose-300 bg-rose-50 text-rose-700"
                                      : "border-gray-200 text-muted-foreground"
                                }
                              >
                                {saldo > 0 ? "+" : ""}{saldo}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="riwayat">
            <div className="bg-white border border-border rounded-xl shadow-sm overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50/50">
                    <TableHead>Nama Siswa</TableHead>
                    <TableHead>Poin</TableHead>
                    <TableHead>Keterangan</TableHead>
                    <TableHead>Tanggal</TableHead>
                    <TableHead className="text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    Array(3).fill(0).map((_, i) => <TableRow key={i}><TableCell colSpan={5}><Skeleton className="h-6 w-full" /></TableCell></TableRow>)
                  ) : !(pointsList as any[])?.length ? (
                    <TableRow><TableCell colSpan={5} className="h-24 text-center text-muted-foreground">Belum ada catatan poin.</TableCell></TableRow>
                  ) : (
                    (pointsList as any[]).map((p) => (
                      <TableRow key={p.id}>
                        <TableCell className="font-medium">{(students as any[])?.find((s) => s.id === p.studentId)?.namaLengkap}</TableCell>
                        <TableCell>
                          <div className={`flex items-center gap-1 font-bold ${p.jenis === "positif" ? "text-emerald-600" : "text-rose-600"}`}>
                            {p.jenis === "positif" ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                            {p.poin}
                          </div>
                        </TableCell>
                        <TableCell className="max-w-[300px] truncate">{p.keterangan}</TableCell>
                        <TableCell className="text-muted-foreground">{format(new Date(p.tanggal), "dd MMM yyyy")}</TableCell>
                        <TableCell className="text-right space-x-1">
                          <Button variant="ghost" size="icon" onClick={() => openEditPoint(p)}><Pencil className="w-4 h-4" /></Button>
                          <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleDeletePoint(p.id)}><Trash2 className="w-4 h-4" /></Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
