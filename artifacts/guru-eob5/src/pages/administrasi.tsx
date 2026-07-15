import { useState } from "react";
import { Layout } from "@/components/layout";
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
  Folder, FileText, Plus, ArrowLeft, Trash2, Edit2, MoreVertical, Upload,
  BookOpen, Download, Loader2, Link as LinkIcon, ExternalLink,
} from "lucide-react";
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

const subjectSchema = z.object({ name: z.string().min(1, "Nama mata pelajaran harus diisi") });
const documentSchema = z.object({
  name: z.string().min(1, "Nama dokumen harus diisi"),
  description: z.string().optional(),
});
const bahanAjarSchema = z.object({
  judul: z.string().min(1, "Judul harus diisi"),
  mataPelajaran: z.string().optional(),
  kelas: z.string().optional(),
  deskripsi: z.string().optional(),
  linkUrl: z.string().url("URL tidak valid").optional().or(z.literal("")),
});

type SubjectFormValues = z.infer<typeof subjectSchema>;
type DocumentFormValues = z.infer<typeof documentSchema>;
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
function BahanAjarTab({ isAdmin }: { isAdmin: boolean }) {
  const { data: items, isLoading } = useBahanAjar();
  const createBA = useCreateBahanAjar();
  const deleteBA = useDeleteBahanAjar();
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

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

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-muted-foreground text-sm">
          <BookOpen className="w-4 h-4" />
          <span>
            Dapat dilihat oleh semua guru, wali kelas, wakasek, dan kepala sekolah.
            {isAdmin && " Hanya admin yang dapat mengelola."}
          </span>
        </div>
        {isAdmin && (
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
                      <FormItem><FormLabel>Mata Pelajaran</FormLabel><FormControl><Input placeholder="Misal: Matematika" {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={form.control} name="kelas" render={({ field }) => (
                      <FormItem><FormLabel>Kelas</FormLabel><FormControl><Input placeholder="Misal: 7A" {...field} /></FormControl><FormMessage /></FormItem>
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
        )}
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array(3).fill(0).map((_, i) => <Skeleton key={i} className="h-40 rounded-xl" />)}
        </div>
      ) : !items?.length ? (
        <div className="py-16 text-center text-muted-foreground bg-white rounded-xl border border-dashed border-border">
          <BookOpen className="w-12 h-12 mx-auto mb-3 text-muted-foreground/30" />
          <p>Belum ada bahan ajar.</p>
          {isAdmin && <p className="text-sm mt-1">Klik "Tambah Bahan Ajar" untuk memulai.</p>}
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
                  {isAdmin && (
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
                      <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                        <a href={item.linkUrl} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      </Button>
                    )}
                    {item.fileName && (
                      <Button
                        variant="ghost" size="icon" className="h-8 w-8"
                        disabled={downloadingId === item.id}
                        onClick={() => handleDownload(item)}
                      >
                        {downloadingId === item.id
                          ? <Loader2 className="w-4 h-4 animate-spin" />
                          : <Download className="w-4 h-4" />}
                      </Button>
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

  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);
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
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const subjectForm = useForm<SubjectFormValues>({
    resolver: zodResolver(subjectSchema),
    defaultValues: { name: "" },
  });
  const documentForm = useForm<DocumentFormValues>({
    resolver: zodResolver(documentSchema),
    defaultValues: { name: "", description: "" },
  });

  const isAdmin = (me as any)?.isAdmin === true;

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

  const onDocumentSubmit = async (data: DocumentFormValues) => {
    if (!selectedSubject) return;
    if (!selectedFile) {
      toast({ variant: "destructive", title: "Gagal", description: "Pilih berkas untuk diunggah" });
      return;
    }
    setIsUploading(true);
    try {
      const fileData = await readFileAsBase64(selectedFile);
      await createDocument.mutateAsync({
        data: { ...data, subjectId: selectedSubject, fileData, fileName: selectedFile.name, fileType: selectedFile.type || undefined, fileSize: selectedFile.size },
      });
      toast({ title: "Berhasil", description: "Dokumen berhasil diunggah" });
      setIsDocumentDialogOpen(false);
      documentForm.reset();
      setSelectedFile(null);
      queryClient.invalidateQueries({ queryKey: ["/api/documents"] });
    } catch {
      toast({ variant: "destructive", title: "Gagal", description: "Terjadi kesalahan" });
    } finally {
      setIsUploading(false);
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
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              {selectedSubject && pageTab === "administrasi" && (
                <Button variant="ghost" size="icon" onClick={() => setSelectedSubject(null)} className="mr-2">
                  <ArrowLeft className="w-5 h-5" />
                </Button>
              )}
              <h1 className="text-3xl font-bold tracking-tight font-serif text-foreground">
                {pageTab === "bahan-ajar"
                  ? "Bahan Ajar"
                  : selectedSubject
                    ? "Dokumen Administrasi"
                    : "Administrasi Guru"}
              </h1>
            </div>
            <p className="text-muted-foreground mt-1">
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
                <Button><Plus className="w-4 h-4 mr-2" /> Tambah Mata Pelajaran</Button>
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
            <Dialog open={isDocumentDialogOpen} onOpenChange={(open) => { setIsDocumentDialogOpen(open); if (!open) { documentForm.reset(); setSelectedFile(null); } }}>
              <DialogTrigger asChild>
                <Button><Upload className="w-4 h-4 mr-2" /> Unggah Dokumen</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Unggah Dokumen Baru</DialogTitle></DialogHeader>
                <Form {...documentForm}>
                  <form onSubmit={documentForm.handleSubmit(onDocumentSubmit)} className="space-y-4">
                    <FormField control={documentForm.control} name="name" render={({ field }) => (
                      <FormItem><FormLabel>Nama Dokumen</FormLabel><FormControl><Input placeholder="Misal: RPP Semester 1" {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={documentForm.control} name="description" render={({ field }) => (
                      <FormItem><FormLabel>Keterangan (Opsional)</FormLabel><FormControl><Textarea placeholder="Catatan tambahan" {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <div className="space-y-2">
                      <Label htmlFor="document-file">Berkas</Label>
                      <Input id="document-file" type="file" onChange={(e) => setSelectedFile(e.target.files?.[0] ?? null)} />
                      {selectedFile && <p className="text-xs text-muted-foreground">{selectedFile.name} ({formatFileSize(selectedFile.size)})</p>}
                    </div>
                    <DialogFooter>
                      <Button type="submit" disabled={createDocument.isPending || isUploading}>
                        {isUploading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Mengunggah...</> : "Simpan"}
                      </Button>
                    </DialogFooter>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          )}
        </div>

        {/* Page-level tabs */}
        <Tabs value={pageTab} onValueChange={(v) => { setPageTab(v as any); setSelectedSubject(null); }}>
          <TabsList>
            <TabsTrigger value="administrasi">Administrasi</TabsTrigger>
            <TabsTrigger value="bahan-ajar">Bahan Ajar</TabsTrigger>
          </TabsList>

          {/* ── Tab Administrasi ── */}
          <TabsContent value="administrasi" className="mt-4">
            {/* Subject folder grid */}
            {!selectedSubject && (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {isLoadingSubjects ? (
                  Array(4).fill(0).map((_, i) => <Skeleton key={i} className="h-32 w-full rounded-xl" />)
                ) : subjects?.length === 0 ? (
                  <div className="col-span-full py-12 text-center text-muted-foreground bg-white rounded-xl border border-dashed border-border">
                    <Folder className="w-12 h-12 mx-auto mb-3 text-muted-foreground/30" />
                    <p>Belum ada mata pelajaran.</p>
                  </div>
                ) : (
                  subjects?.map((subject: any) => (
                    <div
                      key={subject.id}
                      className="group relative bg-white border border-border rounded-xl p-5 hover:border-primary/50 hover:shadow-md transition-all cursor-pointer"
                      onClick={() => setSelectedSubject(subject.id)}
                    >
                      <div className="flex justify-between items-start mb-4">
                        <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                          <Folder className="w-5 h-5 fill-current opacity-20" />
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setEditingSubject(subject); subjectForm.reset({ name: subject.name }); setIsSubjectDialogOpen(true); }}>
                              <Edit2 className="w-4 h-4 mr-2" /> Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-destructive" onClick={(e) => { e.stopPropagation(); handleDeleteSubject(subject.id); }}>
                              <Trash2 className="w-4 h-4 mr-2" /> Hapus
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                      <h3 className="font-semibold text-lg line-clamp-1">{subject.name}</h3>
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-1">Guru: {me?.name}</p>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Document & TP tabs inside a subject */}
            {selectedSubject && (
              <Tabs value={innerTab} onValueChange={(v) => setInnerTab(v as "dokumen" | "tp")}>
                <TabsList>
                  <TabsTrigger value="dokumen">Dokumen</TabsTrigger>
                  <TabsTrigger value="tp">Tujuan Pembelajaran</TabsTrigger>
                </TabsList>
                <TabsContent value="dokumen">
                  <div className="bg-white border border-border rounded-xl overflow-hidden shadow-sm">
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
                          <div key={doc.id} className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors">
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
          </TabsContent>

          {/* ── Tab Bahan Ajar ── */}
          <TabsContent value="bahan-ajar" className="mt-4">
            <BahanAjarTab isAdmin={isAdmin} />
          </TabsContent>
        </Tabs>

      </div>
    </Layout>
  );
}
