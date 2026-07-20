import { Layout } from "@/components/layout";
import {
  useListAcademicCalendars,
  useListAcademicWeeks,
  useListSubjects,
  useListProsem,
  useCreateProsem,
  useDeleteProsem,
  useListProsemItems,
  useCreateProsemItem,
  useUpdateProsemItem,
  useDeleteProsemItem,
  useListTujuanPembelajaran,
  useGetMe,
} from "@workspace/api-client-react";
import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import * as XLSX from "xlsx";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2, Pencil, ChevronLeft, Download, Sparkles, Loader2, X } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";

const prosemSchema = z.object({
  subjectId: z.string().min(1, "Mata pelajaran harus dipilih"),
  kelas: z.string().min(1, "Kelas harus diisi"),
});

const itemSchema = z.object({
  weekId: z.string().min(1, "Pekan harus dipilih"),
  kd: z.string().optional(),
  materi: z.string().optional(),
  jp: z.string().optional(),
  catatan: z.string().optional(),
});

// ---- Types for AI import verify ----
interface VerifyItem {
  id: string; // ephemeral key
  weekId: string;
  bab: string;
  materi: string;
  jp: string;
  catatan: string;
}

export default function Prosem() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: calendars, isLoading: calLoading } = useListAcademicCalendars();
  const { data: subjects } = useListSubjects();
  const { data: me } = useGetMe();
  const FALLBACK_KELAS = ["VII Ibnu Battutah", "VIII Ibnu Sina", "IX Al Khawarizmi"];
  const kelasOptions: string[] =
    (me as any)?.kelasDiampu?.length ? (me as any).kelasDiampu : FALLBACK_KELAS;
  const [selectedCalendar, setSelectedCalendar] = useState<string>("");

  useEffect(() => {
    if (!selectedCalendar && calendars?.length) {
      setSelectedCalendar(calendars[0].id);
    }
  }, [calendars, selectedCalendar]);

  const { data: prosemList, isLoading: prosemLoading } = useListProsem(
    { calendarId: selectedCalendar || undefined },
    { query: { queryKey: ["/api/prosem", selectedCalendar], enabled: !!selectedCalendar } },
  );

  const createProsem = useCreateProsem();
  const deleteProsem = useDeleteProsem();
  const [prosemDialogOpen, setProsemDialogOpen] = useState(false);
  const [openProsemId, setOpenProsemId] = useState<string | null>(null);

  const prosemForm = useForm<z.infer<typeof prosemSchema>>({
    resolver: zodResolver(prosemSchema),
    defaultValues: { subjectId: "", kelas: "" },
  });

  const { data: weeks } = useListAcademicWeeks(
    { calendarId: selectedCalendar || undefined },
    { query: { queryKey: ["/api/academic-weeks", selectedCalendar], enabled: !!selectedCalendar } },
  );

  const { data: items, isLoading: itemsLoading } = useListProsemItems(
    { prosemId: openProsemId || undefined },
    { query: { queryKey: ["/api/prosem-items", openProsemId], enabled: !!openProsemId } },
  );

  const createItem = useCreateProsemItem();
  const updateItem = useUpdateProsemItem();
  const deleteItem = useDeleteProsemItem();
  const [itemDialogOpen, setItemDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<string | null>(null);

  const itemForm = useForm<z.infer<typeof itemSchema>>({
    resolver: zodResolver(itemSchema),
    defaultValues: { weekId: "", kd: "", materi: "", jp: "", catatan: "" },
  });

  // ---- AI import state ----
  const importFileRef = useRef<HTMLInputElement>(null);
  const [importSheets, setImportSheets] = useState<
    { name: string; rows: string[][] }[]
  >([]);
  const [sheetPickerOpen, setSheetPickerOpen] = useState(false);
  const [importLoading, setImportLoading] = useState(false);
  const [verifyItems, setVerifyItems] = useState<VerifyItem[]>([]);
  const [verifyOpen, setVerifyOpen] = useState(false);
  const [bulkLoading, setBulkLoading] = useState(false);

  const subjectName = (id: string) => subjects?.find((s: any) => s.id === id)?.name ?? "-";
  const weekLabel = (id: string) => {
    const w = weeks?.find((x: any) => x.id === id);
    return w ? `Pekan ${w.pekanKe}` : "-";
  };

  const onCreateProsem = async (data: z.infer<typeof prosemSchema>) => {
    try {
      await createProsem.mutateAsync({ data: { ...data, calendarId: selectedCalendar } });
      toast({ title: "Berhasil", description: "Prosem dibuat" });
      setProsemDialogOpen(false);
      prosemForm.reset();
      queryClient.invalidateQueries({ queryKey: ["/api/prosem", selectedCalendar] });
    } catch {
      toast({ variant: "destructive", title: "Gagal", description: "Terjadi kesalahan" });
    }
  };

  const handleDeleteProsem = async (id: string) => {
    if (!confirm("Hapus prosem ini beserta semua materinya?")) return;
    try {
      await deleteProsem.mutateAsync({ id });
      queryClient.invalidateQueries({ queryKey: ["/api/prosem", selectedCalendar] });
      toast({ title: "Berhasil", description: "Prosem dihapus" });
    } catch {
      toast({ variant: "destructive", title: "Gagal", description: "Terjadi kesalahan" });
    }
  };

  const invalidateItems = () =>
    queryClient.invalidateQueries({ queryKey: ["/api/prosem-items", openProsemId] });

  const openNewItem = () => {
    setEditingItem(null);
    itemForm.reset({ weekId: "", kd: "", materi: "", jp: "", catatan: "" });
    setItemDialogOpen(true);
  };

  const openEditItem = (it: any) => {
    setEditingItem(it.id);
    itemForm.reset({
      weekId: it.weekId,
      kd: it.kd ?? "",
      materi: it.materi,
      jp: it.jp != null ? String(it.jp) : "",
      catatan: it.catatan ?? "",
    });
    setItemDialogOpen(true);
  };

  const onSubmitItem = async (data: z.infer<typeof itemSchema>) => {
    if (!openProsemId) return;
    try {
      const resolvedMateri =
        data.materi?.trim() ||
        (data.kd
          ? tpList?.find((t: any) => `TP ${t.tpNumber}` === data.kd)?.description ?? data.kd
          : "");
      const payload = {
        prosemId: openProsemId,
        weekId: data.weekId,
        kd: data.kd || undefined,
        materi: resolvedMateri,
        jp: data.jp ? Number(data.jp) : undefined,
        catatan: data.catatan || undefined,
      };
      if (editingItem) {
        await updateItem.mutateAsync({ id: editingItem, data: payload });
        toast({ title: "Berhasil", description: "Materi diperbarui" });
      } else {
        await createItem.mutateAsync({ data: payload });
        toast({ title: "Berhasil", description: "Materi ditambahkan" });
      }
      setItemDialogOpen(false);
      invalidateItems();
    } catch {
      toast({ variant: "destructive", title: "Gagal", description: "Terjadi kesalahan" });
    }
  };

  const handleDeleteItem = async (id: string) => {
    if (!confirm("Hapus materi ini?")) return;
    try {
      await deleteItem.mutateAsync({ id });
      invalidateItems();
      toast({ title: "Berhasil", description: "Materi dihapus" });
    } catch {
      toast({ variant: "destructive", title: "Gagal", description: "Terjadi kesalahan" });
    }
  };

  const openProsem = prosemList?.find((p: any) => p.id === openProsemId);

  const { data: tpList } = useListTujuanPembelajaran(
    { subjectId: openProsem?.subjectId || undefined, calendarId: selectedCalendar || undefined },
    {
      query: {
        queryKey: ["/api/tp", openProsem?.subjectId, selectedCalendar],
        enabled: !!openProsem?.subjectId && !!selectedCalendar,
      },
    },
  );

  // ---- Download Template ----
  const handleDownloadTemplate = () => {
    const months = ["Juli", "Agustus", "September", "Oktober", "November", "Desember"];
    const headerRow1 = ["No", "Bab", "Materi"];
    const headerRow2: (string | null)[] = [null, null, null];
    months.forEach((m) => {
      headerRow1.push(m, null as any, null as any, null as any);
      headerRow2.push(1 as any, 2 as any, 3 as any, 4 as any);
    });

    const aoa: (string | number | null)[][] = [
      ["PROGRAM SEMESTER _ KELAS _"],
      ["T.A ____-____"],
      ["NAMA SEKOLAH"],
      ["MAPEL : "],
      headerRow1,
      headerRow2,
      [1, "BAB I ...", "Topik 1"],
      [null, null, "Topik 2"],
      [2, "BAB II ...", "Topik 3"],
      [null, null, "Topik 4"],
    ];

    const ws = XLSX.utils.aoa_to_sheet(aoa);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Prosem");
    XLSX.writeFile(wb, "Format_Prosem.xlsx");
  };

  // ---- Handle file pick for AI import ----
  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    // reset input so same file can be re-picked
    e.target.value = "";

    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const buffer = ev.target?.result as ArrayBuffer;
        const workbook = XLSX.read(buffer, { type: "array" });
        const parsed: { name: string; rows: string[][] }[] = workbook.SheetNames.map((name) => {
          const ws = workbook.Sheets[name];
          if (!ws) return { name, rows: [] };
          const raw = XLSX.utils.sheet_to_json<unknown[]>(ws, {
            header: 1,
            raw: false,
            defval: "",
          });
          return {
            name,
            rows: raw.map((row) => (row as unknown[]).map((c) => String(c ?? "").trim())),
          };
        });

        if (parsed.length === 0) {
          toast({ variant: "destructive", title: "File kosong", description: "Tidak ada sheet di file ini." });
          return;
        }
        if (parsed.length === 1) {
          // Single sheet → go straight to AI
          runImportAI(parsed[0].rows);
        } else {
          // Multiple sheets → ask user to pick
          setImportSheets(parsed);
          setSheetPickerOpen(true);
        }
      } catch {
        toast({ variant: "destructive", title: "Gagal membaca file", description: "Pastikan file berformat .xlsx atau .xls yang valid." });
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const runImportAI = async (rows: string[][]) => {
    if (!openProsemId || !weeks?.length) return;
    setImportLoading(true);
    try {
      const res = await fetch("/api/prosem/import-ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          rows,
          weeks: weeks.map((w: any) => ({ id: w.id, pekanKe: w.pekanKe })),
          prosemId: openProsemId,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error((err as any).error ?? "Gagal menganalisis file");
      }
      const { items: aiItems } = (await res.json()) as {
        items: { pekanKe: number; bab: string; materi: string; jp?: number }[];
      };

      if (!aiItems?.length) {
        toast({ variant: "destructive", title: "Tidak ada data", description: "AI tidak menemukan materi dalam file ini." });
        return;
      }

      // Map pekanKe → weekId
      const weekByPekan = new Map((weeks as any[]).map((w) => [w.pekanKe, w.id]));

      const mapped: VerifyItem[] = aiItems
        .map((item, idx) => ({
          id: String(idx),
          weekId: weekByPekan.get(item.pekanKe) ?? (weeks as any[])[0]?.id ?? "",
          bab: item.bab ?? "",
          materi: item.materi ?? "",
          jp: item.jp != null ? String(item.jp) : "",
          catatan: item.bab ? `${item.bab}` : "",
        }))
        .filter((it) => it.materi.trim() !== "");

      setVerifyItems(mapped);
      setVerifyOpen(true);
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Gagal impor AI",
        description: err instanceof Error ? err.message : "Terjadi kesalahan",
      });
    } finally {
      setImportLoading(false);
    }
  };

  const handleBulkSave = async () => {
    if (!openProsemId) return;
    const validItems = verifyItems.filter((it) => it.weekId && it.materi.trim());
    if (!validItems.length) {
      toast({ variant: "destructive", title: "Tidak ada materi valid" });
      return;
    }
    setBulkLoading(true);
    try {
      const res = await fetch("/api/prosem-items/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          prosemId: openProsemId,
          items: validItems.map((it) => ({
            weekId: it.weekId,
            materi: it.materi,
            jp: it.jp ? Number(it.jp) : undefined,
            catatan: it.catatan || undefined,
          })),
        }),
      });
      if (!res.ok) throw new Error("Gagal menyimpan");
      const { inserted } = (await res.json()) as { inserted: number };
      toast({ title: "Berhasil", description: `${inserted} materi berhasil diimpor.` });
      setVerifyOpen(false);
      setVerifyItems([]);
      invalidateItems();
    } catch {
      toast({ variant: "destructive", title: "Gagal menyimpan", description: "Terjadi kesalahan saat menyimpan." });
    } finally {
      setBulkLoading(false);
    }
  };

  const updateVerifyItem = (id: string, field: keyof VerifyItem, value: string) => {
    setVerifyItems((prev) => prev.map((it) => (it.id === id ? { ...it, [field]: value } : it)));
  };

  const removeVerifyItem = (id: string) => {
    setVerifyItems((prev) => prev.filter((it) => it.id !== id));
  };

  const noCalendar = !calLoading && !calendars?.length;

  return (
    <Layout>
      <div className="space-y-6 animate-in fade-in duration-500">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold font-serif">Program Semester</h1>
            <p className="text-muted-foreground mt-1">
              Rencana materi tiap pekan sebagai dasar Info Pekanan.
            </p>
          </div>
          {!openProsemId && selectedCalendar && (
            <Dialog open={prosemDialogOpen} onOpenChange={setProsemDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" /> Prosem Baru
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Buat Program Semester</DialogTitle>
                </DialogHeader>
                <Form {...prosemForm}>
                  <form onSubmit={prosemForm.handleSubmit(onCreateProsem)} className="space-y-4">
                    <FormField
                      control={prosemForm.control}
                      name="subjectId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Mata Pelajaran</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
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
                    <FormField
                      control={prosemForm.control}
                      name="kelas"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Kelas</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Pilih Kelas" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {kelasOptions.map((k) => (
                                <SelectItem key={k} value={k}>{k}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <DialogFooter>
                      <Button type="submit" disabled={createProsem.isPending}>
                        Simpan
                      </Button>
                    </DialogFooter>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          )}
        </div>

        {noCalendar ? (
          <div className="bg-white border border-border rounded-xl shadow-sm h-32 flex items-center justify-center text-muted-foreground">
            Belum ada kalender akademik. Minta admin membuat kalender terlebih dahulu.
          </div>
        ) : !openProsemId ? (
          <div className="bg-white border border-border rounded-xl shadow-sm overflow-hidden">
            <div className="p-4 border-b border-border bg-gray-50/50">
              {calLoading ? (
                <Skeleton className="h-9 w-[280px]" />
              ) : (
                <Select value={selectedCalendar} onValueChange={setSelectedCalendar}>
                  <SelectTrigger className="w-[280px] bg-white">
                    <SelectValue placeholder="Pilih Kalender" />
                  </SelectTrigger>
                  <SelectContent>
                    {calendars?.map((c: any) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.tahunAjaran} — {c.semester}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50/50">
                    <TableHead>Mata Pelajaran</TableHead>
                    <TableHead>Kelas</TableHead>
                    <TableHead className="text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {prosemLoading ? (
                    Array(3)
                      .fill(0)
                      .map((_, i) => (
                        <TableRow key={i}>
                          <TableCell colSpan={3}>
                            <Skeleton className="h-6 w-full" />
                          </TableCell>
                        </TableRow>
                      ))
                  ) : !prosemList?.length ? (
                    <TableRow>
                      <TableCell colSpan={3} className="h-24 text-center text-muted-foreground">
                        Belum ada prosem. Buat prosem baru.
                      </TableCell>
                    </TableRow>
                  ) : (
                    prosemList.map((p: any) => (
                      <TableRow
                        key={p.id}
                        className="cursor-pointer"
                        onClick={() => setOpenProsemId(p.id)}
                      >
                        <TableCell className="font-medium">{subjectName(p.subjectId)}</TableCell>
                        <TableCell>{p.kelas}</TableCell>
                        <TableCell
                          className="text-right"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Button variant="outline" size="sm" onClick={() => setOpenProsemId(p.id)}>
                            Kelola Materi
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive ml-1"
                            onClick={() => handleDeleteProsem(p.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        ) : (
          <div className="bg-white border border-border rounded-xl shadow-sm overflow-hidden">
            <div className="p-4 border-b border-border bg-gray-50/50 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Button variant="ghost" size="icon" onClick={() => setOpenProsemId(null)}>
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <div>
                  <p className="font-medium">
                    {openProsem ? subjectName(openProsem.subjectId) : ""}{" "}
                    {openProsem ? `· ${openProsem.kelas}` : ""}
                  </p>
                  <p className="text-xs text-muted-foreground">Materi per pekan</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {/* Download Template */}
                <Button variant="ghost" size="sm" onClick={handleDownloadTemplate} title="Download format Excel">
                  <Download className="w-4 h-4 mr-1.5" /> Format
                </Button>

                {/* Impor AI */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => importFileRef.current?.click()}
                  disabled={importLoading || !weeks?.length}
                >
                  {importLoading ? (
                    <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
                  ) : (
                    <Sparkles className="w-4 h-4 mr-1.5" />
                  )}
                  {importLoading ? "Menganalisis…" : "Impor AI"}
                </Button>
                <input
                  ref={importFileRef}
                  type="file"
                  accept=".xlsx,.xls,.ods,.csv"
                  className="hidden"
                  onChange={handleImportFile}
                />

                {/* Tambah Manual */}
                <Button variant="outline" onClick={openNewItem} disabled={!weeks?.length}>
                  <Plus className="w-4 h-4 mr-2" /> Tambah Materi
                </Button>
              </div>
            </div>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50/50">
                    <TableHead className="w-24">Pekan</TableHead>
                    <TableHead>CP</TableHead>
                    <TableHead>Materi</TableHead>
                    <TableHead className="w-16">JP</TableHead>
                    <TableHead>Catatan</TableHead>
                    <TableHead className="text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {!weeks?.length ? (
                    <TableRow>
                      <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                        Kalender ini belum punya pekan. Minta admin menambah pekan.
                      </TableCell>
                    </TableRow>
                  ) : itemsLoading ? (
                    Array(3)
                      .fill(0)
                      .map((_, i) => (
                        <TableRow key={i}>
                          <TableCell colSpan={6}>
                            <Skeleton className="h-6 w-full" />
                          </TableCell>
                        </TableRow>
                      ))
                  ) : !items?.length ? (
                    <TableRow>
                      <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                        Belum ada materi. Tambah manual atau gunakan Impor AI.
                      </TableCell>
                    </TableRow>
                  ) : (
                    items.map((it: any) => (
                      <TableRow key={it.id}>
                        <TableCell className="font-medium">{weekLabel(it.weekId)}</TableCell>
                        <TableCell>{it.kd || "-"}</TableCell>
                        <TableCell>{it.materi}</TableCell>
                        <TableCell>{it.jp ?? "-"}</TableCell>
                        <TableCell className="text-muted-foreground max-w-[200px] truncate">
                          {it.catatan || "-"}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="icon" onClick={() => openEditItem(it)}>
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive"
                            onClick={() => handleDeleteItem(it.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        )}
      </div>

      {/* ---- Dialog: Tambah/Edit Materi Manual ---- */}
      <Dialog open={itemDialogOpen} onOpenChange={setItemDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingItem ? "Edit Materi" : "Tambah Materi"}</DialogTitle>
          </DialogHeader>
          <Form {...itemForm}>
            <form onSubmit={itemForm.handleSubmit(onSubmitItem)} className="space-y-4">
              <FormField
                control={itemForm.control}
                name="weekId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Pekan</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Pilih Pekan" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="max-h-60 overflow-y-auto">
                        {weeks?.map((w: any) => (
                          <SelectItem key={w.id} value={w.id}>
                            Pekan {w.pekanKe}
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
                  control={itemForm.control}
                  name="kd"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>CP (Opsional)</FormLabel>
                      {tpList && tpList.length > 0 ? (
                        <Select
                          onValueChange={(v) => {
                            const cleared = v === "__none__";
                            field.onChange(cleared ? "" : v);
                            if (cleared) {
                              itemForm.setValue("materi", "");
                            } else {
                              const tp = tpList?.find((t: any) => `TP ${t.tpNumber}` === v);
                              if (tp) itemForm.setValue("materi", tp.description);
                            }
                          }}
                          value={field.value ? field.value : "__none__"}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Pilih TP" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="max-h-64 overflow-y-auto">
                            <SelectItem value="__none__">— Tidak ada —</SelectItem>
                            {tpList.map((tp: any) => (
                              <SelectItem key={tp.id} value={`TP ${tp.tpNumber}`}>
                                LM {tp.lingkupMateri} · TP {tp.tpNumber} — {tp.description}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <p className="text-xs text-muted-foreground pt-1">
                          {tpList ? "Belum ada TP untuk mapel ini." : "Memuat TP…"}
                        </p>
                      )}
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={itemForm.control}
                  name="jp"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>JP (Opsional)</FormLabel>
                      <FormControl>
                        <Input type="number" min={0} placeholder="2" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              {!itemForm.watch("kd") && (
                <FormField
                  control={itemForm.control}
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
                control={itemForm.control}
                name="catatan"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Catatan (Opsional)</FormLabel>
                    <FormControl>
                      <Input placeholder="Keterangan tambahan" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button type="submit" disabled={createItem.isPending || updateItem.isPending}>
                  Simpan
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* ---- Dialog: Pilih Sheet ---- */}
      <Dialog open={sheetPickerOpen} onOpenChange={setSheetPickerOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Pilih Sheet</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            File ini memiliki beberapa sheet. Pilih sheet yang ingin diimpor.
          </p>
          <div className="flex flex-col gap-2 mt-2">
            {importSheets.map((sheet) => (
              <Button
                key={sheet.name}
                variant="outline"
                className="justify-start"
                onClick={() => {
                  setSheetPickerOpen(false);
                  setImportSheets([]);
                  runImportAI(sheet.rows);
                }}
              >
                {sheet.name}
              </Button>
            ))}
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => { setSheetPickerOpen(false); setImportSheets([]); }}>
              Batal
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ---- Dialog: Verifikasi Hasil Impor AI ---- */}
      <Dialog
        open={verifyOpen}
        onOpenChange={(open) => {
          if (!open) { setVerifyOpen(false); setVerifyItems([]); }
        }}
      >
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-violet-500" />
              Verifikasi Impor AI — {verifyItems.length} materi
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground -mt-1">
            Periksa dan edit hasilnya sebelum disimpan. Klik × untuk menghapus baris yang tidak diperlukan.
          </p>

          <div className="overflow-x-auto -mx-1">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-gray-50 text-muted-foreground">
                  <th className="text-left font-medium px-2 py-2 w-28">Pekan</th>
                  <th className="text-left font-medium px-2 py-2">Materi</th>
                  <th className="text-left font-medium px-2 py-2 w-16">JP</th>
                  <th className="text-left font-medium px-2 py-2">Catatan/Bab</th>
                  <th className="w-8" />
                </tr>
              </thead>
              <tbody>
                {verifyItems.map((it) => (
                  <tr key={it.id} className="border-t border-gray-100">
                    <td className="px-1 py-1.5">
                      <Select
                        value={it.weekId}
                        onValueChange={(v) => updateVerifyItem(it.id, "weekId", v)}
                      >
                        <SelectTrigger className="h-8 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="max-h-48 overflow-y-auto">
                          {(weeks as any[] ?? []).map((w: any) => (
                            <SelectItem key={w.id} value={w.id}>
                              Pekan {w.pekanKe}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </td>
                    <td className="px-1 py-1.5">
                      <Input
                        className="h-8 text-xs"
                        value={it.materi}
                        onChange={(e) => updateVerifyItem(it.id, "materi", e.target.value)}
                      />
                    </td>
                    <td className="px-1 py-1.5">
                      <Input
                        className="h-8 text-xs w-14"
                        type="number"
                        min={0}
                        value={it.jp}
                        onChange={(e) => updateVerifyItem(it.id, "jp", e.target.value)}
                      />
                    </td>
                    <td className="px-1 py-1.5">
                      <Input
                        className="h-8 text-xs"
                        value={it.catatan}
                        placeholder="Bab / keterangan"
                        onChange={(e) => updateVerifyItem(it.id, "catatan", e.target.value)}
                      />
                    </td>
                    <td className="px-1 py-1.5 text-center">
                      <button
                        type="button"
                        className="text-muted-foreground hover:text-destructive transition-colors"
                        onClick={() => removeVerifyItem(it.id)}
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
                {verifyItems.length === 0 && (
                  <tr>
                    <td colSpan={5} className="text-center py-8 text-muted-foreground text-sm">
                      Semua baris dihapus.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="ghost"
              onClick={() => { setVerifyOpen(false); setVerifyItems([]); }}
              disabled={bulkLoading}
            >
              Batal
            </Button>
            <Button
              onClick={handleBulkSave}
              disabled={bulkLoading || verifyItems.length === 0}
            >
              {bulkLoading ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Menyimpan…</>
              ) : (
                `Simpan ${verifyItems.length} Materi`
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
