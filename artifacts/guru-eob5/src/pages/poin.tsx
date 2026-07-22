import { Layout } from "@/components/layout";
import {
  useListPoints,
  useBulkCreatePoints,
  useUpdatePoint,
  useDeletePoint,
  useListStudents,
} from "@workspace/api-client-react";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import {
  ArrowDownRight, ArrowUpRight, Pencil, Plus, Trash2,
  TrendingUp, TrendingDown, BarChart2, Trophy, AlertCircle,
  History, Users, MoreVertical, ChevronRight,
} from "lucide-react";
import { format } from "date-fns";
import { useQueryClient } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { Checkbox } from "@/components/ui/checkbox";

// Preset saran poin
type PoinPreset = { label: string; jenis: "positif" | "negatif"; poin: number };
const SARAN_NEGATIF: PoinPreset[] = [
  { label: "Terlambat", jenis: "negatif", poin: 5 },
  { label: "Tidak bawa buku", jenis: "negatif", poin: 3 },
  { label: "Tidak kerjakan PR", jenis: "negatif", poin: 5 },
  { label: "Tidak pakai seragam", jenis: "negatif", poin: 5 },
  { label: "Menyontek", jenis: "negatif", poin: 15 },
  { label: "Bolos", jenis: "negatif", poin: 20 },
];
const SARAN_POSITIF: PoinPreset[] = [
  { label: "Aktif menjawab", jenis: "positif", poin: 5 },
  { label: "Membantu teman", jenis: "positif", poin: 5 },
  { label: "Nilai ujian terbaik", jenis: "positif", poin: 10 },
  { label: "Juara kelas", jenis: "positif", poin: 20 },
  { label: "Mewakili lomba", jenis: "positif", poin: 15 },
];

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

function todayStr() {
  return new Date().toISOString().split("T")[0];
}

