import { Layout } from "@/components/layout";
import {
  useListPoints,
  useBulkCreatePoints,
  useUpdatePoint,
  useDeletePoint,
  useListStudents,
} from "@workspace/api-client-react";
import { useState } from "react";
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
import { Plus, ArrowUpRight, ArrowDownRight, Pencil, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { useQueryClient } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { Checkbox } from "@/components/ui/checkbox";

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

export default function Poin() {
  const { data: students } = useListStudents();
  const { data: pointsList, isLoading } = useListPoints();
  const bulkCreatePoints = useBulkCreatePoints();
  const updatePoint = useUpdatePoint();
  const deletePoint = useDeletePoint();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [kelasFilter, setKelasFilter] = useState<string>("all");
  const [editingPoint, setEditingPoint] = useState<string | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const editForm = useForm<z.infer<typeof editPointSchema>>({
    resolver: zodResolver(editPointSchema),
    defaultValues: { jenis: "positif", poin: 5, keterangan: "", tanggal: new Date().toISOString().split("T")[0] },
  });

  const invalidatePoints = () => queryClient.invalidateQueries({ queryKey: ["/api/points"] });

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

  const form = useForm<z.infer<typeof pointSchema>>({
    resolver: zodResolver(pointSchema),
    defaultValues: { studentIds: [], jenis: "positif", poin: 5, keterangan: "", tanggal: new Date().toISOString().split("T")[0] },
  });

  const kelasList = [...new Set((students ?? []).map((s: any) => s.kelas))].sort();
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

  return (
    <Layout>
      <div className="space-y-6 animate-in fade-in duration-500">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold font-serif">Poin Siswa</h1>
            <p className="text-muted-foreground mt-1">Buku catatan poin pelanggaran dan prestasi.</p>
          </div>
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
                                if (checked) {
                                  field.onChange([...new Set([...field.value, ...visibleIds])]);
                                } else {
                                  field.onChange(field.value.filter((id: string) => !visibleIds.includes(id)));
                                }
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
                                      checked
                                        ? [...field.value, s.id]
                                        : field.value.filter((id: string) => id !== s.id),
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
              ) : !pointsList?.length ? (
                <TableRow><TableCell colSpan={5} className="h-24 text-center text-muted-foreground">Belum ada catatan poin.</TableCell></TableRow>
              ) : (
                pointsList.map((p:any) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium">{students?.find((s:any) => s.id === p.studentId)?.namaLengkap}</TableCell>
                    <TableCell>
                      <div className={`flex items-center gap-1 font-bold ${p.jenis === 'positif' ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {p.jenis === 'positif' ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
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
      </div>
    </Layout>
  );
}