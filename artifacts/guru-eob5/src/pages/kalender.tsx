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
import { useEffect, useState, useMemo } from "react";
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
import { useToast } from "@/hooks/use-toast";
import {
  Plus,
  Trash2,
  Pencil,
  Calendar,
  CheckCircle2,
  Clock,
  MoreVertical,
  ChevronDown,
  Info,
  CalendarCheck,
  CalendarX,
} from "lucide-react";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";
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

const STATUS_MAP: Record<string, { label: string; className: string }> = {
  efektif: { label: "Aktif", className: "bg-emerald-100 text-emerald-700" },
  pts: { label: "PTS", className: "bg-violet-100 text-violet-700" },
  pas: { label: "PAS", className: "bg-violet-100 text-violet-700" },
  libur: { label: "Libur", className: "bg-amber-100 text-amber-700" },
};

function safeFmt(s: string) {
  try {
    return format(new Date(s), "dd MMM yyyy", { locale: idLocale });
  } catch {
    return s;
  }
}

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

  const selectedCalendarData = calendars?.find((c: any) => c.id === selectedCalendar) as
    | { tahunAjaran: string; semester: string }
    | undefined;

  // Stats computed from weeks
  const weeksArr = (weeks as any[]) ?? [];
  const totalPekan = weeksArr.length;
  const today = new Date();
  const weeksPast = weeksArr.filter((w: any) => {
    try { return new Date(w.tanggalSelesai) < today; } catch { return false; }
  }).length;
  const weeksCurrent = weeksArr.find((w: any) => {
    try {
      const start = new Date(w.tanggalMulai);
      const end = new Date(w.tanggalSelesai);
      return start <= today && today <= end;
    } catch { return false; }
  });
  const sisaPekan = Math.max(0, totalPekan - weeksPast - (weeksCurrent ? 1 : 0));

  const stats = [
    { label: "Total Pekan Efektif", value: totalPekan, icon: Calendar, color: "blue" },
    { label: "Pekan Sudah Lewat", value: weeksPast, icon: CheckCircle2, color: "violet" },
    { label: "Sisa Pekan", value: sisaPekan, icon: Clock, color: "amber" },
  ];

  const colorMap: Record<string, { bg: string; icon: string; bar: string }> = {
    blue: { bg: "bg-blue-100", icon: "text-blue-600", bar: "bg-blue-500" },
    violet: { bg: "bg-violet-100", icon: "text-violet-600", bar: "bg-violet-500" },
    amber: { bg: "bg-amber-100", icon: "text-amber-600", bar: "bg-amber-500" },
  };

  return (
    <Layout>
      {/* Header */}
      <div className="mb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="text-xs text-slate-400 mb-2">
            Manajemen Sekolah / <span className="text-slate-600 font-medium">Kalender Akademik</span>
          </div>
          <h1 className="text-xl font-bold text-slate-800">Kalender Akademik</h1>
          <p className="text-sm text-slate-500">
            {selectedCalendarData
              ? `Tahun Ajaran ${selectedCalendarData.tahunAjaran} — Semester ${selectedCalendarData.semester}`
              : "Kelola pekan efektif per tahun ajaran & semester"}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Dialog open={calDialogOpen} onOpenChange={setCalDialogOpen}>
            <DialogTrigger asChild>
              <button className="rounded-full bg-white border border-slate-200 text-slate-600 px-4 py-2 text-sm font-medium flex items-center gap-2 hover:bg-slate-50 shadow-sm">
                <Plus className="w-4 h-4" />
                Kalender Baru
              </button>
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
                        <FormControl><Input placeholder="2025/2026" {...field} /></FormControl>
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
                            <SelectTrigger><SelectValue placeholder="Pilih Semester" /></SelectTrigger>
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
                    <Button type="submit" disabled={createCalendar.isPending}>Simpan</Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>

          {selectedCalendar && (
            <button
              onClick={openNewWeek}
              className="rounded-full bg-slate-800 text-white px-4 py-2 text-sm font-medium flex items-center gap-2 hover:bg-slate-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Tambah Pekan
            </button>
          )}
        </div>
      </div>

      {/* Calendar Selector */}
      {(isLoading || (calendars?.length ?? 0) > 0) && (
        <div className="flex flex-wrap items-center gap-4 mb-6">
          <div className="relative">
            {isLoading ? (
              <Skeleton className="h-9 w-56 rounded-full" />
            ) : (
              <>
                <select
                  value={selectedCalendar}
                  onChange={(e) => setSelectedCalendar(e.target.value)}
                  className="appearance-none bg-white border border-slate-200 rounded-full px-4 py-2 pr-10 text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-800 shadow-sm cursor-pointer min-w-[220px]"
                >
                  {calendars?.map((c: any) => (
                    <option key={c.id} value={c.id}>
                      {c.tahunAjaran} — {c.semester}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-4 h-4 text-slate-500 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </>
            )}
          </div>
          {selectedCalendar && (
            <button
              onClick={() => handleDeleteCalendar(selectedCalendar)}
              className="text-slate-400 hover:text-red-500 transition-colors p-1"
              title="Hapus kalender"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      )}

      {!selectedCalendar && !isLoading ? (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-16 flex flex-col items-center justify-center text-center text-slate-400">
          <Calendar className="w-12 h-12 mb-3 text-slate-200" />
          <p className="text-sm">Belum ada kalender akademik.</p>
          <p className="text-sm">Klik "Kalender Baru" untuk memulai.</p>
        </div>
      ) : (
        <>
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-6">
            {stats.map((stat) => {
              const c = colorMap[stat.color];
              return (
                <div key={stat.label} className="relative overflow-hidden bg-white rounded-xl border border-slate-200 shadow-sm flex items-center gap-4 p-5 pb-6">
                  <div className={`w-12 h-12 rounded-xl ${c.bg} ${c.icon} flex items-center justify-center shrink-0`}>
                    <stat.icon className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="text-xs uppercase tracking-wide text-slate-500 font-semibold mb-1">{stat.label}</div>
                    {weeksLoading ? (
                      <Skeleton className="h-8 w-12" />
                    ) : (
                      <div className="text-3xl font-black text-slate-800 leading-none">{stat.value}</div>
                    )}
                  </div>
                  <div className={`h-1 absolute bottom-0 left-0 right-0 ${c.bar}`} />
                </div>
              );
            })}
          </div>

          {/* Main two-column layout */}
          <div className="flex flex-col lg:flex-row gap-5">
            {/* Left: Table */}
            <div className="flex-1">
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Daftar Pekan Efektif</div>
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 text-xs uppercase text-slate-500 border-b border-slate-200">
                        <th className="p-4 font-semibold w-12 text-center">No</th>
                        <th className="p-4 font-semibold">Pekan Ke-</th>
                        <th className="p-4 font-semibold">Tanggal Mulai</th>
                        <th className="p-4 font-semibold">Tanggal Selesai</th>
                        <th className="p-4 font-semibold">Status</th>
                        <th className="p-4 font-semibold">Keterangan</th>
                        <th className="p-4 font-semibold text-center w-20">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-sm">
                      {weeksLoading ? (
                        Array.from({ length: 5 }).map((_, i) => (
                          <tr key={i}>
                            <td colSpan={7} className="p-4">
                              <Skeleton className="h-5 w-full" />
                            </td>
                          </tr>
                        ))
                      ) : !weeksArr.length ? (
                        <tr>
                          <td colSpan={7} className="p-12 text-center text-slate-400">
                            Belum ada pekan. Tambahkan pekan efektif.
                          </td>
                        </tr>
                      ) : (
                        weeksArr
                          .slice()
                          .sort((a: any, b: any) => a.pekanKe - b.pekanKe)
                          .map((w: any, idx: number) => {
                            const isCurrent = (() => {
                              try {
                                const start = new Date(w.tanggalMulai);
                                const end = new Date(w.tanggalSelesai);
                                return start <= today && today <= end;
                              } catch { return false; }
                            })();
                            const isPast = (() => {
                              try { return new Date(w.tanggalSelesai) < today && !isCurrent; } catch { return false; }
                            })();
                            const s = STATUS_MAP[w.jenis] ?? { label: w.jenis, className: "bg-slate-100 text-slate-500" };
                            const statusClass = isCurrent
                              ? "bg-emerald-100 text-emerald-700"
                              : isPast
                              ? "bg-slate-100 text-slate-600"
                              : s.className;
                            const statusLabel = isCurrent ? "Aktif" : isPast ? "Selesai" : s.label;

                            return (
                              <tr
                                key={w.id}
                                className={`hover:bg-slate-50 transition-colors relative ${isCurrent ? "bg-blue-50/50" : ""}`}
                              >
                                {isCurrent && (
                                  <td className="absolute left-0 top-0 bottom-0 w-0.5 bg-blue-500 p-0" />
                                )}
                                <td className="p-4 text-center text-slate-500">{idx + 1}</td>
                                <td className="p-4 font-medium text-slate-800">
                                  Pekan {w.pekanKe}
                                  {isCurrent && (
                                    <span className="ml-2 inline-flex items-center rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-semibold text-blue-600">
                                      SAAT INI
                                    </span>
                                  )}
                                </td>
                                <td className="p-4 text-slate-600">{safeFmt(w.tanggalMulai)}</td>
                                <td className="p-4 text-slate-600">{safeFmt(w.tanggalSelesai)}</td>
                                <td className="p-4">
                                  <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${statusClass}`}>
                                    {statusLabel}
                                  </span>
                                </td>
                                <td className="p-4 text-slate-600">{w.keterangan || "-"}</td>
                                <td className="p-4">
                                  <div className="flex items-center justify-center gap-1">
                                    <button
                                      onClick={() => openEditWeek(w)}
                                      className="text-slate-400 hover:text-slate-600 rounded-full p-1 hover:bg-slate-100 transition-colors"
                                    >
                                      <Pencil className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                      onClick={() => handleDeleteWeek(w.id)}
                                      className="text-slate-400 hover:text-red-600 rounded-full p-1 hover:bg-red-50 transition-colors"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
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
              </div>
            </div>

            {/* Right: Info Semester */}
            <div className="w-full lg:w-72 shrink-0 flex flex-col gap-5">
              <div>
                <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Info Semester</div>
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 relative overflow-hidden">
                  <div className="absolute -right-4 -top-4 text-slate-50 opacity-50">
                    <Calendar className="w-32 h-32" />
                  </div>
                  <div className="relative z-10">
                    <div className="flex items-center gap-2 mb-4">
                      <div className="w-8 h-8 rounded-full bg-slate-800 text-white flex items-center justify-center">
                        <Info className="w-4 h-4" />
                      </div>
                      <h3 className="font-bold text-slate-800">
                        {selectedCalendarData
                          ? `Semester ${selectedCalendarData.semester}`
                          : "Semester"}
                      </h3>
                    </div>
                    <div className="space-y-4">
                      {selectedCalendarData && (
                        <div>
                          <p className="text-xs text-slate-500 mb-1">Tahun Ajaran</p>
                          <p className="text-sm font-medium text-slate-800">{selectedCalendarData.tahunAjaran}</p>
                        </div>
                      )}
                      <div>
                        <p className="text-xs text-slate-500 mb-1">Total Pekan</p>
                        <p className="text-sm font-medium text-slate-800">{totalPekan} Pekan</p>
                      </div>
                      {totalPekan > 0 && (
                        <div>
                          <p className="text-xs text-slate-500 mb-1">Progress Semester</p>
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="text-xs font-semibold text-blue-600">Pekan {weeksPast}</span>
                            <span className="text-xs font-medium text-slate-400">dari {totalPekan}</span>
                          </div>
                          <div className="w-full bg-slate-100 rounded-full h-2">
                            <div
                              className="bg-blue-500 h-2 rounded-full transition-all"
                              style={{ width: `${totalPekan > 0 ? Math.round((weeksPast / totalPekan) * 100) : 0}%` }}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Pekan Mendatang</div>
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
                  {weeksLoading ? (
                    <div className="space-y-3">
                      {[1, 2, 3].map((i) => <Skeleton key={i} className="h-12 w-full" />)}
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {weeksArr
                        .slice()
                        .sort((a: any, b: any) => a.pekanKe - b.pekanKe)
                        .filter((w: any) => {
                          try { return new Date(w.tanggalMulai) >= today; } catch { return false; }
                        })
                        .slice(0, 4)
                        .map((w: any) => {
                          const s = STATUS_MAP[w.jenis] ?? { label: w.jenis, className: "bg-slate-100 text-slate-500" };
                          const isLibur = w.jenis === "libur";
                          const bgColor = isLibur ? "bg-orange-50 text-orange-600 border-orange-100" : "bg-blue-50 text-blue-600 border-blue-100";
                          let startD: Date | null = null;
                          try { startD = new Date(w.tanggalMulai); } catch { /* */ }

                          return (
                            <div key={w.id} className="flex gap-3">
                              <div className={`mt-0.5 w-8 h-8 rounded-lg flex flex-col items-center justify-center shrink-0 border ${bgColor}`}>
                                {startD ? (
                                  <>
                                    <span className="text-[9px] font-bold uppercase leading-none mb-0.5">
                                      {format(startD, "MMM", { locale: idLocale })}
                                    </span>
                                    <span className="text-sm font-black leading-none">
                                      {format(startD, "d")}
                                    </span>
                                  </>
                                ) : (
                                  <span className="text-xs font-bold">{w.pekanKe}</span>
                                )}
                              </div>
                              <div>
                                <p className="text-sm font-medium text-slate-800">Pekan {w.pekanKe}</p>
                                <div className="flex items-center gap-1 mt-0.5">
                                  {isLibur ? (
                                    <CalendarX className="w-3 h-3 text-slate-400" />
                                  ) : (
                                    <CalendarCheck className="w-3 h-3 text-slate-400" />
                                  )}
                                  <p className="text-xs text-slate-500">{w.keterangan || s.label}</p>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      {weeksArr.filter((w: any) => {
                        try { return new Date(w.tanggalMulai) >= today; } catch { return false; }
                      }).length === 0 && (
                        <p className="text-xs text-slate-400 text-center py-2">Tidak ada pekan mendatang</p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Week Dialog */}
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
                      <FormControl><Input type="number" min={1} {...field} /></FormControl>
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
                          <SelectTrigger><SelectValue /></SelectTrigger>
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
                      <FormControl><Input type="date" {...field} /></FormControl>
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
                      <FormControl><Input type="date" {...field} /></FormControl>
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
                    <FormControl><Input placeholder="mis. Libur Semester" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button type="submit" disabled={createWeek.isPending || updateWeek.isPending}>
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
