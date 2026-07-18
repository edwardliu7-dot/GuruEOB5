import { Layout } from "@/components/layout";
import { useGetWaliKelasRekap, useGetWaliKelasJurnal } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
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
import { BookOpen } from "lucide-react";
import { format } from "date-fns";
import { id } from "date-fns/locale";

export default function WaliKelas() {
  const { data, isLoading } = useGetWaliKelasRekap();
  const { data: jurnalData, isLoading: jurnalLoading } = useGetWaliKelasJurnal();

  return (
    <Layout>
      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div>
          <h1 className="text-3xl font-bold tracking-tight font-serif text-foreground">
            Rekap Wali Kelas
          </h1>
          <p className="text-muted-foreground mt-1">
            {isLoading ? (
              <Skeleton className="h-5 w-48" />
            ) : (
              `Rekap absensi, nilai, poin, dan jurnal mengajar kelas ${data?.kelas ?? ""}`
            )}
          </p>
        </div>

        <Tabs defaultValue="siswa">
          <TabsList>
            <TabsTrigger value="siswa">Data Siswa</TabsTrigger>
            <TabsTrigger value="jurnal">Jurnal Mengajar</TabsTrigger>
          </TabsList>

          <TabsContent value="siswa">
            <Card className="border-none shadow-sm ring-1 ring-black/5">
              <CardHeader>
                <CardTitle className="text-lg font-serif">Daftar Siswa</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                      <Skeleton key={i} className="h-12 w-full" />
                    ))}
                  </div>
                ) : data?.siswa.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    Belum ada siswa terdaftar di kelas ini.
                  </p>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>NISN</TableHead>
                          <TableHead>Nama</TableHead>
                          <TableHead className="text-center">L/P</TableHead>
                          <TableHead className="text-center">Hadir</TableHead>
                          <TableHead className="text-center">Izin</TableHead>
                          <TableHead className="text-center">Sakit</TableHead>
                          <TableHead className="text-center">Alpa</TableHead>
                          <TableHead className="text-center">Rata-rata Nilai</TableHead>
                          <TableHead className="text-right">Poin</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {data?.siswa.map((s) => (
                          <TableRow key={s.studentId}>
                            <TableCell className="text-muted-foreground">{s.nisn || "-"}</TableCell>
                            <TableCell className="font-medium">{s.namaLengkap}</TableCell>
                            <TableCell className="text-center">{s.jenisKelamin}</TableCell>
                            <TableCell className="text-center text-green-600">{s.hadir}</TableCell>
                            <TableCell className="text-center">{s.izin}</TableCell>
                            <TableCell className="text-center">{s.sakit}</TableCell>
                            <TableCell className="text-center text-red-600">{s.alpa}</TableCell>
                            <TableCell className="text-center">
                              {s.rataNilai != null ? s.rataNilai : "-"}
                            </TableCell>
                            <TableCell className="text-right">
                              <Badge variant={s.totalPoin > 0 ? "destructive" : "secondary"}>
                                {s.totalPoin}
                              </Badge>
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
                  Jurnal Mengajar — Kelas {data?.kelas ?? ""}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {jurnalLoading ? (
                  <div className="space-y-3">
                    {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-10 w-full" />)}
                  </div>
                ) : !jurnalData?.entries.length ? (
                  <p className="text-center text-muted-foreground py-8">
                    Belum ada jurnal untuk kelas ini.
                  </p>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Tanggal</TableHead>
                          <TableHead>Guru</TableHead>
                          <TableHead>Mata Pelajaran</TableHead>
                          <TableHead>Materi</TableHead>
                          <TableHead>Catatan</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {jurnalData.entries.map((e) => (
                          <TableRow key={e.id}>
                            <TableCell className="text-muted-foreground whitespace-nowrap">
                              {format(new Date(e.tanggal), "EEEE, dd MMM yyyy", { locale: id })}
                            </TableCell>
                            <TableCell className="font-medium">{e.teacherName}</TableCell>
                            <TableCell>{e.subjectName}</TableCell>
                            <TableCell className="max-w-[260px] truncate">{e.materi}</TableCell>
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
