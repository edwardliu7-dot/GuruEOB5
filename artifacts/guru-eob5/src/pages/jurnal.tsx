import { Layout } from "@/components/layout";
import { FadeIn, StaggerContainer, StaggerItem } from "@/components/motion";
import {
  useListJournalEntries,
  useCreateJournalEntry,
  useUpdateJournalEntry,
  useDeleteJournalEntry,
  useListSubjects,
  useListStudents,
  useListAttendance,
  useListProsem,
  useListProsemItems,
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
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2, Pencil, AlertTriangle } from "lucide-react";
import { format } from "date-fns";
import { useQueryClient } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";

const journalSchema = z.object({
  subjectId: z.string().min(1, "Mata pelajaran harus dipilih"),
  tanggal: z.string().min(1, "Tanggal harus diisi"),
  kelas: z.string().min(1, "Kelas harus dipilih"),
  materi: z.string().optional(),
  catatan: z.string().optional(),
  prosemItemId: z.string().optional(),
});

const MANUAL_TOPIC_VALUE = "__manual__";

const statusColors: Record<string, string> = {
  hadir: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
  izin: "bg-blue-500/10 text-blue-600 border-blue-500/20",
  sakit: "bg-amber-500/10 text-amber-600 border-amber-500/20",
  alpa: "bg-rose-500/10 text-rose-600 border-rose-500/20",
};

const statusLabels: Record<string, string> = {
  hadir: "Hadir",
  izin: "Izin",
  sakit: "Sakit",
  alpa: "Alpa",
};

/** Shows a reminder if attendance hasn't been filled yet, and a summary once it has. */
function AttendanceContext({
  subjectId,
  kelas,
  tanggal,
}: {
  subjectId: string;
  kelas: string;
  tanggal: string;
}) {
  const ready = !!subjectId && !!kelas && !!tanggal;
  const { data: attendance, isLoading } = useListAttendance(
    { subjectId: subjectId || undefined, kelas: kelas || undefined, date: tanggal || undefined },
    {
      query: {
        queryKey: ["/api/attendance", "context", subjectId, kelas, tanggal],
        enabled: ready,
      },
    },
  );

  if (!ready) return null;
  if (isLoading) return <Skeleton className="h-16 w-full" />;

  if (!attendance?.length) {
    return (
      <div className="flex items-start gap-2 rounded-md border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-800">
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
        <div>
          <p className="font-medium">Absensi belum diisi untuk kelas & tanggal ini.</p>
          <p className="text-amber-700">
            Sebaiknya isi kehadiran siswa terlebih dahulu.{" "}
            <Link href="/absensi" className="underline underline-offset-2">
              Buka Absensi
            </Link>
          </p>
        </div>
      </div>
    );
  }

  const counts: Record<string, number> = { hadir: 0, izin: 0, sakit: 0, alpa: 0 };
  for (const a of attendance) counts[a.status] = (counts[a.status] ?? 0) + 1;

  return (
    <div className="rounded-md border bg-muted/40 p-3 text-sm">
      <p className="mb-2 font-medium text-muted-foreground">
        Absensi tercatat ({attendance.length} siswa):
      </p>
      <div className="flex flex-wrap gap-2">
        {Object.entries(counts)
          .filter(([, n]) => n > 0)
          .map(([status, n]) => (
            <Badge key={status} variant="outline" className={`${statusColors[status]} capitalize`}>
              {statusLabels[status]}: {n}
            </Badge>
          ))}
      </div>
    </div>
  );
}

/**
 * Lets the teacher pick a topic straight from their Prosem (semester plan) for
 * the selected mapel + kelas, instead of retyping "materi" free-form. Picking
 * a topic fills `materi` and links the entry via `prosemItemId` so Info
 * Pekanan can match it exactly instead of guessing by subject+kelas alone.
 */
