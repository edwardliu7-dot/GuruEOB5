import { Layout } from "@/components/layout";
import { useGetKurikulumOverview, useGetKurikulumJurnal } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { FileText, FolderOpen, BookOpen } from "lucide-react";
import { format } from "date-fns";
import { id } from "date-fns/locale";

export default function Kurikulum() {
  const { data, isLoading } = useGetKurikulumOverview();
  const { data: jurnalData, isLoading: jurnalLoading } = useGetKurikulumJurnal();

  return (
    <Layout>
      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div>
          <h1 className="text-3xl font-bold tracking-tight font-serif text-foreground">
            Supervisi Kurikulum
          </h1>
          <p className="text-muted-foreground mt-1">
            Dokumen administrasi seluruh guru, dikelompokkan per mata pelajaran.
          </p>
        </div>

        <Tabs defaultValue="administrasi">
          <TabsList>
            <TabsTrigger value="administrasi">Administrasi per Guru</TabsTrigger>
            <TabsTrigger value="jurnal">Jurnal Mengajar</TabsTrigger>
          </TabsList>

          <TabsContent value="administrasi">
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : (
              <Card className="border-none shadow-sm ring-1 ring-black/5">
                <CardHeader>
                  <CardTitle className="text-lg font-serif">Administrasi per Guru</CardTitle>
                </CardHeader>
                <CardContent>
                  {data?.teachers.length === 0 && (
                    <p className="text-center text-muted-foreground py-8">Belum ada data guru.</p>
                  )}
                  <Accordion type="multiple" className="w-full">
                    {data?.teachers.map((t) => {
                      const totalDocs = t.subjects.reduce((sum, s) => sum + s.documents.length, 0);
                      return (
                        <AccordionItem key={t.username} value={t.username}>
                          <AccordionTrigger>
                            <div className="flex items-center gap-3 text-left">
                              <span className="font-medium">{t.name}</span>
                              <Badge variant="secondary" className="text-xs">
                                {t.subjects.length} mapel • {totalDocs} dokumen
                              </Badge>
                            </div>
                          </AccordionTrigger>
                          <AccordionContent>
                            {t.subjects.length === 0 ? (
                              <p className="text-sm text-muted-foreground px-1 pb-2">
                                Belum ada mata pelajaran yang didaftarkan.
                              </p>
                            ) : (
                              <div className="space-y-4">
                                {t.subjects.map((s) => (
                                  <div key={s.subjectId} className="rounded-lg border p-4">
                                    <div className="flex items-center gap-2 mb-2">
                                      <FolderOpen className="w-4 h-4 text-primary" />
                                      <span className="font-medium text-sm">{s.subjectName}</span>
                                      <Badge variant="outline" className="text-xs">
                                        {s.documents.length} dokumen
                                      </Badge>
                                    </div>
                                    {s.documents.length === 0 ? (
                                      <p className="text-sm text-muted-foreground">
                                        Belum ada dokumen.
                                      </p>
                                    ) : (
                                      <ul className="space-y-1">
                                        {s.documents.map((d) => (
                                          <li
                                            key={d.id}
                                            className="flex items-center gap-2 text-sm text-foreground/80"
                                          >
                                            <FileText className="w-3.5 h-3.5 text-muted-foreground" />
                                            {d.name}
                                            {d.description && (
                                              <span className="text-muted-foreground">
                                                — {d.description}
                                              </span>
                                            )}
                                          </li>
                                        ))}
                                      </ul>
                                    )}
                                  </div>
                                ))}
                              </div>
                            )}
                          </AccordionContent>
                        </AccordionItem>
                      );
                    })}
                  </Accordion>
                </CardContent>
              </Card>
            )}
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
