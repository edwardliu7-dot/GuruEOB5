import { Layout } from "@/components/layout";
import {
  useListSubjects,
  useGenerateSoalOtomatis,
  useListSoalOtomatis,
  useGetSoalOtomatis,
  useDeleteSoalOtomatis,
  getGetSoalOtomatisQueryKey,
} from "@workspace/api-client-react";
import { useState, Component } from "react";
import type { ReactNode } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import {
  Sparkles,
  Download,
  Trash2,
  Loader2,
  ListChecks,
  Clock,
  AlertTriangle,
  History,
  FileText,
  ClipboardList,
  Wand2,
  CheckCircle2,
} from "lucide-react";
import { format } from "date-fns";
import { useQueryClient } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import type { SoalOtomatis } from "@workspace/api-client-react";

function safeFormat(value: unknown, fmt: string): string {
  try {
    if (!value) return "-";
    const d = new Date(value as string);
    if (isNaN(d.getTime())) return "-";
    return format(d, fmt);
  } catch {
    return "-";
  }
}

class PreviewErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean; message: string }> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false, message: "" };
  }
  static getDerivedStateFromError(error: unknown) {
    return { hasError: true, message: String(error) };
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center py-16 text-center gap-3 text-slate-500">
          <AlertTriangle className="w-10 h-10 text-red-400" />
          <p className="font-medium text-red-600">Gagal menampilkan preview</p>
          <p className="text-xs max-w-sm">{this.state.message}</p>
          <button
            className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium hover:bg-slate-50"
            onClick={() => this.setState({ hasError: false, message: "" })}
          >
            Coba lagi
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

const formSchema = z.object({
  subjectId: z.string().min(1, "Mata pelajaran harus dipilih"),
  materi: z.string().min(1, "Materi/topik harus diisi"),
  jumlahSoal: z.coerce.number().int().min(1, "Minimal 1 soal").max(50, "Maksimal 50 soal"),
  jenisSoal: z.enum(["pilihan_ganda", "esai"]),
  tingkatKesulitan: z.enum(["mudah", "sedang", "sulit"]),
});

type FormValues = z.infer<typeof formSchema>;

const LETTERS = ["A", "B", "C", "D", "E", "F"];

function toArr(val: unknown): any[] {
  if (Array.isArray(val)) return val;
  if (val == null) return [];
  return [val];
}

function SoalPreview({ soal }: { soal: SoalOtomatis }) {
  const content = (soal.content ?? {}) as any;
  if (!content || typeof content !== "object" || Array.isArray(content)) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center gap-2 text-slate-500">
        <AlertTriangle className="w-8 h-8 text-amber-500" />
        <p>Konten soal tidak dapat ditampilkan.</p>
      </div>
    );
  }

  const soalArr = toArr(content.soal);
  const previewSoal = soalArr.slice(0, 3);
  const remainingCount = soalArr.length - previewSoal.length;

  return (
    <div className="flex flex-col">
      {/* Header */}
      <div className="bg-slate-50 border-b border-slate-200 p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-800">{content.judul}</h3>
            <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-2">
              {content.petunjukPengerjaan && (
                <span className="italic">{content.petunjukPengerjaan}</span>
              )}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-slate-100 border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-600">
            {soalArr.length} Soal
          </span>
        </div>
      </div>

      {/* Questions */}
      <div className="p-5 flex flex-col gap-6">
        {previewSoal.map((q: any, idx: number) => (
          <div key={q?.nomor ?? idx}>
            <p className="text-sm font-medium text-slate-800 mb-3 flex gap-2">
              <span className="text-slate-400">{q?.nomor ?? idx + 1}.</span>
              <span>{q?.pertanyaan}</span>
            </p>
            {q?.tipe === "pilihan_ganda" || soal.jenisSoal === "pilihan_ganda" ? (
              <div className="pl-5 grid grid-cols-2 gap-2 text-sm">
                {toArr(q?.pilihan).map((opt: string, i: number) => {
                  const isCorrect = opt === q?.jawabanBenar;
                  return (
                    <div
                      key={i}
                      className={`border rounded-lg p-2.5 flex items-center gap-3 relative overflow-hidden ${
                        isCorrect
                          ? "border-green-500 bg-green-50"
                          : "border-slate-200"
                      }`}
                    >
                      {isCorrect && <div className="absolute left-0 top-0 bottom-0 w-1 bg-green-500" />}
                      <div
                        className={`w-6 h-6 rounded-md text-xs flex items-center justify-center font-medium ${
                          isCorrect
                            ? "bg-green-200 text-green-800"
                            : "bg-slate-100 text-slate-500"
                        }`}
                      >
                        {LETTERS[i] ?? i + 1}
                      </div>
                      <span className={isCorrect ? "font-medium text-green-900" : ""}>{opt}</span>
                      {isCorrect && <CheckCircle2 className="w-4 h-4 text-green-500 ml-auto" />}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="pl-5 border border-slate-200 rounded-lg p-3 bg-slate-50">
                <p className="text-xs text-slate-500 mb-1 font-semibold uppercase tracking-wider">Kunci Jawaban</p>
                <p className="text-sm text-slate-700">{q?.jawabanBenar}</p>
              </div>
            )}
            {q?.pembahasan && (
              <p className="mt-2 pl-5 text-xs text-slate-500">
                <span className="font-medium">Pembahasan: </span>{q.pembahasan}
              </p>
            )}
          </div>
        ))}
      </div>

      {remainingCount > 0 && (
        <div className="bg-slate-50 p-3 border-t border-slate-200 text-center">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Dan {remainingCount} soal lainnya (unduh untuk melihat semua)
          </p>
        </div>
      )}
    </div>
  );
}

export default function SoalOtomatisPage() {
  const { data: subjects } = useListSubjects();
  const { data: history, isLoading: isLoadingHistory } = useListSoalOtomatis();
  const generate = useGenerateSoalOtomatis();
  const deleteSoal = useDeleteSoalOtomatis();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const { data: selectedSoal, isLoading: isLoadingSelected } = useGetSoalOtomatis(
    selectedId as string,
    { query: { enabled: !!selectedId, queryKey: getGetSoalOtomatisQueryKey(selectedId as string) } },
  );

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      subjectId: "",
      materi: "",
      jumlahSoal: 10,
      jenisSoal: "pilihan_ganda",
      tingkatKesulitan: "sedang",
    },
  });

  const tipeSoal = form.watch("jenisSoal");
  const kesulitan = form.watch("tingkatKesulitan");

  const onSubmit = async (values: FormValues) => {
    try {
      const result = await generate.mutateAsync({ data: values });
      queryClient.setQueryData(getGetSoalOtomatisQueryKey(result.id), result);
      setSelectedId(result.id);
      queryClient.invalidateQueries({ queryKey: ["/api/soal-otomatis"] });
      toast({ title: "Berhasil", description: "Soal berhasil dibuat" });
    } catch (e: any) {
      const msg = e?.data?.error ?? e?.message ?? "Terjadi kesalahan saat membuat soal";
      toast({ variant: "destructive", title: "Gagal membuat soal", description: msg });
    }
  };

  const handleDownload = async (id: string) => {
    setDownloadingId(id);
    try {
      const response = await fetch(`/api/soal-otomatis/${id}/docx`, { credentials: "include" });
      if (!response.ok) throw new Error("Gagal mengunduh");
      const blob = await response.blob();
      const disposition = response.headers.get("Content-Disposition") ?? "";
      const match = disposition.match(/filename="(.+)"/);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = match?.[1] ?? "Soal.docx";
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch {
      toast({ variant: "destructive", title: "Gagal", description: "Tidak dapat mengunduh berkas" });
    } finally {
      setDownloadingId(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Yakin ingin menghapus soal ini?")) return;
    try {
      await deleteSoal.mutateAsync({ id });
      if (selectedId === id) setSelectedId(null);
      queryClient.invalidateQueries({ queryKey: ["/api/soal-otomatis"] });
      toast({ title: "Berhasil", description: "Dihapus" });
    } catch {
      toast({ variant: "destructive", title: "Gagal", description: "Terjadi kesalahan" });
    }
  };

  return (
    <Layout>
      {/* Header */}
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-800">Soal Otomatis</h1>
          <p className="text-sm text-slate-500 mt-1">
            Buat soal latihan dan ujian dalam hitungan detik menggunakan AI.
          </p>
        </div>
      </div>

      <div className="flex gap-5 items-start">
        {/* Left panel */}
        <div className="flex-1 flex flex-col gap-5 min-w-0">
          {/* Form card */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
            <h2 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-purple-500" />
              Parameter Pembuatan Soal
            </h2>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="subjectId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                          Mata Pelajaran
                        </FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger className="bg-slate-50 border-slate-200 rounded-lg text-sm text-slate-700">
                              <SelectValue placeholder="Pilih mata pelajaran" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {subjects?.map((s: any) => (
                              <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="materi"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                          Topik / Materi Spesifik
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Misal: Sistem pencernaan manusia..."
                            className="bg-slate-50 border-slate-200 rounded-lg text-sm text-slate-700"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="jumlahSoal"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                          Jumlah Soal
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min={1}
                            max={50}
                            className="bg-slate-50 border-slate-200 rounded-lg text-sm text-slate-700"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div>
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                      Tipe Soal
                    </p>
                    <div className="flex bg-slate-100/50 p-1 rounded-lg border border-slate-200">
                      {(["pilihan_ganda", "esai"] as const).map((t) => (
                        <button
                          key={t}
                          type="button"
                          onClick={() => form.setValue("jenisSoal", t)}
                          className={`flex-1 rounded-md py-1.5 text-xs font-medium transition-colors ${
                            tipeSoal === t
                              ? "bg-white shadow-sm text-slate-800 border border-slate-200/50"
                              : "text-slate-500 hover:text-slate-700"
                          }`}
                        >
                          {t === "pilihan_ganda" ? "Pilihan Ganda" : "Esai"}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                      Kesulitan
                    </p>
                    <div className="flex bg-slate-100/50 p-1 rounded-lg border border-slate-200">
                      {(["mudah", "sedang", "sulit"] as const).map((k) => (
                        <button
                          key={k}
                          type="button"
                          onClick={() => form.setValue("tingkatKesulitan", k)}
                          className={`flex-1 rounded-md py-1.5 text-xs font-medium transition-colors capitalize ${
                            kesulitan === k
                              ? "bg-white shadow-sm text-slate-800 border border-slate-200/50"
                              : "text-slate-500 hover:text-slate-700"
                          }`}
                        >
                          {k.charAt(0).toUpperCase() + k.slice(1)}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={generate.isPending}
                  className="w-full rounded-full bg-slate-800 text-white px-4 py-2.5 text-sm font-medium hover:bg-slate-700 flex items-center justify-center gap-2 transition-all shadow-sm disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {generate.isPending ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Wand2 className="w-4 h-4" />
                  )}
                  {generate.isPending ? "Menyusun Soal..." : "Generate Soal dengan AI"}
                </button>
              </form>
            </Form>
          </div>

          {/* Generated preview */}
          {isLoadingSelected ? (
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-3">
              {Array(6).fill(0).map((_, i) => (
                <Skeleton key={i} className="h-5 w-full" />
              ))}
            </div>
          ) : selectedSoal ? (
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
              <PreviewErrorBoundary>
                <SoalPreview soal={selectedSoal} />
              </PreviewErrorBoundary>
              <div className="p-4 border-t border-slate-200 bg-slate-50/50">
                <button
                  type="button"
                  onClick={() => handleDownload(selectedSoal.id)}
                  disabled={downloadingId === selectedSoal.id}
                  className="rounded-full bg-white border border-slate-200 text-slate-700 px-4 py-2 text-sm font-medium hover:bg-slate-50 flex items-center gap-1.5 shadow-sm transition-colors disabled:opacity-60 mx-auto"
                >
                  {downloadingId === selectedSoal.id ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Download className="w-3.5 h-3.5" />
                  )}
                  Unduh DOCX
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-12 flex flex-col items-center justify-center text-center text-slate-400">
              <ListChecks className="w-12 h-12 mb-3 text-slate-200" />
              <p className="text-sm">Isi form di atas lalu klik "Generate Soal" untuk membuat soal baru,</p>
              <p className="text-sm">atau pilih salah satu riwayat untuk melihat kembali.</p>
            </div>
          )}
        </div>

        {/* Right sidebar */}
        <div className="w-72 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col shrink-0">
          <div className="p-4 border-b border-slate-200 flex items-center gap-2 bg-slate-50/50">
            <History className="w-4 h-4 text-slate-500" />
            <h2 className="text-sm font-bold text-slate-800">Riwayat Soal</h2>
          </div>

          {isLoadingHistory ? (
            <div className="p-4 space-y-2">
              {Array(3).fill(0).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : !history?.length ? (
            <p className="p-6 text-center text-sm text-slate-400">Belum ada soal yang dibuat.</p>
          ) : (
            <div className="flex flex-col divide-y divide-slate-100">
              {history.map((h: any) => {
                const isPG = h.jenisSoal === "pilihan_ganda";
                const colors: string[] = [
                  "bg-blue-100 text-blue-700",
                  "bg-orange-100 text-orange-700",
                  "bg-green-100 text-green-700",
                  "bg-indigo-100 text-indigo-700",
                  "bg-rose-100 text-rose-700",
                ];
                // stable color per id
                const colorIdx = h.id
                  ? Math.abs(h.id.charCodeAt(0) - 65) % colors.length
                  : 0;
                const colorClass = colors[colorIdx];
                return (
                  <button
                    key={h.id}
                    type="button"
                    onClick={() => setSelectedId(h.id)}
                    className={`p-4 text-left hover:bg-slate-50 transition-colors group flex items-start gap-3 ${selectedId === h.id ? "bg-slate-50" : ""}`}
                  >
                    <div
                      className={`mt-0.5 w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${colorClass}`}
                    >
                      {isPG ? (
                        <ClipboardList className="w-4 h-4" />
                      ) : (
                        <FileText className="w-4 h-4" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-semibold text-slate-800 group-hover:text-indigo-600 transition-colors line-clamp-2 leading-tight">
                        {h.materi}
                      </h3>
                      <div className="flex items-center gap-2 mt-1.5">
                        <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
                          {isPG ? "Pilihan Ganda" : "Esai"}
                        </span>
                        <span className="w-1 h-1 rounded-full bg-slate-300" />
                        <span className="text-[10px] font-medium text-slate-500">{h.jumlahSoal} Soal</span>
                      </div>
                      <div className="flex items-center gap-1 mt-1 text-xs text-slate-400">
                        <Clock className="w-3 h-3" />
                        {safeFormat(h.createdAt, "dd MMM yyyy")}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); handleDelete(h.id); }}
                      className="opacity-0 group-hover:opacity-100 transition-opacity text-slate-300 hover:text-red-500 p-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
