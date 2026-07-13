import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  Table,
  TableRow,
  TableCell,
  WidthType,
  AlignmentType,
  BorderStyle,
} from "docx";
import type { ModulAjarContent } from "./gemini";

const CELL_BORDER = {
  top: { style: BorderStyle.SINGLE, size: 2, color: "999999" },
  bottom: { style: BorderStyle.SINGLE, size: 2, color: "999999" },
  left: { style: BorderStyle.SINGLE, size: 2, color: "999999" },
  right: { style: BorderStyle.SINGLE, size: 2, color: "999999" },
};

function heading(text: string, level: (typeof HeadingLevel)[keyof typeof HeadingLevel]) {
  return new Paragraph({ text, heading: level, spacing: { before: 240, after: 120 } });
}

function body(text: string) {
  return new Paragraph({ text: text || "-", spacing: { after: 120 } });
}

function bulletList(items: string[]) {
  if (!items.length) return [body("-")];
  return items.map((item) => new Paragraph({ text: item, bullet: { level: 0 }, spacing: { after: 60 } }));
}

function numberedList(items: string[]) {
  if (!items.length) return [body("-")];
  return items.map(
    (item, i) => new Paragraph({ text: `${i + 1}. ${item}`, spacing: { after: 60 } }),
  );
}

function infoRow(label: string, value: string): TableRow {
  return new TableRow({
    children: [
      new TableCell({
        width: { size: 30, type: WidthType.PERCENTAGE },
        borders: CELL_BORDER,
        children: [new Paragraph({ children: [new TextRun({ text: label, bold: true })] })],
      }),
      new TableCell({
        width: { size: 70, type: WidthType.PERCENTAGE },
        borders: CELL_BORDER,
        children: [new Paragraph(value || "-")],
      }),
    ],
  });
}

export async function buildModulAjarDocx(
  content: ModulAjarContent,
  meta: { mataPelajaran: string; alokasiWaktu: string },
): Promise<Buffer> {
  const { informasiUmum: iu, komponenInti: ki, lampiran: lp } = content;

  const doc = new Document({
    sections: [
      {
        properties: {},
        children: [
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [new TextRun({ text: content.judul || "Modul Ajar", bold: true, size: 32 })],
            spacing: { after: 300 },
          }),

          heading("A. Informasi Umum", HeadingLevel.HEADING_1),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              infoRow("Nama Penyusun", iu.namaPenyusun),
              infoRow("Instansi", iu.instansi),
              infoRow("Mata Pelajaran", meta.mataPelajaran),
              infoRow("Jenjang", iu.jenjang),
              infoRow("Kelas", iu.kelas),
              infoRow("Alokasi Waktu", meta.alokasiWaktu),
              infoRow("Jumlah Pertemuan", String(iu.jumlahPertemuan)),
              infoRow("Kompetensi Awal", iu.kompetensiAwal),
              infoRow("Profil Pelajar Pancasila", iu.profilPelajarPancasila.join(", ")),
              infoRow("Sarana Prasarana", iu.saranaPrasarana.join(", ")),
              infoRow("Target Peserta Didik", iu.targetPesertaDidik),
              infoRow("Model Pembelajaran", iu.modelPembelajaran),
            ],
          }),

          heading("B. Komponen Inti", HeadingLevel.HEADING_1),

          heading("1. Tujuan Pembelajaran", HeadingLevel.HEADING_2),
          ...numberedList(ki.tujuanPembelajaran),

          heading("2. Kriteria Ketercapaian Tujuan Pembelajaran (KKTP)", HeadingLevel.HEADING_2),
          ...numberedList(ki.kriteriaKetercapaianTujuanPembelajaran),

          heading("3. Pemahaman Bermakna", HeadingLevel.HEADING_2),
          body(ki.pemahamanBermakna),

          heading("4. Pertanyaan Pemantik", HeadingLevel.HEADING_2),
          ...bulletList(ki.pertanyaanPemantik),

          heading("5. Kegiatan Pembelajaran", HeadingLevel.HEADING_2),
          ...ki.kegiatanPembelajaran.flatMap((k) => [
            new Paragraph({
              children: [new TextRun({ text: `Pertemuan ke-${k.pertemuanKe}`, bold: true })],
              spacing: { before: 160, after: 80 },
            }),
            new Paragraph({ children: [new TextRun({ text: "Pendahuluan: ", bold: true }), new TextRun(k.pendahuluan)], spacing: { after: 60 } }),
            new Paragraph({ children: [new TextRun({ text: "Kegiatan Inti: ", bold: true }), new TextRun(k.kegiatanInti)], spacing: { after: 60 } }),
            new Paragraph({ children: [new TextRun({ text: "Penutup: ", bold: true }), new TextRun(k.penutup)], spacing: { after: 60 } }),
          ]),

          heading("6. Asesmen", HeadingLevel.HEADING_2),
          new Paragraph({ children: [new TextRun({ text: "Asesmen Diagnostik: ", bold: true }), new TextRun(ki.asesmen.asesmenDiagnostik)], spacing: { after: 60 } }),
          new Paragraph({ children: [new TextRun({ text: "Asesmen Formatif: ", bold: true }), new TextRun(ki.asesmen.asesmenFormatif)], spacing: { after: 60 } }),
          new Paragraph({ children: [new TextRun({ text: "Asesmen Sumatif: ", bold: true }), new TextRun(ki.asesmen.asesmenSumatif)], spacing: { after: 60 } }),

          heading("7. Refleksi", HeadingLevel.HEADING_2),
          new Paragraph({ children: [new TextRun({ text: "Refleksi Guru:", bold: true })], spacing: { after: 60 } }),
          ...bulletList(ki.refleksiGuru),
          new Paragraph({ children: [new TextRun({ text: "Refleksi Peserta Didik:", bold: true })], spacing: { before: 120, after: 60 } }),
          ...bulletList(ki.refleksiPesertaDidik),

          heading("C. Lampiran", HeadingLevel.HEADING_1),

          heading("1. Lembar Kerja Peserta Didik (LKPD)", HeadingLevel.HEADING_2),
          body(lp.lkpd),

          heading("2. Kunci Jawaban LKPD", HeadingLevel.HEADING_2),
          body(lp.kunciJawabanLkpd),

          heading("3. Rubrik Penilaian", HeadingLevel.HEADING_2),
          body(lp.rubrikPenilaian),

          heading("4. Pengayaan", HeadingLevel.HEADING_2),
          body(lp.pengayaan),

          heading("5. Remedial", HeadingLevel.HEADING_2),
          body(lp.remedial),

          heading("6. Bahan Bacaan Guru dan Peserta Didik", HeadingLevel.HEADING_2),
          body(lp.bahanBacaan),

          heading("7. Media Pembelajaran", HeadingLevel.HEADING_2),
          ...bulletList(lp.media),

          heading("8. Glosarium", HeadingLevel.HEADING_2),
          ...lp.glosarium.flatMap((g) => [
            new Paragraph({
              children: [new TextRun({ text: `${g.istilah}: `, bold: true }), new TextRun(g.definisi)],
              spacing: { after: 60 },
            }),
          ]),

          heading("9. Daftar Pustaka", HeadingLevel.HEADING_2),
          ...bulletList(lp.daftarPustaka),
        ],
      },
    ],
  });

  return Packer.toBuffer(doc);
}
