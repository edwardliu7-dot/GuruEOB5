import { useState, useRef } from "react";
import * as XLSX from "xlsx";
import { Layout } from "@/components/layout";
import {
  useListStudents,
  useCreateStudent,
  useUpdateStudent,
  useDeleteStudent,
  useAnalyzeStudentImport,
  useBulkCreateStudents,
} from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useToast } from "@/hooks/use-toast";
import {
  Search,
  Plus,
  Trash2,
  Edit2,
  Download,
  Upload,
  Loader2,
  Sparkles,
  ChevronRight,
  Users,
  User,
  Pencil,
  ChevronDown,
  Filter,
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useQueryClient } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { KELAS_OPTIONS } from "@/lib/options";

const studentSchema = z.object({
  nisn: z.string().optional(),
  namaLengkap: z.string().min(1, "Nama lengkap harus diisi"),
  kelas: z.string().min(1, "Kelas harus diisi"),
  jenisKelamin: z.enum(["L", "P"]),
  school: z.string().min(1, "Nama sekolah harus diisi"),
});

type StudentFormValues = z.infer<typeof studentSchema>;

type ImportRow = {
  nisn?: string;
  namaLengkap: string;
  kelas: string;
  jenisKelamin: "L" | "P";
  school: string;
};

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

const AVATAR_COLORS = [
  "bg-blue-100 text-blue-700",
  "bg-pink-100 text-pink-700",
  "bg-orange-100 text-orange-700",
  "bg-purple-100 text-purple-700",
  "bg-indigo-100 text-indigo-700",
  "bg-rose-100 text-rose-700",
  "bg-teal-100 text-teal-700",
  "bg-emerald-100 text-emerald-700",
  "bg-amber-100 text-amber-700",
  "bg-cyan-100 text-cyan-700",
];

function getAvatarColor(index: number): string {
  return AVATAR_COLORS[index % AVATAR_COLORS.length];
}

