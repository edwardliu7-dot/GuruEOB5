import { Layout } from "@/components/layout";
import { useGetKesiswaanOverview } from "@workspace/api-client-react";
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

export default function Kesiswaan() {
  const { data, isLoading } = useGetKesiswaanOverview();

  return (
    <Layout>
      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div>
          <h1 className="text-3xl font-bold tracking-tight font-serif text-foreground">
            Rekap Kesiswaan
          </h1>
          <p className="text-muted-foreground mt-1">
            Rekap absensi dan poin pelanggaran seluruh kelas.
          </p>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2].map((i) => (
              <Skeleton key={i} className="h-40 w-full" />
            ))}
          </div>
        ) : (
          <>
            <Card className="border-none shadow-sm ring-1 ring-black/5">
              <CardHeader>
                <CardTitle className="text-lg font-serif">Rekap per Kelas</CardTitle>
              </CardHeader>
              <CardContent>
                {data?.perKelas.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">Belum ada data siswa.</p>
                ) : (
                  <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Kelas</TableHead>
                        <TableHead className="text-center">Siswa</TableHead>
                        <TableHead className="text-center">Hadir</TableHead>
                        <TableHead className="text-center">Izin</TableHead>
                        <TableHead className="text-center">Sakit</TableHead>
                        <TableHead className="text-center">Alpa</TableHead>
                        <TableHead className="text-center">Poin +</TableHead>
                        <TableHead className="text-center">Poin −</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data?.perKelas.map((k) => (
                        <TableRow key={k.kelas}>
                          <TableCell className="font-medium">{k.kelas}</TableCell>
                          <TableCell className="text-center">{k.totalSiswa}</TableCell>
                          <TableCell className="text-center text-green-600">{k.hadir}</TableCell>
                          <TableCell className="text-center">{k.izin}</TableCell>
                          <TableCell className="text-center">{k.sakit}</TableCell>
                          <TableCell className="text-center text-red-600">{k.alpa}</TableCell>
                          <TableCell className="text-center text-green-600">
                            {k.totalPoinPositif}
                          </TableCell>
                          <TableCell className="text-center text-red-600">
                            {k.totalPoinNegatif}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="border-none shadow-sm ring-1 ring-black/5">
              <CardHeader>
                <CardTitle className="text-lg font-serif">
                  Siswa dengan Poin Pelanggaran Terbanyak
                </CardTitle>
              </CardHeader>
              <CardContent>
                {data?.siswaPoinTerbanyak.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    Belum ada catatan poin pelanggaran.
                  </p>
                ) : (
                  <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nama</TableHead>
                        <TableHead>Kelas</TableHead>
                        <TableHead className="text-right">Total Poin Pelanggaran</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data?.siswaPoinTerbanyak.map((s) => (
                        <TableRow key={s.studentId}>
                          <TableCell className="font-medium">{s.namaLengkap}</TableCell>
                          <TableCell>{s.kelas}</TableCell>
                          <TableCell className="text-right">
                            <Badge variant="destructive">{s.totalPoin}</Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </Layout>
  );
}
