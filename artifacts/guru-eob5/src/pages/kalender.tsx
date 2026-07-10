import { Layout } from "@/components/layout";
import {
  useListAcademicCalendars,
  useCreateAcademicCalendar,
  useDeleteAcademicCalendar,
  useListAcademicWeeks,
  useCreateAcademicWeek,
  useUpdateAcademicWeek,
  useDeleteAcademicWeek,
} from "@workspace/api-client-react";
import { useEffect, useState } from "react";
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
  DialogTrigger,
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2, Pencil } from "lucide-react";
import { format } from "date-fns";
import { useQueryClient } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";

const calendarSchema = z.object({
  tahunAjaran: z.string().min(1, "Tahun ajaran harus diisi"),
  semester: z.string().min(1, "Semester harus dipilih"),
});

const weekSchema = z.object({
  pekanKe: z.coerce.number().int().min(1, "Pekan harus diisi"),
  tanggalMulai: z.string().min(1, "Tanggal mulai harus diisi"),
  tanggalSelesai: z.string().min(1, "Tanggal selesai harus diisi"),
  jenis: z.string().min(1, "Jenis harus dipilih"),
  keterangan: z.string().optional(),
});

const JENIS_LABEL: Record<string, string> = {
  efektif: "Efektif",
  pts: "PTS",
  pas: "PAS",
  libur: "Libur",
};

const JENIS_VARIANT: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
  efektif: "default",
  pts: "secondary",
  pas: "secondary",
  libur: "outline",
};

