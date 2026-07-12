import { Layout } from "@/components/layout";
import {
  useListGrades,
  useCreateGrade,
  useDeleteGrade,
  useListSubjects,
  useListStudents,
  useListAcademicCalendars,
} from "@workspace/api-client-react";
import { useEffect, useMemo, useState } from "react";
import * as XLSX from "xlsx";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Download } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";

const LM_LIST = [1, 2, 3, 4, 5];
const TP_LIST = [1, 2, 3, 4];

type Grade = {
  id: string;
  studentId: string;
  subjectId: string;
  calendarId: string;
  jenis: "formatif" | "sumatif_lm" | "sumatif_akhir";
  lingkupMateri: number | null;
  tpNumber: number | null;
  nilai: number;
};

function gradeKey(jenis: string, lm: number | null, tp: number | null) {
  return `${jenis}|${lm ?? "-"}|${tp ?? "-"}`;
}

function GradeCell({
  value,
  onSave,
  disabled,
}: {
  value: number | null;
  onSave: (nilai: number | null) => void;
  disabled?: boolean;
}) {
  const [local, setLocal] = useState(value === null ? "" : String(value));

  useEffect(() => {
    setLocal(value === null ? "" : String(value));
  }, [value]);

  return (
    <Input
      type="number"
      min={0}
      max={100}
      disabled={disabled}
      value={local}
      onChange={(e) => setLocal(e.target.value)}
      onBlur={() => {
        const trimmed = local.trim();
        const parsed = trimmed === "" ? null : Number(trimmed);
        if (parsed !== null && (Number.isNaN(parsed) || parsed < 0 || parsed > 100)) {
          setLocal(value === null ? "" : String(value));
          return;
        }
        if (parsed === value) return;
        onSave(parsed);
      }}
      className="h-8 w-16 text-center px-1"
    />
  );
}

