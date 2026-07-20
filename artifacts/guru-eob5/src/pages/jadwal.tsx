import { useState } from "react";
import { Layout } from "@/components/layout";
import {
  useListJadwal,
  useCreateJadwal,
  useUpdateJadwal,
  useDeleteJadwal,
  useListSubjects,
  getListJadwalQueryKey,
} from "@workspace/api-client-react";
import type { JadwalEntry, JadwalInput, JadwalInputHari } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  CalendarClock,
  Clock,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";
import { KELAS_OPTIONS } from "@/lib/options";

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
  const [lastId, setLastId] = useState(initial.entry?.id ?? "");
  if (initial.entry?.id !== lastId) {
    setLastId(initial.entry?.id ?? "");
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
  const { data: jadwalList, isLoading } = useListJadwal();
  const deleteMutation = useDeleteJadwal();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editEntry, setEditEntry] = useState<JadwalEntry | undefined>();

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
          <Button onClick={openCreate} className="shrink-0">
            <Plus className="h-4 w-4 mr-1.5" />
            Tambah Jadwal
          </Button>
        </div>

        {/* Empty state */}
        {isEmpty && (
          <div className="flex flex-col items-center justify-center py-24 text-center gap-4 text-muted-foreground">
            <CalendarClock className="h-12 w-12 opacity-30" />
            <div>
              <p className="font-medium text-foreground">Belum ada jadwal</p>
              <p className="text-sm mt-1">Tambahkan jadwal pelajaranmu untuk mulai</p>
            </div>
            <Button onClick={openCreate}>
              <Plus className="h-4 w-4 mr-1.5" />
              Tambah Jadwal Pertama
            </Button>
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

      {/* Dialog */}
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
    </Layout>
  );
}
