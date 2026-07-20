import { useEffect, useMemo, useRef, useState } from "react";
import * as XLSX from "xlsx";
import {
  useListAcademicCalendars,
  useListTujuanPembelajaran,
  useCreateTujuanPembelajaran,
  useUpdateTujuanPembelajaran,
  useDeleteTujuanPembelajaran,
  useAnalyzeTPImport,
  useBulkCreateTujuanPembelajaran,
  getListTujuanPembelajaranQueryKey,
} from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { BookOpen, Edit2, Loader2, Plus, Sparkles, Trash2, Upload } from "lucide-react";

const LM_LIST = [1, 2, 3, 4, 5];

const tpSchema = z.object({
  lingkupMateri: z.coerce.number().int().min(1, "Wajib diisi"),
  description: z.string().min(1, "Tujuan pembelajaran harus diisi"),
});
type TPFormValues = z.infer<typeof tpSchema>;

type ImportItem = { lingkupMateri: number; tpNumber: number; description: string };

const SPREADSHEET_EXTENSIONS = ["csv", "tsv", "txt", "xlsx", "xls", "xlsm", "xlsb", "ods"];

function readFileAsBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const commaIndex = result.indexOf(",");
      resolve(commaIndex >= 0 ? result.slice(commaIndex + 1) : result);
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