function ProsemTopicPicker({
  subjectId,
  kelas,
  value,
  onPick,
}: {
  subjectId: string;
  kelas: string;
  value: string | undefined;
  onPick: (prosemItemId: string | undefined, materi?: string) => void;
}) {
  const ready = !!subjectId && !!kelas;

  const { data: prosemList } = useListProsem(
    { subjectId: subjectId || undefined },
    {
      query: {
        queryKey: ["/api/prosem", "picker", subjectId],
        enabled: ready,
      },
    },
  );
  const prosem = prosemList?.find((p: any) => p.kelas === kelas);

  const { data: items } = useListProsemItems(
    { prosemId: prosem?.id || undefined },
    { query: { queryKey: ["/api/prosem-items", "picker", prosem?.id], enabled: !!prosem?.id } },
  );

  if (!ready) return null;
  if (!prosem || !items?.length) {
    return (
      <p className="text-xs text-muted-foreground">
        Belum ada Prosem untuk mapel & kelas ini. Materi akan dicatat manual.
      </p>
    );
  }

  return (
    <div>
      <label className="text-sm font-medium leading-none">Topik dari Prosem (Opsional)</label>
      {/* Native select used intentionally — Radix Select portal conflicts with Dialog modal */}
      <select
        className="mt-1 flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm ring-offset-background focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
        value={value ?? MANUAL_TOPIC_VALUE}
        onChange={(e) => {
          const v = e.target.value;
          if (v === MANUAL_TOPIC_VALUE) {
            onPick(undefined);
            return;
          }
          const item = items.find((it: any) => it.id === v);
          onPick(v, item?.materi);
        }}
      >
        <option value={MANUAL_TOPIC_VALUE}>Materi manual (tidak ada di Prosem)</option>
        {items.map((it: any) => (
          <option key={it.id} value={it.id}>
            {it.kd ? `${it.kd} — ` : ""}
            {it.materi}
          </option>
        ))}
      </select>
      <p className="text-xs text-muted-foreground mt-1">
        Memilih topik akan menandai realisasi materi ini pada Info Pekanan.
      </p>
    </div>
  );
}

