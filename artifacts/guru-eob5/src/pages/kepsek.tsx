import { Layout } from "@/components/layout";
import { useGetKepsekOverview, useGetKepsekJurnal } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { formatJabatan } from "@/lib/options";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { BookOpen } from "lucide-react";

export default function Kepsek() {
  const { data, isLoading } = useGetKepsekOverview();
  const { data: jurnalData, isLoading: jurnalLoading } = useGetKepsekJurnal();

  return (
    <Layout>
      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div>
          <h1 className="text-3xl font-bold tracking-tight font-serif text-foreground">
            Progres Kinerja Guru
          </h1>
          <p className="text-muted-foreground mt-1">
            Pantauan kepala sekolah: jurnal mengajar dan kelengkapan administrasi setiap guru.
          </p>
        </div>

        <Tabs defaultValue="kinerja">
          <TabsList>
            <TabsTrigger value="kinerja">Ringkasan Kinerja</TabsTrigger>
            <TabsTrigger value="jurnal">Jurnal Mengajar</TabsTrigger>
          </TabsList>

          <TabsContent value="kinerja">
            <Card className="border-none shadow-sm ring-1 ring-black/5">
              <CardHeader>
                <CardTitle className="text-lg font-serif">Ringkasan per Guru</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                      <Skeleton key={i} className="h-12 w-full" />
                    ))}
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Nama</TableHead>
                          <TableHead>Jabatan</TableHead>
                          <TableHead>Mapel</TableHead>
                          <TableHead className="text-center">Jurnal Bulan Ini</TableHead>
                          <TableHead className="text-center">Dokumen</TableHead>
                          <TableHead className="w-48">Kelengkapan</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {data?.teachers.length === 0 && (
                          <TableRow>
                            <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                              Belum ada data guru.
                            </TableCell>
                          </TableRow>
                        )}
                        {data?.teachers.map((t) => (
                          <TableRow key={t.username}>
                            <TableCell className="font-medium">{t.name}</TableCell>
                            <TableCell>
                              <span className="text-sm text-muted-foreground">
                                {formatJabatan(t.jabatan)}
                              </span>
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-wrap gap-1">
                                {(t.mapel ?? []).slice(0, 3).map((m) => (
                                  <Badge key={m} variant="secondary" className="text-xs">
                                    {m}
                                  </Badge>
                                ))}
                                {(t.mapel?.length ?? 0) > 3 && (
                                  <Badge variant="outline" className="text-xs">
                                    +{(t.mapel?.length ?? 0) - 3}
                                  </Badge>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="text-center">{t.jurnalBulanIni}</TableCell>
                            <TableCell className="text-center">
                              {t.dokumenSelesai}/{t.dokumenTotal}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Progress value={t.kelengkapanPersen} className="h-2" />
                                <span className="text-xs text-muted-foreground w-10 text-right">
                                  {t.kelengkapanPersen}%
                                </span>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="jurnal">
            <Card className="border-none shadow-sm ring-1 ring-black/5">
              <CardHeader>
                <CardTitle className="text-lg font-serif flex items-center gap-2">
                  <BookOpen className="w-5 h-5" />
                  Jurnal Mengajar Semua Guru
                </CardTitle>
              </CardHeader>
              <CardContent>
                {jurnalLoading ? (
                  <div className="space-y-3">
                    {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-10 w-full" />)}
                  </div>
                ) : !jurnalData?.entries.length ? (
                  <p className="text-center text-muted-foreground py-8">
                    Belum ada jurnal yang tercatat.
                  </p>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Tanggal</TableHead>
                          <TableHead>Guru</TableHead>
                          <TableHead>Mata Pelajaran</TableHead>
                          <TableHead>Kelas</TableHead>
                          <TableHead>Materi</TableHead>
                          <TableHead>Catatan</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {jurnalData.entries.map((e) => (
                          <TableRow key={e.id}>
                            <TableCell className="text-muted-foreground whitespace-nowrap">
                              {format(new Date(e.tanggal), "dd MMM yyyy", { locale: id })}
                            </TableCell>
                            <TableCell className="font-medium">{e.teacherName}</TableCell>
                            <TableCell>{e.subjectName}</TableCell>
                            <TableCell>
                              <Badge variant="secondary" className="text-xs">{e.kelas || "-"}</Badge>
                            </TableCell>
                            <TableCell className="max-w-[240px] truncate">{e.materi}</TableCell>
                            <TableCell className="max-w-[180px] truncate text-muted-foreground">
                              {e.catatan || "-"}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
