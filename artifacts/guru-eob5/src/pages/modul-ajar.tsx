import { Layout } from "@/components/layout";
import {
  useListSubjects,
  useGenerateModulAjar,
  useListModulAjar,
  useGetModulAjar,
  useDeleteModulAjar,
  getGetModulAjarQueryKey,
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
  FileText,
  Clock,
  AlertTriangle,
  History,
  BookOpen,
  ChevronDown,
  ChevronUp,
  Target,
  BookMarked,
  List,
} from "lucide-react";
import { format } from "date-fns";
import { useQueryClient } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import type { ModulAjar } from "@workspace/api-client-react";

/** Safe date formatter — never throws even on null/undefined/invalid dates */
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

/** Error boundary that shows a friendly message instead of crashing the whole page */
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
  alokasiWaktu: z.string().min(1, "Alokasi waktu harus diisi"),
  kelas: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

/** Safely coerce an unknown value to an array — prevents `.map is not a function` crashes */
function toArr(val: unknown): any[] {
  if (Array.isArray(val)) return val;
  if (val == null) return [];
  return [val];
}

function ModulPreview({ modul }: { modul: ModulAjar }) {
  const [expandedSection, setExpandedSection] = useState<string | null>("tujuan");
  const content = (modul.content ?? {}) as any;

  if (!content || typeof content !== "object" || Array.isArray(content)) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center gap-2 text-slate-500">
        <AlertTriangle className="w-8 h-8 text-amber-500" />
        <p>Konten modul ajar tidak dapat ditampilkan.</p>
      </div>
    );
  }

  const ki = (typeof content.komponenInti === "object" && content.komponenInti ? content.komponenInti : {}) as any;
  const iu = (typeof content.informasiUmum === "object" && content.informasiUmum ? content.informasiUmum : {}) as any;
  const lp = (typeof content.lampiran === "object" && content.lampiran ? content.lampiran : {}) as any;

  const toggleSection = (section: string) => {
    setExpandedSection((prev) => (prev === section ? null : section));
  };

  const sections = [
    {
      id: "tujuan",
      title: "Tujuan Pembelajaran",
      icon: Target,
      content: (
        <ul className="list-disc pl-5 space-y-1.5 text-sm text-slate-600">
          {toArr(ki.tujuanPembelajaran).map((t: string, i: number) => (
            <li key={i}>{t}</li>
          ))}
        </ul>
      ),
    },
    {
      id: "materi",
      title: "Materi Inti",
      icon: BookMarked,
      content: (
        <div className="text-sm text-slate-600 space-y-2">
          <p>{iu.kompetensiAwal}</p>
          <p className="text-xs text-slate-400">Model: {iu.modelPembelajaran}</p>
        </div>
      ),
    },
    {
      id: "langkah",
      title: "Langkah Pembelajaran",
      icon: List,
      content: (
        <div className="space-y-3">
          {toArr(ki.kegiatanPembelajaran).map((k: any, idx: number) => (
            <div key={k?.pertemuanKe ?? idx}>
              <h4 className="text-xs font-bold text-slate-700 mb-1">
                Pertemuan ke-{k?.pertemuanKe ?? idx + 1}
              </h4>
              <p className="text-sm text-slate-600">
                <span className="font-medium">Pendahuluan: </span>{k?.pendahuluan}
              </p>
              <p className="text-sm text-slate-600">
                <span className="font-medium">Inti: </span>{k?.kegiatanInti}
              </p>
              <p className="text-sm text-slate-600">
                <span className="font-medium">Penutup: </span>{k?.penutup}
              </p>
            </div>
          ))}
        </div>
      ),
    },
    {
      id: "penilaian",
      title: "Penilaian (Asesmen)",
      icon: FileText,
      content: (
        <ul className="list-disc pl-5 space-y-1.5 text-sm text-slate-600">
          {ki.asesmen?.asesmenDiagnostik && <li><strong>Diagnostik:</strong> {ki.asesmen.asesmenDiagnostik}</li>}
          {ki.asesmen?.asesmenFormatif && <li><strong>Formatif:</strong> {ki.asesmen.asesmenFormatif}</li>}
          {ki.asesmen?.asesmenSumatif && <li><strong>Sumatif:</strong> {ki.asesmen.asesmenSumatif}</li>}
          {toArr(lp.rubrikPenilaian).map((r: string, i: number) => <li key={i}>{r}</li>)}
        </ul>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-0">
      {/* Header */}
      <div className="p-5 border-b border-slate-100 bg-slate-50/50">
        <div className="flex items-start justify-between mb-4">
          <div>
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className="rounded-full bg-blue-100 text-blue-700 px-2.5 py-0.5 text-xs font-medium">
                {modul.subjectName ?? "Modul Ajar"}
              </span>
              {modul.kelas && (
                <span className="rounded-full bg-slate-100 text-slate-600 px-2.5 py-0.5 text-xs font-medium">
                  {modul.kelas}
                </span>
              )}
              <span className="rounded-full bg-slate-100 text-slate-600 px-2.5 py-0.5 text-xs font-medium">
                {modul.alokasiWaktu}
              </span>
            </div>
            <h3 className="text-lg font-bold text-slate-800">
              {content.judul ?? `Modul Ajar: ${modul.materi}`}
            </h3>
          </div>
        </div>
      </div>

      {/* Collapsible sections */}
      <div className="p-5 space-y-3">
        {sections.map((section) => {
          const Icon = section.icon;
          return (
            <div key={section.id} className="border border-slate-200 rounded-lg overflow-hidden">
              <button
                type="button"
                onClick={() => toggleSection(section.id)}
                className="w-full flex items-center justify-between p-3.5 bg-white hover:bg-slate-50 transition-colors"
              >
                <div className="flex items-center gap-2.5 text-sm font-semibold text-slate-700">
                  <Icon className="w-4 h-4 text-slate-400" />
                  {section.title}
                </div>
                {expandedSection === section.id ? (
                  <ChevronUp className="w-4 h-4 text-slate-400" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-slate-400" />
                )}
              </button>
              {expandedSection === section.id && (
                <div className="p-4 border-t border-slate-100 bg-slate-50/30">
                  {section.content}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function ModulAjarPage() {
  const { data: subjects } = useListSubjects();
  const { data: history, isLoading: isLoadingHistory } = useListModulAjar();
  const generate = useGenerateModulAjar();
  const deleteModul = useDeleteModulAjar();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const { data: selectedModul, isLoading: isLoadingSelected } = useGetModulAjar(
    selectedId as string,
    { query: { enabled: !!selectedId, queryKey: getGetModulAjarQueryKey(selectedId as string) } },
  );

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { subjectId: "", materi: "", alokasiWaktu: "", kelas: "" },
  });

  const onSubmit = async (values: FormValues) => {
    try {
      const result = await generate.mutateAsync({ data: values });
      queryClient.setQueryData(getGetModulAjarQueryKey(result.id), result);
      setSelectedId(result.id);
      queryClient.invalidateQueries({ queryKey: ["/api/modul-ajar"] });
      toast({ title: "Berhasil", description: "Modul ajar berhasil dibuat" });
    } catch (e: any) {
      const msg = e?.data?.error ?? e?.message ?? "Terjadi kesalahan saat membuat modul ajar";
      toast({ variant: "destructive", title: "Gagal membuat modul ajar", description: msg });
    }
  };

  const handleDownload = async (id: string) => {
    setDownloadingId(id);
    try {
      const response = await fetch(`/api/modul-ajar/${id}/docx`, { credentials: "include" });
      if (!response.ok) throw new Error("Gagal mengunduh");
      const blob = await response.blob();
      const disposition = response.headers.get("Content-Disposition") ?? "";
      const match = disposition.match(/filename="(.+)"/);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = match?.[1] ?? "Modul_Ajar.docx";
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
    if (!confirm("Yakin ingin menghapus modul ajar ini?")) return;
    try {
      await deleteModul.mutateAsync({ id });
      if (selectedId === id) setSelectedId(null);
      queryClient.invalidateQueries({ queryKey: ["/api/modul-ajar"] });
      toast({ title: "Berhasil", description: "Dihapus" });
    } catch {
      toast({ variant: "destructive", title: "Gagal", description: "Terjadi kesalahan" });
    }
  };

  return (
    <Layout>
      {/* Page header */}
      <div className="mb-6">
        <h1 className="text-xl font-bold text-slate-800">Buat Modul Ajar AI</h1>
        <p className="text-sm text-slate-500 mt-0.5">Generate modul ajar Kurikulum Merdeka secara otomatis.</p>
      </div>

      <div className="flex gap-5 items-start">
        {/* Left panel */}
        <div className="flex-1 flex flex-col gap-5 min-w-0">
          {/* Form card */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
            <h2 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-500" />
              Parameter Modul
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
                            <SelectTrigger className="rounded-lg border-slate-200 bg-white text-sm text-slate-800 focus:ring-2 focus:ring-slate-800/20 focus:border-slate-800">
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
                    name="kelas"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                          Kelas (Opsional)
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Misal: VII"
                            className="rounded-lg border-slate-200 text-sm text-slate-800 focus:ring-2 focus:ring-slate-800/20 focus:border-slate-800"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="col-span-2">
                    <FormField
                      control={form.control}
                      name="materi"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                            Topik / Materi
                          </FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Contoh: Sistem Pencernaan Manusia"
                              className="rounded-lg border-slate-200 text-sm text-slate-800 focus:ring-2 focus:ring-slate-800/20 focus:border-slate-800"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <FormField
                    control={form.control}
                    name="alokasiWaktu"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                          Alokasi Waktu
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Misal: 2 JP"
                            className="rounded-lg border-slate-200 text-sm text-slate-800 focus:ring-2 focus:ring-slate-800/20 focus:border-slate-800"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <button
                  type="submit"
                  disabled={generate.isPending}
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-slate-800 to-slate-700 text-white px-4 py-3 text-sm font-bold shadow-sm hover:from-slate-700 hover:to-slate-600 transition-all disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {generate.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Memproses dengan AI...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>Generate Modul Ajar</span>
                    </>
                  )}
                </button>
              </form>
            </Form>
          </div>

          {/* Generated preview card */}
          {isLoadingSelected ? (
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-3">
              {Array(6).fill(0).map((_, i) => (
                <Skeleton key={i} className="h-5 w-full" />
              ))}
            </div>
          ) : selectedModul ? (
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
              <PreviewErrorBoundary>
                <ModulPreview modul={selectedModul} />
              </PreviewErrorBoundary>
              <div className="p-5 border-t border-slate-100 bg-slate-50/50">
                <button
                  type="button"
                  onClick={() => handleDownload(selectedModul.id)}
                  disabled={downloadingId === selectedModul.id}
                  className="w-full flex items-center justify-center gap-2 rounded-full bg-white border border-slate-300 text-slate-700 px-4 py-2.5 text-sm font-medium hover:bg-slate-50 transition-colors shadow-sm disabled:opacity-60"
                >
                  {downloadingId === selectedModul.id ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Download className="w-4 h-4" />
                  )}
                  <span>Download DOCX</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-12 flex flex-col items-center justify-center text-center text-slate-400">
              <FileText className="w-12 h-12 mb-3 text-slate-200" />
              <p className="text-sm">Isi form di atas lalu klik "Generate Modul Ajar" untuk membuat modul baru,</p>
              <p className="text-sm">atau pilih salah satu riwayat untuk melihat kembali.</p>
            </div>
          )}
        </div>

        {/* Right sidebar */}
        <div className="w-72 bg-white rounded-xl border border-slate-200 shadow-sm p-4 flex flex-col sticky top-6 shrink-0" style={{ maxHeight: "calc(100vh - 8rem)" }}>
          <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-100">
            <History className="w-4 h-4 text-slate-500" />
            <h3 className="text-sm font-bold text-slate-800">Riwayat Modul</h3>
          </div>

          {isLoadingHistory ? (
            <div className="space-y-2">
              {Array(3).fill(0).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : !history?.length ? (
            <p className="text-sm text-slate-400 text-center py-8">Belum ada modul yang dibuat.</p>
          ) : (
            <div className="flex-1 overflow-y-auto -mx-2 px-2 space-y-1 [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:rounded [&::-webkit-scrollbar-thumb]:bg-slate-200">
              {history.map((h: any) => (
                <div
                  key={h.id}
                  className={`group flex flex-col gap-1.5 p-3 rounded-lg hover:bg-slate-50 cursor-pointer transition-colors border border-transparent hover:border-slate-100 relative ${selectedId === h.id ? "bg-slate-50 border-slate-100" : ""}`}
                  onClick={() => setSelectedId(h.id)}
                >
                  <div className="flex items-start gap-2.5">
                    <div className="mt-0.5 bg-blue-50 p-1.5 rounded-md text-blue-600 shrink-0">
                      <BookOpen className="w-3.5 h-3.5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="text-sm font-semibold text-slate-700 truncate group-hover:text-slate-900">
                        {h.materi}
                      </h4>
                      <div className="flex flex-wrap items-center gap-1.5 mt-1">
                        {h.subjectName && (
                          <span className="text-[10px] font-medium text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                            {h.subjectName}
                          </span>
                        )}
                        {h.kelas && (
                          <span className="text-[10px] font-medium text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                            {h.kelas}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between mt-1 pl-[2.2rem]">
                    <div className="flex items-center gap-1 text-[10px] text-slate-400">
                      <Clock className="w-3 h-3" />
                      <span>{safeFormat(h.createdAt, "dd MMM yyyy HH:mm")}</span>
                    </div>
                    <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); handleDownload(h.id); }}
                        disabled={downloadingId === h.id}
                        className="text-slate-400 hover:text-slate-600 transition-colors p-1 rounded"
                      >
                        {downloadingId === h.id ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Download className="w-3.5 h-3.5" />
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); handleDelete(h.id); }}
                        className="text-slate-400 hover:text-red-600 transition-colors p-1 rounded"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