export default function Jurnal() {
  const { data: subjects } = useListSubjects();
  const { data: students } = useListStudents();
  const [selectedSubject, setSelectedSubject] = useState<string>("");
  const { data: journals, isLoading } = useListJournalEntries(
    { subjectId: selectedSubject && selectedSubject !== "all" ? selectedSubject : undefined },
    { query: { queryKey: ["/api/journal", selectedSubject] } }
  );

  const kelasList = useMemo(
    () => [...new Set((students ?? []).map((s: any) => s.kelas))].sort(),
    [students],
  );

  const createJournal = useCreateJournalEntry();
  const updateJournal = useUpdateJournalEntry();
  const deleteJournal = useDeleteJournalEntry();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingJournal, setEditingJournal] = useState<string | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<z.infer<typeof journalSchema>>({
    resolver: zodResolver(journalSchema),
    defaultValues: { subjectId: "", tanggal: new Date().toISOString().split("T")[0], kelas: "", materi: "", catatan: "", prosemItemId: undefined },
  });

  const watchedSubjectId = form.watch("subjectId");
  const watchedKelas = form.watch("kelas");
  const watchedTanggal = form.watch("tanggal");
  const watchedProsemItemId = form.watch("prosemItemId");

  const openNew = () => {
    setEditingJournal(null);
    form.reset({ subjectId: "", tanggal: new Date().toISOString().split("T")[0], kelas: "", materi: "", catatan: "", prosemItemId: undefined });
    setIsDialogOpen(true);
  };

  const openEdit = (j: any) => {
    setEditingJournal(j.id);
    form.reset({
      subjectId: j.subjectId,
      tanggal: j.tanggal,
      kelas: j.kelas,
      materi: j.materi,
      catatan: j.catatan ?? "",
      prosemItemId: j.prosemItemId ?? undefined,
    });
    setIsDialogOpen(true);
  };

  const onSubmit = async (data: z.infer<typeof journalSchema>) => {
    try {
      const payload = { ...data, materi: data.materi ?? "" };
      if (editingJournal) {
        await updateJournal.mutateAsync({ id: editingJournal, data: payload });
        toast({ title: "Berhasil", description: "Jurnal diperbarui" });
      } else {
        await createJournal.mutateAsync({ data: payload });
        toast({ title: "Berhasil", description: "Jurnal ditambahkan" });
      }
      setIsDialogOpen(false);
      form.reset();
      setEditingJournal(null);
      queryClient.invalidateQueries({ queryKey: ["/api/journal"] });
    } catch {
      toast({ variant: "destructive", title: "Gagal", description: "Terjadi kesalahan" });
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("Hapus jurnal ini?")) {
      try {
        await deleteJournal.mutateAsync({ id });
        queryClient.invalidateQueries({ queryKey: ["/api/journal"] });
        toast({ title: "Berhasil", description: "Jurnal dihapus" });
      } catch {
        toast({ variant: "destructive", title: "Gagal", description: "Terjadi kesalahan" });
      }
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        <FadeIn className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold font-serif">Jurnal Mengajar</h1>
            <p className="text-muted-foreground mt-1">Catatan harian pelaksanaan pembelajaran.</p>
          </div>
          <Dialog
            open={isDialogOpen}
            onOpenChange={(open) => {
              setIsDialogOpen(open);
              if (!open) setEditingJournal(null);
            }}
          >
            <DialogTrigger asChild>
              <Button onClick={openNew}><Plus className="w-4 h-4 mr-2" /> Tambah Jurnal</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>{editingJournal ? "Edit Jurnal Mengajar" : "Tambah Jurnal Mengajar"}</DialogTitle></DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField control={form.control} name="subjectId" render={({ field }) => (
                    <FormItem><FormLabel>Mata Pelajaran</FormLabel>
                      <Select onValueChange={(v) => { field.onChange(v); form.setValue("prosemItemId", undefined); }} value={field.value}>
                        <FormControl><SelectTrigger><SelectValue placeholder="Pilih Mapel" /></SelectTrigger></FormControl>
                        <SelectContent>{subjects?.map((s:any) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
                      </Select><FormMessage />
                    </FormItem>
                  )} />
                  <div className="grid grid-cols-2 gap-4">
                    <FormField control={form.control} name="tanggal" render={({ field }) => (
                      <FormItem><FormLabel>Tanggal</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={form.control} name="kelas" render={({ field }) => (
                      <FormItem><FormLabel>Kelas</FormLabel>
                        <Select onValueChange={(v) => { field.onChange(v); form.setValue("prosemItemId", undefined); }} value={field.value}>
                          <FormControl><SelectTrigger><SelectValue placeholder="Pilih Kelas" /></SelectTrigger></FormControl>
                          <SelectContent>{kelasList.map((k) => <SelectItem key={k} value={k}>{k}</SelectItem>)}</SelectContent>
                        </Select><FormMessage />
                      </FormItem>
                    )} />
                  </div>
                  <ProsemTopicPicker
                    subjectId={watchedSubjectId}
                    kelas={watchedKelas}
                    value={watchedProsemItemId}
                    onPick={(prosemItemId, materi) => {
                      form.setValue("prosemItemId", prosemItemId);
                      if (materi !== undefined) form.setValue("materi", materi);
                    }}
                  />
                  <AttendanceContext subjectId={watchedSubjectId} kelas={watchedKelas} tanggal={watchedTanggal} />
                  {!watchedProsemItemId && (
                    <FormField control={form.control} name="materi" render={({ field }) => (
                      <FormItem><FormLabel>Materi</FormLabel><FormControl><Input placeholder="Topik bahasan" {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                  )}
                  <FormField control={form.control} name="catatan" render={({ field }) => (
                    <FormItem><FormLabel>Catatan (Opsional)</FormLabel><FormControl><Textarea placeholder="Keterangan tambahan" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <DialogFooter><Button type="submit" disabled={createJournal.isPending || updateJournal.isPending}>Simpan</Button></DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </FadeIn>

        <FadeIn delay={0.08} className="bg-card border border-border rounded-xl shadow-sm overflow-hidden flex flex-col">
          <div className="p-4 border-b border-border bg-muted/40 flex gap-4">
             <Select value={selectedSubject} onValueChange={setSelectedSubject}>
              <SelectTrigger className="w-[250px] bg-card"><SelectValue placeholder="Semua Mata Pelajaran" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Mata Pelajaran</SelectItem>
                {subjects?.map((s:any) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40">
                <TableHead>Tanggal</TableHead>
                <TableHead>Mata Pelajaran</TableHead>
                <TableHead>Kelas</TableHead>
                <TableHead>Materi</TableHead>
                <TableHead>Catatan</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array(3).fill(0).map((_, i) => <TableRow key={i}><TableCell colSpan={6}><Skeleton className="h-6 w-full" /></TableCell></TableRow>)
              ) : !journals?.length ? (
                <TableRow><TableCell colSpan={6} className="h-24 text-center text-muted-foreground">Belum ada jurnal.</TableCell></TableRow>
              ) : (
                journals.map((j:any, idx:number) => (
                  <TableRow key={j.id} style={{ animationDelay: `${idx * 40}ms` }} className="animate-in fade-in slide-in-from-bottom-1 duration-300 fill-mode-both">
                    <TableCell>{format(new Date(j.tanggal), "dd MMM yyyy")}</TableCell>
                    <TableCell>{subjects?.find((s:any) => s.id === j.subjectId)?.name}</TableCell>
                    <TableCell>{j.kelas}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span>{j.materi}</span>
                        {j.prosemItemId && (
                          <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 shrink-0">
                            Prosem
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground max-w-[200px] truncate">{j.catatan || "-"}</TableCell>
                    <TableCell className="text-right space-x-1">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(j)}><Pencil className="w-4 h-4" /></Button>
                      <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleDelete(j.id)}><Trash2 className="w-4 h-4" /></Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </FadeIn>
      </div>
    </Layout>
  );
}
