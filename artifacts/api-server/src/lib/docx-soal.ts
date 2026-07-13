import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } from "docx";
import type { SoalContent } from "./gemini";

const LETTERS = ["A", "B", "C", "D", "E", "F"];

export async function buildSoalDocx(
  content: SoalContent,
  meta: { mataPelajaran: string; materi: string },
): Promise<Buffer> {
  const questionParagraphs = content.soal.flatMap((q) => {
    const paragraphs: Paragraph[] = [
      new Paragraph({
        children: [new TextRun({ text: `${q.nomor}. ${q.pertanyaan}`, bold: true })],
        spacing: { before: 200, after: 80 },
      }),
    ];
    if (q.tipe === "pilihan_ganda") {
      q.pilihan.forEach((opt, i) => {
        paragraphs.push(
          new Paragraph({ text: `${LETTERS[i] ?? i + 1}. ${opt}`, spacing: { after: 40 }, indent: { left: 360 } }),
        );
      });
    } else {
      paragraphs.push(new Paragraph({ text: "Jawaban: ..............................................", spacing: { after: 40 }, indent: { left: 360 } }));
    }
    return paragraphs;
  });

  const answerKeyParagraphs = content.soal.flatMap((q) => [
    new Paragraph({
      children: [
        new TextRun({ text: `${q.nomor}. `, bold: true }),
        new TextRun({ text: q.jawabanBenar, bold: true }),
      ],
      spacing: { after: 40 },
    }),
    new Paragraph({ text: q.pembahasan || "-", spacing: { after: 100 }, indent: { left: 360 } }),
  ]);

  const doc = new Document({
    sections: [
      {
        properties: {},
        children: [
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [new TextRun({ text: content.judul || "Soal Latihan", bold: true, size: 32 })],
            spacing: { after: 120 },
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [new TextRun({ text: `${meta.mataPelajaran} — ${meta.materi}`, italics: true })],
            spacing: { after: 240 },
          }),
          new Paragraph({
            children: [new TextRun({ text: "Petunjuk Pengerjaan: ", bold: true }), new TextRun(content.petunjukPengerjaan)],
            spacing: { after: 240 },
          }),
          ...questionParagraphs,

          new Paragraph({ text: "", pageBreakBefore: true }),
          new Paragraph({
            children: [new TextRun({ text: "Kunci Jawaban", bold: true, size: 28 })],
            spacing: { after: 200 },
          }),
          ...answerKeyParagraphs,
        ],
      },
    ],
  });

  return Packer.toBuffer(doc);
}