export default function Kalender() {
  const { data: calendars, isLoading } = useListAcademicCalendars();
  const [selectedCalendar, setSelectedCalendar] = useState<string>("");
  const createCalendar = useCreateAcademicCalendar();
  const deleteCalendar = useDeleteAcademicCalendar();
  const [calDialogOpen, setCalDialogOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!selectedCalendar && calendars?.length) {
      setSelectedCalendar(calendars[0].id);
    }
  }, [calendars, selectedCalendar]);

  const calForm = useForm<z.infer<typeof calendarSchema>>({
    resolver: zodResolver(calendarSchema),
    defaultValues: { tahunAjaran: "", semester: "" },
  });

  const { data: weeks, isLoading: weeksLoading } = useListAcademicWeeks(
    { calendarId: selectedCalendar || undefined },
    { query: { queryKey: ["/api/academic-weeks", selectedCalendar], enabled: !!selectedCalendar } },
  );

  const createWeek = useCreateAcademicWeek();
  const updateWeek = useUpdateAcademicWeek();
  const deleteWeek = useDeleteAcademicWeek();
  const [weekDialogOpen, setWeekDialogOpen] = useState(false);
  const [editingWeek, setEditingWeek] = useState<string | null>(null);

  const weekForm = useForm<z.infer<typeof weekSchema>>({
    resolver: zodResolver(weekSchema),
    defaultValues: {
      pekanKe: 1,
      tanggalMulai: "",
      tanggalSelesai: "",
      jenis: "efektif",
      keterangan: "",
    },
  });

  const invalidateWeeks = () =>
    queryClient.invalidateQueries({ queryKey: ["/api/academic-weeks", selectedCalendar] });

  const onCreateCalendar = async (data: z.infer<typeof calendarSchema>) => {
    try {
      const created = await createCalendar.mutateAsync({ data });
      toast({ title: "Berhasil", description: "Kalender akademik dibuat" });
      setCalDialogOpen(false);
      calForm.reset();
      queryClient.invalidateQueries({ queryKey: ["/api/academic-calendars"] });
      setSelectedCalendar(created.id);
    } catch {
      toast({ variant: "destructive", title: "Gagal", description: "Terjadi kesalahan" });
    }
  };

  const handleDeleteCalendar = async (id: string) => {
    if (!confirm("Hapus kalender ini beserta semua pekannya?")) return;
    try {
      await deleteCalendar.mutateAsync({ id });
      queryClient.invalidateQueries({ queryKey: ["/api/academic-calendars"] });
      if (selectedCalendar === id) setSelectedCalendar("");
      toast({ title: "Berhasil", description: "Kalender dihapus" });
    } catch {
      toast({ variant: "destructive", title: "Gagal", description: "Terjadi kesalahan" });
    }
  };

  const openNewWeek = () => {
    setEditingWeek(null);
    weekForm.reset({
      pekanKe: (weeks?.length ?? 0) + 1,
      tanggalMulai: "",
      tanggalSelesai: "",
      jenis: "efektif",
      keterangan: "",
    });
    setWeekDialogOpen(true);
  };

  const openEditWeek = (w: any) => {
    setEditingWeek(w.id);
    weekForm.reset({
      pekanKe: w.pekanKe,
      tanggalMulai: w.tanggalMulai,
      tanggalSelesai: w.tanggalSelesai,
      jenis: w.jenis,
      keterangan: w.keterangan ?? "",
    });
    setWeekDialogOpen(true);
  };

  const onSubmitWeek = async (data: z.infer<typeof weekSchema>) => {
    try {
      const payload = {
        ...data,
        calendarId: selectedCalendar,
        keterangan: data.keterangan || undefined,
      };
      if (editingWeek) {
        await updateWeek.mutateAsync({ id: editingWeek, data: payload });
        toast({ title: "Berhasil", description: "Pekan diperbarui" });
      } else {
        await createWeek.mutateAsync({ data: payload });
        toast({ title: "Berhasil", description: "Pekan ditambahkan" });
      }
      setWeekDialogOpen(false);
      invalidateWeeks();
    } catch {
      toast({ variant: "destructive", title: "Gagal", description: "Terjadi kesalahan" });
    }
  };

  const handleDeleteWeek = async (id: string) => {
    if (!confirm("Hapus pekan ini?")) return;
    try {
      await deleteWeek.mutateAsync({ id });
      invalidateWeeks();
      toast({ title: "Berhasil", description: "Pekan dihapus" });
    } catch {
      toast({ variant: "destructive", title: "Gagal", description: "Terjadi kesalahan" });
    }
  };

  return (
    <Layout>
      <div className="space-y-6 animate-in fade-in duration-500">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold font-serif">Kalender Akademik</h1>
            <p className="text-muted-foreground mt-1">
              Kelola pekan efektif per tahun ajaran & semester.
            </p>
          </div>
          <Dialog open={calDialogOpen} onOpenChange={setCalDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" /> Kalender Baru
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Buat Kalender Akademik</DialogTitle>
              </DialogHeader>
              <Form {...calForm}>
                <form onSubmit={calForm.handleSubmit(onCreateCalendar)} className="space-y-4">
                  <FormField
                    control={calForm.control}
                    name="tahunAjaran"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tahun Ajaran</FormLabel>
                        <FormControl>
                          <Input placeholder="2025/2026" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={calForm.control}
                    name="semester"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Semester</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Pilih Semester" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Ganjil">Ganjil</SelectItem>
                            <SelectItem value="Genap">Genap</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <DialogFooter>
                    <Button type="submit" disabled={createCalendar.isPending}>
                      Simpan
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="bg-white border border-border rounded-xl shadow-sm overflow-hidden">
          <div className="p-4 border-b border-border bg-gray-50/50 flex flex-wrap gap-4 items-center justify-between">
            <div className="flex items-center gap-3">
              {isLoading ? (
                <Skeleton className="h-9 w-[280px]" />
              ) : (
                <Select value={selectedCalendar} onValueChange={setSelectedCalendar}>
                  <SelectTrigger className="w-[280px] bg-white">
                    <SelectValue placeholder="Pilih Kalender" />
                  </SelectTrigger>
                  <SelectContent>
                    {calendars?.map((c: any) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.tahunAjaran} — {c.semester}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              {selectedCalendar && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-destructive"
                  onClick={() => handleDeleteCalendar(selectedCalendar)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              )}
            </div>
            {selectedCalendar && (
              <Button variant="outline" onClick={openNewWeek}>
                <Plus className="w-4 h-4 mr-2" /> Tambah Pekan
              </Button>
            )}
          </div>

          {!selectedCalendar ? (
            <div className="h-32 flex items-center justify-center text-muted-foreground">
              {calendars?.length ? "Pilih kalender." : "Belum ada kalender akademik."}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50/50">
                  <TableHead className="w-20">Pekan</TableHead>
                  <TableHead>Tanggal</TableHead>
                  <TableHead>Jenis</TableHead>
                  <TableHead>Keterangan</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {weeksLoading ? (
                  Array(3)
                    .fill(0)
                    .map((_, i) => (
                      <TableRow key={i}>
                        <TableCell colSpan={5}>
                          <Skeleton className="h-6 w-full" />
                        </TableCell>
                      </TableRow>
                    ))
                ) : !weeks?.length ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                      Belum ada pekan. Tambahkan pekan efektif.
                    </TableCell>
                  </TableRow>
                ) : (
                  weeks.map((w: any) => (
                    <TableRow key={w.id}>
                      <TableCell className="font-medium">Pekan {w.pekanKe}</TableCell>
                      <TableCell>
                        {format(new Date(w.tanggalMulai), "dd MMM")} –{" "}
                        {format(new Date(w.tanggalSelesai), "dd MMM yyyy")}
                      </TableCell>
                      <TableCell>
                        <Badge variant={JENIS_VARIANT[w.jenis] ?? "outline"}>
                          {JENIS_LABEL[w.jenis] ?? w.jenis}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground max-w-[240px] truncate">
                        {w.keterangan || "-"}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" onClick={() => openEditWeek(w)}>
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive"
                          onClick={() => handleDeleteWeek(w.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </div>
      </div>

      <Dialog open={weekDialogOpen} onOpenChange={setWeekDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingWeek ? "Edit Pekan" : "Tambah Pekan"}</DialogTitle>
          </DialogHeader>
          <Form {...weekForm}>
            <form onSubmit={weekForm.handleSubmit(onSubmitWeek)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={weekForm.control}
                  name="pekanKe"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Pekan Ke</FormLabel>
                      <FormControl>
                        <Input type="number" min={1} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={weekForm.control}
                  name="jenis"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Jenis</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="efektif">Efektif</SelectItem>
                          <SelectItem value="pts">PTS</SelectItem>
                          <SelectItem value="pas">PAS</SelectItem>
                          <SelectItem value="libur">Libur</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={weekForm.control}
                  name="tanggalMulai"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tanggal Mulai</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={weekForm.control}
                  name="tanggalSelesai"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tanggal Selesai</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={weekForm.control}
                name="keterangan"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Keterangan (Opsional)</FormLabel>
                    <FormControl>
                      <Input placeholder="mis. Libur Semester" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button
                  type="submit"
                  disabled={createWeek.isPending || updateWeek.isPending}
                >
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