export default function Siswa() {
  const [search, setSearch] = useState("");
  const [kelasFilter, setKelasFilter] = useState("");
  const [genderFilter, setGenderFilter] = useState("");

  const { data: students, isLoading } = useListStudents(
    { search: search || undefined },
    { query: { queryKey: ["/api/students", search] } }
  );

  const createStudent = useCreateStudent();
  const updateStudent = useUpdateStudent();
  const deleteStudent = useDeleteStudent();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<any | null>(null);

  const analyzeImport = useAnalyzeStudentImport();
  const bulkCreate = useBulkCreateStudents();
  const [importRows, setImportRows] = useState<ImportRow[]>([]);
  const [isVerifyOpen, setIsVerifyOpen] = useState(false);

  const { toast } = useToast();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<StudentFormValues>({
    resolver: zodResolver(studentSchema),
    defaultValues: {
      nisn: "",
      namaLengkap: "",
      kelas: "",
      jenisKelamin: "L",
      school: "Sekolah",
    },
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
    } catch {
      toast({
        variant: "destructive",
        title: "Gagal",
        description: "Terjadi kesalahan",
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("Yakin ingin menghapus siswa ini?")) {
      try {
        await deleteStudent.mutateAsync({ id });
        queryClient.invalidateQueries({ queryKey: ["/api/students"] });
        toast({ title: "Berhasil", description: "Data siswa dihapus" });
      } catch {
        toast({
          variant: "destructive",
          title: "Gagal",
          description: "Terjadi kesalahan",
        });
      }
    }
  };

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (fileInputRef.current) fileInputRef.current.value = "";
    if (!file) return;

    try {
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: "array" });

      const rows: string[][] = [];
      for (const sheetName of workbook.SheetNames) {
        const sheet = workbook.Sheets[sheetName];
        if (!sheet) continue;
        const sheetRows = XLSX.utils.sheet_to_json<unknown[]>(sheet, {
          header: 1,
          raw: false,
          defval: "",
        });
        for (const row of sheetRows) {
          rows.push(row.map((cell) => String(cell ?? "").trim()));
        }
      }

      const nonEmpty = rows.filter((row) => row.some((cell) => cell !== ""));
      if (nonEmpty.length === 0) {
        toast({
          variant: "destructive",
          title: "Gagal Import",
          description: "File tidak berisi data",
        });
        return;
      }
      if (nonEmpty.length > 1000) {
        toast({
          variant: "destructive",
          title: "Gagal Import",
          description: "Maksimal 1000 baris per import",
        });
        return;
      }

      const result = await analyzeImport.mutateAsync({
        data: { rows: nonEmpty },
      });
      if (result.students.length === 0) {
        toast({
          variant: "destructive",
          title: "Gagal Import",
          description: "AI tidak menemukan data siswa pada file ini",
        });
        return;
      }
      setImportRows(result.students as ImportRow[]);
      setIsVerifyOpen(true);
    } catch (err: any) {
      const message =
        err?.data?.error ?? "File tidak dapat dibaca. Pastikan formatnya benar.";
      toast({ variant: "destructive", title: "Gagal Import", description: message });
    }
  };

  const updateImportRow = (index: number, patch: Partial<ImportRow>) => {
    setImportRows((rows) =>
      rows.map((row, i) => (i === index ? { ...row, ...patch } : row))
    );
  };

  const removeImportRow = (index: number) => {
    setImportRows((rows) => rows.filter((_, i) => i !== index));
  };

  const handleConfirmImport = async () => {
    const invalid = importRows.some(
      (r) => !r.namaLengkap.trim() || !r.kelas.trim() || !r.school.trim()
    );
    if (invalid) {
      toast({
        variant: "destructive",
        title: "Data belum lengkap",
        description: "Nama, kelas, dan sekolah wajib diisi pada setiap baris",
      });
      return;
    }
    const invalidKelas = importRows.filter(
      (r) => !(KELAS_OPTIONS as readonly string[]).includes(r.kelas)
    );
    if (invalidKelas.length > 0) {
      toast({
        variant: "destructive",
        title: "Kelas tidak valid",
        description: `${invalidKelas.length} siswa memiliki kelas yang belum dipilih. Pilih kelas yang benar dari dropdown sebelum menyimpan.`,
      });
      return;
    }
    try {
      const result = await bulkCreate.mutateAsync({
        data: {
          students: importRows.map((r) => ({
            ...r,
            nisn: r.nisn?.trim() || undefined,
          })),
        },
      });
      toast({
        title: "Import Berhasil",
        description:
          result.skipped > 0
            ? `${result.count} data siswa ditambahkan, ${result.skipped} dilewati karena duplikat`
            : `${result.count} data siswa ditambahkan`,
      });
      setIsVerifyOpen(false);
      setImportRows([]);
      queryClient.invalidateQueries({ queryKey: ["/api/students"] });
    } catch (err: any) {
      const message =
        err?.data?.error ?? "Terjadi kesalahan saat menyimpan data";
      toast({
        variant: "destructive",
        title: "Gagal Import",
        description: message,
      });
    }
  };

  // Filtered students based on kelas and gender filters
  const filteredStudents = (students ?? []).filter((s: any) => {
    if (kelasFilter && s.kelas !== kelasFilter) return false;
    if (genderFilter && s.jenisKelamin !== genderFilter) return false;
    return true;
  });

  const totalLaki = (students ?? []).filter((s: any) => s.jenisKelamin === "L").length;
  const totalPerempuan = (students ?? []).filter((s: any) => s.jenisKelamin === "P").length;
  const totalSiswa = (students ?? []).length;

  return (
    <Layout>
      {/* Header */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <div className="text-xs text-slate-400 mb-2 flex items-center gap-1">
            <span>Dashboard</span>
            <ChevronRight className="w-3 h-3" />
            <span>Manajemen Siswa</span>
            <ChevronRight className="w-3 h-3" />
            <span className="text-slate-600 font-medium">Data Siswa</span>
          </div>
          <h1 className="text-xl font-bold text-slate-800">Data Siswa</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {isLoading ? "Memuat..." : `${totalSiswa} siswa terdaftar aktif`}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <input
            type="file"
            accept=".csv,.tsv,.txt,.xlsx,.xls,.xlsm,.xlsb,.ods,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel,application/vnd.oasis.opendocument.spreadsheet,text/csv"
            className="hidden"
            ref={fileInputRef}
            onChange={handleImportFile}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={analyzeImport.isPending}
            className="flex items-center gap-2 px-4 py-2 rounded-full border border-slate-200 bg-white text-slate-600 text-sm font-medium hover:bg-slate-50 shadow-sm transition-colors disabled:opacity-60"
          >
            {analyzeImport.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Upload className="w-4 h-4" />
            )}
            {analyzeImport.isPending ? "Menganalisis..." : "Import Excel"}
          </button>
          <button
            onClick={() => {
              setEditingStudent(null);
              form.reset();
              setIsDialogOpen(true);
            }}
            className="flex items-center gap-2 rounded-full bg-slate-800 text-white px-4 py-2 text-sm font-medium hover:bg-slate-700 transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Tambah Siswa
          </button>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-6">
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 flex items-center gap-4 relative overflow-hidden">
          <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center shrink-0">
            <Users className="w-6 h-6" />
          </div>
          <div>
            {isLoading ? (
              <Skeleton className="h-9 w-16 mb-1" />
            ) : (
              <div className="text-3xl font-black text-slate-800">{totalSiswa}</div>
            )}
            <div className="text-xs uppercase tracking-wide text-slate-500 font-semibold mt-0.5">
              Total Siswa
            </div>
          </div>
          <div className="h-1 absolute bottom-0 left-0 right-0 bg-slate-300"></div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 flex items-center gap-4 relative overflow-hidden">
          <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
            <User className="w-6 h-6" />
          </div>
          <div>
            {isLoading ? (
              <Skeleton className="h-9 w-16 mb-1" />
            ) : (
              <div className="text-3xl font-black text-slate-800">{totalLaki}</div>
            )}
            <div className="text-xs uppercase tracking-wide text-slate-500 font-semibold mt-0.5">
              Laki-laki
            </div>
          </div>
          <div className="h-1 absolute bottom-0 left-0 right-0 bg-blue-500"></div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 flex items-center gap-4 relative overflow-hidden">
          <div className="w-12 h-12 rounded-xl bg-pink-100 text-pink-600 flex items-center justify-center shrink-0">
            <User className="w-6 h-6" />
          </div>
          <div>
            {isLoading ? (
              <Skeleton className="h-9 w-16 mb-1" />
            ) : (
              <div className="text-3xl font-black text-slate-800">{totalPerempuan}</div>
            )}
            <div className="text-xs uppercase tracking-wide text-slate-500 font-semibold mt-0.5">
              Perempuan
            </div>
          </div>
          <div className="h-1 absolute bottom-0 left-0 right-0 bg-pink-500"></div>
        </div>
      </div>

      {/* Filter Row */}
      <div className="flex flex-col sm:flex-row items-center gap-3 mb-4">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari nama atau NIS..."
            className="w-full pl-9 pr-4 py-2 rounded-full border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-slate-800 focus:border-transparent shadow-sm"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative w-full sm:w-44">
            <select
              className="w-full appearance-none px-4 py-2 pr-8 rounded-full border border-slate-200 bg-white text-sm text-slate-600 focus:outline-none focus:ring-2 focus:ring-slate-800 shadow-sm font-medium"
              value={kelasFilter}
              onChange={(e) => setKelasFilter(e.target.value)}
            >
              <option value="">Semua Kelas</option>
              {KELAS_OPTIONS.map((k) => (
                <option key={k} value={k}>
                  {k}
                </option>
              ))}
            </select>
            <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
          <div className="relative w-full sm:w-44">
            <select
              className="w-full appearance-none px-4 py-2 pr-8 rounded-full border border-slate-200 bg-white text-sm text-slate-600 focus:outline-none focus:ring-2 focus:ring-slate-800 shadow-sm font-medium"
              value={genderFilter}
              onChange={(e) => setGenderFilter(e.target.value)}
            >
              <option value="">Semua Gender</option>
              <option value="L">Laki-laki</option>
              <option value="P">Perempuan</option>
            </select>
            <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
          <button
            onClick={() => { setKelasFilter(""); setGenderFilter(""); setSearch(""); }}
            className="flex items-center justify-center p-2 rounded-full border border-slate-200 bg-white text-slate-500 hover:text-slate-800 hover:bg-slate-50 shadow-sm"
          >
            <Filter className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-xs uppercase text-slate-500 font-semibold border-b border-slate-200">
                <th className="p-4 w-16 text-center">No</th>
                <th className="p-4">Nama Lengkap</th>
                <th className="p-4">Kelas</th>
                <th className="p-4">NIS</th>
                <th className="p-4">Jenis Kelamin</th>
                <th className="p-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {isLoading ? (
                Array(5)
                  .fill(0)
                  .map((_, i) => (
                    <tr key={i}>
                      <td className="p-4 text-center">
                        <Skeleton className="h-4 w-6 mx-auto" />
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <Skeleton className="w-8 h-8 rounded-full" />
                          <Skeleton className="h-4 w-36" />
                        </div>
                      </td>
                      <td className="p-4">
                        <Skeleton className="h-6 w-16 rounded-full" />
                      </td>
                      <td className="p-4">
                        <Skeleton className="h-4 w-20" />
                      </td>
                      <td className="p-4">
                        <Skeleton className="h-6 w-20 rounded-full" />
                      </td>
                      <td className="p-4">
                        <Skeleton className="h-8 w-16 ml-auto" />
                      </td>
                    </tr>
                  ))
              ) : filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-12 text-center text-slate-400 text-sm">
                    {search || kelasFilter || genderFilter
                      ? "Tidak ada siswa yang cocok dengan filter."
                      : "Belum ada data siswa. Tambahkan siswa baru."}
                  </td>
                </tr>
              ) : (
                filteredStudents.map((student: any, idx: number) => (
                  <tr
                    key={student.id}
                    className="hover:bg-slate-50 transition-colors group"
                  >
                    <td className="p-4 text-center text-slate-500 font-medium">
                      {idx + 1}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${getAvatarColor(idx)}`}
                        >
                          {getInitials(student.namaLengkap)}
                        </div>
                        <span className="font-semibold text-slate-800">
                          {student.namaLengkap}
                        </span>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-semibold">
                        {student.kelas}
                      </span>
                    </td>
                    <td className="p-4 text-slate-600 font-mono text-xs">
                      {student.nisn || "-"}
                    </td>
                    <td className="p-4">
                      <span
                        className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                          student.jenisKelamin === "L"
                            ? "bg-blue-50 text-blue-600"
                            : "bg-pink-50 text-pink-600"
                        }`}
                      >
                        {student.jenisKelamin === "L" ? "Laki-laki" : "Perempuan"}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => {
                            setEditingStudent(student);
                            form.reset({
                              nisn: student.nisn || "",
                              namaLengkap: student.namaLengkap,
                              kelas: student.kelas,
                              jenisKelamin: student.jenisKelamin,
                              school: student.school,
                            });
                            setIsDialogOpen(true);
                          }}
                          className="p-1.5 rounded-md text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(student.id)}
                          className="p-1.5 rounded-md text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
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

        {!isLoading && filteredStudents.length > 0 && (
          <div className="p-4 border-t border-slate-100 flex items-center justify-between text-sm text-slate-500">
            <div>
              Menampilkan{" "}
              <span className="font-semibold text-slate-800">
                {filteredStudents.length}
              </span>{" "}
              dari{" "}
              <span className="font-semibold text-slate-800">{totalSiswa}</span>{" "}
              siswa
            </div>
          </div>
        )}
      </div>

      {/* Add/Edit Dialog */}
      <Dialog
        open={isDialogOpen}
        onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) {
            setEditingStudent(null);
            form.reset();
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingStudent ? "Edit Data Siswa" : "Tambah Data Siswa"}
            </DialogTitle>
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
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Pilih kelas" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {KELAS_OPTIONS.map((k) => (
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
                <FormField
                  control={form.control}
                  name="jenisKelamin"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Jenis Kelamin</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
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
                <Button
                  type="submit"
                  disabled={createStudent.isPending || updateStudent.isPending}
                >
                  Simpan
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Import Verify Dialog */}
      <Dialog
        open={isVerifyOpen}
        onOpenChange={(open) => {
          setIsVerifyOpen(open);
          if (!open) setImportRows([]);
        }}
      >
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" /> Verifikasi Data
              Import
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            AI telah mengidentifikasi {importRows.length} data siswa. Periksa
            dan perbaiki bila perlu sebelum disimpan.
          </p>
          <div className="max-h-[50vh] overflow-y-auto border border-slate-200 rounded-md">
            <table className="w-full text-left border-collapse text-sm">
              <thead className="sticky top-0 bg-slate-50 border-b border-slate-200 shadow-sm z-10">
                <tr className="text-xs uppercase text-slate-500 font-semibold">
                  <th className="p-3 w-[110px]">NISN</th>
                  <th className="p-3">Nama Lengkap</th>
                  <th className="p-3 w-[100px]">Kelas</th>
                  <th className="p-3 w-[90px]">L/P</th>
                  <th className="p-3 w-[170px]">Sekolah</th>
                  <th className="p-3 w-[50px]"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {importRows.map((row, i) => (
                  <tr key={i} className="hover:bg-slate-50 transition-colors">
                    <td className="p-2">
                      <input
                        value={row.nisn ?? ""}
                        onChange={(e) =>
                          updateImportRow(i, { nisn: e.target.value })
                        }
                        className="w-full h-8 px-2 rounded-md border border-slate-200 focus:outline-none focus:ring-1 focus:ring-slate-800 text-sm"
                      />
                    </td>
                    <td className="p-2">
                      <input
                        value={row.namaLengkap}
                        onChange={(e) =>
                          updateImportRow(i, { namaLengkap: e.target.value })
                        }
                        className={`w-full h-8 px-2 rounded-md border ${
                          !row.namaLengkap.trim()
                            ? "border-red-300 bg-red-50 focus:ring-red-500"
                            : "border-slate-200 focus:ring-slate-800"
                        } focus:outline-none focus:ring-1 text-sm`}
                      />
                    </td>
                    <td className="p-2">
                      <select
                        value={row.kelas}
                        onChange={(e) =>
                          updateImportRow(i, { kelas: e.target.value })
                        }
                        className={`w-full h-8 px-2 rounded-md border ${
                          !(KELAS_OPTIONS as readonly string[]).includes(row.kelas)
                            ? "border-red-300 bg-red-50 focus:ring-red-500"
                            : "border-slate-200 focus:ring-slate-800"
                        } focus:outline-none focus:ring-1 bg-white text-sm`}
                      >
                        <option value="">Pilih</option>
                        {KELAS_OPTIONS.map((k) => (
                          <option key={k} value={k}>
                            {k}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="p-2">
                      <select
                        value={row.jenisKelamin}
                        onChange={(e) =>
                          updateImportRow(i, {
                            jenisKelamin: e.target.value as "L" | "P",
                          })
                        }
                        className="w-full h-8 px-2 rounded-md border border-slate-200 focus:outline-none focus:ring-1 focus:ring-slate-800 bg-white text-sm"
                      >
                        <option value="L">L</option>
                        <option value="P">P</option>
                      </select>
                    </td>
                    <td className="p-2">
                      <input
                        value={row.school}
                        onChange={(e) =>
                          updateImportRow(i, { school: e.target.value })
                        }
                        className={`w-full h-8 px-2 rounded-md border ${
                          !row.school.trim()
                            ? "border-red-300 bg-red-50 focus:ring-red-500"
                            : "border-slate-200 focus:ring-slate-800"
                        } focus:outline-none focus:ring-1 text-sm`}
                      />
                    </td>
                    <td className="p-2 text-center">
                      <button
                        onClick={() => removeImportRow(i)}
                        className="text-slate-400 hover:text-red-600 transition-colors p-1"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsVerifyOpen(false);
                setImportRows([]);
              }}
              disabled={bulkCreate.isPending}
            >
              Batal
            </Button>
            <Button
              onClick={handleConfirmImport}
              disabled={bulkCreate.isPending || importRows.length === 0}
            >
              {bulkCreate.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />{" "}
                  Menyimpan...
                </>
              ) : (
                <>Simpan {importRows.length} Siswa</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
