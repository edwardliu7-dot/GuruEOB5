import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Printer } from "lucide-react";
import { cn } from "@/lib/utils";

// ---- Month definitions by semester ----
const GANJIL_MONTHS = [
  { name: "Juli", num: 7 },
  { name: "Agustus", num: 8 },
  { name: "September", num: 9 },
  { name: "Oktober", num: 10 },
  { name: "November", num: 11 },
  { name: "Desember", num: 12 },
];
const GENAP_MONTHS = [
  { name: "Januari", num: 1 },
  { name: "Februari", num: 2 },
  { name: "Maret", num: 3 },
  { name: "April", num: 4 },
  { name: "Mei", num: 5 },
  { name: "Juni", num: 6 },
];

interface ProsemWeek {
  id: string;
  pekanKe: number;
  jenis: string;
  tanggalMulai: string;
  tanggalSelesai: string;
  keterangan?: string | null;
}

interface ProsemItemData {
  id: string;
  weekId: string;
  materi: string;
  jp?: number | null;
  kd?: string | null;
  catatan?: string | null;
}

interface MateriRow {
  materi: string;
  jpByWeekId: Map<string, number>;
  totalJP: number;
  catatan: string;
}

type EnrichedWeek = ProsemWeek & { monthIndex: number; weekInMonth: number };

// ---- Week type helpers (same as prosem.tsx) ----
function isKBMWeek(jenis: string) {
  const n = jenis.toLowerCase().replace(/\s+/g, "");
  return n === "kbm" || n === "efektif";
}
function isExamWeek(jenis: string) {
  const n = jenis.toUpperCase().replace(/\s+/g, "");
  return ["STS", "SAS", "PTS", "PAS"].includes(n);
}
function isSpecialWeek(jenis: string) {
  return isExamWeek(jenis) || !isKBMWeek(jenis);
}
function getSpecialLabel(jenis: string, keterangan?: string | null) {
  const j = jenis.toUpperCase().replace(/\s+/g, "");
  if (["STS", "SAS", "PTS", "PAS"].includes(j)) return j;
  return keterangan || "Libur Sekolah";
}
function getSpecialBg(jenis: string) {
  if (isExamWeek(jenis)) return "bg-amber-100";
  return "bg-emerald-100";
}
function getSpecialBgInline(jenis: string) {
  if (isExamWeek(jenis)) return "#fef3c7";
  return "#d1fae5";
}

// ---- Props ----
export interface ProsemDisdikViewProps {
  open: boolean;
  onClose: () => void;
  prosem: { id: string; subjectId: string; calendarId: string; kelas: string } | null;
  items: ProsemItemData[];
  weeks: ProsemWeek[];
  subjectName: string;
  tahunAjaran: string;
  semester: string;
}