export function TujuanPembelajaranTab({ subjectId }: { subjectId: string }) {
  const { data: calendars, isLoading: isLoadingCalendars } = useListAcademicCalendars();
  const [calendarId, setCalendarId] = useState<string>("");
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!calendarId && calendars?.length) setCalendarId(calendars[0].id);
  }, [calendars, calendarId]);

  const queryKey = getListTujuanPembelajaranQueryKey({ subjectId, calendarId: calendarId || undefined });
  const { data: tpList, isLoading } = useListTujuanPembelajaran(
    { subjectId, calendarId: calendarId || undefined },
    { query: { queryKey, enabled: !!calendarId } },
  );

  const createTP = useCreateTujuanPembelajaran();
  const updateTP = useUpdateTujuanPembelajaran();
  const deleteTP = useDeleteTujuanPembelajaran();
  const analyzeImport = useAnalyzeTPImport();
  const bulkCreate = useBulkCreateTujuanPembelajaran();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTP, setEditingTP] = useState<any | null>(null);
  const [importItems, setImportItems] = useState<ImportItem[]>([]);
  const [isVerifyOpen, setIsVerifyOpen] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  const invalidate = () => queryClient.invalidateQueries({ queryKey });

  const form = useForm<TPFormValues>({
    resolver: zodResolver(tpSchema),
    defaultValues: { lingkupMateri: 1, description: "" },
  });

  const grouped = useMemo(() => {
    const map = new Map<number, any[]>();
    for (const item of tpList ?? []) {
      const list = map.get(item.lingkupMateri) ?? [];
      list.push(item);
      map.set(item.lingkupMateri, list);
    }
    for (const list of map.values()) list.sort((a, b) => a.tpNumber - b.tpNumber);
    return [...map.entries()].sort((a, b) => a[0] - b[0]);
  }, [tpList]);

  const onSubmit = async (data: TPFormValues) => {
    if (!calendarId) return;
    try {
      if (editingTP) {
        await updateTP.mutateAsync({ id: editingTP.id, data: { ...data, subjectId, calendarId } });
        toast({ title: "Berhasil", description: "Tujuan Pembelajaran diperbarui" });
      } else {
        await createTP.mutateAsync({ data: { ...data, subjectId, calendarId } });
        toast({ title: "Berhasil", description: "Tujuan Pembelajaran ditambahkan" });
      }
      setIsDialogOpen(false);
      form.reset({ lingkupMateri: 1, description: "" });
      setEditingTP(null);
      invalidate();
    } catch (err: any) {
      toast({ variant: "destructive", title: "Gagal", description: err?.data?.error ?? "Terjadi kesalahan" });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Yakin ingin menghapus Tujuan Pembelajaran ini?")) return;
    try {
      await deleteTP.mutateAsync({ id });
      invalidate();
      toast({ title: "Berhasil", description: "Dihapus" });
    } catch {
      toast({ variant: "destructive", title: "Gagal", description: "Terjadi kesalahan" });
    }
  };

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (fileInputRef.current) fileInputRef.current.value = "";
    if (!file) return;

    const ext = file.name.split(".").pop()?.toLowerCase();

    try {
      let result;
      if (ext && SPREADSHEET_EXTENSIONS.includes(ext)) {
        const buffer = await file.arrayBuffer();
        const workbook = XLSX.read(buffer, { type: "array" });
        const rows: string[][] = [];
        for (const sheetName of workbook.SheetNames) {
          const sheet = workbook.Sheets[sheetName];
          if (!sheet) continue;
          const sheetRows = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, raw: false, defval: "" });
          for (const row of sheetRows) rows.push(row.map((cell) => String(cell ?? "").trim()));
        }
        const nonEmpty = rows.filter((row) => row.some((cell) => cell !== ""));
        if (nonEmpty.length === 0) {
          toast({ variant: "destructive", title: "Gagal Import", description: "File tidak berisi data" });
          return;
        }
        result = await analyzeImport.mutateAsync({ data: { rows: nonEmpty } });
      } else {
        // Any other format (PDF, Word, image, plain text, scan) -- let AI read the raw file.
        const fileData = await readFileAsBase64(file);
        result = await analyzeImport.mutateAsync({
          data: { fileData, fileName: file.name, fileType: file.type || undefined },
        });
      }

      if (result.items.length === 0) {
        toast({ variant: "destructive", title: "Gagal Import", description: "AI tidak menemukan Tujuan Pembelajaran pada berkas ini" });
        return;
      }
      setImportItems(result.items);
      setIsVerifyOpen(true);
    } catch (err: any) {
      const message = err?.data?.error ?? "Berkas tidak dapat dibaca oleh AI. Coba berkas lain.";
      toast({ variant: "destructive", title: "Gagal Import", description: message });
    }
  };

  const updateImportItem = (index: number, patch: Partial<ImportItem>) => {
    setImportItems((items) => items.map((item, i) => (i === index ? { ...item, ...patch } : item)));
  };
  const removeImportItem = (index: number) => {
    setImportItems((items) => items.filter((_, i) => i !== index));
  };

  const handleConfirmImport = async () => {
    if (!calendarId) return;
    try {
      const res = await bulkCreate.mutateAsync({ data: { subjectId, calendarId, items: importItems } });
      toast({
        title: "Import Berhasil",
        description:
          res.skipped > 0
            ? `${res.count} TP ditambahkan, ${res.skipped} dilewati karena sudah ada`
            : `${res.count} TP ditambahkan`,
      });
      setIsConfirmOpen(false);
      setIsVerifyOpen(false);
      setImportItems([]);
      invalidate();
    } catch (err: any) {
      setIsConfirmOpen(false);
      toast({ variant: "destructive", title: "Gagal Import", description: err?.data?.error ?? "Terjadi kesalahan" });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="w-full sm:w-64">
          <Select value={calendarId} onValueChange={setCalendarId}>
            <SelectTrigger>
              <SelectValue placeholder="Pilih tahun ajaran & semester" />
            </SelectTrigger>
            <SelectContent>
              {calendars?.map((c: any) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.tahunAjaran} - Semester {c.semester}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="file"
            accept=".csv,.tsv,.txt,.xlsx,.xls,.xlsm,.xlsb,.ods,.pdf,.docx,.png,.jpg,.jpeg,.webp"
            className="hidden"
            ref={fileInputRef}
            onChange={handleImportFile}
          />
          <Button
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            disabled={analyzeImport.isPending || !calendarId}
          >
            {analyzeImport.isPending ? (
              <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Menganalisis dengan AI...</>
            ) : (
              <><Sparkles className="w-4 h-4 mr-2" /> Impor dengan AI</>
            )}
          </Button>
          <Dialog
            open={isDialogOpen}
            onOpenChange={(open) => {
              setIsDialogOpen(open);
              if (!open) {
                setEditingTP(null);
                form.reset({ lingkupMateri: 1, description: "" });
              }
            }}
          >
            <DialogTrigger asChild>
              <Button disabled={!calendarId}><Plus className="w-4 h-4 mr-2" /> Tambah Manual</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingTP ? "Edit Tujuan Pembelajaran" : "Tambah Tujuan Pembelajaran"}</DialogTitle>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="lingkupMateri"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Lingkup Materi</FormLabel>
                        <Select onValueChange={(v) => field.onChange(Number(v))} value={String(field.value)}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {LM_LIST.map((lm) => (
                              <SelectItem key={lm} value={String(lm)}>
                                Lingkup Materi {lm}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <p className="text-xs text-muted-foreground">
                          Nomor TP diberikan otomatis dan berurutan mengikuti Lingkup Materi sebelumnya.
                        </p>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tujuan Pembelajaran</FormLabel>
                        <FormControl>
                          <Textarea rows={4} placeholder="Ketik teks Tujuan Pembelajaran..." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <DialogFooter>
                    <Button type="submit" disabled={createTP.isPending || updateTP.isPending}>Simpan</Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Dialog open={isVerifyOpen} onOpenChange={(open) => { setIsVerifyOpen(open); if (!open) setImportItems([]); }}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" /> Verifikasi Hasil Import AI
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            AI menemukan {importItems.length} Tujuan Pembelajaran. Periksa dan perbaiki bila perlu sebelum disimpan.
            Nomor TP akan diberikan otomatis secara berurutan mengikuti Lingkup Materi saat disimpan.
          </p>
          <div className="max-h-[50vh] overflow-y-auto space-y-3 pr-1">
            {importItems.map((item, i) => (
              <div key={i} className="border border-border rounded-lg p-3 space-y-2">
                <div className="flex items-center gap-2">
                  <Select value={String(item.lingkupMateri)} onValueChange={(v) => updateImportItem(i, { lingkupMateri: Number(v) })}>
                    <SelectTrigger className="h-8 w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {LM_LIST.map((lm) => (
                        <SelectItem key={lm} value={String(lm)}>
                          Lingkup Materi {lm}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button variant="ghost" size="icon" className="h-8 w-8 ml-auto text-destructive hover:bg-destructive/10" onClick={() => removeImportItem(i)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
                <Textarea
                  rows={2}
                  value={item.description}
                  onChange={(e) => updateImportItem(i, { description: e.target.value })}
                />
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setIsVerifyOpen(false); setImportItems([]); }} disabled={bulkCreate.isPending}>
              Batal
            </Button>
            <Button onClick={() => setIsConfirmOpen(true)} disabled={bulkCreate.isPending || importItems.length === 0}>
              {bulkCreate.isPending ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Menyimpan...</>
              ) : (
                <>Simpan {importItems.length} TP</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Konfirmasi Simpan Tujuan Pembelajaran</AlertDialogTitle>
            <AlertDialogDescription>
              Anda akan menyimpan {importItems.length} Tujuan Pembelajaran hasil analisis AI ke mata pelajaran ini.
              Pastikan data pada langkah verifikasi sebelumnya sudah benar. Lanjutkan?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={bulkCreate.isPending}>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleConfirmImport();
              }}
              disabled={bulkCreate.isPending}
            >
              {bulkCreate.isPending ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Menyimpan...</>
              ) : (
                "Ya, Simpan"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
        {isLoadingCalendars || isLoading ? (
          <div className="p-4 space-y-4">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        ) : !calendarId ? (
          <div className="py-16 text-center text-muted-foreground">
            <BookOpen className="w-12 h-12 mx-auto mb-3 text-muted-foreground/30" />
            <p>Buat kalender akademik (tahun ajaran/semester) terlebih dahulu di menu Kalender.</p>
          </div>
        ) : grouped.length === 0 ? (
          <div className="py-16 text-center text-muted-foreground">
            <BookOpen className="w-12 h-12 mx-auto mb-3 text-muted-foreground/30" />
            <p>Belum ada Tujuan Pembelajaran untuk mata pelajaran ini.</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {grouped.map(([lm, items]) => (
              <div key={lm} className="p-4">
                <h4 className="font-semibold text-sm text-primary mb-2">Lingkup Materi {lm}</h4>
                <div className="space-y-2">
                  {items.map((item: any) => (
                    <div key={item.id} className="flex items-start justify-between gap-3 bg-gray-50/60 rounded-lg p-3">
                      <div className="flex gap-3">
                        <span className="shrink-0 text-xs font-medium text-muted-foreground bg-card border border-border rounded px-2 py-0.5 h-fit">
                          TP {item.tpNumber}
                        </span>
                        <p className="text-sm">{item.description}</p>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-muted-foreground hover:text-foreground"
                          onClick={() => {
                            setEditingTP(item);
                            form.reset({
                              lingkupMateri: item.lingkupMateri,
                              description: item.description,
                            });
                            setIsDialogOpen(true);
                          }}
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-destructive hover:bg-destructive/10"
                          onClick={() => handleDelete(item.id)}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
