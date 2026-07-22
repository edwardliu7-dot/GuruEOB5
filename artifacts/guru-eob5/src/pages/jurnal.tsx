import { Layout } from "@/components/layout";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import {
  Plus,
  Trash2,
  Edit2,
  AlertTriangle,
  Calendar,
  ChevronDown,
  BookOpen,
  CheckCircle2,
  Clock,
  Filter,
} from "lucide-react";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
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
  const [selectedKelas, setSelectedKelas] = useState<string>("");
  const { data: journals, isLoading } = useListJournalEntries(
    {
      subjectId: selectedSubject && selectedSubject !== "all" ? selectedSubject : undefined,
    },
    { query: { queryKey: ["/api/journal", selectedSubject] } },
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
    defaultValues: {
      subjectId: "",
      tanggal: new Date().toISOString().split("T")[0],
      kelas: "",
      materi: "",
      catatan: "",
      prosemItemId: undefined,
    },
  });

  const watchedSubjectId = form.watch("subjectId");
  const watchedKelas = form.watch("kelas");
  const watchedTanggal = form.watch("tanggal");
  const watchedProsemItemId = form.watch("prosemItemId");

  const openNew = () => {
    setEditingJournal(null);
    form.reset({
      subjectId: "",
      tanggal: new Date().toISOString().split("T")[0],
      kelas: "",
      materi: "",
      catatan: "",
      prosemItemId: undefined,
    });
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

  // Filtered journals
  const filteredJournals = useMemo(() => {
    if (!journals) return [];
    return journals.filter((j: any) => {
      const matchSubject =
        !selectedSubject || selectedSubject === "all" || j.subjectId === selectedSubject;
      const matchKelas = !selectedKelas || selectedKelas === "all" || j.kelas === selectedKelas;
      return matchSubject && matchKelas;
    });
  }, [journals, selectedSubject, selectedKelas]);

  // Stats for current week
  const today = new Date();
  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - today.getDay() + 1); // Monday

  const daysOfWeek = ["Sen", "Sel", "Rab", "Kam", "Jum"];
  const daysRecorded = useMemo(() => {
    if (!journals) return new Set<number>();
    const recorded = new Set<number>();
    for (const j of journals as any[]) {
      const d = new Date(j.tanggal);
      const dow = d.getDay(); // 1=Mon..5=Fri
      if (dow >= 1 && dow <= 5) {
        const diffDays = Math.floor((d.getTime() - startOfWeek.getTime()) / (1000 * 60 * 60 * 24));
        if (diffDays >= 0 && diffDays < 5) recorded.add(diffDays);
      }
    }
    return recorded;
  }, [journals]);

  const weekProgress = Math.round((daysRecorded.size / 5) * 100);

  // Attendance stats for table row
  const getAttendanceForEntry = (j: any) => {
    // We don't have attendance per-entry without extra queries; show hadir count from journal if stored
    return { present: null as number | null, total: null as number | null };
  };

  return (
    <Layout>
      {/* Dialog */}
      <Dialog
        open={isDialogOpen}
        onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) setEditingJournal(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingJournal ? "Edit Jurnal Mengajar" : "Tambah Jurnal Mengajar"}
            </DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="subjectId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Mata Pelajaran</FormLabel>
                    <Select
                      onValueChange={(v) => {
                        field.onChange(v);
                        form.setValue("prosemItemId", undefined);
                      }}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Pilih Mapel" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {subjects?.map((s: any) => (
                          <SelectItem key={s.id} value={s.id}>
                            {s.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="tanggal"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tanggal</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="kelas"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Kelas</FormLabel>
                      <Select
                        onValueChange={(v) => {
                          field.onChange(v);
                          form.setValue("prosemItemId", undefined);
                        }}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Pilih Kelas" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {kelasList.map((k) => (
                            <SelectItem key={k} value={k}>
                              {k}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
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
              <AttendanceContext
                subjectId={watchedSubjectId}
                kelas={watchedKelas}
                tanggal={watchedTanggal}
              />
              {!watchedProsemItemId && (
                <FormField
                  control={form.control}
                  name="materi"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Materi</FormLabel>
                      <FormControl>
                        <Input placeholder="Topik bahasan" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
              <FormField
                control={form.control}
                name="catatan"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Catatan (Opsional)</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Keterangan tambahan" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button
                  type="submit"
                  disabled={createJournal.isPending || updateJournal.isPending}
                >
                  Simpan
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Page content */}
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-end">
          <div>
            <h1 className="text-xl font-bold text-foreground">Jurnal Mengajar</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              {journals ? `${journals.length} entri` : "Memuat..."} tercatat
            </p>
          </div>
          <button
            onClick={openNew}
            className="rounded-full bg-slate-800 text-white px-4 py-2 text-sm font-medium flex items-center gap-2 hover:bg-slate-700 transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Tambah Entri
          </button>
        </div>

        <div className="flex gap-5">
          {/* Left Column */}
          <div className="flex-1 flex flex-col gap-5 min-w-0">
            {/* Progress Card & Filter Bar */}
            <div className="grid grid-cols-3 gap-5">
              {/* Progress Card */}
              <div className="bg-white dark:bg-card rounded-xl border border-slate-200 dark:border-border shadow-sm p-5 relative overflow-hidden flex flex-col justify-between">
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-blue-500"></div>
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                      <Calendar className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-[10px] uppercase tracking-wide font-bold text-slate-500 mb-0.5">
                        Progres Pekan Ini
                      </h3>
                      <p className="text-xs text-slate-600 font-medium">
                        {daysRecorded.size} dari 5 hari tercatat
                      </p>
                    </div>
                  </div>
                  <div className="text-2xl font-black text-slate-800 dark:text-foreground leading-none">
                    {weekProgress}
                    <span className="text-sm text-slate-400">%</span>
                  </div>
                </div>
                <div className="flex gap-1.5 mt-auto">
                  {daysOfWeek.map((day, idx) => (
                    <div key={day} className="flex-1 flex flex-col gap-1.5 items-center">
                      <div
                        className={`w-full h-1.5 rounded-full ${daysRecorded.has(idx) ? "bg-blue-500" : "bg-slate-100"}`}
                      ></div>
                      <span
                        className={`text-[9px] uppercase font-bold tracking-wider ${daysRecorded.has(idx) ? "text-blue-700" : "text-slate-400"}`}
                      >
                        {day}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Filter Bar */}
              <div className="col-span-2 bg-white dark:bg-card rounded-xl border border-slate-200 dark:border-border shadow-sm p-5 flex gap-4 items-end">
                <div className="flex-1">
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 block">
                    Mata Pelajaran
                  </label>
                  <div className="relative">
                    <select
                      className="w-full appearance-none bg-slate-50 dark:bg-muted border border-slate-200 dark:border-border rounded-lg pl-3 pr-8 py-2.5 text-sm text-slate-700 dark:text-foreground font-medium focus:outline-none focus:border-slate-300 focus:bg-white transition-colors cursor-pointer"
                      value={selectedSubject}
                      onChange={(e) => setSelectedSubject(e.target.value)}
                    >
                      <option value="">Semua Mata Pelajaran</option>
                      {subjects?.map((s: any) => (
                        <option key={s.id} value={s.id}>
                          {s.name}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-3 pointer-events-none" />
                  </div>
                </div>
                <div className="w-36">
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 block">
                    Kelas
                  </label>
                  <div className="relative">
                    <select
                      className="w-full appearance-none bg-slate-50 dark:bg-muted border border-slate-200 dark:border-border rounded-lg pl-3 pr-8 py-2.5 text-sm text-slate-700 dark:text-foreground font-medium focus:outline-none focus:border-slate-300 focus:bg-white transition-colors cursor-pointer"
                      value={selectedKelas}
                      onChange={(e) => setSelectedKelas(e.target.value)}
                    >
                      <option value="">Semua Kelas</option>
                      {kelasList.map((k) => (
                        <option key={k} value={k}>
                          {k}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-3 pointer-events-none" />
                  </div>
                </div>
                <button
                  className="h-10 w-10 shrink-0 rounded-lg bg-slate-50 dark:bg-muted border border-slate-200 dark:border-border text-slate-600 flex items-center justify-center hover:bg-slate-100 transition-colors mb-px"
                  onClick={() => {
                    setSelectedSubject("");
                    setSelectedKelas("");
                  }}
                  title="Reset filter"
                >
                  <Filter className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Table Card */}
            <div className="bg-white dark:bg-card rounded-xl border border-slate-200 dark:border-border shadow-sm overflow-hidden flex-1 flex flex-col">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-muted text-[11px] font-bold uppercase text-slate-500 tracking-wider">
                      <th className="p-4 border-b border-slate-200 dark:border-border font-semibold">
                        Tanggal
                      </th>
                      <th className="p-4 border-b border-slate-200 dark:border-border font-semibold">
                        Kelas
                      </th>
                      <th className="p-4 border-b border-slate-200 dark:border-border font-semibold">
                        Mata Pelajaran
                      </th>
                      <th className="p-4 border-b border-slate-200 dark:border-border font-semibold">
                        Materi/Topik
                      </th>
                      <th className="p-4 border-b border-slate-200 dark:border-border font-semibold">
                        Catatan
                      </th>
                      <th className="p-4 border-b border-slate-200 dark:border-border font-semibold text-center">
                        Aksi
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-border text-sm">
                    {isLoading ? (
                      Array(4)
                        .fill(0)
                        .map((_, i) => (
                          <tr key={i}>
                            <td colSpan={6} className="p-4">
                              <Skeleton className="h-6 w-full" />
                            </td>
                          </tr>
                        ))
                    ) : filteredJournals.length === 0 ? (
                      <tr>
                        <td
                          colSpan={6}
                          className="p-12 text-center text-slate-400 text-sm"
                        >
                          Belum ada jurnal mengajar.
                        </td>
                      </tr>
                    ) : (
                      filteredJournals.map((j: any) => (
                        <tr
                          key={j.id}
                          className="hover:bg-slate-50 dark:hover:bg-muted/50 group transition-colors"
                        >
                          <td className="p-4 align-top whitespace-nowrap">
                            <span className="font-semibold text-slate-800 dark:text-foreground">
                              {format(new Date(j.tanggal), "dd MMM", { locale: localeId })}
                            </span>
                          </td>
                          <td className="p-4 align-top whitespace-nowrap">
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-slate-100 dark:bg-muted text-slate-600 dark:text-foreground border border-slate-200/60 dark:border-border">
                              {j.kelas}
                            </span>
                          </td>
                          <td className="p-4 align-top whitespace-nowrap">
                            <span className="text-slate-600 dark:text-muted-foreground font-medium">
                              {subjects?.find((s: any) => s.id === j.subjectId)?.name ?? "-"}
                            </span>
                          </td>
                          <td className="p-4 align-top">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-slate-800 dark:text-foreground block truncate max-w-[180px]">
                                {j.materi}
                              </span>
                              {j.prosemItemId && (
                                <Badge
                                  variant="outline"
                                  className="bg-primary/5 text-primary border-primary/20 shrink-0 text-[10px]"
                                >
                                  Prosem
                                </Badge>
                              )}
                            </div>
                          </td>
                          <td className="p-4 align-top">
                            <p
                              className="text-slate-500 text-sm truncate max-w-[200px]"
                              title={j.catatan}
                            >
                              {j.catatan || "-"}
                            </p>
                          </td>
                          <td className="p-4 align-top text-center">
                            <div className="flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button
                                onClick={() => openEdit(j)}
                                className="text-slate-400 hover:text-blue-600 hover:bg-blue-50 h-8 w-8 rounded-lg flex items-center justify-center transition-colors"
                                title="Edit"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDelete(j.id)}
                                className="text-slate-400 hover:text-red-600 hover:bg-red-50 h-8 w-8 rounded-lg flex items-center justify-center transition-colors"
                                title="Hapus"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              <div className="p-4 border-t border-slate-100 dark:border-border bg-slate-50 dark:bg-muted mt-auto flex items-center justify-between text-xs text-slate-500">
                <span>
                  Menampilkan {filteredJournals.length} entri
                  {journals && filteredJournals.length !== journals.length
                    ? ` dari ${journals.length}`
                    : ""}
                </span>
              </div>
            </div>
          </div>

          {/* Right Sidebar — Prosem snippet */}
          <ProsemSidebar />
        </div>
      </div>
    </Layout>
  );
}

function ProsemSidebar() {
  const { data: subjects } = useListSubjects();
  // We show the first available prosem items as a quick view
  const firstSubject = subjects?.[0];
  const { data: prosemList } = useListProsem(
    { subjectId: firstSubject?.id },
    { query: { enabled: !!firstSubject?.id, queryKey: ["/api/prosem", "sidebar", firstSubject?.id] } },
  );
  const firstProsem = prosemList?.[0];
  const { data: items } = useListProsemItems(
    { prosemId: firstProsem?.id },
    { query: { enabled: !!firstProsem?.id, queryKey: ["/api/prosem-items", "sidebar", firstProsem?.id] } },
  );

  const displayItems = (items ?? []).slice(0, 4);

  return (
    <div className="w-72 bg-white dark:bg-card rounded-xl border border-slate-200 dark:border-border shadow-sm p-5 h-fit sticky top-6 shrink-0">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center shrink-0">
          <BookOpen className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-base font-bold text-slate-800 dark:text-foreground leading-tight">
            Rencana Prosem
          </h2>
          <p className="text-xs text-slate-500 mt-0.5 font-medium">
            {firstProsem ? `${firstSubject?.name}` : "Program Semester"}
          </p>
        </div>
      </div>

      <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-3">
        Topik Terjadwal
      </div>

      {displayItems.length === 0 ? (
        <p className="text-sm text-slate-400 text-center py-4">
          Belum ada topik di Prosem.
        </p>
      ) : (
        <div className="flex flex-col gap-3">
          {displayItems.map((item: any) => (
            <div
              key={item.id}
              className="p-3 rounded-xl border border-slate-100 dark:border-border bg-slate-50/50 dark:bg-muted flex flex-col gap-2.5 hover:border-slate-200 transition-colors cursor-default"
            >
              <div className="flex justify-between items-start gap-2">
                <span className="inline-flex px-2 py-0.5 rounded text-[10px] font-bold bg-white dark:bg-background border border-slate-200 dark:border-border text-slate-600 dark:text-foreground uppercase tracking-wide">
                  LM {item.lingkupMateri}
                </span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-700">
                  <Clock className="w-3 h-3" />
                  Rencana
                </span>
              </div>
              <p className="text-sm font-semibold text-slate-800 dark:text-foreground leading-snug">
                {item.materi}
              </p>
            </div>
          ))}
        </div>
      )}

      <div className="mt-6 pt-5 border-t border-slate-100 dark:border-border">
        <Link href="/prosem">
          <button className="w-full py-2.5 rounded-lg border border-dashed border-slate-300 dark:border-border text-slate-500 text-sm font-semibold hover:border-slate-400 hover:text-slate-700 transition-colors flex items-center justify-center gap-2">
            Lihat Prosem Lengkap
          </button>
        </Link>
      </div>
    </div>
  );
}
