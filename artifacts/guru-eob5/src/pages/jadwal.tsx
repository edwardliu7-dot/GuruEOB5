import { useRef, useState } from "react";
import { Layout } from "@/components/layout";
import {
  useListJadwal,
  useCreateJadwal,
  useUpdateJadwal,
  useDeleteJadwal,
  useListSubjects,
  useImportJadwalPreview,
  useBulkCreateJadwal,
  getListJadwalQueryKey,
} from "@workspace/api-client-react";
import type {
  JadwalEntry,
  JadwalInput,
  JadwalInputHari,
  JadwalImportPreviewItem,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertCircle,
  CalendarClock,
  CheckCircle2,
  Clock,
  FileUp,
  Loader2,
  Pencil,
  Plus,
  Trash2,
  XCircle,
} from "lucide-react";
import { KELAS_OPTIONS } from "@/lib/options";
import { cn } from "@/lib/utils";

const HARI_LIST = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"] as const;
type Hari = (typeof HARI_LIST)[number];

// ── Blank form ───────────────────────────────────────────────────────────────
const BLANK: JadwalInput = {
  subjectId: "",
  kelas: "",
  hari: "Senin",
  jamMulai: "07:00",
  jamSelesai: "08:00",
};

// ── JadwalForm dialog ────────────────────────────────────────────────────────
function JadwalDialog({
  open,
  initial,
  onClose,
}: {
  open: boolean;
  initial: { entry?: JadwalEntry; data: JadwalInput };
  onClose: () => void;
}) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: subjects } = useListSubjects();
  const createMutation = useCreateJadwal();
  const updateMutation = useUpdateJadwal();

  const [form, setForm] = useState<JadwalInput>(initial.data);

  // Sync when dialog re-opens with different entry
  const currentId = initial.entry?.id ?? "";
  const [lastId, setLastId] = useState(currentId);
  if (currentId !== lastId) {
    setLastId(currentId);
    setForm(initial.data);
  }

  const isEdit = !!initial.entry;
  const isPending = createMutation.isPending || updateMutation.isPending;

  function set<K extends keyof JadwalInput>(key: K, val: JadwalInput[K]) {
    setForm((f) => ({ ...f, [key]: val }));
  }

  async function handleSubmit() {
    if (!form.subjectId || !form.kelas || !form.hari || !form.jamMulai || !form.jamSelesai) {
      toast({ title: "Lengkapi semua field", variant: "destructive" });
      return;
    }
    try {
      if (isEdit) {
        await updateMutation.mutateAsync({ id: initial.entry!.id, data: form });
        toast({ title: "Jadwal diperbarui" });
      } else {
        await createMutation.mutateAsync({ data: form });
        toast({ title: "Jadwal ditambahkan" });
      }
      queryClient.invalidateQueries({ queryKey: getListJadwalQueryKey() });
      onClose();
    } catch {
      toast({ title: "Gagal menyimpan jadwal", variant: "destructive" });
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Jadwal" : "Tambah Jadwal"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Mata Pelajaran */}
          <div className="space-y-1.5">
            <Label>Mata Pelajaran</Label>
            <Select value={form.subjectId} onValueChange={(v) => set("subjectId", v)}>
              <SelectTrigger>
                <SelectValue placeholder="Pilih mata pelajaran..." />
              </SelectTrigger>
              <SelectContent>
                {(subjects ?? []).map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Kelas */}
          <div className="space-y-1.5">
            <Label>Kelas</Label>
            <Select value={form.kelas} onValueChange={(v) => set("kelas", v)}>
              <SelectTrigger>
                <SelectValue placeholder="Pilih kelas..." />
              </SelectTrigger>
              <SelectContent>
                {KELAS_OPTIONS.map((k) => (
                  <SelectItem key={k} value={k}>
                    {k}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Hari */}
          <div className="space-y-1.5">
            <Label>Hari</Label>
            <Select value={form.hari} onValueChange={(v) => set("hari", v as JadwalInputHari)}>
              <SelectTrigger>
                <SelectValue placeholder="Pilih hari..." />
              </SelectTrigger>
              <SelectContent>
                {HARI_LIST.map((h) => (
                  <SelectItem key={h} value={h}>
                    {h}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Waktu */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Jam Mulai</Label>
              <Input
                type="time"
                value={form.jamMulai}
                onChange={(e) => set("jamMulai", e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Jam Selesai</Label>
              <Input
                type="time"
                value={form.jamSelesai}
                onChange={(e) => set("jamSelesai", e.target.value)}
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isPending}>
            Batal
          </Button>
          <Button onClick={handleSubmit} disabled={isPending}>
            {isPending ? "Menyimpan..." : "Simpan"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Import PDF dialog ─────────────────────────────────────────────────────────
type ImportStep = "upload" | "preview";

function ImportDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const previewMutation = useImportJadwalPreview();
  const bulkMutation = useBulkCreateJadwal();
  const { data: subjects } = useListSubjects();

  const [step, setStep] = useState<ImportStep>("upload");
  const [items, setItems] = useState<JadwalImportPreviewItem[]>([]);
  // track which matched rows the user has excluded
  const [excluded, setExcluded] = useState<Set<number>>(new Set());
  // track user-selected subject for unmatched rows (index → subjectId)
  const [overrides, setOverrides] = useState<Map<number, string>>(new Map());

  function resetState() {
    setStep("upload");
    setItems([]);
    setExcluded(new Set());
    setOverrides(new Map());
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function handleClose() {
    resetState();
    onClose();
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (fileInputRef.current) fileInputRef.current.value = "";
    if (!file) return;

    if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
      toast({ title: "Format tidak didukung", description: "Harap unggah file PDF", variant: "destructive" });
      return;
    }

    try {
      const buffer = await file.arrayBuffer();
      // btoa(String.fromCharCode(...)) overflows the call stack for large files;
      // use a chunked approach instead.
      const bytes = new Uint8Array(buffer);
      let binary = "";
      const CHUNK = 8192;
      for (let i = 0; i < bytes.length; i += CHUNK) {
        binary += String.fromCharCode(...bytes.subarray(i, i + CHUNK));
      }
      const base64 = btoa(binary);
      const result = await previewMutation.mutateAsync({ data: { fileBase64: base64 } });
      if (!result.preview || result.preview.length === 0) {
        toast({ title: "Tidak ada jadwal ditemukan", description: "AI tidak berhasil mengekstrak jadwal dari PDF ini", variant: "destructive" });
        return;
      }
      setItems(result.preview);
      setStep("preview");
    } catch (err: unknown) {
      const msg = (err as { data?: { error?: string } })?.data?.error ?? "Gagal membaca PDF";
      toast({ title: "Gagal ekstraksi", description: msg, variant: "destructive" });
    }
  }

  async function handleSave() {
    const toSave = items
      .filter((item, idx) => {
        if (excluded.has(idx)) return false;
        if (item.matched && item.subjectId) return true;
        return overrides.has(idx); // unmatched but user picked a subject
      })
      .map((item, _, arr) => {
        const idx = items.indexOf(item);
        const subjectId = item.subjectId ?? overrides.get(idx)!;
        return {
          subjectId,
          kelas: item.kelas,
          hari: item.hari,
          jamMulai: item.jamMulai,
          jamSelesai: item.jamSelesai,
        };
      });

    if (toSave.length === 0) {
      toast({ title: "Tidak ada data untuk disimpan", variant: "destructive" });
      return;
    }

    try {
      const result = await bulkMutation.mutateAsync({ data: { entries: toSave } });
      toast({ title: `${result.inserted} jadwal berhasil disimpan` });
      queryClient.invalidateQueries({ queryKey: getListJadwalQueryKey() });
      handleClose();
    } catch (err: unknown) {
      const msg = (err as { data?: { error?: string } })?.data?.error ?? "Gagal menyimpan jadwal";
      toast({ title: "Gagal", description: msg, variant: "destructive" });
    }
  }

  function toggleExclude(idx: number) {
    setExcluded((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
  }

  const matchedCount = items.filter((item, idx) =>
    !excluded.has(idx) && (item.matched || overrides.has(idx))
  ).length;
  const unmatchedCount = items.filter((item, idx) => !item.matched && !overrides.has(idx)).length;

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) handleClose(); }}>
      <DialogContent className={cn("max-w-3xl", step === "preview" && "max-w-5xl")}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileUp className="h-5 w-5" />
            Import Jadwal dari PDF
          </DialogTitle>
        </DialogHeader>

        {/* ── Step 1: Upload ── */}
        {step === "upload" && (
          <div className="py-4">
            {previewMutation.isPending ? (
              <div className="flex flex-col items-center gap-4 py-12 text-muted-foreground">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
                <p className="text-sm font-medium">AI sedang membaca jadwal dari PDF…</p>
                <p className="text-xs">Proses ini bisa memakan 15–30 detik</p>
              </div>
            ) : (
              <div
                className="flex flex-col items-center gap-4 rounded-xl border-2 border-dashed border-border/60 bg-muted/20 py-16 text-center cursor-pointer hover:bg-muted/40 transition-colors"
                onClick={() => fileInputRef.current?.click()}
              >
                <FileUp className="h-10 w-10 text-muted-foreground/50" />
                <div>
                  <p className="font-medium text-foreground">Klik untuk memilih file PDF jadwal</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    AI akan mengekstrak jadwal dan mencocokkan mata pelajaran secara otomatis
                  </p>
                </div>
                <Button variant="outline" size="sm" type="button">
                  Pilih File PDF
                </Button>
              </div>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,application/pdf"
              className="hidden"
              onChange={handleFileChange}
              disabled={previewMutation.isPending}
            />
          </div>
        )}

        {/* ── Step 2: Preview ── */}
        {step === "preview" && (
          <div className="space-y-3 py-2">
            {/* Summary bar */}
            <div className="flex flex-wrap gap-2 text-sm">
              <span className="flex items-center gap-1.5 rounded-full bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300 px-3 py-1 font-medium">
                <CheckCircle2 className="h-3.5 w-3.5" />
                {matchedCount} cocok
              </span>
              {unmatchedCount > 0 && (
                <span className="flex items-center gap-1.5 rounded-full bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-300 px-3 py-1 font-medium">
                  <AlertCircle className="h-3.5 w-3.5" />
                  {unmatchedCount} belum dipilih mapelnya
                </span>
              )}
            </div>

            {/* Table */}
            <div className="max-h-[55vh] overflow-auto rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-8"></TableHead>
                    <TableHead>Kelas</TableHead>
                    <TableHead>Hari</TableHead>
                    <TableHead>Waktu</TableHead>
                    <TableHead>Nama di PDF</TableHead>
                    <TableHead>Mata Pelajaran (sistem)</TableHead>
                    <TableHead>Guru</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((item, idx) => {
                    const isExcluded = excluded.has(idx);
                    return (
                      <TableRow
                        key={idx}
                        className={cn(
                          !item.matched && "bg-orange-50/50 dark:bg-orange-950/20",
                          isExcluded && "opacity-40 line-through",
                        )}
                      >
                        <TableCell>
                          {item.matched ? (
                            <button
                              title={isExcluded ? "Sertakan kembali" : "Hapus dari import"}
                              onClick={() => toggleExclude(idx)}
                              className="text-muted-foreground hover:text-destructive transition-colors"
                            >
                              {isExcluded ? (
                                <CheckCircle2 className="h-4 w-4 text-green-500" />
                              ) : (
                                <XCircle className="h-4 w-4" />
                              )}
                            </button>
                          ) : (
                            <AlertCircle className="h-4 w-4 text-orange-500" />
                          )}
                        </TableCell>
                        <TableCell className="font-medium text-xs">{item.kelas}</TableCell>
                        <TableCell className="text-xs">{item.hari}</TableCell>
                        <TableCell className="text-xs whitespace-nowrap">
                          {item.jamMulai} – {item.jamSelesai}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">{item.mapelRaw}</TableCell>
                        <TableCell>
                          {item.matched ? (
                            <span className="text-xs font-medium text-foreground">{item.subjectName}</span>
                          ) : (
                            <Select
                              value={overrides.get(idx) ?? ""}
                              onValueChange={(val) =>
                                setOverrides((prev) => {
                                  const next = new Map(prev);
                                  if (val) next.set(idx, val); else next.delete(idx);
                                  return next;
                                })
                              }
                            >
                              <SelectTrigger className="h-7 text-xs w-44">
                                <SelectValue placeholder="Pilih mapel…" />
                              </SelectTrigger>
                              <SelectContent>
                                {(subjects ?? []).map((s) => (
                                  <SelectItem key={s.id} value={s.id} className="text-xs">
                                    {s.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          )}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {item.teacherName ?? "—"}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>

            {unmatchedCount > 0 && (
              <p className="text-xs text-muted-foreground">
                Baris tidak cocok terjadi karena nama mata pelajaran di PDF tidak ditemukan di
                sistem. Tambahkan mata pelajaran lebih dulu lalu import ulang.
              </p>
            )}
          </div>
        )}

        <DialogFooter className="gap-2">
          {step === "preview" && (
            <Button
              variant="outline"
              onClick={() => { setStep("upload"); setItems([]); setExcluded(new Set()); }}
              disabled={bulkMutation.isPending}
            >
              Pilih File Lain
            </Button>
          )}
          <Button variant="outline" onClick={handleClose} disabled={previewMutation.isPending || bulkMutation.isPending}>
            Batal
          </Button>
          {step === "preview" && (
            <Button onClick={handleSave} disabled={bulkMutation.isPending || matchedCount === 0}>
              {bulkMutation.isPending ? (
                <><Loader2 className="h-4 w-4 mr-1.5 animate-spin" />Menyimpan…</>
              ) : (
                `Simpan ${matchedCount} Jadwal`
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Jadwal card ───────────────────────────────────────────────────────────────
function JadwalCard({
  entry,
  onEdit,
  onDelete,
}: {
  entry: JadwalEntry;
  onEdit: (e: JadwalEntry) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <div className="group relative rounded-lg border bg-card p-3 shadow-sm hover:shadow-md transition-shadow">
      <p className="font-semibold text-sm leading-tight pr-12">{entry.subjectName}</p>
      <Badge variant="secondary" className="mt-1 text-[11px]">
        {entry.kelas}
      </Badge>
      <div className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
        <Clock className="h-3 w-3 shrink-0" />
        {entry.jamMulai} – {entry.jamSelesai}
      </div>

      {/* Action buttons — visible on hover */}
      <div className="absolute right-2 top-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={() => onEdit(entry)}
          className="rounded p-1 hover:bg-accent text-muted-foreground hover:text-foreground"
        >
          <Pencil className="h-3.5 w-3.5" />
        </button>
        <button
          onClick={() => onDelete(entry.id)}
          className="rounded p-1 hover:bg-destructive/10 text-muted-foreground hover:text-destructive"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function Jadwal() {
  const { user } = useAuth();
  const { data: jadwalList, isLoading } = useListJadwal();
  const deleteMutation = useDeleteJadwal();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editEntry, setEditEntry] = useState<JadwalEntry | undefined>();
  const [importOpen, setImportOpen] = useState(false);

  function openCreate() {
    setEditEntry(undefined);
    setDialogOpen(true);
  }

  function openEdit(entry: JadwalEntry) {
    setEditEntry(entry);
    setDialogOpen(true);
  }

  async function handleDelete(id: string) {
    if (!window.confirm("Hapus jadwal ini?")) return;
    try {
      await deleteMutation.mutateAsync({ id });
      queryClient.invalidateQueries({ queryKey: getListJadwalQueryKey() });
      toast({ title: "Jadwal dihapus" });
    } catch {
      toast({ title: "Gagal menghapus jadwal", variant: "destructive" });
    }
  }

  // Group by hari
  const byHari = HARI_LIST.reduce<Record<Hari, JadwalEntry[]>>(
    (acc, h) => ({ ...acc, [h]: [] }),
    {} as Record<Hari, JadwalEntry[]>,
  );
  for (const entry of jadwalList ?? []) {
    const h = entry.hari as Hari;
    if (byHari[h]) byHari[h].push(entry);
  }
  for (const h of HARI_LIST) {
    byHari[h].sort((a, b) => a.jamMulai.localeCompare(b.jamMulai));
  }

  const isEmpty = !isLoading && (jadwalList ?? []).length === 0;

  return (
    <Layout>
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight font-serif text-foreground">
              Jadwal Pelajaran
            </h1>
            <p className="text-muted-foreground mt-1">
              Jadwal mengajarmu per hari dalam seminggu.
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {user?.isAdmin && (
              <Button variant="outline" onClick={() => setImportOpen(true)}>
                <FileUp className="h-4 w-4 mr-1.5" />
                Import PDF
              </Button>
            )}
            <Button onClick={openCreate}>
              <Plus className="h-4 w-4 mr-1.5" />
              Tambah Jadwal
            </Button>
          </div>
        </div>

        {/* Empty state */}
        {isEmpty && (
          <div className="flex flex-col items-center justify-center py-24 text-center gap-4 text-muted-foreground">
            <CalendarClock className="h-12 w-12 opacity-30" />
            <div>
              <p className="font-medium text-foreground">Belum ada jadwal</p>
              <p className="text-sm mt-1">Tambahkan jadwal pelajaranmu untuk mulai</p>
            </div>
            <div className="flex gap-2">
              {user?.isAdmin && (
                <Button variant="outline" onClick={() => setImportOpen(true)}>
                  <FileUp className="h-4 w-4 mr-1.5" />
                  Import PDF
                </Button>
              )}
              <Button onClick={openCreate}>
                <Plus className="h-4 w-4 mr-1.5" />
                Tambah Jadwal Pertama
              </Button>
            </div>
          </div>
        )}

        {/* Timetable grid */}
        {!isEmpty && (
          <div className="overflow-x-auto pb-2">
            <div className="flex gap-3 min-w-max">
              {HARI_LIST.map((hari) => (
                <div key={hari} className="w-44 shrink-0">
                  {/* Day header */}
                  <div className="mb-2 rounded-lg bg-primary/10 px-3 py-2 text-center">
                    <p className="text-xs font-bold text-primary uppercase tracking-wide">
                      {hari}
                    </p>
                    <p className="text-[11px] text-primary/60 mt-0.5">
                      {byHari[hari].length} kelas
                    </p>
                  </div>

                  {/* Cards */}
                  <div className="space-y-2">
                    {isLoading ? (
                      <>
                        <Skeleton className="h-20 w-full rounded-lg" />
                        <Skeleton className="h-20 w-full rounded-lg" />
                      </>
                    ) : byHari[hari].length === 0 ? (
                      <div className="flex items-center justify-center rounded-lg border border-dashed border-border/60 bg-muted/30 h-16 text-xs text-muted-foreground/60">
                        Tidak ada kelas
                      </div>
                    ) : (
                      byHari[hari].map((entry) => (
                        <JadwalCard
                          key={entry.id}
                          entry={entry}
                          onEdit={openEdit}
                          onDelete={handleDelete}
                        />
                      ))
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Edit/Create Dialog */}
      <JadwalDialog
        open={dialogOpen}
        initial={{
          entry: editEntry,
          data: editEntry
            ? {
                subjectId: editEntry.subjectId,
                kelas: editEntry.kelas,
                hari: editEntry.hari,
                jamMulai: editEntry.jamMulai,
                jamSelesai: editEntry.jamSelesai,
              }
            : BLANK,
        }}
        onClose={() => setDialogOpen(false)}
      />

      {/* Import Dialog */}
      <ImportDialog open={importOpen} onClose={() => setImportOpen(false)} />
    </Layout>
  );
}
