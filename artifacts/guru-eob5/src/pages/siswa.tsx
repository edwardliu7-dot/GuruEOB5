import { useState, useRef } from "react";
import { Layout } from "@/components/layout";
import { useListStudents, useCreateStudent, useUpdateStudent, useDeleteStudent } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useToast } from "@/hooks/use-toast";
import { Search, Plus, Trash2, Edit2, Download, Upload } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQueryClient } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";

const studentSchema = z.object({
  nisn: z.string().optional(),
  namaLengkap: z.string().min(1, "Nama lengkap harus diisi"),
  kelas: z.string().min(1, "Kelas harus diisi"),
  jenisKelamin: z.enum(["L", "P"]),
  school: z.string().min(1, "Nama sekolah harus diisi"),
});

type StudentFormValues = z.infer<typeof studentSchema>;

export default function Siswa() {
  const [search, setSearch] = useState("");
  const { data: students, isLoading } = useListStudents({ search: search || undefined }, { query: { queryKey: ["/api/students", search] } });
  const createStudent = useCreateStudent();
  const updateStudent = useUpdateStudent();
  const deleteStudent = useDeleteStudent();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<any | null>(null);

  const { toast } = useToast();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<StudentFormValues>({
    resolver: zodResolver(studentSchema),
    defaultValues: { nisn: "", namaLengkap: "", kelas: "", jenisKelamin: "L", school: "Sekolah" },
  });

  const onSubmit = async (data: StudentFormValues) => {
    try {
      if (editingStudent) {
        await updateStudent.mutateAsync({ id: editingStudent.id, data });
        toast({ title: "Berhasil", description: "Data siswa diperbarui" });
      } else {
        await createStudent.mutateAsync({ data });
        toast({ title: "Berhasil", description: "Data siswa ditambahkan" });
      }
      setIsDialogOpen(false);
      form.reset();
      setEditingStudent(null);
      queryClient.invalidateQueries({ queryKey: ["/api/students"] });
    } catch (e) {
      toast({ variant: "destructive", title: "Gagal", description: "Terjadi kesalahan" });
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("Yakin ingin menghapus siswa ini?")) {
      try {
        await deleteStudent.mutateAsync({ id });
        queryClient.invalidateQueries({ queryKey: ["/api/students"] });
        toast({ title: "Berhasil", description: "Data siswa dihapus" });
      } catch (e) {
        toast({ variant: "destructive", title: "Gagal", description: "Terjadi kesalahan" });
      }
    }
  };

  const handleExportCSV = () => {
    if (!students || students.length === 0) return;
    const headers = ["NISN", "Nama Lengkap", "Kelas", "L/P", "Sekolah"];
    const csvContent = [
      headers.join(","),
      ...students.map((s:any) => `"${s.nisn||""}","${s.namaLengkap}","${s.kelas}","${s.jenisKelamin}","${s.school}"`)
    ].join("\n");
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", "data_siswa.csv");
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleImportCSV = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const text = event.target?.result as string;
        const rows = text.split('\n').map(row => row.split(',').map(cell => cell.replace(/^"|"$/g, '').trim()));
        
        let successCount = 0;
        // Skip header row
        for (let i = 1; i < rows.length; i++) {
          if (rows[i].length < 5) continue; // Skip malformed rows
          const [nisn, namaLengkap, kelas, jenisKelamin, school] = rows[i];
          if (namaLengkap && kelas && school) {
            await createStudent.mutateAsync({
              data: { nisn, namaLengkap, kelas, jenisKelamin: jenisKelamin === "P" ? "P" : "L", school }
            });
            successCount++;
          }
        }
        toast({ title: "Import Berhasil", description: `${successCount} data siswa ditambahkan` });
        queryClient.invalidateQueries({ queryKey: ["/api/students"] });
      } catch (err) {
        toast({ variant: "destructive", title: "Gagal Import", description: "Format CSV tidak valid" });
      }
      if (fileInputRef.current) fileInputRef.current.value = "";
    };
    reader.readAsText(file);
  };

  return (
    <Layout>
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight font-serif text-foreground">Data Siswa</h1>
            <p className="text-muted-foreground mt-1">Kelola direktori siswa, tambah, edit, atau ekspor data.</p>
          </div>
          <div className="flex items-center gap-2">
            <input 
              type="file" 
              accept=".csv" 
              className="hidden" 
              ref={fileInputRef} 
              onChange={handleImportCSV} 
            />
            <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
              <Upload className="w-4 h-4 mr-2" /> Import
            </Button>
            <Button variant="outline" onClick={handleExportCSV} disabled={!students?.length}>
              <Download className="w-4 h-4 mr-2" /> Ekspor
            </Button>
            <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if(!open){ setEditingStudent(null); form.reset(); } }}>
              <DialogTrigger asChild>
                <Button><Plus className="w-4 h-4 mr-2" /> Tambah Siswa</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{editingStudent ? "Edit Data Siswa" : "Tambah Data Siswa"}</DialogTitle>
                </DialogHeader>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField
                      control={form.control}
                      name="nisn"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>NISN</FormLabel>
                          <FormControl>
                            <Input placeholder="Opsional" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="namaLengkap"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nama Lengkap</FormLabel>
                          <FormControl>
                            <Input placeholder="Misal: Budi Santoso" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="kelas"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Kelas</FormLabel>
                            <FormControl>
                              <Input placeholder="Misal: X-A" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="jenisKelamin"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Jenis Kelamin</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Pilih" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="L">Laki-laki (L)</SelectItem>
                                <SelectItem value="P">Perempuan (P)</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <FormField
                      control={form.control}
                      name="school"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Sekolah</FormLabel>
                          <FormControl>
                            <Input placeholder="Nama Sekolah" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <DialogFooter>
                      <Button type="submit" disabled={createStudent.isPending || updateStudent.isPending}>Simpan</Button>
                    </DialogFooter>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <div className="bg-white border border-border rounded-xl shadow-sm overflow-hidden flex flex-col">
          <div className="p-4 border-b border-border bg-gray-50/50">
            <div className="relative max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input 
                placeholder="Cari nama atau NISN..." 
                className="pl-9 bg-white"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50/50">
                  <TableHead className="w-[100px]">NISN</TableHead>
                  <TableHead>Nama Lengkap</TableHead>
                  <TableHead>Kelas</TableHead>
                  <TableHead>L/P</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array(5).fill(0).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-10" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-8" /></TableCell>
                      <TableCell><Skeleton className="h-8 w-16 ml-auto" /></TableCell>
                    </TableRow>
                  ))
                ) : students?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-32 text-center text-muted-foreground">
                      Tidak ada data siswa ditemukan.
                    </TableCell>
                  </TableRow>
                ) : (
                  students?.map((student: any) => (
                    <TableRow key={student.id} className="hover:bg-gray-50/50">
                      <TableCell className="font-medium text-muted-foreground">{student.nisn || "-"}</TableCell>
                      <TableCell className="font-medium">{student.namaLengkap}</TableCell>
                      <TableCell>{student.kelas}</TableCell>
                      <TableCell>{student.jenisKelamin}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 text-muted-foreground hover:text-foreground"
                            onClick={() => {
                              setEditingStudent(student);
                              form.reset({
                                nisn: student.nisn || "",
                                namaLengkap: student.namaLengkap,
                                kelas: student.kelas,
                                jenisKelamin: student.jenisKelamin,
                                school: student.school
                              });
                              setIsDialogOpen(true);
                            }}
                          >
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 text-destructive hover:bg-destructive/10"
                            onClick={() => handleDelete(student.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>
    </Layout>
  );
}
