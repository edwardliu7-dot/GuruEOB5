import { useState, useRef, useCallback } from "react";
import { Layout } from "@/components/layout";
import { FadeIn, StaggerContainer, StaggerItem } from "@/components/motion";
import {
  useListSubjects, useCreateSubject, useUpdateSubject, useDeleteSubject,
  useListDocuments, useCreateDocument, useDeleteDocument,
  useGetMe, getListDocumentsQueryKey,
} from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Label } from "@/components/ui/label";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useToast } from "@/hooks/use-toast";
import {
  Folder, FolderOpen, FileText, Plus, ArrowLeft, Trash2, Edit2, MoreVertical, Upload,
  BookOpen, Download, Loader2, ExternalLink, X, CheckCircle2, AlertCircle, ChevronRight,
  Target, History
} from "lucide-react";
import { cn } from "@/lib/utils";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { useQueryClient, useQuery, useMutation } from "@tanstack/react-query";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { TujuanPembelajaranTab } from "@/components/tujuan-pembelajaran-tab";
import { Badge } from "@/components/ui/badge";

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

function formatFileSize(bytes?: number | null): string {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// Strip extension from filename for default document name
function fileBaseName(filename: string): string {
  return filename.replace(/\.[^.]+$/, "");
}

interface PendingDoc {
  id: string;
  file: File;
  name: string;
  status: "pending" | "uploading" | "done" | "error";
}

const subjectSchema = z.object({ name: z.string().min(1, "Nama mata pelajaran harus diisi") });
const bahanAjarSchema = z.object({
  judul: z.string().min(1, "Judul harus diisi"),
  mataPelajaran: z.string().optional(),
  kelas: z.string().optional(),
  deskripsi: z.string().optional(),
  linkUrl: z.string().url("URL tidak valid").optional().or(z.literal("")),
});

type SubjectFormValues = z.infer<typeof subjectSchema>;
type BahanAjarFormValues = z.infer<typeof bahanAjarSchema>;

// ─── Bahan Ajar API helpers ───────────────────────────────────────────────────
async function apiFetch(path: string, options?: RequestInit) {
  const res = await fetch(path, { credentials: "include", ...options });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

function useBahanAjar() {
  return useQuery({ queryKey: ["/api/bahan-ajar"], queryFn: () => apiFetch("/api/bahan-ajar") });
}

function useCreateBahanAjar() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: object) =>
      apiFetch("/api/bahan-ajar", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["/api/bahan-ajar"] }),
  });
}

