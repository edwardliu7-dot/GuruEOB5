import PDFDocument from "pdfkit";

export type CardAccount = {
  namaLengkap: string;
  kelas: string;
  username: string;
  password: string;
};

const MM = 2.8346456693; // points per millimeter
const PAGE_WIDTH = 595.28; // A4 portrait, points
const PAGE_HEIGHT = 841.89;
const MARGIN = 20;
const CARD_WIDTH = 85.6 * MM; // standard ID-card size
const CARD_HEIGHT = 54 * MM;
const GAP = 14;
const COLS = 2;

function drawCard(
  doc: PDFKit.PDFDocument,
  x: number,
  y: number,
  school: string,
  account: CardAccount,
): void {
  doc.roundedRect(x, y, CARD_WIDTH, CARD_HEIGHT, 8).stroke("#94a3b8");

  doc
    .fillColor("#0f172a")
    .font("Helvetica-Bold")
    .fontSize(8)
    .text(school.toUpperCase(), x + 12, y + 10, { width: CARD_WIDTH - 24 });

  doc
    .fillColor("#334155")
    .font("Helvetica")
    .fontSize(7)
    .text("KARTU AKUN SISWA — BLP & TOMAT", x + 12, y + 22, { width: CARD_WIDTH - 24 });

  doc
    .fillColor("#0f172a")
    .font("Helvetica-Bold")
    .fontSize(11)
    .text(account.namaLengkap, x + 12, y + 36, { width: CARD_WIDTH - 24 });

  doc
    .fillColor("#64748b")
    .font("Helvetica")
    .fontSize(8)
    .text(`Kelas ${account.kelas}`, x + 12, y + 52, { width: CARD_WIDTH - 24 });

  const credY = y + 68;
  doc
    .fillColor("#0f172a")
    .font("Helvetica-Bold")
    .fontSize(9)
    .text(`Username: ${account.username}`, x + 12, credY, { width: CARD_WIDTH - 24 })
    .text(`Password: ${account.password}`, x + 12, credY + 14, { width: CARD_WIDTH - 24 });

  doc
    .fillColor("#94a3b8")
    .font("Helvetica-Oblique")
    .fontSize(6)
    .text(
      "Simpan kartu ini. Gunakan username & password untuk masuk ke aplikasi BLP dan TOMAT.",
      x + 12,
      y + CARD_HEIGHT - 16,
      { width: CARD_WIDTH - 24 },
    );
}

function buildCardsPdf(school: string, accounts: CardAccount[]): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: "A4", margin: MARGIN });
    const chunks: Buffer[] = [];
    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    const usableHeight = PAGE_HEIGHT - 2 * MARGIN;
    const rowsPerPage = Math.floor((usableHeight + GAP) / (CARD_HEIGHT + GAP));
    const perPage = rowsPerPage * COLS;

    accounts.forEach((account, i) => {
      const posOnPage = i % perPage;
      if (i > 0 && posOnPage === 0) doc.addPage();
      const col = posOnPage % COLS;
      const row = Math.floor(posOnPage / COLS);
      const x = MARGIN + col * (CARD_WIDTH + GAP);
      const y = MARGIN + row * (CARD_HEIGHT + GAP);
      drawCard(doc, x, y, school, account);
    });

    if (accounts.length === 0) {
      doc.font("Helvetica").fontSize(12).text("Belum ada akun yang digenerate.", MARGIN, MARGIN);
    }

    doc.end();
  });
}

export async function buildSingleAccountCardPdf(
  school: string,
  account: CardAccount,
): Promise<Buffer> {
  return buildCardsPdf(school, [account]);
}

export async function buildBulkAccountCardsPdf(
  school: string,
  accounts: CardAccount[],
): Promise<Buffer> {
  return buildCardsPdf(school, accounts);
}