export default function Nilai() {
  const { data: subjects } = useListSubjects();
  const { data: students } = useListStudents();
  const { data: calendars } = useListAcademicCalendars();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [kelasFilter, setKelasFilter] = useState<string>("");
  const [subjectId, setSubjectId] = useState<string>("");
  const [calendarId, setCalendarId] = useState<string>("");

  const kelasList = useMemo(
    () => [...new Set((students ?? []).map((s: any) => s.kelas))].sort(),
    [students],
  );

  useEffect(() => {
    if (!kelasFilter && kelasList.length) setKelasFilter(kelasList[0]);
  }, [kelasList, kelasFilter]);

  useEffect(() => {
    if (!subjectId && subjects?.length) setSubjectId(subjects[0].id);
  }, [subjects, subjectId]);

  useEffect(() => {
    if (!calendarId && calendars?.length) setCalendarId(calendars[0].id);
  }, [calendars, calendarId]);

  const kelasStudents = useMemo(
    () =>
      (students ?? [])
        .filter((s: any) => s.kelas === kelasFilter)
        .sort((a: any, b: any) => a.namaLengkap.localeCompare(b.namaLengkap)),
    [students, kelasFilter],
  );

  const ready = !!subjectId && !!calendarId && !!kelasFilter;

  const { data: gradesList, isLoading } = useListGrades(
    { subjectId: subjectId || undefined, calendarId: calendarId || undefined },
    {
      query: {
        queryKey: ["/api/grades", subjectId, calendarId],
        enabled: ready,
      },
    },
  );

  const createGrade = useCreateGrade();
  const deleteGrade = useDeleteGrade();

  const gradeMap = useMemo(() => {
    const map = new Map<string, Grade>();
    for (const g of (gradesList ?? []) as Grade[]) {
      map.set(`${g.studentId}::${gradeKey(g.jenis, g.lingkupMateri, g.tpNumber)}`, g);
    }
    return map;
  }, [gradesList]);

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ["/api/grades", subjectId, calendarId] });

  const saveCell = async (
    studentId: string,
    jenis: Grade["jenis"],
    lingkupMateri: number | null,
    tpNumber: number | null,
    nilai: number | null,
  ) => {
    const existing = gradeMap.get(`${studentId}::${gradeKey(jenis, lingkupMateri, tpNumber)}`);
    try {
      if (nilai === null) {
        if (existing) {
          await deleteGrade.mutateAsync({ id: existing.id });
          invalidate();
        }
        return;
      }
      await createGrade.mutateAsync({
        data: {
          studentId,
          subjectId,
          calendarId,
          jenis,
          nilai,
          ...(lingkupMateri !== null ? { lingkupMateri } : {}),
          ...(tpNumber !== null ? { tpNumber } : {}),
        },
      });
      invalidate();
    } catch {
      toast({ variant: "destructive", title: "Gagal", description: "Nilai tidak tersimpan" });
    }
  };

  const selectedSubjectName = subjects?.find((s: any) => s.id === subjectId)?.name ?? "";
  const selectedCalendar = calendars?.find((c: any) => c.id === calendarId);

  const handleExport = () => {
    if (!kelasStudents.length) return;

    const groupRow: (string | { v: string; s?: unknown })[] = ["No", "NISN", "Nama Siswa"];
    const subRow: string[] = ["", "", ""];
    const merges: XLSX.Range[] = [];
    let col = 3;
    for (const lm of LM_LIST) {
      groupRow.push(`Formatif - Lingkup Materi ${lm}`, "", "", "");
      for (const tp of TP_LIST) subRow.push(`TP${tp}`);
      merges.push({ s: { r: 0, c: col }, e: { r: 0, c: col + 3 } });
      col += 4;
    }
    for (const lm of LM_LIST) {
      groupRow.push(`Sumatif LM${lm}`);
      subRow.push("");
      col += 1;
    }
    groupRow.push("Sumatif Akhir Semester");
    subRow.push("");

    merges.push({ s: { r: 0, c: 0 }, e: { r: 1, c: 0 } });
    merges.push({ s: { r: 0, c: 1 }, e: { r: 1, c: 1 } });
    merges.push({ s: { r: 0, c: 2 }, e: { r: 1, c: 2 } });
    merges.push({ s: { r: 0, c: col }, e: { r: 1, c: col } });

    const dataRows = kelasStudents.map((s: any, i: number) => {
      const row: (string | number)[] = [i + 1, s.nisn || "-", s.namaLengkap];
      for (const lm of LM_LIST) {
        for (const tp of TP_LIST) {
          const g = gradeMap.get(`${s.id}::${gradeKey("formatif", lm, tp)}`);
          row.push(g ? g.nilai : "");
        }
      }
      for (const lm of LM_LIST) {
        const g = gradeMap.get(`${s.id}::${gradeKey("sumatif_lm", lm, null)}`);
        row.push(g ? g.nilai : "");
      }
      const akhir = gradeMap.get(`${s.id}::${gradeKey("sumatif_akhir", null, null)}`);
      row.push(akhir ? akhir.nilai : "");
      return row;
    });

    const infoRows = [
      [`Mata Pelajaran: ${selectedSubjectName}`],
      [`Kelas: ${kelasFilter}`],
      [
        `Tahun Ajaran: ${selectedCalendar?.tahunAjaran ?? "-"}  Semester: ${selectedCalendar?.semester ?? "-"}`,
      ],
      [],
    ];

    const ws = XLSX.utils.aoa_to_sheet([...infoRows, groupRow, subRow, ...dataRows]);
    const headerOffset = infoRows.length;
    ws["!merges"] = merges.map((m) => ({
      s: { r: m.s.r + headerOffset, c: m.s.c },
      e: { r: m.e.r + headerOffset, c: m.e.c },
    }));
    ws["!cols"] = [
      { wch: 5 },
      { wch: 12 },
      { wch: 24 },
      ...Array(LM_LIST.length * TP_LIST.length + LM_LIST.length + 1).fill({ wch: 9 }),
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Rekap Nilai");
    XLSX.writeFile(wb, `Rekap_Nilai_${kelasFilter}_${selectedSubjectName || "mapel"}.xlsx`);
  };

  return (
    <Layout>
      <div className="space-y-6 animate-in fade-in duration-500">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold font-serif">Data Nilai</h1>
            <p className="text-muted-foreground mt-1">
              Formatif per Tujuan Pembelajaran (TP), Sumatif per Lingkup Materi, dan Sumatif Akhir Semester (Kurikulum
              Merdeka).
            </p>
          </div>
          <Button variant="outline" onClick={handleExport} disabled={!ready || !kelasStudents.length}>
            <Download className="w-4 h-4 mr-2" /> Download Rekap Nilai
          </Button>
        </div>

        <div className="bg-white border border-border rounded-xl shadow-sm overflow-hidden flex flex-col">
          <div className="p-4 border-b border-border bg-gray-50/50 flex flex-wrap gap-3">
            <Select value={kelasFilter} onValueChange={setKelasFilter}>
              <SelectTrigger className="w-[150px] bg-white"><SelectValue placeholder="Pilih Kelas" /></SelectTrigger>
              <SelectContent>{kelasList.map((k) => <SelectItem key={k} value={k}>{k}</SelectItem>)}</SelectContent>
            </Select>
            <Select value={subjectId} onValueChange={setSubjectId}>
              <SelectTrigger className="w-[220px] bg-white"><SelectValue placeholder="Pilih Mata Pelajaran" /></SelectTrigger>
              <SelectContent>{subjects?.map((s: any) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
            </Select>
            <Select value={calendarId} onValueChange={setCalendarId}>
              <SelectTrigger className="w-[220px] bg-white"><SelectValue placeholder="Pilih Tahun Ajaran/Semester" /></SelectTrigger>
              <SelectContent>
                {calendars?.map((c: any) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.tahunAjaran} - Semester {c.semester}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {!calendars?.length ? (
            <p className="p-8 text-center text-muted-foreground">
              Belum ada kalender akademik. Buat tahun ajaran/semester di halaman Kalender Akademik terlebih dahulu.
            </p>
          ) : !subjects?.length ? (
            <p className="p-8 text-center text-muted-foreground">Belum ada mata pelajaran.</p>
          ) : !kelasStudents.length ? (
            <p className="p-8 text-center text-muted-foreground">Belum ada siswa di kelas ini.</p>
          ) : isLoading ? (
            <div className="p-6 space-y-2">
              {Array(5).fill(0).map((_, i) => <Skeleton key={i} className="h-8 w-full" />)}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="text-sm border-collapse w-full">
                <thead>
                  <tr className="bg-gray-50/70">
                    <th rowSpan={2} className="sticky left-0 bg-gray-50/70 border px-2 py-1 min-w-[40px]">No</th>
                    <th rowSpan={2} className="sticky left-[40px] bg-gray-50/70 border px-2 py-1 min-w-[180px] text-left">Nama Siswa</th>
                    {LM_LIST.map((lm) => (
                      <th key={lm} colSpan={4} className="border px-2 py-1 whitespace-nowrap">Formatif - LM {lm}</th>
                    ))}
                    {LM_LIST.map((lm) => (
                      <th key={lm} rowSpan={2} className="border px-2 py-1 whitespace-nowrap">Sumatif LM{lm}</th>
                    ))}
                    <th rowSpan={2} className="border px-2 py-1 whitespace-nowrap">Sumatif Akhir Semester</th>
                  </tr>
                  <tr className="bg-gray-50/70">
                    {LM_LIST.map((lm) =>
                      TP_LIST.map((tp) => (
                        <th key={`${lm}-${tp}`} className="border px-1 py-1 font-normal text-xs">TP{tp}</th>
                      )),
                    )}
                  </tr>
                </thead>
                <tbody>
                  {kelasStudents.map((s: any, i: number) => (
                    <tr key={s.id} className="hover:bg-gray-50/50">
                      <td className="sticky left-0 bg-white border px-2 py-1 text-center text-muted-foreground">{i + 1}</td>
                      <td className="sticky left-[40px] bg-white border px-2 py-1 font-medium whitespace-nowrap">{s.namaLengkap}</td>
                      {LM_LIST.map((lm) =>
                        TP_LIST.map((tp) => {
                          const g = gradeMap.get(`${s.id}::${gradeKey("formatif", lm, tp)}`);
                          return (
                            <td key={`${lm}-${tp}`} className="border px-1 py-1">
                              <GradeCell
                                value={g ? g.nilai : null}
                                onSave={(v) => saveCell(s.id, "formatif", lm, tp, v)}
                              />
                            </td>
                          );
                        }),
                      )}
                      {LM_LIST.map((lm) => {
                        const g = gradeMap.get(`${s.id}::${gradeKey("sumatif_lm", lm, null)}`);
                        return (
                          <td key={lm} className="border px-1 py-1">
                            <GradeCell
                              value={g ? g.nilai : null}
                              onSave={(v) => saveCell(s.id, "sumatif_lm", lm, null, v)}
                            />
                          </td>
                        );
                      })}
                      <td className="border px-1 py-1">
                        <GradeCell
                          value={gradeMap.get(`${s.id}::${gradeKey("sumatif_akhir", null, null)}`)?.nilai ?? null}
                          onSave={(v) => saveCell(s.id, "sumatif_akhir", null, null, v)}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
        <p className="text-xs text-muted-foreground">
          Klik sel nilai untuk mengisi atau mengubahnya, kosongkan lalu klik di luar sel untuk menghapus nilai.
        </p>
      </div>
    </Layout>
  );
}
