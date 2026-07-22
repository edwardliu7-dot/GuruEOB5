import { Layout } from "@/components/layout";
import { useListTeachers, useUpdateTeacher, useDeleteTeacher } from "@workspace/api-client-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import {
  Trash2,
  Edit2,
  ChevronRight,
  Users,
  BookOpen,
  Briefcase,
  Search,
  Filter,
} from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { JABATAN_LABELS } from "@/lib/options";

const teacherSchema = z.object({
  name: z.string().min(1, "Nama harus diisi"),
  role: z.enum(["admin", "guru"]),
});

function getInitials(name: string): string {
  return (name ?? "?")
    .split(" ")
    .map((p: string) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

const AVATAR_COLORS = [
  "bg-blue-100 text-blue-600",
  "bg-violet-100 text-violet-600",
  "bg-amber-100 text-amber-600",
  "bg-emerald-100 text-emerald-600",
  "bg-slate-100 text-slate-600",
  "bg-pink-100 text-pink-600",
  "bg-orange-100 text-orange-600",
  "bg-rose-100 text-rose-600",
  "bg-teal-100 text-teal-600",
  "bg-cyan-100 text-cyan-600",
];

function getAvatarColor(index: number): string {
  return AVATAR_COLORS[index % AVATAR_COLORS.length];
}

function getJabatanBadgeClass(jabatan: string): string {
  switch (jabatan) {
    case "guru":
      return "bg-blue-100 text-blue-700";
    case "wali_kelas":
      return "bg-violet-100 text-violet-700";
    case "kepala_sekolah":
      return "bg-amber-100 text-amber-700";
    case "wakasek":
      return "bg-slate-100 text-slate-700";
    default:
      return "bg-slate-100 text-slate-700";
  }
}

export default function Guru() {
  const { data: teachers, isLoading } = useListTeachers();
  const updateTeacher = useUpdateTeacher();
  const deleteTeacher = useDeleteTeacher();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState<any | null>(null);
  const [search, setSearch] = useState("");

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<z.infer<typeof teacherSchema>>({
    resolver: zodResolver(teacherSchema),
    defaultValues: { name: "", role: "guru" },
  });

  const onSubmit = async (data: z.infer<typeof teacherSchema>) => {
    try {
      if (editingTeacher) {
        await updateTeacher.mutateAsync({ id: editingTeacher.id, data });
        toast({ title: "Berhasil", description: "Data guru diperbarui" });
      }
      setIsDialogOpen(false);
      form.reset();
      setEditingTeacher(null);
      queryClient.invalidateQueries({ queryKey: ["/api/teachers"] });
    } catch {
      toast({
        variant: "destructive",
        title: "Gagal",
        description: "Terjadi kesalahan",
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("Hapus guru ini?")) {
      try {
        await deleteTeacher.mutateAsync({ id });
        queryClient.invalidateQueries({ queryKey: ["/api/teachers"] });
        toast({ title: "Berhasil", description: "Data dihapus" });
      } catch {
        toast({
          variant: "destructive",
          title: "Gagal",
          description: "Terjadi kesalahan",
        });
      }
    }
  };

  const filteredTeachers = (teachers ?? []).filter((t: any) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      (t.name ?? "").toLowerCase().includes(q) ||
      (t.username ?? "").toLowerCase().includes(q)
    );
  });

  const totalGuru = (teachers ?? []).length;
  const totalGuruMapel = (teachers ?? []).filter((t: any) =>
    (t.jabatan as string[] | undefined)?.includes("guru")
  ).length;
  const totalOther = totalGuru - totalGuruMapel;

  return (
    <Layout>
      {/* Breadcrumb */}
      <div className="flex items-center text-xs text-slate-400 mb-2 font-medium">
        <span>Beranda</span>
        <ChevronRight className="w-3 h-3 mx-1" />
        <span>Manajemen</span>
        <ChevronRight className="w-3 h-3 mx-1" />
        <span className="text-slate-600">Data Guru</span>
      </div>

      {/* Header */}
      <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Data Guru</h1>
          <p className="text-sm text-slate-500 mt-1">
            {isLoading ? "Memuat..." : `${totalGuru} tenaga pendidik terdaftar`}
          </p>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-6">
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 relative overflow-hidden flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
            <Users className="w-6 h-6" />
          </div>
          <div>
            {isLoading ? (
              <Skeleton className="h-9 w-12 mb-1" />
            ) : (
              <div className="text-3xl font-black text-slate-800 leading-none mb-1">
                {totalGuru}
              </div>
            )}
            <div className="text-xs uppercase tracking-wide text-slate-500 font-semibold">
              Total Guru
            </div>
          </div>
          <div className="h-1 absolute bottom-0 left-0 right-0 bg-blue-500" />
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 relative overflow-hidden flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-violet-100 text-violet-600 flex items-center justify-center shrink-0">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            {isLoading ? (
              <Skeleton className="h-9 w-12 mb-1" />
            ) : (
              <div className="text-3xl font-black text-slate-800 leading-none mb-1">
                {totalGuruMapel}
              </div>
            )}
            <div className="text-xs uppercase tracking-wide text-slate-500 font-semibold">
              Guru Mapel
            </div>
          </div>
          <div className="h-1 absolute bottom-0 left-0 right-0 bg-violet-500" />
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 relative overflow-hidden flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center shrink-0">
            <Briefcase className="w-6 h-6" />
          </div>
          <div>
            {isLoading ? (
              <Skeleton className="h-9 w-12 mb-1" />
            ) : (
              <div className="text-3xl font-black text-slate-800 leading-none mb-1">
                {totalOther}
              </div>
            )}
            <div className="text-xs uppercase tracking-wide text-slate-500 font-semibold">
              Staff TU / Wali Kelas
            </div>
          </div>
          <div className="h-1 absolute bottom-0 left-0 right-0 bg-amber-500" />
        </div>
      </div>

      {/* Filter Row */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Cari nama atau NIP guru..."
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-slate-200 focus:border-slate-300 transition-all placeholder:text-slate-400"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500 border-b border-slate-200 font-semibold">
                <th className="p-4 w-1/3">Guru</th>
                <th className="p-4">Jabatan</th>
                <th className="p-4">Mata Pelajaran</th>
                <th className="p-4">Kelas Perwalian</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {isLoading ? (
                Array(5)
                  .fill(0)
                  .map((_, i) => (
                    <tr key={i}>
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <Skeleton className="w-10 h-10 rounded-full" />
                          <div>
                            <Skeleton className="h-4 w-32 mb-1" />
                            <Skeleton className="h-3 w-44" />
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <Skeleton className="h-6 w-24 rounded-full" />
                      </td>
                      <td className="p-4">
                        <Skeleton className="h-6 w-24 rounded-full" />
                      </td>
                      <td className="p-4">
                        <Skeleton className="h-4 w-20" />
                      </td>
                      <td className="p-4">
                        <Skeleton className="h-6 w-16 rounded-full" />
                      </td>
                      <td className="p-4">
                        <Skeleton className="h-8 w-20 ml-auto" />
                      </td>
                    </tr>
                  ))
              ) : filteredTeachers.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="p-12 text-center text-slate-400 text-sm"
                  >
                    {search
                      ? "Tidak ada guru yang cocok dengan pencarian."
                      : "Belum ada data guru."}
                  </td>
                </tr>
              ) : (
                filteredTeachers.map((teacher: any, idx: number) => {
                  const initials = getInitials(teacher.name ?? "?");
                  const avatarColor = getAvatarColor(idx);
                  const jabatan: string[] = teacher.jabatan ?? [];
                  const mapel: string[] = teacher.mapel ?? [];
                  const waliKelasKelas = teacher.waliKelasKelas ?? null;

                  return (
                    <tr
                      key={teacher.id}
                      className="hover:bg-slate-50 transition-colors group"
                    >
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shrink-0 ${avatarColor}`}
                          >
                            {teacher.photoUrl ? (
                              <img
                                src={teacher.photoUrl}
                                alt={teacher.name}
                                className="w-10 h-10 rounded-full object-cover"
                              />
                            ) : (
                              initials
                            )}
                          </div>
                          <div>
                            <div className="font-semibold text-slate-800">
                              {teacher.name}
                            </div>
                            <div className="text-xs text-slate-500 mt-0.5">
                              {teacher.username ?? teacher.email ?? ""}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex flex-wrap gap-1">
                          {jabatan.length > 0 ? (
                            jabatan.map((j: string) => (
                              <span
                                key={j}
                                className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${getJabatanBadgeClass(j)}`}
                              >
                                {JABATAN_LABELS[j] ?? j}
                              </span>
                            ))
                          ) : (
                            <span className="text-slate-400">-</span>
                          )}
                        </div>
                      </td>
                      <td className="p-4">
                        {mapel.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {mapel.slice(0, 2).map((m: string) => (
                              <span
                                key={m}
                                className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200"
                              >
                                {m}
                              </span>
                            ))}
                            {mapel.length > 2 && (
                              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-500">
                                +{mapel.length - 2}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>
                      <td className="p-4">
                        {waliKelasKelas ? (
                          <span className="font-medium text-slate-700">
                            {waliKelasKelas}
                          </span>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>
                      <td className="p-4">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700">
                          Aktif
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => {
                              setEditingTeacher(teacher);
                              form.reset({
                                name: teacher.name,
                                role: teacher.role,
                              });
                              setIsDialogOpen(true);
                            }}
                            className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            aria-label="Edit"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(teacher.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                            aria-label="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {!isLoading && filteredTeachers.length > 0 && (
          <div className="p-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between text-sm text-slate-500 gap-4">
            <div>
              Menampilkan{" "}
              <span className="font-medium text-slate-800">
                {filteredTeachers.length}
              </span>{" "}
              dari{" "}
              <span className="font-medium text-slate-800">{totalGuru}</span>{" "}
              guru
            </div>
          </div>
        )}
      </div>

      {/* Edit Dialog */}
      <Dialog
        open={isDialogOpen}
        onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) {
            setEditingTeacher(null);
            form.reset();
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Data Guru</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nama Lengkap</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Peran</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Pilih Peran" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="guru">Guru</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button type="submit" disabled={updateTeacher.isPending}>
                  Simpan
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
