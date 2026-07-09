import { Layout } from "@/components/layout";
import { useListJournalEntries, useCreateJournalEntry, useDeleteJournalEntry, useListSubjects } from "@workspace/api-client-react";
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
import { Plus, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { useQueryClient } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";

const journalSchema = z.object({
  subjectId: z.string().min(1, "Mata pelajaran harus dipilih"),
  tanggal: z.string().min(1, "Tanggal harus diisi"),
  kelas: z.string().min(1, "Kelas harus diisi"),
  materi: z.string().min(1, "Materi harus diisi"),
  catatan: z.string().optional(),
});

export default function Jurnal() {
  const { data: subjects } = useListSubjects();
  const [selectedSubject, setSelectedSubject] = useState<string>("");
  const { data: journals, isLoading } = useListJournalEntries(
    { subjectId: selectedSubject || undefined },
    { query: { queryKey: ["/api/journal", selectedSubject] } }
  );

  const createJournal = useCreateJournalEntry();
  const deleteJournal = useDeleteJournalEntry();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<z.infer<typeof journalSchema>>({
    resolver: zodResolver(journalSchema),
    defaultValues: { subjectId: "", tanggal: new Date().toISOString().split("T")[0], kelas: "", materi: "", catatan: "" },
  });

  const onSubmit = async (data: z.infer<typeof journalSchema>) => {
    try {
      await createJournal.mutateAsync({ data });
      toast({ title: "Berhasil", description: "Jurnal ditambahkan" });
      setIsDialogOpen(false);
      form.reset();
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
      <div className="space-y-6 animate-in fade-in duration-500">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold font-serif">Jurnal Mengajar</h1>
            <p className="text-muted-foreground mt-1">Catatan harian pelaksanaan pembelajaran.</p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button><Plus className="w-4 h-4 mr-2" /> Tambah Jurnal</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Tambah Jurnal Mengajar</DialogTitle></DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField control={form.control} name="subjectId" render={({ field }) => (
                    <FormItem><FormLabel>Mata Pelajaran</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
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
                      <FormItem><FormLabel>Kelas</FormLabel><FormControl><Input placeholder="X-A" {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                  </div>
                  <FormField control={form.control} name="materi" render={({ field }) => (
                    <FormItem><FormLabel>Materi</FormLabel><FormControl><Input placeholder="Topik bahasan" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="catatan" render={({ field }) => (
                    <FormItem><FormLabel>Catatan (Opsional)</FormLabel><FormControl><Textarea placeholder="Keterangan tambahan" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <DialogFooter><Button type="submit" disabled={createJournal.isPending}>Simpan</Button></DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="bg-white border border-border rounded-xl shadow-sm overflow-hidden flex flex-col">
          <div className="p-4 border-b border-border bg-gray-50/50 flex gap-4">
             <Select value={selectedSubject} onValueChange={setSelectedSubject}>
              <SelectTrigger className="w-[250px] bg-white"><SelectValue placeholder="Semua Mata Pelajaran" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Mata Pelajaran</SelectItem>
                {subjects?.map((s:any) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50/50">
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
                journals.map((j:any) => (
                  <TableRow key={j.id}>
                    <TableCell>{format(new Date(j.tanggal), "dd MMM yyyy")}</TableCell>
                    <TableCell>{subjects?.find((s:any) => s.id === j.subjectId)?.name}</TableCell>
                    <TableCell>{j.kelas}</TableCell>
                    <TableCell>{j.materi}</TableCell>
                    <TableCell className="text-muted-foreground max-w-[200px] truncate">{j.catatan || "-"}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleDelete(j.id)}><Trash2 className="w-4 h-4" /></Button>
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