function useDeleteBahanAjar() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiFetch(`/api/bahan-ajar/${id}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["/api/bahan-ajar"] }),
  });
}

// ─── Bahan Ajar Tab ───────────────────────────────────────────────────────────
function BahanAjarTab({ isAdmin, currentUserId, subjects, me }: {
  isAdmin: boolean;
  currentUserId?: string;
  subjects?: any[];
  me?: any;
}) {
  const { data: items, isLoading } = useBahanAjar();
  const createBA = useCreateBahanAjar();
  const deleteBA = useDeleteBahanAjar();
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [presentingId, setPresentingId] = useState<string | null>(null);

  // Build dropdown options from existing data
  const subjectOptions: string[] = subjects?.map((s: any) => s.name).filter(Boolean) ?? [];
  const kelasOptions: string[] = (me?.kelasDiampu as string[] | undefined) ?? [];

  const form = useForm<BahanAjarFormValues>({
    resolver: zodResolver(bahanAjarSchema),
    defaultValues: { judul: "", mataPelajaran: "", kelas: "", deskripsi: "", linkUrl: "" },
  });

  const onSubmit = async (data: BahanAjarFormValues) => {
    setIsUploading(true);
    try {
      let filePayload: Record<string, any> = {};
      if (selectedFile) {
        filePayload = {
          fileData: await readFileAsBase64(selectedFile),
          fileName: selectedFile.name,
          fileType: selectedFile.type || undefined,
          fileSize: selectedFile.size,
        };
      }
      await createBA.mutateAsync({ ...data, ...filePayload });
      toast({ title: "Berhasil", description: "Bahan ajar ditambahkan" });
      setIsDialogOpen(false);
      form.reset();
      setSelectedFile(null);
    } catch {
      toast({ variant: "destructive", title: "Gagal", description: "Terjadi kesalahan" });
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Hapus bahan ajar ini?")) return;
    try {
      await deleteBA.mutateAsync(id);
      toast({ title: "Berhasil", description: "Bahan ajar dihapus" });
    } catch {
      toast({ variant: "destructive", title: "Gagal", description: "Terjadi kesalahan" });
    }
  };

  const handleDownload = async (item: any) => {
    setDownloadingId(item.id);
    try {
      const res = await fetch(`/api/bahan-ajar/${item.id}/file`, { credentials: "include" });
      if (!res.ok) throw new Error();
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = item.fileName || item.judul;
      document.body.appendChild(a); a.click(); a.remove();
      URL.revokeObjectURL(url);
    } catch {
      toast({ variant: "destructive", title: "Gagal", description: "Tidak dapat mengunduh berkas" });
    } finally {
      setDownloadingId(null);
    }
  };

  const handleOpen = async (item: any) => {
    setPresentingId(item.id);
    try {
      const res = await fetch(`/api/bahan-ajar/${item.id}/file`, { credentials: "include" });
      if (!res.ok) throw new Error();
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      window.open(url, "_blank");
      // Beri waktu tab baru memuat berkas sebelum URL di-revoke
      setTimeout(() => URL.revokeObjectURL(url), 60_000);
    } catch {
      toast({ variant: "destructive", title: "Gagal", description: "Tidak dapat membuka berkas" });
    } finally {
      setPresentingId(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-muted-foreground text-sm">
          <BookOpen className="w-4 h-4" />
          <span>
            Semua guru dapat menambahkan bahan ajar. Guru hanya dapat menghapus unggahan miliknya sendiri.
          </span>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) { form.reset(); setSelectedFile(null); } }}>
          <DialogTrigger asChild>
            <Button><Plus className="w-4 h-4 mr-2" /> Tambah Bahan Ajar</Button>
          </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader><DialogTitle>Tambah Bahan Ajar</DialogTitle></DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField control={form.control} name="judul" render={({ field }) => (
                    <FormItem><FormLabel>Judul</FormLabel><FormControl><Input placeholder="Judul bahan ajar" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <div className="grid grid-cols-2 gap-4">
                    <FormField control={form.control} name="mataPelajaran" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Mata Pelajaran</FormLabel>
                        {subjectOptions.length > 0 ? (
                          <Select value={field.value} onValueChange={field.onChange}>
                            <FormControl>
                              <SelectTrigger><SelectValue placeholder="Pilih mata pelajaran" /></SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {subjectOptions.map((name) => (
                                <SelectItem key={name} value={name}>{name}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : (
                          <FormControl><Input placeholder="Misal: Matematika" {...field} /></FormControl>
                        )}
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="kelas" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Kelas</FormLabel>
                        {kelasOptions.length > 0 ? (
                          <Select value={field.value} onValueChange={field.onChange}>
                            <FormControl>
                              <SelectTrigger><SelectValue placeholder="Pilih kelas" /></SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {kelasOptions.map((k) => (
                                <SelectItem key={k} value={k}>{k}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : (
                          <FormControl><Input placeholder="Misal: VII Ibnu Battutah" {...field} /></FormControl>
                        )}
                        <FormMessage />
                      </FormItem>
                    )} />
                  </div>
                  <FormField control={form.control} name="deskripsi" render={({ field }) => (
                    <FormItem><FormLabel>Deskripsi (Opsional)</FormLabel><FormControl><Textarea placeholder="Keterangan singkat" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="linkUrl" render={({ field }) => (
                    <FormItem><FormLabel>Link Eksternal (Opsional)</FormLabel><FormControl><Input placeholder="https://..." {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <div className="space-y-2">
                    <Label htmlFor="ba-file">Unggah Berkas (Opsional)</Label>
                    <Input id="ba-file" type="file" onChange={(e) => setSelectedFile(e.target.files?.[0] ?? null)} />
                    {selectedFile && (
                      <p className="text-xs text-muted-foreground">{selectedFile.name} ({formatFileSize(selectedFile.size)})</p>
                    )}
                  </div>
                  <DialogFooter>
                    <Button type="submit" disabled={isUploading || createBA.isPending}>
                      {isUploading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Mengunggah...</> : "Simpan"}
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array(3).fill(0).map((_, i) => <Skeleton key={i} className="h-40 rounded-xl" />)}
        </div>
      ) : !items?.length ? (
        <div className="py-16 text-center text-muted-foreground bg-card rounded-xl border border-dashed border-border">
          <BookOpen className="w-12 h-12 mx-auto mb-3 text-muted-foreground/30" />
          <p>Belum ada bahan ajar.</p>
          <p className="text-sm mt-1">Klik "Tambah Bahan Ajar" untuk memulai.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((item: any) => (
            <Card key={item.id} className="group relative hover:shadow-md transition-all">
              <CardContent className="p-5 flex flex-col gap-3 h-full">
                <div className="flex items-start justify-between gap-2">
                  <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0">
                    <BookOpen className="w-5 h-5" />
                  </div>
                  {(item.createdBy === currentUserId || isAdmin) && (
                    <Button
                      variant="ghost" size="icon"
                      className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity text-destructive"
                      onClick={() => handleDelete(item.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>

                <div className="flex-1">
                  <h3 className="font-semibold text-base line-clamp-2">{item.judul}</h3>
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {item.mataPelajaran && (
                      <Badge variant="secondary" className="text-xs">{item.mataPelajaran}</Badge>
                    )}
                    {item.kelas && (
                      <Badge variant="outline" className="text-xs">{item.kelas}</Badge>
                    )}
                  </div>
                  {item.deskripsi && (
                    <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{item.deskripsi}</p>
                  )}
                </div>

                <div className="flex items-center justify-between mt-auto pt-2 border-t border-border">
                  <span className="text-xs text-muted-foreground">
                    {format(new Date(item.createdAt), "dd MMM yyyy")}
                  </span>
                  <div className="flex gap-1">
                    {item.linkUrl && (
                      <Button variant="ghost" size="icon" className="h-8 w-8" title="Buka tautan" asChild>
                        <a href={item.linkUrl} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      </Button>
                    )}
                    {item.fileName && (
                      <>
                        <Button
                          variant="ghost" size="icon" className="h-8 w-8 text-blue-600 hover:bg-blue-50"
                          title="Buka / Presentasikan"
                          disabled={presentingId === item.id}
                          onClick={() => handleOpen(item)}
                        >
                          {presentingId === item.id
                            ? <Loader2 className="w-4 h-4 animate-spin" />
                            : <ExternalLink className="w-4 h-4" />}
                        </Button>
                        <Button
                          variant="ghost" size="icon" className="h-8 w-8"
                          title="Unduh"
                          disabled={downloadingId === item.id}
                          onClick={() => handleDownload(item)}
                        >
                          {downloadingId === item.id
                            ? <Loader2 className="w-4 h-4 animate-spin" />
                            : <Download className="w-4 h-4" />}
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function Administrasi() {
  const { data: subjects, isLoading: isLoadingSubjects } = useListSubjects();
  const { data: me } = useGetMe();
  const createSubject = useCreateSubject();
  const updateSubject = useUpdateSubject();
  const deleteSubject = useDeleteSubject();

  const [selectedSubject, setSelectedSubjectRaw] = useState<string | null>(() => {
    // Restore last-opened subject so documents are visible immediately on re-visit
    return localStorage.getItem("administrasi_selectedSubject") ?? null;
  });

  const setSelectedSubject = useCallback((id: string | null) => {
    setSelectedSubjectRaw(id);
    if (id) {
      localStorage.setItem("administrasi_selectedSubject", id);
    } else {
      localStorage.removeItem("administrasi_selectedSubject");
    }
  }, []);
  const [isSubjectDialogOpen, setIsSubjectDialogOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState<any | null>(null);
  const [innerTab, setInnerTab] = useState<"dokumen" | "tp">("dokumen");
  const [pageTab, setPageTab] = useState<"administrasi" | "bahan-ajar">("administrasi");

  const { data: documents, isLoading: isLoadingDocuments } = useListDocuments(
    { subjectId: selectedSubject || undefined },
    { query: { enabled: !!selectedSubject, queryKey: getListDocumentsQueryKey({ subjectId: selectedSubject || undefined }) } },
  );
  const createDocument = useCreateDocument();
  const deleteDocument = useDeleteDocument();
  const [isDocumentDialogOpen, setIsDocumentDialogOpen] = useState(false);
  const [pendingDocs, setPendingDocs] = useState<PendingDoc[]>([]);
  const [uploadProgress, setUploadProgress] = useState<{ done: number; total: number } | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const docFileInputRef = useRef<HTMLInputElement>(null);

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const subjectForm = useForm<SubjectFormValues>({
    resolver: zodResolver(subjectSchema),
    defaultValues: { name: "" },
  });

  const isAdmin = (me as any)?.isAdmin === true;

  // Add files to pending list (dedup by name+size)
  const addFiles = useCallback((files: FileList | File[]) => {
    const arr = Array.from(files);
    setPendingDocs((prev) => {
      const existing = new Set(prev.map((p) => `${p.file.name}-${p.file.size}`));
      const newEntries: PendingDoc[] = arr
        .filter((f) => !existing.has(`${f.name}-${f.size}`))
        .map((f) => ({
          id: `${f.name}-${f.size}-${Math.random()}`,
          file: f,
          name: fileBaseName(f.name),
          status: "pending" as const,
        }));
      return [...prev, ...newEntries];
    });
  }, []);

  const removeDoc = (id: string) => setPendingDocs((prev) => prev.filter((d) => d.id !== id));
  const updateDocName = (id: string, name: string) =>
    setPendingDocs((prev) => prev.map((d) => (d.id === id ? { ...d, name } : d)));

  const closeDocDialog = () => {
    if (uploadProgress) return; // block close while uploading
    setIsDocumentDialogOpen(false);
    setPendingDocs([]);
    setUploadProgress(null);
  };

  const onSubjectSubmit = async (data: SubjectFormValues) => {
    if (!me) return;
    try {
      if (editingSubject) {
        await updateSubject.mutateAsync({ id: editingSubject.id, data: { ...data, teacherId: editingSubject.teacherId } });
        toast({ title: "Berhasil", description: "Mata pelajaran berhasil diperbarui" });
      } else {
        await createSubject.mutateAsync({ data: { ...data, teacherId: me.id } });
        toast({ title: "Berhasil", description: "Mata pelajaran berhasil ditambahkan" });
      }
      setIsSubjectDialogOpen(false);
      subjectForm.reset();
      setEditingSubject(null);
      queryClient.invalidateQueries({ queryKey: ["/api/subjects"] });
    } catch {
      toast({ variant: "destructive", title: "Gagal", description: "Terjadi kesalahan" });
    }
  };

  const handleUploadDocs = async () => {
    if (!selectedSubject || pendingDocs.length === 0) return;
    const todo = pendingDocs.filter((d) => d.status === "pending");
    if (todo.length === 0) return;
    setUploadProgress({ done: 0, total: todo.length });
    let done = 0;
    let failed = 0;
    for (const doc of todo) {
      setPendingDocs((prev) => prev.map((d) => (d.id === doc.id ? { ...d, status: "uploading" } : d)));
      try {
        const fileData = await readFileAsBase64(doc.file);
        await createDocument.mutateAsync({
          data: {
            name: doc.name.trim() || fileBaseName(doc.file.name),
            subjectId: selectedSubject,
            fileData,
            fileName: doc.file.name,
            fileType: doc.file.type || undefined,
            fileSize: doc.file.size,
          },
        });
        setPendingDocs((prev) => prev.map((d) => (d.id === doc.id ? { ...d, status: "done" } : d)));
        done++;
      } catch (err) {
        setPendingDocs((prev) => prev.map((d) => (d.id === doc.id ? { ...d, status: "error" } : d)));
        failed++;
        console.error("Upload dokumen gagal:", err);
      }
      setUploadProgress({ done, total: todo.length });
    }
    queryClient.invalidateQueries({ queryKey: ["/api/documents"] });
    if (failed === 0) {
      toast({ title: "Berhasil", description: `${done} dokumen berhasil diunggah.` });
      setIsDocumentDialogOpen(false);
      setPendingDocs([]);
      setUploadProgress(null);
    } else {
      toast({ variant: "destructive", title: `${failed} dokumen gagal`, description: "Dokumen yang gagal ditandai merah — Anda dapat mencoba lagi." });
      setUploadProgress(null);
    }
  };

  const handleDownloadDocument = async (doc: any) => {
    setDownloadingId(doc.id);
    try {
      const response = await fetch(`/api/documents/${doc.id}/file`, { credentials: "include" });
      if (!response.ok) throw new Error();
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = doc.fileName || doc.name;
      document.body.appendChild(a); a.click(); a.remove();
      URL.revokeObjectURL(url);
    } catch {
      toast({ variant: "destructive", title: "Gagal", description: "Tidak dapat mengunduh dokumen" });
    } finally {
      setDownloadingId(null);
    }
  };

  const handleDeleteSubject = async (id: string) => {
    if (!confirm("Yakin ingin menghapus mata pelajaran ini?")) return;
    try {
      await deleteSubject.mutateAsync({ id });
      queryClient.invalidateQueries({ queryKey: ["/api/subjects"] });
      toast({ title: "Berhasil", description: "Dihapus" });
    } catch {
      toast({ variant: "destructive", title: "Gagal", description: "Terjadi kesalahan" });
    }
  };

  const handleDeleteDocument = async (id: string) => {
    if (!confirm("Yakin ingin menghapus dokumen ini?")) return;
    try {
      await deleteDocument.mutateAsync({ id });
      queryClient.invalidateQueries({ queryKey: ["/api/documents"] });
      toast({ title: "Berhasil", description: "Dihapus" });
    } catch {
      toast({ variant: "destructive", title: "Gagal", description: "Terjadi kesalahan" });
    }
  };

  return (
    <Layout>
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">

        {/* Page header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <div className="text-xs text-slate-400 mb-2 flex items-center gap-1">
              <span>Dashboard</span>
              <ChevronRight className="w-3 h-3" />
              <span className="text-slate-600 font-medium">Administrasi Guru</span>
            </div>
            <div className="flex items-center gap-2">
              {selectedSubject && pageTab === "administrasi" && (
                <button onClick={() => setSelectedSubject(null)} className="mr-2 text-slate-400 hover:text-slate-600 transition-colors">
                  <ArrowLeft className="w-5 h-5" />
                </button>
              )}
              <h1 className="text-xl font-bold text-slate-800">
                {pageTab === "bahan-ajar"
                  ? "Bahan Ajar"
                  : selectedSubject
                    ? "Dokumen Administrasi"
                    : "Administrasi Guru"}
              </h1>
            </div>
            <p className="text-sm text-slate-500 mt-0.5">
              {pageTab === "bahan-ajar"
                ? "Materi pembelajaran yang dapat diakses seluruh guru."
                : selectedSubject
                  ? `Mata Pelajaran: ${subjects?.find((s: any) => s.id === selectedSubject)?.name}`
                  : "Kelola folder mata pelajaran dan dokumen administrasinya."}
            </p>
          </div>

          {/* Action button per context */}
          {pageTab === "administrasi" && !selectedSubject && (
            <Dialog open={isSubjectDialogOpen} onOpenChange={(open) => { setIsSubjectDialogOpen(open); if (!open) { setEditingSubject(null); subjectForm.reset(); } }}>
              <DialogTrigger asChild>
                <button className="flex items-center gap-2 rounded-full bg-slate-800 text-white px-4 py-2 text-sm font-medium hover:bg-slate-700 transition-colors shadow-sm w-max">
                  <Plus className="w-4 h-4" />
                  Tambah Mata Pelajaran
                </button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>{editingSubject ? "Edit Mata Pelajaran" : "Tambah Mata Pelajaran"}</DialogTitle></DialogHeader>
                <Form {...subjectForm}>
                  <form onSubmit={subjectForm.handleSubmit(onSubjectSubmit)} className="space-y-4">
                    <FormField control={subjectForm.control} name="name" render={({ field }) => (
                      <FormItem><FormLabel>Nama Mata Pelajaran</FormLabel><FormControl><Input placeholder="Misal: Matematika Kelas X" {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <DialogFooter>
                      <Button type="submit" disabled={createSubject.isPending || updateSubject.isPending}>Simpan</Button>
                    </DialogFooter>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          )}
          {pageTab === "administrasi" && selectedSubject && innerTab === "dokumen" && (
            <Dialog open={isDocumentDialogOpen} onOpenChange={(open) => { if (!open) closeDocDialog(); else setIsDocumentDialogOpen(true); }}>
              <DialogTrigger asChild>
                <button className="flex items-center gap-2 px-4 py-2 rounded-full border border-slate-200 bg-white text-slate-600 text-sm font-medium hover:bg-slate-50 shadow-sm transition-colors">
                  <Upload className="w-4 h-4" /> Unggah Dokumen
                </button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle>Unggah Dokumen</DialogTitle>
                </DialogHeader>

                {/* Drop zone */}
                <div
                  className={cn(
                    "relative border-2 border-dashed rounded-xl transition-colors cursor-pointer",
                    isDraggingOver
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/50 hover:bg-muted/30",
                  )}
                  onClick={() => docFileInputRef.current?.click()}
                  onDragOver={(e) => { e.preventDefault(); setIsDraggingOver(true); }}
                  onDragLeave={() => setIsDraggingOver(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setIsDraggingOver(false);
                    if (e.dataTransfer.files.length) addFiles(e.dataTransfer.files);
                  }}
                >
                  <div className="py-7 flex flex-col items-center gap-2 text-muted-foreground select-none">
                    <Upload className="w-8 h-8 opacity-40" />
                    <p className="text-sm font-medium">Klik atau seret berkas ke sini</p>
                    <p className="text-xs">Bisa pilih beberapa berkas sekaligus</p>
                  </div>
                  <input
                    ref={docFileInputRef}
                    type="file"
                    multiple
                    className="hidden"
                    onChange={(e) => { if (e.target.files?.length) { addFiles(e.target.files); e.target.value = ""; } }}
                  />
                </div>

                {/* File list */}
                {pendingDocs.length > 0 && (
                  <div className="border border-border rounded-lg overflow-hidden divide-y divide-border max-h-64 overflow-y-auto">
                    {pendingDocs.map((doc) => (
                      <div key={doc.id} className={cn(
                        "flex items-center gap-2 px-3 py-2 text-sm",
                        doc.status === "done" && "bg-green-50/60",
                        doc.status === "error" && "bg-red-50/60",
                        doc.status === "uploading" && "bg-blue-50/40",
                      )}>
                        {/* Status icon */}
                        <div className="shrink-0 w-5">
                          {doc.status === "pending" && <FileText className="w-4 h-4 text-muted-foreground" />}
                          {doc.status === "uploading" && <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />}
                          {doc.status === "done" && <CheckCircle2 className="w-4 h-4 text-green-500" />}
                          {doc.status === "error" && <AlertCircle className="w-4 h-4 text-red-500" />}
                        </div>

                        {/* Editable name */}
                        <Input
                          className="h-7 text-xs flex-1 min-w-0 border-0 bg-transparent shadow-none focus-visible:ring-0 px-0"
                          value={doc.name}
                          disabled={doc.status !== "pending"}
                          onChange={(e) => updateDocName(doc.id, e.target.value)}
                          placeholder="Nama dokumen"
                        />

                        {/* File size */}
                        <span className="text-xs text-muted-foreground shrink-0 hidden sm:block">
                          {formatFileSize(doc.file.size)}
                        </span>

                        {/* Remove */}
                        {doc.status === "pending" && (
                          <button
                            type="button"
                            className="shrink-0 text-muted-foreground hover:text-destructive"
                            onClick={() => removeDoc(doc.id)}
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Progress bar */}
                {uploadProgress && (
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Mengunggah…</span>
                      <span>{uploadProgress.done}/{uploadProgress.total}</span>
                    </div>
                    <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary transition-all duration-300 rounded-full"
                        style={{ width: `${Math.round((uploadProgress.done / uploadProgress.total) * 100)}%` }}
                      />
                    </div>
                  </div>
                )}

                <DialogFooter>
                  <Button variant="outline" onClick={closeDocDialog} disabled={!!uploadProgress}>
                    Batal
                  </Button>
                  <Button
                    onClick={handleUploadDocs}
                    disabled={pendingDocs.filter((d) => d.status === "pending").length === 0 || !!uploadProgress}
                  >
                    {uploadProgress
                      ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Mengunggah…</>
                      : <>
                          <Upload className="w-4 h-4 mr-2" />
                          Unggah {pendingDocs.filter((d) => d.status === "pending").length} Berkas
                        </>
                    }
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </div>

        {/* Page-level tabs */}
        <div className="flex bg-slate-100/50 p-1 rounded-full w-max mt-2 mb-6 border border-slate-200/50 shadow-sm">
          <button
            onClick={() => { setPageTab("administrasi"); setSelectedSubject(null); }}
            className={`px-6 py-2 text-sm font-medium rounded-full transition-all ${
              pageTab === "administrasi" ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-700 hover:bg-slate-200/50"
            }`}
          >
            Administrasi
          </button>
          <button
            onClick={() => { setPageTab("bahan-ajar"); setSelectedSubject(null); }}
            className={`px-6 py-2 text-sm font-medium rounded-full transition-all ${
              pageTab === "bahan-ajar" ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-700 hover:bg-slate-200/50"
            }`}
          >
            Bahan Ajar
          </button>
        </div>

        {pageTab === "administrasi" && (
          <div>
            {/* Subject folder grid */}
            {!selectedSubject && (
              <>
                {/* Stats row */}
                {!isLoadingSubjects && (subjects?.length ?? 0) > 0 && (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
                    {[
                      { label: "Mata Pelajaran", count: subjects?.length ?? 0, color: "blue" },
                      { label: "Total Dokumen", count: 0, color: "violet" },
                      { label: "Bahan Ajar", count: 0, color: "amber" },
                      { label: "Tujuan Pembelajaran", count: 0, color: "emerald" },
                    ].map((stat, idx) => {
                      const colorStyles: Record<string, { bg: string; text: string; bar: string }> = {
                        blue:    { bg: "bg-blue-100",    text: "text-blue-600",    bar: "bg-blue-500" },
                        violet:  { bg: "bg-violet-100",  text: "text-violet-600",  bar: "bg-violet-500" },
                        amber:   { bg: "bg-amber-100",   text: "text-amber-600",   bar: "bg-amber-500" },
                        emerald: { bg: "bg-emerald-100", text: "text-emerald-600", bar: "bg-emerald-500" },
                      };
                      const cs = colorStyles[stat.color];
                      return (
                        <div key={idx} className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden flex flex-col">
                          <div className="p-4 flex justify-between items-center">
                            <div>
                              <p className="text-xs font-semibold text-slate-500 mb-1">{stat.label}</p>
                              <h3 className="text-2xl font-bold text-slate-800">{stat.count}</h3>
                            </div>
                            <div className={`p-2.5 rounded-xl ${cs.bg} ${cs.text}`}>
                              <Folder className="w-5 h-5" />
                            </div>
                          </div>
                          <div className={`h-1 w-full ${cs.bar}`} />
                        </div>
                      );
                    })}
                  </div>
                )}

                <div className="flex flex-col lg:flex-row gap-6">
                  {/* Folder grid */}
                  <div className="flex-1">
                    <StaggerContainer className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {isLoadingSubjects ? (
                        Array(4).fill(0).map((_, i) => <Skeleton key={i} className="h-36 w-full rounded-xl" />)
                      ) : subjects?.length === 0 ? (
                        <div className="col-span-full py-12 text-center text-muted-foreground bg-card rounded-xl border border-dashed border-border">
                          <Folder className="w-12 h-12 mx-auto mb-3 text-muted-foreground/30" />
                          <p>Belum ada mata pelajaran.</p>
                        </div>
                      ) : (
                        subjects?.map((subject: any, idx: number) => {
                          const folderColors = ["blue", "emerald", "violet", "amber", "blue", "emerald"] as const;
                          const colorKey = folderColors[idx % folderColors.length];
                          const colorStyles: Record<string, { bg: string; text: string; ring: string }> = {
                            blue:    { bg: "bg-blue-100",    text: "text-blue-600",    ring: "ring-blue-500" },
                            emerald: { bg: "bg-emerald-100", text: "text-emerald-600", ring: "ring-emerald-500" },
                            violet:  { bg: "bg-violet-100",  text: "text-violet-600",  ring: "ring-violet-500" },
                            amber:   { bg: "bg-amber-100",   text: "text-amber-600",   ring: "ring-amber-500" },
                          };
                          const cs = colorStyles[colorKey];
                          return (
                            <StaggerItem key={subject.id}>
                              <div
                                className="group relative bg-white border border-slate-200 rounded-xl p-5 hover:shadow-md hover:border-slate-300 transition-all cursor-pointer h-full flex flex-col gap-4"
                                onClick={() => setSelectedSubject(subject.id)}
                              >
                                <div className="flex justify-between items-start">
                                  <div className={`p-3 rounded-xl ${cs.bg} ${cs.text}`}>
                                    <FolderOpen className="w-5 h-5" />
                                  </div>
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button
                                        variant="ghost" size="icon"
                                        className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity text-slate-400"
                                        onClick={(e) => e.stopPropagation()}
                                      >
                                        <MoreVertical className="w-4 h-4" />
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                      <DropdownMenuItem onClick={(e) => {
                                        e.stopPropagation();
                                        setEditingSubject(subject);
                                        subjectForm.reset({ name: subject.name });
                                        setIsSubjectDialogOpen(true);
                                      }}>
                                        <Edit2 className="w-4 h-4 mr-2" /> Edit
                                      </DropdownMenuItem>
                                      <DropdownMenuItem className="text-destructive" onClick={(e) => {
                                        e.stopPropagation();
                                        handleDeleteSubject(subject.id);
                                      }}>
                                        <Trash2 className="w-4 h-4 mr-2" /> Hapus
                                      </DropdownMenuItem>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                </div>

                                <div>
                                  <h3 className="font-bold text-lg text-slate-800 line-clamp-1">{subject.name}</h3>
                                  <div className="flex items-center gap-2 mt-2">
                                    <span className="inline-flex items-center gap-1 text-xs font-semibold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md">
                                      <FileText className="w-3 h-3" /> Dokumen
                                    </span>
                                    <span className="inline-flex items-center gap-1 text-xs font-semibold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md">
                                      <Target className="w-3 h-3" /> TP
                                    </span>
                                  </div>
                                </div>

                                <div className="mt-auto pt-3 border-t border-slate-100 flex items-center gap-2.5">
                                  <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-600">
                                    {me?.name?.split(" ").map((n: string) => n[0]).join("").substring(0, 2) ?? "G"}
                                  </div>
                                  <span className="text-xs font-medium text-slate-600 truncate">{me?.name}</span>
                                </div>
                              </div>
                            </StaggerItem>
                          );
                        })
                      )}
                    </StaggerContainer>
                  </div>

                  {/* Recent activity sidebar */}
                  {(subjects?.length ?? 0) > 0 && (
                    <div className="w-full lg:w-72 shrink-0">
                      <h2 className="text-sm font-bold text-slate-700 flex items-center gap-2 mb-3 px-1">
                        <History className="w-4 h-4 text-slate-400" />
                        Mata Pelajaran
                      </h2>
                      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                        <div className="divide-y divide-slate-100">
                          {subjects?.map((subject: any, idx: number) => {
                            const folderColors = ["blue", "emerald", "violet", "amber", "blue", "emerald"] as const;
                            const colorKey = folderColors[idx % folderColors.length];
                            const iconColors: Record<string, string> = {
                              blue: "bg-blue-100 text-blue-600",
                              emerald: "bg-emerald-100 text-emerald-600",
                              violet: "bg-violet-100 text-violet-600",
                              amber: "bg-amber-100 text-amber-600",
                            };
                            return (
                              <div
                                key={subject.id}
                                className="flex items-center gap-3 p-3.5 hover:bg-slate-50 cursor-pointer transition-colors"
                                onClick={() => setSelectedSubject(subject.id)}
                              >
                                <div className={`p-2 rounded-lg ${iconColors[colorKey]}`}>
                                  <FolderOpen className="w-4 h-4" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-bold text-slate-800 truncate">{subject.name}</p>
                                  <p className="text-xs text-slate-400 mt-0.5">Klik untuk buka dokumen</p>
                                </div>
                                <ChevronRight className="w-4 h-4 text-slate-300 shrink-0" />
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}

            {/* Document & TP tabs inside a subject */}
            {selectedSubject && (
              <Tabs value={innerTab} onValueChange={(v) => setInnerTab(v as "dokumen" | "tp")}>
                <TabsList>
                  <TabsTrigger value="dokumen">Dokumen</TabsTrigger>
                  <TabsTrigger value="tp">Tujuan Pembelajaran</TabsTrigger>
                </TabsList>
                <TabsContent value="dokumen">
                  <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
                    {isLoadingDocuments ? (
                      <div className="p-4 space-y-4"><Skeleton className="h-12 w-full" /><Skeleton className="h-12 w-full" /></div>
                    ) : documents?.length === 0 ? (
                      <div className="py-16 text-center text-muted-foreground">
                        <FileText className="w-12 h-12 mx-auto mb-3 text-muted-foreground/30" />
                        <p>Belum ada dokumen untuk mata pelajaran ini.</p>
                      </div>
                    ) : (
                      <div className="divide-y divide-border">
                        {documents?.map((doc: any) => (
                          <div key={doc.id} className="flex items-center justify-between p-4 hover:bg-muted/30 transition-colors">
                            <div className="flex items-center gap-4">
                              <div className="w-10 h-10 rounded bg-gray-100 flex items-center justify-center text-gray-500">
                                <FileText className="w-5 h-5" />
                              </div>
                              <div>
                                <h4 className="font-medium">{doc.name}</h4>
                                <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                                  <span>{format(new Date(doc.uploadedAt), "dd MMM yyyy")}</span>
                                  {doc.fileSize ? <><span>•</span><span>{formatFileSize(doc.fileSize)}</span></> : null}
                                  {doc.description ? <><span>•</span><span className="line-clamp-1">{doc.description}</span></> : null}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-1">
                              <Button variant="ghost" size="icon" className="text-muted-foreground hover:bg-muted" disabled={downloadingId === doc.id} onClick={() => handleDownloadDocument(doc)}>
                                {downloadingId === doc.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                              </Button>
                              <Button variant="ghost" size="icon" className="text-destructive hover:bg-destructive/10" onClick={() => handleDeleteDocument(doc.id)}>
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </TabsContent>
                <TabsContent value="tp">
                  <TujuanPembelajaranTab subjectId={selectedSubject} />
                </TabsContent>
              </Tabs>
            )}
          </div>
        )}

        {pageTab === "bahan-ajar" && (
          <BahanAjarTab isAdmin={isAdmin} currentUserId={(me as any)?.id} subjects={subjects} me={me} />
        )}

      </div>
    </Layout>
  );
}
