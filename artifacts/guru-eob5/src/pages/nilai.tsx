import { Layout } from "@/components/layout";
import { useListGrades, useCreateGrade, useListSubjects, useListStudents } from "@workspace/api-client-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Plus } from "lucide-react";
import { format } from "date-fns";
import { useQueryClient } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";

const gradeSchema = z.object({
  studentId: z.string().min(1, "Siswa harus dipilih"),
  subjectId: z.string().min(1, "Mata pelajaran harus dipilih"),
  jenis: z.enum(["tugas", "uts", "uas"]),
  nilai: z.coerce.number().min(0).max(100),
  tanggal: z.string().min(1, "Tanggal harus diisi"),
});

export default function Nilai() {
  const { data: subjects } = useListSubjects();
  const { data: students } = useListStudents();
  const [selectedSubject, setSelectedSubject] = useState<string>("");
  
  const { data: gradesList, isLoading } = useListGrades(
    { subjectId: selectedSubject || undefined },
    { query: { queryKey: ["/api/grades", selectedSubject] } }
  );

  const createGrade = useCreateGrade();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<z.infer<typeof gradeSchema>>({
    resolver: zodResolver(gradeSchema),
    defaultValues: { studentId: "", subjectId: "", jenis: "tugas", nilai: 0, tanggal: new Date().toISOString().split("T")[0] },
  });

  const onSubmit = async (data: z.infer<typeof gradeSchema>) => {
    try {
      await createGrade.mutateAsync({ data });
      toast({ title: "Berhasil", description: "Nilai dicatat" });
      setIsDialogOpen(false);
      form.reset();
      queryClient.invalidateQueries({ queryKey: ["/api/grades"] });
    } catch {
      toast({ variant: "destructive", title: "Gagal", description: "Terjadi kesalahan" });
    }
  };

  return (
    <Layout>
      <div className="space-y-6 animate-in fade-in duration-500">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold font-serif">Data Nilai</h1>
            <p className="text-muted-foreground mt-1">Catat dan pantau nilai akademik siswa.</p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button><Plus className="w-4 h-4 mr-2" /> Input Nilai</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Input Nilai</DialogTitle></DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField control={form.control} name="studentId" render={({ field }) => (
                    <FormItem><FormLabel>Siswa</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl><SelectTrigger><SelectValue placeholder="Pilih Siswa" /></SelectTrigger></FormControl>
                        <SelectContent>{students?.map((s:any) => <SelectItem key={s.id} value={s.id}>{s.namaLengkap}</SelectItem>)}</SelectContent>
                      </Select><FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="subjectId" render={({ field }) => (
                    <FormItem><FormLabel>Mata Pelajaran</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl><SelectTrigger><SelectValue placeholder="Pilih Mapel" /></SelectTrigger></FormControl>
                        <SelectContent>{subjects?.map((s:any) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
                      </Select><FormMessage />
                    </FormItem>
                  )} />
                  <div className="grid grid-cols-2 gap-4">
                    <FormField control={form.control} name="jenis" render={({ field }) => (
                      <FormItem><FormLabel>Jenis Nilai</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl><SelectTrigger><SelectValue placeholder="Pilih Jenis" /></SelectTrigger></FormControl>
                          <SelectContent>
                            <SelectItem value="tugas">Tugas</SelectItem>
                            <SelectItem value="uts">UTS</SelectItem>
                            <SelectItem value="uas">UAS</SelectItem>
                          </SelectContent>
                        </Select><FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="nilai" render={({ field }) => (
                      <FormItem><FormLabel>Nilai</FormLabel><FormControl><Input type="number" min="0" max="100" {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                  </div>
                  <FormField control={form.control} name="tanggal" render={({ field }) => (
                    <FormItem><FormLabel>Tanggal</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <DialogFooter><Button type="submit" disabled={createGrade.isPending}>Simpan</Button></DialogFooter>
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
                <TableHead>Nama Siswa</TableHead>
                <TableHead>Mata Pelajaran</TableHead>
                <TableHead>Jenis</TableHead>
                <TableHead>Nilai</TableHead>
                <TableHead>Tanggal</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array(3).fill(0).map((_, i) => <TableRow key={i}><TableCell colSpan={5}><Skeleton className="h-6 w-full" /></TableCell></TableRow>)
              ) : !gradesList?.length ? (
                <TableRow><TableCell colSpan={5} className="h-24 text-center text-muted-foreground">Belum ada data nilai.</TableCell></TableRow>
              ) : (
                gradesList.map((g:any) => (
                  <TableRow key={g.id}>
                    <TableCell className="font-medium">{students?.find((s:any) => s.id === g.studentId)?.namaLengkap}</TableCell>
                    <TableCell>{subjects?.find((s:any) => s.id === g.subjectId)?.name}</TableCell>
                    <TableCell className="uppercase text-muted-foreground text-xs font-semibold">{g.jenis}</TableCell>
                    <TableCell className="font-bold text-primary">{g.nilai}</TableCell>
                    <TableCell className="text-muted-foreground">{format(new Date(g.tanggal), "dd MMM yyyy")}</TableCell>
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