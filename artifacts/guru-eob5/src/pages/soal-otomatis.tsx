import { Layout } from "@/components/layout";
import {
  useListSubjects,
  useGenerateSoalOtomatis,
  useListSoalOtomatis,
  useGetSoalOtomatis,
  useDeleteSoalOtomatis,
  getGetSoalOtomatisQueryKey,
} from "@workspace/api-client-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Sparkles, Download, Trash2, Loader2, ListChecks, Clock } from "lucide-react";
import { format } from "date-fns";
import { useQueryClient } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import type { SoalOtomatis } from "@workspace/api-client-react";

const formSchema = z.object({
  subjectId: z.string().min(1, "Mata pelajaran harus dipilih"),
  materi: z.string().min(1, "Materi/topik harus diisi"),
  jumlahSoal: z.coerce.number().int().min(1, "Minimal 1 soal").max(50, "Maksimal 50 soal"),
  jenisSoal: z.enum(["pilihan_ganda", "esai"]),
  tingkatKesulitan: z.enum(["mudah", "sedang", "sulit"]),
});

type FormValues = z.infer<typeof formSchema>;

const LETTERS = ["A", "B", "C", "D", "E", "F"];

function SoalPreview({ soal }: { soal: SoalOtomatis }) {
  const content = soal.content as any;
  return (
    <div className="space-y-5 text-sm">
      <h2 className="text-xl font-bold font-serif text-center">{content.judul}</h2>
      <p className="italic text-muted-foreground text-center">{content.petunjukPengerjaan}</p>
      <div className="space-y-4">
        {(content.soal ?? []).map((q: any) => (
          <div key={q.nomor} className="border border-border rounded-md p-4">
            <p className="font-medium mb-2">{q.nomor}. {q.pertanyaan}</p>
            {q.tipe === "pilihan_ganda" ? (
              <ul className="space-y-1 pl-2">
                {(q.pilihan ?? []).map((opt: string, i: number) => (
                  <li key={i} className={opt === q.jawabanBenar ? "font-semibold text-emerald-700" : ""}>
                    {LETTERS[i] ?? i + 1}. {opt}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-muted-foreground">
                <span className="font-medium text-foreground">Kunci Jawaban: </span>{q.jawabanBenar}
              </p>
            )}
            {q.pembahasan && (
              <p className="mt-2 text-xs text-muted-foreground"><span className="font-medium">Pembahasan: </span>{q.pembahasan}</p>
            )}
          </div>
        ))}
      </div>
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
    defaultValues: { subjectId: "", materi: "", jumlahSoal: 10, jenisSoal: "pilihan_ganda", tingkatKesulitan: "sedang" },
  });

  const onSubmit = async (values: FormValues) => {
    try {
      const result = await generate.mutateAsync({ data: values });
      // Pre-fill cache so the detail view shows instantly without a second fetch
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
    } catch (e) {
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
    } catch (e) {
      toast({ variant: "destructive", title: "Gagal", description: "Terjadi kesalahan" });
    }
  };

  return (
    <Layout>
      <div className="space-y-6 animate-in fade-in duration-500">
        <div>
          <h1 className="text-3xl font-bold font-serif">Buat Soal Otomatis</h1>
          <p className="text-muted-foreground mt-1">
            Hasilkan soal latihan pilihan ganda atau esai secara otomatis dengan AI, lengkap dengan kunci jawaban.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white border border-border rounded-xl shadow-sm p-5">
              <h2 className="font-semibold mb-4 flex items-center gap-2"><Sparkles className="w-4 h-4 text-primary" /> Detail Soal</h2>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="subjectId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Mata Pelajaran</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger><SelectValue placeholder="Pilih mata pelajaran" /></SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {subjects?.map((s: any) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
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
                        <FormLabel>Materi/Topik</FormLabel>
                        <FormControl>
                          <Input placeholder="Misal: Persamaan Kuadrat" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="jumlahSoal"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Jumlah Soal</FormLabel>
                        <FormControl>
                          <Input type="number" min={1} max={50} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="jenisSoal"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Jenis Soal</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="pilihan_ganda">Pilihan Ganda</SelectItem>
                            <SelectItem value="esai">Esai</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="tingkatKesulitan"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tingkat Kesulitan</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="mudah">Mudah</SelectItem>
                            <SelectItem value="sedang">Sedang</SelectItem>
                            <SelectItem value="sulit">Sulit</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit" className="w-full" disabled={generate.isPending}>
                    {generate.isPending ? (
                      <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Membuat Soal...</>
                    ) : (
                      <><Sparkles className="w-4 h-4 mr-2" /> Generate Soal</>
                    )}
                  </Button>
                </form>
              </Form>
            </div>

            <div className="bg-white border border-border rounded-xl shadow-sm overflow-hidden">
              <div className="p-4 border-b border-border bg-gray-50/50">
                <h2 className="font-semibold flex items-center gap-2"><Clock className="w-4 h-4" /> Riwayat</h2>
              </div>
              {isLoadingHistory ? (
                <div className="p-4 space-y-2">{Array(3).fill(0).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}</div>
              ) : !history?.length ? (
                <p className="p-6 text-center text-sm text-muted-foreground">Belum ada soal yang dibuat.</p>
              ) : (
                <div className="divide-y divide-border max-h-[420px] overflow-y-auto">
                  {history.map((h: any) => (
                    <button
                      key={h.id}
                      onClick={() => setSelectedId(h.id)}
                      className={`w-full text-left p-3 hover:bg-gray-50 transition-colors flex items-start justify-between gap-2 ${selectedId === h.id ? "bg-primary/5" : ""}`}
                    >
                      <div className="min-w-0">
                        <p className="font-medium text-sm truncate">{h.materi}</p>
                        <p className="text-xs text-muted-foreground">
                          {h.jumlahSoal} soal &middot; {h.jenisSoal === "pilihan_ganda" ? "PG" : "Esai"} &middot; {format(new Date(h.createdAt), "dd MMM yyyy")}
                        </p>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          disabled={downloadingId === h.id}
                          onClick={(e) => { e.stopPropagation(); handleDownload(h.id); }}
                        >
                          {downloadingId === h.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-destructive"
                          onClick={(e) => { e.stopPropagation(); handleDelete(h.id); }}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="lg:col-span-2 bg-white border border-border rounded-xl shadow-sm p-6 min-h-[500px]">
            {isLoadingSelected ? (
              <div className="space-y-3">{Array(8).fill(0).map((_, i) => <Skeleton key={i} className="h-5 w-full" />)}</div>
            ) : selectedSoal ? (
              <>
                <div className="flex justify-end mb-4">
                  <Button variant="outline" size="sm" onClick={() => handleDownload(selectedSoal.id)} disabled={downloadingId === selectedSoal.id}>
                    {downloadingId === selectedSoal.id ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Download className="w-4 h-4 mr-2" />}
                    Unduh .docx
                  </Button>
                </div>
                <SoalPreview soal={selectedSoal} />
              </>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center text-muted-foreground py-20">
                <ListChecks className="w-12 h-12 mb-3 text-muted-foreground/30" />
                <p>Isi form di sebelah kiri lalu klik "Generate Soal" untuk membuat soal baru,</p>
                <p>atau pilih salah satu riwayat untuk melihat kembali.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