export function ProsemDisdikView({
  open,
  onClose,
  prosem,
  items,
  weeks,
  subjectName,
  tahunAjaran,
  semester,
}: ProsemDisdikViewProps) {
  // ---- Build month definitions ----
  const monthDefs =
    semester?.toLowerCase().includes("genap") ? GENAP_MONTHS : GANJIL_MONTHS;

  // ---- Sort weeks and assign month/week-in-month slots ----
  const sortedWeeks = [...weeks].sort((a, b) => a.pekanKe - b.pekanKe);
  const monthCounters = new Array(monthDefs.length).fill(0);

  const enrichedWeeks: EnrichedWeek[] = sortedWeeks.map((w) => {
    const monthNum = new Date(w.tanggalMulai + "T00:00:00").getMonth() + 1;
    let mIdx = monthDefs.findIndex((m) => m.num === monthNum);
    if (mIdx < 0) mIdx = 0; // fallback to first month
    monthCounters[mIdx]++;
    return { ...w, monthIndex: mIdx, weekInMonth: monthCounters[mIdx] };
  });

  const weeksByMonth = monthDefs.map((_, i) =>
    enrichedWeeks.filter((w) => w.monthIndex === i),
  );

  // ---- Build materi rows (group by materi text, ordered by first appearance) ----
  const sortedItems = [...items].sort((a, b) => {
    const ia = sortedWeeks.findIndex((w) => w.id === a.weekId);
    const ib = sortedWeeks.findIndex((w) => w.id === b.weekId);
    return ia - ib;
  });

  const materiOrder: string[] = [];
  const materiMap = new Map<string, MateriRow>();
  for (const item of sortedItems) {
    if (!item.materi || item.materi.toLowerCase() === "libur") continue;
    if (!materiMap.has(item.materi)) {
      materiOrder.push(item.materi);
      materiMap.set(item.materi, { materi: item.materi, jpByWeekId: new Map(), totalJP: 0, catatan: "" });
    }
    const row = materiMap.get(item.materi)!;
    const jp = item.jp ?? 0;
    if (jp > 0) row.jpByWeekId.set(item.weekId, jp);
    row.totalJP += jp;
    if (item.catatan && !row.catatan) row.catatan = item.catatan;
  }
  const materiRows = materiOrder.map((m) => materiMap.get(m)!);

  // ---- Compute header alokasi waktu (mode of JP across KBM weeks) ----
  const kbmJPs = sortedItems
    .filter((it) => {
      const w = weeks.find((x) => x.id === it.weekId);
      return w && isKBMWeek(w.jenis) && it.materi?.toLowerCase() !== "libur" && (it.jp ?? 0) > 0;
    })
    .map((it) => it.jp as number);
  const avgJP = kbmJPs.length
    ? Math.round(kbmJPs.reduce((s, x) => s + x, 0) / kbmJPs.length)
    : 0;
  const alokasiHeader = avgJP > 0 ? `${avgJP} JP / Minggu` : "– JP / Minggu";

  // ---- Totals ----
  const totalJP = materiRows.reduce((s, r) => s + r.totalJP, 0);
  const jpSumByWeek = new Map<string, number>();
  for (const item of sortedItems) {
    if (!item.materi || item.materi.toLowerCase() === "libur" || !item.jp) continue;
    jpSumByWeek.set(item.weekId, (jpSumByWeek.get(item.weekId) ?? 0) + item.jp);
  }

  // ---- Special week IDs (PTS/PAS/Libur) ----
  const specialWeekIds = new Set(
    enrichedWeeks.filter((w) => isSpecialWeek(w.jenis)).map((w) => w.id),
  );

  // ---- Print handler (generates clean HTML in new window) ----
  const handlePrint = () => {
    const rows = materiRows
      .map(
        (row) => `
        <tr>
          <td style="padding:2px 6px;">${row.materi}</td>
          <td style="text-align:center;font-weight:600;">${row.totalJP || ""}</td>
          ${enrichedWeeks
            .map((w) => {
              const special = specialWeekIds.has(w.id);
              const jp = row.jpByWeekId.get(w.id);
              if (special) {
                return `<td style="background:${getSpecialBgInline(w.jenis)};-webkit-print-color-adjust:exact;print-color-adjust:exact;text-align:center;"></td>`;
              }
              return `<td style="text-align:center;">${jp || ""}</td>`;
            })
            .join("")}
          <td style="padding:2px 4px;color:#555;">${row.catatan || ""}</td>
        </tr>`,
      )
      .join("");

    const specialCols = enrichedWeeks
      .map((w) => {
        if (!specialWeekIds.has(w.id)) return "";
        return `
          <tr>
            <td colspan="${2 + enrichedWeeks.length + 1}" style="background:${getSpecialBgInline(w.jenis)};text-align:center;font-style:italic;padding:1px;">
              ${getSpecialLabel(w.jenis, w.keterangan)}
            </td>
          </tr>`;
      })
      .join("");
    void specialCols; // suppress unused var

    const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>Program Semester — ${subjectName}</title>
<style>
  @page { size: A4 landscape; margin: 1cm; }
  * { box-sizing: border-box; }
  body { font-family: Arial, sans-serif; font-size: 8.5pt; color: #000; margin: 0; }
  table { border-collapse: collapse; width: 100%; }
  th, td { border: 0.5pt solid #000; vertical-align: middle; padding: 2px 3px; }
  .title { text-align:center; font-size:13pt; font-weight:bold; margin-bottom:6px; letter-spacing:1px; }
  .info-grid { display:grid; grid-template-columns:1fr 1fr; gap:0 2cm; margin-bottom:8px; }
  .info-grid td { padding:1px 4px 1px 0; border:none; font-size:8.5pt; }
  .th-main { background:#f3f4f6; font-weight:600; text-align:center; }
  .vert { writing-mode:vertical-rl; text-orientation:mixed; transform:rotate(180deg); white-space:nowrap; display:block; margin:0 auto; font-size:7.5pt; }
</style>
</head>
<body>
<p class="title">PROGRAM SEMESTER</p>
<div class="info-grid">
  <table style="border-collapse:collapse;">
    <tr><td style="font-weight:600;padding-right:8px;">Mata Pelajaran</td><td style="padding-right:4px;">:</td><td>${subjectName}</td></tr>
    <tr><td style="font-weight:600;padding-right:8px;">Alokasi Waktu</td><td style="padding-right:4px;">:</td><td>${alokasiHeader}</td></tr>
  </table>
  <table style="border-collapse:collapse;">
    <tr><td style="font-weight:600;padding-right:8px;">Kelas/Semester</td><td style="padding-right:4px;">:</td><td>${prosem?.kelas ?? ""} / ${semester}</td></tr>
    <tr><td style="font-weight:600;padding-right:8px;">Tahun Pelajaran</td><td style="padding-right:4px;">:</td><td>${tahunAjaran}</td></tr>
  </table>
</div>
<table>
  <colgroup>
    <col style="width:190pt">
    <col style="width:36pt">
    ${enrichedWeeks.map(() => `<col style="width:20pt">`).join("")}
    <col style="width:60pt">
  </colgroup>
  <thead>
    <tr class="th-main">
      <th rowspan="2">Materi Pokok</th>
      <th rowspan="2" style="font-size:7.5pt;">Alokasi<br>Waktu</th>
      ${monthDefs
        .map((m, mIdx) => {
          const mWeeks = weeksByMonth[mIdx];
          if (!mWeeks.length) return "";
          return `<th colspan="${mWeeks.length}">${m.name}</th>`;
        })
        .join("")}
      <th rowspan="2">Ket</th>
    </tr>
    <tr class="th-main">
      ${enrichedWeeks
        .map(
          (w) =>
            `<th style="${specialWeekIds.has(w.id) ? `background:${getSpecialBgInline(w.jenis)};-webkit-print-color-adjust:exact;print-color-adjust:exact;` : ""}">${w.weekInMonth}</th>`,
        )
        .join("")}
    </tr>
  </thead>
  <tbody>
    ${materiRows.length === 0 ? `<tr><td colspan="${3 + enrichedWeeks.length}" style="text-align:center;padding:8px;">Belum ada materi</td></tr>` : rows}
    <tr style="background:#f9fafb;">
      <td style="font-weight:600;padding:2px 6px;">Cadangan</td>
      <td></td>
      ${enrichedWeeks.map((w) => `<td style="${specialWeekIds.has(w.id) ? `background:${getSpecialBgInline(w.jenis)};-webkit-print-color-adjust:exact;print-color-adjust:exact;` : ""}"></td>`).join("")}
      <td></td>
    </tr>
    <tr style="background:#f3f4f6;font-weight:700;">
      <td style="padding:2px 6px;">Jumlah</td>
      <td style="text-align:center;">${totalJP || ""}</td>
      ${enrichedWeeks
        .map(
          (w) =>
            `<td style="text-align:center;${specialWeekIds.has(w.id) ? `background:${getSpecialBgInline(w.jenis)};-webkit-print-color-adjust:exact;print-color-adjust:exact;` : ""}">${specialWeekIds.has(w.id) ? "" : (jpSumByWeek.get(w.id) || "")}</td>`,
        )
        .join("")}
      <td></td>
    </tr>
  </tbody>
</table>
</body>
</html>`;
    const win = window.open("", "_blank", "width=1200,height=820");
    if (win) {
      win.document.write(html);
      win.document.close();
      setTimeout(() => {
        win.focus();
        win.print();
      }, 600);
    }
  };

  // ---- Render ----
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-[96vw] w-[96vw] max-h-[92vh] flex flex-col p-0 gap-0">
        <DialogHeader className="flex flex-row items-center justify-between px-4 pt-3 pb-2 border-b border-border shrink-0">
          <DialogTitle className="text-sm font-semibold">Program Semester — Format Disdik</DialogTitle>
          <Button size="sm" variant="outline" onClick={handlePrint}>
            <Printer className="w-3.5 h-3.5 mr-1.5" /> Cetak / Simpan PDF
          </Button>
        </DialogHeader>

        <div className="flex-1 overflow-auto p-4 md:p-6">
          {/* ---- Title ---- */}
          <p className="text-center font-bold text-sm tracking-widest mb-3 uppercase">
            Program Semester
          </p>

          {/* ---- Header info ---- */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-16 gap-y-0.5 text-xs mb-5">
            <table style={{ borderCollapse: "collapse" }}>
              <tbody>
                <tr>
                  <td className="pr-2 py-0.5 font-semibold whitespace-nowrap w-32">Mata Pelajaran</td>
                  <td className="pr-1.5">:</td>
                  <td>{subjectName}</td>
                </tr>
                <tr>
                  <td className="pr-2 py-0.5 font-semibold whitespace-nowrap">Alokasi Waktu</td>
                  <td className="pr-1.5">:</td>
                  <td>{alokasiHeader}</td>
                </tr>
              </tbody>
            </table>
            <table style={{ borderCollapse: "collapse" }}>
              <tbody>
                <tr>
                  <td className="pr-2 py-0.5 font-semibold whitespace-nowrap w-32">Kelas/Semester</td>
                  <td className="pr-1.5">:</td>
                  <td>{prosem?.kelas} / {semester}</td>
                </tr>
                <tr>
                  <td className="pr-2 py-0.5 font-semibold whitespace-nowrap">Tahun Pelajaran</td>
                  <td className="pr-1.5">:</td>
                  <td>{tahunAjaran}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* ---- Main table ---- */}
          <div className="overflow-x-auto rounded border border-border">
            <table
              className="border-collapse text-xs"
              style={{ tableLayout: "auto", minWidth: "100%", fontSize: "11px" }}
            >
              <colgroup>
                <col style={{ minWidth: 180 }} />
                <col style={{ width: 48 }} />
                {enrichedWeeks.map((w) => (
                  <col key={w.id} style={{ width: 26 }} />
                ))}
                <col style={{ minWidth: 72 }} />
              </colgroup>

              <thead>
                {/* Row 1: labels + month spans + Ket */}
                <tr>
                  <th
                    rowSpan={2}
                    className="border border-border bg-muted/50 px-2 py-1 text-center font-semibold align-middle"
                  >
                    Materi Pokok
                  </th>
                  <th
                    rowSpan={2}
                    className="border border-border bg-muted/50 px-1 py-1 text-center font-semibold align-middle leading-tight"
                    style={{ fontSize: 10 }}
                  >
                    Alokasi<br />Waktu
                  </th>
                  {monthDefs.map((m, mIdx) => {
                    const mWeeks = weeksByMonth[mIdx];
                    if (!mWeeks.length) return null;
                    return (
                      <th
                        key={m.name}
                        colSpan={mWeeks.length}
                        className="border border-border bg-muted/50 px-1 py-1 text-center font-semibold"
                        style={{ fontSize: 11 }}
                      >
                        {m.name}
                      </th>
                    );
                  })}
                  <th
                    rowSpan={2}
                    className="border border-border bg-muted/50 px-1 py-1 text-center font-semibold align-middle"
                  >
                    Ket
                  </th>
                </tr>
                {/* Row 2: week-in-month numbers */}
                <tr>
                  {enrichedWeeks.map((w) => (
                    <th
                      key={w.id}
                      className={cn(
                        "border border-border px-0.5 py-0.5 text-center font-medium",
                        isSpecialWeek(w.jenis) ? getSpecialBg(w.jenis) : "bg-muted/30",
                      )}
                      style={{ fontSize: 10 }}
                    >
                      {w.weekInMonth}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {/* ---- Materi rows ---- */}
                {materiRows.length === 0 ? (
                  <tr>
                    <td
                      colSpan={3 + enrichedWeeks.length}
                      className="border border-border py-6 text-center text-muted-foreground"
                    >
                      Belum ada materi. Isi prosem terlebih dahulu.
                    </td>
                  </tr>
                ) : (
                  materiRows.map((row, rowIdx) => (
                    <tr key={rowIdx} className="hover:bg-muted/10">
                      <td className="border border-border px-2 py-0.5 align-middle">{row.materi}</td>
                      <td className="border border-border px-1 py-0.5 text-center font-semibold align-middle">
                        {row.totalJP > 0 ? row.totalJP : ""}
                      </td>
                      {enrichedWeeks.map((w) => {
                        const special = specialWeekIds.has(w.id);
                        const jp = row.jpByWeekId.get(w.id);

                        if (special) {
                          // First row renders the label; others just show coloured bg
                          return (
                            <td
                              key={w.id}
                              className={cn(
                                "border border-border p-0.5 text-center align-middle",
                                getSpecialBg(w.jenis),
                              )}
                            >
                              {rowIdx === 0 ? (
                                <span
                                  className="block mx-auto leading-none"
                                  style={{
                                    writingMode: "vertical-rl",
                                    transform: "rotate(180deg)",
                                    whiteSpace: "nowrap",
                                    fontSize: 8,
                                  }}
                                >
                                  {getSpecialLabel(w.jenis, w.keterangan)}
                                </span>
                              ) : null}
                            </td>
                          );
                        }

                        return (
                          <td
                            key={w.id}
                            className="border border-border p-0.5 text-center align-middle"
                          >
                            {jp || ""}
                          </td>
                        );
                      })}
                      <td className="border border-border px-1.5 py-0.5 text-muted-foreground align-middle" style={{ fontSize: 10 }}>
                        {row.catatan || ""}
                      </td>
                    </tr>
                  ))
                )}

                {/* ---- Cadangan row ---- */}
                <tr className="bg-muted/20">
                  <td className="border border-border px-2 py-0.5 font-semibold">Cadangan</td>
                  <td className="border border-border p-0.5 text-center" />
                  {enrichedWeeks.map((w) => (
                    <td
                      key={w.id}
                      className={cn(
                        "border border-border p-0.5",
                        specialWeekIds.has(w.id) ? getSpecialBg(w.jenis) : "",
                      )}
                    />
                  ))}
                  <td className="border border-border p-0.5" />
                </tr>

                {/* ---- Jumlah row ---- */}
                <tr className="bg-muted/40">
                  <td className="border border-border px-2 py-0.5 font-bold">Jumlah</td>
                  <td className="border border-border p-0.5 text-center font-bold">
                    {totalJP > 0 ? totalJP : ""}
                  </td>
                  {enrichedWeeks.map((w) => {
                    const special = specialWeekIds.has(w.id);
                    const sum = jpSumByWeek.get(w.id);
                    return (
                      <td
                        key={w.id}
                        className={cn(
                          "border border-border p-0.5 text-center font-semibold",
                          special ? getSpecialBg(w.jenis) : "",
                        )}
                      >
                        {!special && sum ? sum : ""}
                      </td>
                    );
                  })}
                  <td className="border border-border p-0.5" />
                </tr>
              </tbody>
            </table>
          </div>

          {/* ---- Legend ---- */}
          <div className="flex items-center gap-4 mt-3 text-[10px] text-muted-foreground">
            <span className="flex items-center gap-1">
              <span className="inline-block w-4 h-3 rounded bg-amber-100 border border-amber-300" />
              Ujian (PTS/PAS)
            </span>
            <span className="flex items-center gap-1">
              <span className="inline-block w-4 h-3 rounded bg-emerald-100 border border-emerald-300" />
              Libur
            </span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
