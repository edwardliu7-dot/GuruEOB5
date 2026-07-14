import { Layout } from "@/components/layout";
import {
  useListGrades,
  useCreateGrade,
  useDeleteGrade,
  useListSubjects,
  useListStudents,
  useListAcademicCalendars,
  useListTujuanPembelajaran,
} from "@workspace/api-client-react";
import { useEffect, useMemo, useState } from "react";
import ExcelJS from "exceljs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Download } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";

type Grade = {
  id: string;
  studentId: string;
  subjectId: string;
  calendarId: string;
  jenis: "formatif" | "sumatif_lm" | "sumatif_tengah" | "sumatif_akhir";
  lingkupMateri: number | null;
  tpNumber: number | null;
  nilai: number;
};

function gradeKey(jenis: string, lm: number | null, tp: number | null) {
  return `${jenis}|${lm ?? "-"}|${tp ?? "-"}`;
}

function fmt1(v: number | null) {
  if (v === null) return "-";
  return v % 1 === 0 ? String(v) : v.toFixed(1);
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

  // Subjects filtered to those whose name includes the selected kelas.
  // Teachers typically name subjects with the class embedded
  // (e.g. "Matematika - VII Ibnu Battutah"), so this prevents subjects
  // from other classes appearing in the dropdown.
  const filteredSubjects = useMemo(
    () =>
      (subjects ?? []).filter(
        (s: any) => !kelasFilter || s.name.toLowerCase().includes(kelasFilter.toLowerCase()),
      ),
    [subjects, kelasFilter],
  );

  useEffect(() => {
    if (!kelasFilter && kelasList.length) setKelasFilter(kelasList[0]);
  }, [kelasList, kelasFilter]);

  // When filtered subjects change (e.g. kelas changed), reset subjectId if
  // the current selection is no longer in the filtered list.
  useEffect(() => {
    if (!filteredSubjects.length) return;
    const stillValid = filteredSubjects.some((s: any) => s.id === subjectId);
    if (!stillValid) setSubjectId(filteredSubjects[0].id);
  }, [filteredSubjects]);

  // Initial subject selection when subjects first load.
  useEffect(() => {
    if (!subjectId && filteredSubjects.length) setSubjectId(filteredSubjects[0].id);
  }, [filteredSubjects, subjectId]);

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

  const { data: tpList, isLoading: isLoadingTP } = useListTujuanPembelajaran(
    { subjectId: subjectId || undefined, calendarId: calendarId || undefined },
    {
      query: {
        queryKey: ["/api/tp", subjectId, calendarId],
        enabled: ready,
      },
    },
  );

  const LM_LIST = useMemo(() => {
    const set = new Set<number>((tpList ?? []).map((tp: any) => tp.lingkupMateri));
    return [...set].sort((a, b) => a - b);
  }, [tpList]);

  const tpByLM = useMemo(() => {
    const map = new Map<number, number[]>();
    for (const tp of (tpList ?? []) as any[]) {
      const arr = map.get(tp.lingkupMateri) ?? [];
      arr.push(tp.tpNumber);
      map.set(tp.lingkupMateri, arr);
    }
    for (const arr of map.values()) arr.sort((a, b) => a - b);
    return map;
  }, [tpList]);

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

  // Per-student summary: rata-rata, jumlah, nilai raport
  const computeStats = (studentId: string) => {
    const allValues: number[] = [];
    const sumatifComponents: number[] = [];

    // Formatif
    for (const lm of LM_LIST) {
      for (const tp of tpByLM.get(lm) ?? []) {
        const g = gradeMap.get(`${studentId}::${gradeKey("formatif", lm, tp)}`);
        if (g) allValues.push(g.nilai);
      }
    }

    // Sumatif LM — averaged first before adding to raport components
    let sumatifLmSum = 0;
    let sumatifLmCount = 0;
    for (const lm of LM_LIST) {
      const g = gradeMap.get(`${studentId}::${gradeKey("sumatif_lm", lm, null)}`);
      if (g) {
        allValues.push(g.nilai);
        sumatifLmSum += g.nilai;
        sumatifLmCount++;
      }
    }
    if (sumatifLmCount > 0) sumatifComponents.push(sumatifLmSum / sumatifLmCount);

    // Sumatif Tengah Semester
    const tengah = gradeMap.get(`${studentId}::${gradeKey("sumatif_tengah", null, null)}`);
    if (tengah) {
      allValues.push(tengah.nilai);
      sumatifComponents.push(tengah.nilai);
    }

    // Sumatif Akhir Semester
    const akhir = gradeMap.get(`${studentId}::${gradeKey("sumatif_akhir", null, null)}`);
    if (akhir) {
      allValues.push(akhir.nilai);
      sumatifComponents.push(akhir.nilai);
    }

    const rataRata =
      allValues.length > 0
        ? allValues.reduce((a, b) => a + b, 0) / allValues.length
        : null;
    const jumlah = allValues.length;
    const nilaiRaport =
      sumatifComponents.length > 0
        ? sumatifComponents.reduce((a, b) => a + b, 0) / sumatifComponents.length
        : null;

    return { rataRata, jumlah, nilaiRaport };
  };

  const selectedSubjectName = subjects?.find((s: any) => s.id === subjectId)?.name ?? "";
  const selectedCalendar = calendars?.find((c: any) => c.id === calendarId);

  const handleExport = async () => {
    if (!kelasStudents.length) return;

    const formatifCols = LM_LIST.reduce((sum, lm) => sum + (tpByLM.get(lm)?.length ?? 0), 0);
    // No + No + Nama + formatif cols + sumatif_lm cols + sumatif_tengah + sumatif_akhir + rata-rata + jumlah + nilai_raport
    const totalCols = 3 + formatifCols + LM_LIST.length + 1 + 1 + 3;

    const thinBorder = {
      top: { style: "thin" as const },
      bottom: { style: "thin" as const },
      left: { style: "thin" as const },
      right: { style: "thin" as const },
    };
    const centered = { horizontal: "center" as const, vertical: "middle" as const, wrapText: true };
    const headerFill = { type: "pattern" as const, pattern: "solid" as const, fgColor: { argb: "FFE2E8F0" } };
    const summaryFill = { type: "pattern" as const, pattern: "solid" as const, fgColor: { argb: "FFFEF9C3" } };

    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet("Rekap Nilai");

    ws.mergeCells(1, 1, 1, totalCols);
    ws.getCell(1, 1).value = `Mata Pelajaran: ${selectedSubjectName}`;
    ws.mergeCells(2, 1, 2, totalCols);
    ws.getCell(2, 1).value = `Kelas: ${kelasFilter}`;
    ws.mergeCells(3, 1, 3, totalCols);
    ws.getCell(3, 1).value = `Tahun Ajaran: ${selectedCalendar?.tahunAjaran ?? "-"}  Semester: ${selectedCalendar?.semester ?? "-"}`;
    for (let r = 1; r <= 3; r++) {
      ws.getCell(r, 1).font = { bold: true };
      ws.getCell(r, 1).alignment = { horizontal: "left" };
    }

    const headerRow1 = 5;
    const headerRow2 = 6;
    const dataStartRow = 7;

    ws.mergeCells(headerRow1, 1, headerRow2, 1);
    ws.getCell(headerRow1, 1).value = "No";
    ws.mergeCells(headerRow1, 2, headerRow2, 2);
    ws.getCell(headerRow1, 2).value = "NISN";
    ws.mergeCells(headerRow1, 3, headerRow2, 3);
    ws.getCell(headerRow1, 3).value = "Nama Siswa";

    let col = 4;
    for (const lm of LM_LIST) {
      const tpNumbers = tpByLM.get(lm) ?? [];
      if (tpNumbers.length === 0) continue;
      ws.mergeCells(headerRow1, col, headerRow1, col + tpNumbers.length - 1);
      ws.getCell(headerRow1, col).value = `Formatif - Lingkup Materi ${lm}`;
      for (const tp of tpNumbers) {
        ws.getCell(headerRow2, col).value = `TP${tp}`;
        col += 1;
      }
    }
    for (const lm of LM_LIST) {
      ws.mergeCells(headerRow1, col, headerRow2, col);
      ws.getCell(headerRow1, col).value = `Sumatif LM${lm}`;
      col += 1;
    }
    ws.mergeCells(headerRow1, col, headerRow2, col);
    ws.getCell(headerRow1, col).value = "Sumatif Tengah Semester";
    col += 1;
    ws.mergeCells(headerRow1, col, headerRow2, col);
    ws.getCell(headerRow1, col).value = "Sumatif Akhir Semester";
    col += 1;
    ws.mergeCells(headerRow1, col, headerRow2, col);
    ws.getCell(headerRow1, col).value = "Rata-rata";
    col += 1;
    ws.mergeCells(headerRow1, col, headerRow2, col);
    ws.getCell(headerRow1, col).value = "Jumlah";
    col += 1;
    ws.mergeCells(headerRow1, col, headerRow2, col);
    ws.getCell(headerRow1, col).value = "Nilai Raport";

    for (let r = headerRow1; r <= headerRow2; r++) {
      for (let c = 1; c <= totalCols; c++) {
        const cell = ws.getCell(r, c);
        cell.font = { bold: true };
        cell.alignment = centered;
        cell.border = thinBorder;
        cell.fill = headerFill;
      }
    }

    kelasStudents.forEach((s: any, i: number) => {
      const r = dataStartRow + i;
      ws.getCell(r, 1).value = i + 1;
      ws.getCell(r, 2).value = s.nisn || "-";
      ws.getCell(r, 3).value = s.namaLengkap;

      let c = 4;
      for (const lm of LM_LIST) {
        for (const tp of tpByLM.get(lm) ?? []) {
          const g = gradeMap.get(`${s.id}::${gradeKey("formatif", lm, tp)}`);
          ws.getCell(r, c).value = g ? g.nilai : "";
          c += 1;
        }
      }
      for (const lm of LM_LIST) {
        const g = gradeMap.get(`${s.id}::${gradeKey("sumatif_lm", lm, null)}`);
        ws.getCell(r, c).value = g ? g.nilai : "";
        c += 1;
      }
      const tengah = gradeMap.get(`${s.id}::${gradeKey("sumatif_tengah", null, null)}`);
      ws.getCell(r, c).value = tengah ? tengah.nilai : "";
      c += 1;
      const akhir = gradeMap.get(`${s.id}::${gradeKey("sumatif_akhir", null, null)}`);
      ws.getCell(r, c).value = akhir ? akhir.nilai : "";
      c += 1;

      const { rataRata, jumlah, nilaiRaport } = computeStats(s.id);
      ws.getCell(r, c).value = rataRata !== null ? Math.round(rataRata * 10) / 10 : "";
      ws.getCell(r, c).fill = summaryFill;
      c += 1;
      ws.getCell(r, c).value = jumlah || "";
      ws.getCell(r, c).fill = summaryFill;
      c += 1;
      ws.getCell(r, c).value = nilaiRaport !== null ? Math.round(nilaiRaport * 10) / 10 : "";
      ws.getCell(r, c).fill = summaryFill;

      for (let cc = 1; cc <= totalCols; cc++) {
        const cell = ws.getCell(r, cc);
        cell.border = thinBorder;
        cell.alignment = cc === 3 ? { horizontal: "left" as const, vertical: "middle" as const } : centered;
      }
      ws.getCell(r, 3).font = { bold: true };
    });

    ws.getColumn(1).width = 6;
    ws.getColumn(2).width = 14;
    ws.getColumn(3).width = 26;
    for (let c = 4; c <= totalCols; c++) ws.getColumn(c).width = 12;

    const buffer = await wb.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Rekap_Nilai_${kelasFilter}_${selectedSubjectName || "mapel"}.xlsx`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <Layout>
      <div className="space-y-6 animate-in fade-in duration-500">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold font-serif">Data Nilai</h1>
            <p className="text-muted-foreground mt-1">
              Formatif (per TP), Sumatif per Lingkup Materi, Sumatif Tengah Semester (PTS), Sumatif Akhir Semester (PAS), Nilai Raport.
            </p>
          </div>
          <Button variant="outline" onClick={handleExport} disabled={!ready || !kelasStudents.length}>
            <Download className="w-4 h-4 mr-2" /> Download Rekap Nilai
          </Button>
        </div>

        <div className="bg-white border border-border rounded-xl shadow-sm overflow-hidden flex flex-col">
          <div className="p-4 border-b border-border bg-gray-50/50 flex flex-wrap gap-3">
            <Select value={kelasFilter} onValueChange={setKelasFilter}>
              <SelectTrigger className="w-[180px] bg-white"><SelectValue placeholder="Pilih Kelas" /></SelectTrigger>
              <SelectContent>{kelasList.map((k) => <SelectItem key={k} value={k}>{k}</SelectItem>)}</SelectContent>
            </Select>
            <Select value={subjectId} onValueChange={setSubjectId}>
              <SelectTrigger className="w-[240px] bg-white"><SelectValue placeholder="Pilih Mata Pelajaran" /></SelectTrigger>
              <SelectContent>
                {filteredSubjects.map((s: any) => (
                  <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                ))}
                {!filteredSubjects.length && (
                  <div className="px-3 py-2 text-sm text-muted-foreground">
                    Tidak ada mapel untuk kelas ini
                  </div>
                )}
              </SelectContent>
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
          ) : !filteredSubjects.length ? (
            <p className="p-8 text-center text-muted-foreground">
              Belum ada mata pelajaran untuk kelas ini. Buat mapel di halaman Administrasi.
            </p>
          ) : !kelasStudents.length ? (
            <p className="p-8 text-center text-muted-foreground">Belum ada siswa di kelas ini.</p>
          ) : isLoading || isLoadingTP ? (
            <div className="p-6 space-y-2">
              {Array(5).fill(0).map((_, i) => <Skeleton key={i} className="h-8 w-full" />)}
            </div>
          ) : (
            <div className="overflow-x-auto">
              {LM_LIST.length === 0 && (
                <p className="px-4 pt-4 text-sm text-muted-foreground">
                  Belum ada Tujuan Pembelajaran untuk mata pelajaran ini. Isi TP di tab "Tujuan
                  Pembelajaran" pada halaman Administrasi agar kolom formatif muncul.
                </p>
              )}
              <table className="text-sm border-collapse w-full">
                <thead>
                  <tr className="bg-gray-50/70">
                    <th rowSpan={2} className="sticky left-0 bg-gray-50/70 border px-2 py-1 min-w-[40px]">No</th>
                    <th rowSpan={2} className="sticky left-[40px] bg-gray-50/70 border px-2 py-1 min-w-[180px] text-left">Nama Siswa</th>
                    {LM_LIST.map((lm) => (
                      <th key={lm} colSpan={tpByLM.get(lm)?.length ?? 0} className="border px-2 py-1 whitespace-nowrap">Formatif - LM {lm}</th>
                    ))}
                    {LM_LIST.map((lm) => (
                      <th key={lm} rowSpan={2} className="border px-2 py-1 whitespace-nowrap">Sumatif LM{lm}</th>
                    ))}
                    <th rowSpan={2} className="border px-2 py-1 whitespace-nowrap bg-amber-50/60">Sumatif Tengah Semester</th>
                    <th rowSpan={2} className="border px-2 py-1 whitespace-nowrap">Sumatif Akhir Semester</th>
                    <th rowSpan={2} className="border px-2 py-1 whitespace-nowrap bg-yellow-50/80 text-amber-700">Rata-rata</th>
                    <th rowSpan={2} className="border px-2 py-1 whitespace-nowrap bg-yellow-50/80 text-amber-700">Jml</th>
                    <th rowSpan={2} className="border px-2 py-1 whitespace-nowrap bg-yellow-50/80 text-amber-700 font-bold">Nilai Raport</th>
                  </tr>
                  <tr className="bg-gray-50/70">
                    {LM_LIST.map((lm) =>
                      (tpByLM.get(lm) ?? []).map((tp) => (
                        <th key={`${lm}-${tp}`} className="border px-1 py-1 font-normal text-xs">TP{tp}</th>
                      )),
                    )}
                  </tr>
                </thead>
                <tbody>
                  {kelasStudents.map((s: any, i: number) => {
                    const { rataRata, jumlah, nilaiRaport } = computeStats(s.id);
                    return (
                      <tr key={s.id} className="hover:bg-gray-50/50">
                        <td className="sticky left-0 bg-white border px-2 py-1 text-center text-muted-foreground">{i + 1}</td>
                        <td className="sticky left-[40px] bg-white border px-2 py-1 font-medium whitespace-nowrap">{s.namaLengkap}</td>
                        {LM_LIST.map((lm) =>
                          (tpByLM.get(lm) ?? []).map((tp) => {
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
                        <td className="border px-1 py-1 bg-amber-50/30">
                          <GradeCell
                            value={gradeMap.get(`${s.id}::${gradeKey("sumatif_tengah", null, null)}`)?.nilai ?? null}
                            onSave={(v) => saveCell(s.id, "sumatif_tengah", null, null, v)}
                          />
                        </td>
                        <td className="border px-1 py-1">
                          <GradeCell
                            value={gradeMap.get(`${s.id}::${gradeKey("sumatif_akhir", null, null)}`)?.nilai ?? null}
                            onSave={(v) => saveCell(s.id, "sumatif_akhir", null, null, v)}
                          />
                        </td>
                        <td className="border px-2 py-1 text-center bg-yellow-50/60 text-amber-800 font-medium min-w-[56px]">
                          {fmt1(rataRata)}
                        </td>
                        <td className="border px-2 py-1 text-center bg-yellow-50/60 text-amber-800 min-w-[40px]">
                          {jumlah || "-"}
                        </td>
                        <td className="border px-2 py-1 text-center bg-yellow-50/60 text-amber-900 font-bold min-w-[64px]">
                          {fmt1(nilaiRaport)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="text-xs text-muted-foreground space-y-1">
          <p>Klik sel nilai untuk mengisi atau mengubahnya. Kosongkan lalu klik di luar sel untuk menghapus nilai.</p>
          <p>
            <span className="font-medium">Nilai Raport</span> = rata-rata komponen sumatif: (avg Sumatif LM + Sumatif Tengah + Sumatif Akhir) / jumlah komponen yang terisi.
          </p>
        </div>
      </div>
    </Layout>
  );
}
