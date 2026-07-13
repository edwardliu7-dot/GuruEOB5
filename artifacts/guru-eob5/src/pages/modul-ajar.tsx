import { Layout } from "@/components/layout";
import {
  useListSubjects,
  useGenerateModulAjar,
  useListModulAjar,
  useGetModulAjar,
  useDeleteModulAjar,
  getGetModulAjarQueryKey,
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
import { Sparkles, Download, Trash2, Loader2, FileText, Clock } from "lucide-react";
import { format } from "date-fns";
import { useQueryClient } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import type { ModulAjar } from "@workspace/api-client-react";

const formSchema = z.object({
  subjectId: z.string().min(1, "Mata pelajaran harus dipilih"),
  materi: z.string().min(1, "Materi/topik harus diisi"),
  alokasiWaktu: z.string().min(1, "Alokasi waktu harus diisi"),
  kelas: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

function ModulPreview({ modul }: { modul: ModulAjar }) {
  const content = modul.content as any;
  const iu = content.informasiUmum ?? {};
  const ki = content.komponenInti ?? {};
  const lp = content.lampiran ?? {};

  return (
    <div className="space-y-6 text-sm">
      <h2 className="text-xl font-bold font-serif text-center">{content.judul}</h2>

      <section>
        <h3 className="font-semibold text-primary mb-2">A. Informasi Umum</h3>
        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1">
          <div><dt className="text-muted-foreground">Nama Penyusun</dt><dd>{iu.namaPenyusun}</dd></div>
          <div><dt className="text-muted-foreground">Instansi</dt><dd>{iu.instansi}</dd></div>
          <div><dt className="text-muted-foreground">Jenjang</dt><dd>{iu.jenjang}</dd></div>
          <div><dt className="text-muted-foreground">Kelas</dt><dd>{iu.kelas}</dd></div>
          <div><dt className="text-muted-foreground">Alokasi Waktu</dt><dd>{modul.alokasiWaktu}</dd></div>
          <div><dt className="text-muted-foreground">Jumlah Pertemuan</dt><dd>{iu.jumlahPertemuan}</dd></div>
        </dl>
        <p className="mt-2"><span className="text-muted-foreground">Kompetensi Awal: </span>{iu.kompetensiAwal}</p>
        <p className="mt-1"><span className="text-muted-foreground">Model Pembelajaran: </span>{iu.modelPembelajaran}</p>
      </section>

      <section>
        <h3 className="font-semibold text-primary mb-2">B. Komponen Inti</h3>
        <p className="font-medium mt-2">1. Tujuan Pembelajaran</p>
        <ul className="list-disc pl-5">
          {(ki.tujuanPembelajaran ?? []).map((t: string, i: number) => <li key={i}>{t}</li>)}
        </ul>
        <p className="font-medium mt-3">2. Kriteria Ketercapaian Tujuan Pembelajaran</p>
        <ul className="list-disc pl-5">
          {(ki.kriteriaKetercapaianTujuanPembelajaran ?? []).map((t: string, i: number) => <li key={i}>{t}</li>)}
        </ul>
        <p className="font-medium mt-3">3. Pemahaman Bermakna</p>
        <p>{ki.pemahamanBermakna}</p>
        <p className="font-medium mt-3">4. Pertanyaan Pemantik</p>
        <ul className="list-disc pl-5">
          {(ki.pertanyaanPemantik ?? []).map((t: string, i: number) => <li key={i}>{t}</li>)}
        </ul>
        <p className="font-medium mt-3">5. Kegiatan Pembelajaran</p>
        <div className="space-y-3">
          {(ki.kegiatanPembelajaran ?? []).map((k: any) => (
            <div key={k.pertemuanKe} className="border border-border rounded-md p-3 bg-gray-50/50">
              <p className="font-medium mb-1">Pertemuan ke-{k.pertemuanKe}</p>
              <p><span className="text-muted-foreground">Pendahuluan: </span>{k.pendahuluan}</p>
              <p><span className="text-muted-foreground">Kegiatan Inti: </span>{k.kegiatanInti}</p>
              <p><span className="text-muted-foreground">Penutup: </span>{k.penutup}</p>
            </div>
          ))}
        </div>
        <p className="font-medium mt-3">6. Asesmen</p>
        <p><span className="text-muted-foreground">Diagnostik: </span>{ki.asesmen?.asesmenDiagnostik}</p>
        <p><span className="text-muted-foreground">Formatif: </span>{ki.asesmen?.asesmenFormatif}</p>
        <p><span className="text-muted-foreground">Sumatif: </span>{ki.asesmen?.asesmenSumatif}</p>
      </section>

      <section>
        <h3 className="font-semibold text-primary mb-2">C. Lampiran</h3>
        <p className="font-medium mt-2">LKPD</p>
        <p className="whitespace-pre-line">{lp.lkpd}</p>
        <p className="font-medium mt-3">Kunci Jawaban LKPD</p>
        <p className="whitespace-pre-line">{lp.kunciJawabanLkpd}</p>
        <p className="font-medium mt-3">Rubrik Penilaian</p>
        <p className="whitespace-pre-line">{lp.rubrikPenilaian}</p>
        <p className="font-medium mt-3">Pengayaan &amp; Remedial</p>
        <p>{lp.pengayaan}</p>
        <p>{lp.remedial}</p>
        <p className="font-medium mt-3">Glosarium</p>
        <ul className="list-disc pl-5">
          {(lp.glosarium ?? []).map((g: any, i: number) => (
            <li key={i}><span className="font-medium">{g.istilah}:</span> {g.definisi}</li>
          ))}
        </ul>
        <p className="font-medium mt-3">Daftar Pustaka</p>
        <ul className="list-disc pl-5">
          {(lp.daftarPustaka ?? []).map((t: string, i: number) => <li key={i}>{t}</li>)}
        </ul>
      </section>
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
      setSelectedId(result.id);
      queryClient.invalidateQueries({ queryKey: ["/api/modul-ajar"] });
      toast({ title: "Berhasil", description: "Modul ajar berhasil dibuat" });
    } catch (e) {
      toast({ variant: "destructive", title: "Gagal", description: "Terjadi kesalahan saat membuat modul ajar" });
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
    } catch (e) {
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
    } catch (e) {
      toast({ variant: "destructive", title: "Gagal", description: "Terjadi kesalahan" });
    }
  };

  return (
    <Layout>
      <div className="space-y-6 animate-in fade-in duration-500">
        <div>
          <h1 className="text-3xl font-bold font-serif">Buat Modul Ajar</h1>
          <p className="text-muted-foreground mt-1">
            Hasilkan modul ajar Kurikulum Merdeka secara otomatis dengan AI, lengkap dengan LKPD, asesmen, dan lampiran.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white border border-border rounded-xl shadow-sm p-5">
              <h2 className="font-semibold mb-4 flex items-center gap-2"><Sparkles className="w-4 h-4 text-primary" /> Detail Modul</h2>
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
                          <Input placeholder="Misal: Sistem Ekskresi Manusia" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="kelas"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Kelas (Opsional)</FormLabel>
                        <FormControl>
                          <Input placeholder="Misal: XI" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="alokasiWaktu"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Alokasi Waktu</FormLabel>
                        <FormControl>
                          <Input placeholder="Misal: 2 x 45 menit (2 pertemuan)" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit" className="w-full" disabled={generate.isPending}>
                    {generate.isPending ? (
                      <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Membuat Modul...</>
                    ) : (
                      <><Sparkles className="w-4 h-4 mr-2" /> Generate Modul</>
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
                <p className="p-6 text-center text-sm text-muted-foreground">Belum ada modul ajar yang dibuat.</p>
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
                        <p className="text-xs text-muted-foreground">{format(new Date(h.createdAt), "dd MMM yyyy HH:mm")}</p>
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
            ) : selectedModul ? (
              <>
                <div className="flex justify-end mb-4">
                  <Button variant="outline" size="sm" onClick={() => handleDownload(selectedModul.id)} disabled={downloadingId === selectedModul.id}>
                    {downloadingId === selectedModul.id ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Download className="w-4 h-4 mr-2" />}
                    Unduh .docx
                  </Button>
                </div>
                <ModulPreview modul={selectedModul} />
              </>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center text-muted-foreground py-20">
                <FileText className="w-12 h-12 mb-3 text-muted-foreground/30" />
                <p>Isi form di sebelah kiri lalu klik "Generate Modul" untuk membuat modul ajar baru,</p>
                <p>atau pilih salah satu riwayat untuk melihat kembali.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
