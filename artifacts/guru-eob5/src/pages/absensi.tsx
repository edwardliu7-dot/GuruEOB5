import { Layout } from "@/components/layout";
import { useListAttendance, useBulkCreateAttendance, useListSubjects, useListStudents } from "@workspace/api-client-react";
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
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";

const attendanceSchema = z.object({
  studentIds: z.array(z.string()).min(1, "Pilih minimal satu siswa"),
  subjectId: z.string().min(1, "Mata pelajaran harus dipilih"),
  tanggal: z.string().min(1, "Tanggal harus diisi"),
  status: z.enum(["hadir", "izin", "sakit", "alpa"]),
});

export default function Absensi() {
  const { data: subjects } = useListSubjects();
  const { data: students } = useListStudents();
  const [selectedSubject, setSelectedSubject] = useState<string>("");

  const subjectFilter = selectedSubject && selectedSubject !== "all" ? selectedSubject : undefined;
  const { data: attendanceList, isLoading } = useListAttendance(
    { subjectId: subjectFilter },
    { query: { queryKey: ["/api/attendance", subjectFilter ?? ""] } }
  );

  const bulkCreateAttendance = useBulkCreateAttendance();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [kelasFilter, setKelasFilter] = useState<string>("all");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<z.infer<typeof attendanceSchema>>({
    resolver: zodResolver(attendanceSchema),
    defaultValues: { studentIds: [], subjectId: "", tanggal: new Date().toISOString().split("T")[0], status: "hadir" },
  });

  const kelasList = [...new Set((students ?? []).map((s: any) => s.kelas))].sort();
  const visibleStudents = (students ?? []).filter(
    (s: any) => kelasFilter === "all" || s.kelas === kelasFilter,
  );

  const onSubmit = async (data: z.infer<typeof attendanceSchema>) => {
    try {
      const result = await bulkCreateAttendance.mutateAsync({ data });
      toast({ title: "Berhasil", description: `Kehadiran dicatat untuk ${result.count} siswa` });
      setIsDialogOpen(false);
      form.reset();
      setKelasFilter("all");
      queryClient.invalidateQueries({ queryKey: ["/api/attendance"] });
    } catch {
      toast({ variant: "destructive", title: "Gagal", description: "Terjadi kesalahan" });
    }
  };

  const statusColors: Record<string, string> = {
    hadir: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
    izin: "bg-blue-500/10 text-blue-600 border-blue-500/20",
    sakit: "bg-amber-500/10 text-amber-600 border-amber-500/20",
    alpa: "bg-rose-500/10 text-rose-600 border-rose-500/20",
  };

  return (
    <Layout>
      <div className="space-y-6 animate-in fade-in duration-500">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold font-serif">Absensi</h1>
            <p className="text-muted-foreground mt-1">Kelola kehadiran siswa.</p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button><Plus className="w-4 h-4 mr-2" /> Catat Kehadiran</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Catat Kehadiran</DialogTitle></DialogHeader>
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
                  <FormField control={form.control} name="subjectId" render={({ field }) => (
                    <FormItem><FormLabel>Mata Pelajaran</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl><SelectTrigger><SelectValue placeholder="Pilih Mapel" /></SelectTrigger></FormControl>
                        <SelectContent>{subjects?.map((s:any) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
                      </Select><FormMessage />
                    </FormItem>
                  )} />
                  <div className="grid grid-cols-2 gap-4">
                    <FormField control={form.control} name="tanggal" render={({ field }) => (
                      <FormItem><FormLabel>Tanggal</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={form.control} name="status" render={({ field }) => (
                      <FormItem><FormLabel>Status</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl><SelectTrigger><SelectValue placeholder="Pilih Status" /></SelectTrigger></FormControl>
                          <SelectContent>
                            <SelectItem value="hadir">Hadir</SelectItem>
                            <SelectItem value="izin">Izin</SelectItem>
                            <SelectItem value="sakit">Sakit</SelectItem>
                            <SelectItem value="alpa">Alpa</SelectItem>
                          </SelectContent>
                        </Select><FormMessage />
                      </FormItem>
                    )} />
                  </div>
                  <DialogFooter><Button type="submit" disabled={bulkCreateAttendance.isPending}>Simpan</Button></DialogFooter>
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
                <TableHead>Nama Siswa</TableHead>
                <TableHead>Mata Pelajaran</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array(3).fill(0).map((_, i) => <TableRow key={i}><TableCell colSpan={4}><Skeleton className="h-6 w-full" /></TableCell></TableRow>)
              ) : !attendanceList?.length ? (
                <TableRow><TableCell colSpan={4} className="h-24 text-center text-muted-foreground">Belum ada data kehadiran.</TableCell></TableRow>
              ) : (
                attendanceList.map((a:any) => (
                  <TableRow key={a.id}>
                    <TableCell>{format(new Date(a.tanggal), "dd MMM yyyy")}</TableCell>
                    <TableCell className="font-medium">{students?.find((s:any) => s.id === a.studentId)?.namaLengkap}</TableCell>
                    <TableCell>{subjects?.find((s:any) => s.id === a.subjectId)?.name}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={`${statusColors[a.status]} capitalize`}>
                        {a.status}
                      </Badge>
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