export default function Poin() {
  const { data: students } = useListStudents();
  const { data: pointsList, isLoading } = useListPoints();
  const bulkCreatePoints = useBulkCreatePoints();
  const updatePoint = useUpdatePoint();
  const deletePoint = useDeletePoint();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [kelasFilter, setKelasFilter] = useState<string>("all");     // used inside dialog
  const [rekapKelasFilter, setRekapKelasFilter] = useState<string>("all"); // used in Rekap tab
  const [activeTab, setActiveTab] = useState<"Riwayat" | "Rekap Siswa">("Riwayat");
  const [editingPoint, setEditingPoint] = useState<string | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const kelasList = useMemo(
    () => [...new Set((students ?? []).map((s: any) => s.kelas))].sort(),
    [students],
  );

  const invalidatePoints = () => queryClient.invalidateQueries({ queryKey: ["/api/points"] });

  // ---- Stats computation ----
  const stats = useMemo(() => {
    const totalMasuk = (pointsList as any[] ?? [])
      .filter((p: any) => p.jenis === "positif")
      .reduce((s: number, p: any) => s + p.poin, 0);
    const totalKeluar = (pointsList as any[] ?? [])
      .filter((p: any) => p.jenis === "negatif")
      .reduce((s: number, p: any) => s + p.poin, 0);
    return { totalMasuk, totalKeluar, saldo: totalMasuk - totalKeluar };
  }, [pointsList]);

  // ---- Top Pelanggaran & Prestasi ----
  const { topPelanggaran, topPrestasi } = useMemo(() => {
    const mapNegatif = new Map<string, { studentId: string; total: number; count: number }>();
    const mapPositif = new Map<string, { studentId: string; total: number; count: number }>();
    for (const p of (pointsList as any[] ?? [])) {
      if (p.jenis === "negatif") {
        const cur = mapNegatif.get(p.studentId) ?? { studentId: p.studentId, total: 0, count: 0 };
        cur.total += p.poin;
        cur.count++;
        mapNegatif.set(p.studentId, cur);
      } else {
        const cur = mapPositif.get(p.studentId) ?? { studentId: p.studentId, total: 0, count: 0 };
        cur.total += p.poin;
        cur.count++;
        mapPositif.set(p.studentId, cur);
      }
    }
    const getName = (id: string) =>
      (students as any[] ?? []).find((s: any) => s.id === id)?.namaLengkap ?? id;
    const getKelas = (id: string) =>
      (students as any[] ?? []).find((s: any) => s.id === id)?.kelas ?? "";

    const topPelanggaran = [...mapNegatif.values()]
      .sort((a, b) => b.total - a.total)
      .slice(0, 3)
      .map((x) => ({ ...x, name: getName(x.studentId), kelas: getKelas(x.studentId) }));
    const topPrestasi = [...mapPositif.values()]
      .sort((a, b) => b.total - a.total)
      .slice(0, 3)
      .map((x) => ({ ...x, name: getName(x.studentId), kelas: getKelas(x.studentId) }));
    return { topPelanggaran, topPrestasi };
  }, [pointsList, students]);

  // ---- Rekap per siswa ----
  const rekapRows = useMemo(() => {
    if (!students || !pointsList) return [];
    const map = new Map<string, { positif: number; negatif: number }>();
    for (const p of pointsList as any[]) {
      const cur = map.get(p.studentId) ?? { positif: 0, negatif: 0 };
      if (p.jenis === "positif") cur.positif += p.poin;
      else cur.negatif += p.poin;
      map.set(p.studentId, cur);
    }
    return (students as any[])
      .map((s) => {
        const acc = map.get(s.id) ?? { positif: 0, negatif: 0 };
        return { ...s, positif: acc.positif, negatif: acc.negatif, saldo: acc.positif - acc.negatif };
      })
      .sort((a, b) => b.negatif - a.negatif);
  }, [students, pointsList]);

  const filteredRekapRows = useMemo(
    () => rekapRows.filter((r: any) => rekapKelasFilter === "all" || r.kelas === rekapKelasFilter),
    [rekapRows, rekapKelasFilter],
  );

  // ---- Edit dialog ----
  const editForm = useForm<z.infer<typeof editPointSchema>>({
    resolver: zodResolver(editPointSchema),
    defaultValues: { jenis: "positif", poin: 5, keterangan: "", tanggal: todayStr() },
  });
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

  // ---- Input Poin dialog ----
  const form = useForm<z.infer<typeof pointSchema>>({
    resolver: zodResolver(pointSchema),
    defaultValues: { studentIds: [], jenis: "positif", poin: 5, keterangan: "", tanggal: todayStr() },
  });
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

  // Avatar color helper
  const AVATAR_COLORS = [
    "bg-blue-100 text-blue-700", "bg-pink-100 text-pink-700",
    "bg-orange-100 text-orange-700", "bg-purple-100 text-purple-700",
    "bg-indigo-100 text-indigo-700", "bg-rose-100 text-rose-700",
    "bg-teal-100 text-teal-700", "bg-emerald-100 text-emerald-700",
    "bg-amber-100 text-amber-700", "bg-cyan-100 text-cyan-700",
  ];
  const getAvatar = (name: string) => {
    const idx = name.charCodeAt(0) % AVATAR_COLORS.length;
    return AVATAR_COLORS[idx];
  };
  const getInitials = (name: string) =>
    name.split(" ").map((p) => p[0]).filter(Boolean).slice(0, 2).join("").toUpperCase();

  return (
    <Layout>
      {/* Header */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <div className="text-xs text-slate-400 mb-2 flex items-center gap-1">
            <span>Beranda</span>
            <ChevronRight className="w-3 h-3" />
            <span>Kesiswaan</span>
            <ChevronRight className="w-3 h-3" />
            <span className="text-slate-600 font-medium">Poin Siswa</span>
          </div>
          <h1 className="text-xl font-bold text-slate-800">Poin Siswa</h1>
          <p className="text-sm text-slate-500 mt-0.5">Buku catatan poin pelanggaran dan prestasi.</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsDialogOpen(true)}
            className="flex items-center gap-2 rounded-full bg-slate-800 text-white px-4 py-2 text-sm font-medium hover:bg-slate-700 transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Tambah Poin
          </button>
        </div>
      </div>

      {/* Pill Switcher */}
      <div className="flex items-center gap-2 mb-8 bg-slate-200/50 p-1 rounded-full w-max">
        {(["Riwayat", "Rekap Siswa"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
              activeTab === tab
                ? "bg-white text-slate-800 shadow-sm"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            {tab === "Riwayat" && <History className="w-4 h-4" />}
            {tab === "Rekap Siswa" && <Users className="w-4 h-4" />}
            {tab}
          </button>
        ))}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 flex items-center gap-4 relative overflow-hidden">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-emerald-100 text-emerald-600">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs uppercase tracking-wide text-slate-500 font-semibold mb-1">Poin Masuk</div>
            {isLoading ? <Skeleton className="h-9 w-16" /> : (
              <div className="text-3xl font-black text-slate-800">{stats.totalMasuk}</div>
            )}
          </div>
          <div className="h-1 absolute bottom-0 left-0 right-0 bg-emerald-500" />
        </div>
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 flex items-center gap-4 relative overflow-hidden">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-rose-100 text-rose-600">
            <TrendingDown className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs uppercase tracking-wide text-slate-500 font-semibold mb-1">Poin Keluar</div>
            {isLoading ? <Skeleton className="h-9 w-16" /> : (
              <div className="text-3xl font-black text-slate-800">-{stats.totalKeluar}</div>
            )}
          </div>
          <div className="h-1 absolute bottom-0 left-0 right-0 bg-rose-500" />
        </div>
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 flex items-center gap-4 relative overflow-hidden">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-blue-100 text-blue-600">
            <BarChart2 className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs uppercase tracking-wide text-slate-500 font-semibold mb-1">Saldo Bersih</div>
            {isLoading ? <Skeleton className="h-9 w-16" /> : (
              <div className={`text-3xl font-black ${stats.saldo >= 0 ? "text-slate-800" : "text-rose-600"}`}>
                {stats.saldo >= 0 ? stats.saldo : stats.saldo}
              </div>
            )}
          </div>
          <div className="h-1 absolute bottom-0 left-0 right-0 bg-blue-500" />
        </div>
      </div>

      {/* Riwayat Tab */}
      {activeTab === "Riwayat" && (
        <div className="flex flex-col lg:flex-row gap-5">
          {/* Left: Table */}
          <div className="flex-1 min-w-0">
            <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Riwayat Poin Terbaru</h2>
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 text-xs uppercase text-slate-500 border-b border-slate-200">
                      <th className="font-semibold p-4">Tanggal</th>
                      <th className="font-semibold p-4">Siswa</th>
                      <th className="font-semibold p-4">Keterangan</th>
                      <th className="font-semibold p-4 text-right">Poin</th>
                      <th className="font-semibold p-4 w-10"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-sm">
                    {isLoading ? (
                      Array(5).fill(0).map((_, i) => (
                        <tr key={i}>
                          <td className="p-4"><Skeleton className="h-4 w-24" /></td>
                          <td className="p-4"><div className="flex items-center gap-3"><Skeleton className="w-8 h-8 rounded-full" /><Skeleton className="h-4 w-32" /></div></td>
                          <td className="p-4"><Skeleton className="h-4 w-40" /></td>
                          <td className="p-4"><Skeleton className="h-6 w-12 ml-auto" /></td>
                          <td className="p-4"></td>
                        </tr>
                      ))
                    ) : !(pointsList as any[])?.length ? (
                      <tr>
                        <td colSpan={5} className="p-12 text-center text-slate-400 text-sm">
                          Belum ada catatan poin.
                        </td>
                      </tr>
                    ) : (
                      (pointsList as any[]).map((p) => {
                        const student = (students as any[])?.find((s) => s.id === p.studentId);
                        return (
                          <tr key={p.id} className="hover:bg-slate-50/70 transition-colors">
                            <td className="p-4 text-slate-500 whitespace-nowrap">
                              {format(new Date(p.tanggal), "dd MMM yyyy")}
                            </td>
                            <td className="p-4">
                              <div className="flex items-center gap-3">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${getAvatar(student?.namaLengkap ?? "")}`}>
                                  {getInitials(student?.namaLengkap ?? "?")}
                                </div>
                                <span className="font-medium text-slate-700">{student?.namaLengkap ?? "-"}</span>
                              </div>
                            </td>
                            <td className="p-4 text-slate-600">{p.keterangan}</td>
                            <td className="p-4 text-right">
                              <span className={`inline-flex items-center justify-center rounded-full px-2.5 py-0.5 text-xs font-bold ${
                                p.jenis === "positif"
                                  ? "bg-emerald-100 text-emerald-700"
                                  : "bg-rose-100 text-rose-700"
                              }`}>
                                {p.jenis === "positif" ? `+${p.poin}` : `-${p.poin}`}
                              </span>
                            </td>
                            <td className="p-4">
                              <div className="flex items-center gap-1 opacity-0 hover:opacity-100 group-hover:opacity-100">
                                <button
                                  onClick={() => openEditPoint(p)}
                                  className="text-slate-400 hover:text-blue-600 rounded-full p-1 hover:bg-blue-50 transition-colors"
                                >
                                  <Pencil className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => handleDeletePoint(p.id)}
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

          {/* Right: Sidebars */}
          <div className="w-full lg:w-72 flex flex-col gap-5">
            {/* Top Pelanggaran */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-4 border-b border-slate-100 flex items-center gap-3 bg-rose-50/30">
                <div className="w-8 h-8 rounded-lg bg-rose-100 text-rose-600 flex items-center justify-center">
                  <AlertCircle className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-slate-800 text-sm">Top Pelanggaran</h3>
              </div>
              <div className="p-4 flex flex-col gap-4">
                {topPelanggaran.length === 0 ? (
                  <p className="text-xs text-slate-400 text-center py-2">Belum ada data</p>
                ) : topPelanggaran.map((item, idx) => (
                  <div key={item.studentId} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-bold text-slate-400 w-4">{idx + 1}</span>
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${getAvatar(item.name)}`}>
                        {getInitials(item.name)}
                      </div>
                      <div>
                        <div className="font-medium text-slate-700 text-sm">{item.name}</div>
                        <div className="text-xs text-slate-400">{item.count} catatan</div>
                      </div>
                    </div>
                    <span className="inline-flex rounded-full bg-rose-100 text-rose-700 px-2 py-0.5 text-xs font-bold">
                      -{item.total}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Top Prestasi */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-4 border-b border-slate-100 flex items-center gap-3 bg-emerald-50/30">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center">
                  <Trophy className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-slate-800 text-sm">Prestasi Tertinggi</h3>
              </div>
              <div className="p-4 flex flex-col gap-4">
                {topPrestasi.length === 0 ? (
                  <p className="text-xs text-slate-400 text-center py-2">Belum ada data</p>
                ) : topPrestasi.map((item, idx) => (
                  <div key={item.studentId} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-bold text-slate-400 w-4">{idx + 1}</span>
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${getAvatar(item.name)}`}>
                        {getInitials(item.name)}
                      </div>
                      <div>
                        <div className="font-medium text-slate-700 text-sm">{item.name}</div>
                        <div className="text-xs text-slate-400">{item.count} apresiasi</div>
                      </div>
                    </div>
                    <span className="inline-flex rounded-full bg-emerald-100 text-emerald-700 px-2 py-0.5 text-xs font-bold">
                      +{item.total}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Rekap Siswa Tab */}
      {activeTab === "Rekap Siswa" && (
        <>
          {/* Filter bar */}
          <div className="flex items-center gap-3 mb-4 flex-wrap">
            <span className="text-sm font-medium text-slate-500">Filter Kelas:</span>
            <Select value={rekapKelasFilter} onValueChange={setRekapKelasFilter}>
              <SelectTrigger className="w-[160px] h-8 text-sm">
                <SelectValue placeholder="Semua Kelas" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Kelas</SelectItem>
                {kelasList.map((k) => <SelectItem key={k} value={k}>{k}</SelectItem>)}
              </SelectContent>
            </Select>
            {rekapKelasFilter !== "all" && (
              <button
                onClick={() => setRekapKelasFilter("all")}
                className="text-xs text-slate-400 hover:text-slate-600 transition-colors"
              >
                Reset
              </button>
            )}
          </div>
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-xs uppercase text-slate-500 border-b border-slate-200">
                  <th className="font-semibold p-4">Nama Siswa</th>
                  <th className="font-semibold p-4">Kelas</th>
                  <th className="font-semibold p-4 text-emerald-600">Poin Positif</th>
                  <th className="font-semibold p-4 text-rose-600">Poin Negatif</th>
                  <th className="font-semibold p-4">Total Poin</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {isLoading ? (
                  Array(5).fill(0).map((_, i) => (
                    <tr key={i}><td colSpan={5} className="p-4"><Skeleton className="h-6 w-full" /></td></tr>
                  ))
                ) : filteredRekapRows.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-12 text-center text-slate-400">
                      {rekapKelasFilter !== "all" ? `Tidak ada siswa di kelas ${rekapKelasFilter}.` : "Belum ada data poin."}
                    </td>
                  </tr>
                ) : filteredRekapRows.map((s: any) => (
                  <tr key={s.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${getAvatar(s.namaLengkap)}`}>
                          {getInitials(s.namaLengkap)}
                        </div>
                        <span className="font-medium text-slate-700">{s.namaLengkap}</span>
                      </div>
                    </td>
                    <td className="p-4 text-slate-500">{s.kelas}</td>
                    <td className="p-4">
                      {s.positif > 0 ? (
                        <span className="flex items-center gap-1 text-emerald-600 font-semibold">
                          <ArrowUpRight className="w-4 h-4" />{s.positif}
                        </span>
                      ) : <span className="text-slate-400">—</span>}
                    </td>
                    <td className="p-4">
                      {s.negatif > 0 ? (
                        <span className="flex items-center gap-1 text-rose-600 font-semibold">
                          <ArrowDownRight className="w-4 h-4" />{s.negatif}
                        </span>
                      ) : <span className="text-slate-400">—</span>}
                    </td>
                    <td className="p-4">
                      <span className={`inline-flex items-center justify-center rounded-full px-2.5 py-0.5 text-xs font-bold border ${
                        s.saldo > 0
                          ? "border-emerald-300 bg-emerald-50 text-emerald-700"
                          : s.saldo < 0
                            ? "border-rose-300 bg-rose-50 text-rose-700"
                            : "border-gray-200 bg-gray-50 text-slate-500"
                      }`}>
                        {s.saldo > 0 ? "+" : ""}{s.saldo}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        </>
      )}

      {/* Input Poin Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
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
                      <label className="flex items-center gap-2 px-3 py-2 border-b bg-muted/40 cursor-pointer text-sm font-medium">
                        <Checkbox
                          checked={allVisibleSelected}
                          onCheckedChange={(checked) => {
                            if (checked) field.onChange([...new Set([...field.value, ...visibleIds])]);
                            else field.onChange(field.value.filter((id: string) => !visibleIds.includes(id)));
                          }}
                        />
                        Pilih Semua {kelasFilter !== "all" ? `(${kelasFilter})` : ""}
                      </label>
                      {visibleStudents.length === 0 ? (
                        <p className="px-3 py-4 text-sm text-muted-foreground text-center">Tidak ada siswa.</p>
                      ) : (
                        visibleStudents.map((s: any) => (
                          <label key={s.id} className="flex items-center gap-2 px-3 py-1.5 cursor-pointer hover:bg-muted/30 text-sm">
                            <Checkbox
                              checked={field.value.includes(s.id)}
                              onCheckedChange={(checked) => {
                                field.onChange(
                                  checked ? [...field.value, s.id] : field.value.filter((id: string) => id !== s.id),
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
              <div className="space-y-1.5">
                <p className="text-sm font-medium leading-none">Saran Cepat</p>
                <div className="flex flex-wrap gap-1.5">
                  {SARAN_NEGATIF.map((s) => (
                    <button key={s.label} type="button"
                      onClick={() => { form.setValue("jenis", s.jenis); form.setValue("poin", s.poin); form.setValue("keterangan", s.label); }}
                      className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100 transition-colors"
                    >
                      <ArrowDownRight className="w-3 h-3" />{s.label} ({s.poin})
                    </button>
                  ))}
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {SARAN_POSITIF.map((s) => (
                    <button key={s.label} type="button"
                      onClick={() => { form.setValue("jenis", s.jenis); form.setValue("poin", s.poin); form.setValue("keterangan", s.label); }}
                      className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors"
                    >
                      <ArrowUpRight className="w-3 h-3" />{s.label} ({s.poin})
                    </button>
                  ))}
                </div>
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

      {/* Edit Dialog */}
      <Dialog open={!!editingPoint} onOpenChange={(open) => !open && setEditingPoint(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Edit Poin</DialogTitle></DialogHeader>
          <Form {...editForm}>
            <form onSubmit={editForm.handleSubmit(onSubmitEdit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField control={editForm.control} name="jenis" render={({ field }) => (
                  <FormItem><FormLabel>Jenis Poin</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                      <SelectContent>
                        <SelectItem value="positif">Positif</SelectItem>
                        <SelectItem value="negatif">Negatif</SelectItem>
                      </SelectContent>
                    </Select><FormMessage />
                  </FormItem>
                )} />
                <FormField control={editForm.control} name="poin" render={({ field }) => (
                  <FormItem><FormLabel>Jumlah Poin</FormLabel><FormControl><Input type="number" min="1" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
              </div>
              <FormField control={editForm.control} name="keterangan" render={({ field }) => (
                <FormItem><FormLabel>Keterangan</FormLabel><FormControl><Textarea {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={editForm.control} name="tanggal" render={({ field }) => (
                <FormItem><FormLabel>Tanggal</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <DialogFooter><Button type="submit" disabled={updatePoint.isPending}>Simpan</Button></DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
