import "./_group.css";
import {
  ChevronLeft,
  ChevronRight,
  Printer,
  Share2,
  CalendarDays,
  CheckCircle2,
  AlertTriangle,
  ArrowUpRight,
  BookOpen,
  Megaphone,
  ClipboardList,
  Info,
} from "lucide-react";

type Status = "sesuai" | "tertinggal" | "di_depan";

const hsl = (v: string) => `hsl(${v})`;
const C = {
  cream: "40 33% 98%",
  navy: "220 50% 15%",
  blue: "215 80% 40%",
  gold: "38 92% 50%",
  mutedFg: "220 15% 45%",
  border: "220 20% 90%",
  green: "160 55% 40%",
  red: "0 74% 52%",
};

const statusMeta: Record<
  Status,
  { label: string; color: string; bg: string; icon: typeof CheckCircle2 }
> = {
  sesuai: { label: "Sesuai Rencana", color: C.green, bg: "160 55% 96%", icon: CheckCircle2 },
  tertinggal: { label: "Tertinggal", color: C.red, bg: "0 74% 97%", icon: AlertTriangle },
  di_depan: { label: "Di Depan", color: C.blue, bg: "215 80% 96%", icon: ArrowUpRight },
};

type Row = {
  mapel: string;
  kelas: string;
  kd: string;
  rencana: string;
  jp: number;
  realisasi: string | null;
  tanggal: string | null;
  status: Status;
};

const rows: Row[] = [
  {
    mapel: "Matematika",
    kelas: "VIII A",
    kd: "3.5",
    rencana: "Sistem Persamaan Linear Dua Variabel (SPLDV) — metode substitusi",
    jp: 4,
    realisasi: "SPLDV — metode substitusi & eliminasi",
    tanggal: "Sen, 6 Jul",
    status: "sesuai",
  },
  {
    mapel: "Matematika",
    kelas: "VIII B",
    kd: "3.5",
    rencana: "Sistem Persamaan Linear Dua Variabel (SPLDV) — metode substitusi",
    jp: 4,
    realisasi: "Relasi & fungsi (pengulangan materi pekan lalu)",
    tanggal: "Sel, 7 Jul",
    status: "tertinggal",
  },
  {
    mapel: "IPA Terpadu",
    kelas: "VIII A",
    kd: "3.6",
    rencana: "Struktur & fungsi jaringan tumbuhan",
    jp: 3,
    realisasi: "Struktur jaringan tumbuhan + praktikum daun",
    tanggal: "Rab, 8 Jul",
    status: "di_depan",
  },
  {
    mapel: "IPA Terpadu",
    kelas: "VIII B",
    kd: "3.6",
    rencana: "Struktur & fungsi jaringan tumbuhan",
    jp: 3,
    realisasi: null,
    tanggal: null,
    status: "tertinggal",
  },
];

function StatCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: string;
}) {
  return (
    <div
      className="rounded-xl border bg-white px-5 py-4"
      style={{ borderColor: hsl(C.border) }}
    >
      <div
        className="text-3xl font-bold"
        style={{ color: hsl(tone), fontFamily: "'Playfair Display', serif" }}
      >
        {value}
      </div>
      <div className="mt-1 text-sm" style={{ color: hsl(C.mutedFg) }}>
        {label}
      </div>
    </div>
  );
}

function StatusPill({ status }: { status: Status }) {
  const m = statusMeta[status];
  const Icon = m.icon;
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold"
      style={{ background: hsl(m.bg), color: hsl(m.color) }}
    >
      <Icon className="h-3.5 w-3.5" />
      {m.label}
    </span>
  );
}

function LessonCard({ row }: { row: Row }) {
  return (
    <div
      className="rounded-xl border bg-white p-5"
      style={{ borderColor: hsl(C.border) }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg"
            style={{ background: hsl("215 80% 96%"), color: hsl(C.blue) }}
          >
            <BookOpen className="h-5 w-5" />
          </div>
          <div>
            <div className="font-semibold" style={{ color: hsl(C.navy) }}>
              {row.mapel}
            </div>
            <div className="flex items-center gap-2 text-xs" style={{ color: hsl(C.mutedFg) }}>
              <span
                className="rounded px-1.5 py-0.5 font-medium"
                style={{ background: hsl("40 20% 92%"), color: hsl(C.navy) }}
              >
                Kelas {row.kelas}
              </span>
              <span>KD {row.kd}</span>
              <span>· {row.jp} JP</span>
            </div>
          </div>
        </div>
        <StatusPill status={row.status} />
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <div
          className="rounded-lg p-3"
          style={{ background: hsl("40 33% 98%"), border: `1px solid ${hsl(C.border)}` }}
        >
          <div
            className="mb-1 text-[11px] font-bold uppercase tracking-wide"
            style={{ color: hsl(C.gold) }}
          >
            Rencana · Prosem
          </div>
          <div className="text-sm leading-snug" style={{ color: hsl(C.navy) }}>
            {row.rencana}
          </div>
        </div>
        <div
          className="rounded-lg p-3"
          style={{ background: hsl("40 33% 98%"), border: `1px solid ${hsl(C.border)}` }}
        >
          <div
            className="mb-1 text-[11px] font-bold uppercase tracking-wide"
            style={{ color: hsl(C.blue) }}
          >
            Realisasi · Jurnal
          </div>
          {row.realisasi ? (
            <div className="text-sm leading-snug" style={{ color: hsl(C.navy) }}>
              {row.realisasi}
              <span className="mt-1 block text-xs" style={{ color: hsl(C.mutedFg) }}>
                Diisi {row.tanggal}
              </span>
            </div>
          ) : (
            <div className="text-sm italic" style={{ color: hsl(C.red) }}>
              Belum ada jurnal pekan ini
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function InfoPekanan() {
  return (
    <div
      className="ip-root min-h-screen w-full px-8 py-8"
      style={{ background: hsl(C.cream), color: hsl(C.navy) }}
    >
      <div className="mx-auto max-w-5xl">
        {/* Header */}
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div
              className="mb-1 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold"
              style={{ background: hsl("38 92% 94%"), color: hsl(C.gold) }}
            >
              <CalendarDays className="h-3.5 w-3.5" />
              Tahun Ajaran 2025/2026 · Semester Genap
            </div>
            <h1 className="text-3xl font-extrabold" style={{ color: hsl(C.navy) }}>
              Info Pekanan
            </h1>
            <p className="mt-1 text-sm" style={{ color: hsl(C.mutedFg) }}>
              Ringkasan capaian pembelajaran pekan ini — rencana Prosem vs realisasi Jurnal
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              className="inline-flex items-center gap-2 rounded-lg border bg-white px-4 py-2 text-sm font-semibold"
              style={{ borderColor: hsl(C.border), color: hsl(C.navy) }}
            >
              <Share2 className="h-4 w-4" />
              Bagikan
            </button>
            <button
              className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-white"
              style={{ background: hsl(C.blue) }}
            >
              <Printer className="h-4 w-4" />
              Cetak Lembar
            </button>
          </div>
        </div>

        {/* Week navigator */}
        <div
          className="mt-6 flex items-center justify-between rounded-xl border bg-white px-4 py-3"
          style={{ borderColor: hsl(C.border) }}
        >
          <button
            className="flex h-9 w-9 items-center justify-center rounded-lg border"
            style={{ borderColor: hsl(C.border), color: hsl(C.mutedFg) }}
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <div className="text-center">
            <div className="flex items-center justify-center gap-2">
              <span className="text-lg font-bold" style={{ color: hsl(C.navy) }}>
                Pekan ke-7
              </span>
              <span
                className="rounded-full px-2.5 py-0.5 text-xs font-semibold"
                style={{ background: hsl("160 55% 94%"), color: hsl(C.green) }}
              >
                Pekan Efektif
              </span>
            </div>
            <div className="text-sm" style={{ color: hsl(C.mutedFg) }}>
              6 – 11 Juli 2026 · pekan berjalan
            </div>
          </div>
          <button
            className="flex h-9 w-9 items-center justify-center rounded-lg border"
            style={{ borderColor: hsl(C.border), color: hsl(C.mutedFg) }}
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>

        {/* Summary stats */}
        <div className="mt-4 grid grid-cols-4 gap-3">
          <StatCard label="Total Kelas · Mapel" value="4" tone={C.navy} />
          <StatCard label="Sesuai Rencana" value="1" tone={C.green} />
          <StatCard label="Tertinggal" value="2" tone={C.red} />
          <StatCard label="Di Depan" value="1" tone={C.blue} />
        </div>

        {/* Lesson cards */}
        <div className="mt-6">
          <h2 className="mb-3 text-lg font-bold" style={{ color: hsl(C.navy) }}>
            Capaian per Kelas
          </h2>
          <div className="grid grid-cols-2 gap-4">
            {rows.map((r, i) => (
              <LessonCard key={i} row={r} />
            ))}
          </div>
        </div>

        {/* Weekly notes */}
        <div className="mt-6 grid grid-cols-2 gap-4">
          <div
            className="rounded-xl border bg-white p-5"
            style={{ borderColor: hsl(C.border) }}
          >
            <div className="mb-3 flex items-center gap-2">
              <Megaphone className="h-5 w-5" style={{ color: hsl(C.gold) }} />
              <h3 className="text-base font-bold" style={{ color: hsl(C.navy) }}>
                Pengumuman Pekanan
              </h3>
            </div>
            <ul className="space-y-2 text-sm" style={{ color: hsl(C.navy) }}>
              <li className="flex gap-2">
                <span style={{ color: hsl(C.gold) }}>•</span>
                Ulangan harian SPLDV kelas VIII A & B pekan depan (Senin).
              </li>
              <li className="flex gap-2">
                <span style={{ color: hsl(C.gold) }}>•</span>
                Persiapan PTS mulai pekan ke-9 — mohon percepat kelas yang tertinggal.
              </li>
            </ul>
          </div>
          <div
            className="rounded-xl border bg-white p-5"
            style={{ borderColor: hsl(C.border) }}
          >
            <div className="mb-3 flex items-center gap-2">
              <ClipboardList className="h-5 w-5" style={{ color: hsl(C.blue) }} />
              <h3 className="text-base font-bold" style={{ color: hsl(C.navy) }}>
                Tugas & Tindak Lanjut
              </h3>
            </div>
            <ul className="space-y-2 text-sm" style={{ color: hsl(C.navy) }}>
              <li className="flex gap-2">
                <span style={{ color: hsl(C.blue) }}>•</span>
                VIII B: kejar materi SPLDV agar sejajar dengan VIII A.
              </li>
              <li className="flex gap-2">
                <span style={{ color: hsl(C.blue) }}>•</span>
                IPA VIII B: jadwalkan pengganti — jurnal pekan ini belum terisi.
              </li>
            </ul>
          </div>
        </div>

        {/* Footer hint */}
        <div
          className="mt-6 flex items-start gap-2 rounded-lg px-4 py-3 text-xs"
          style={{ background: hsl("215 80% 97%"), color: hsl(C.mutedFg) }}
        >
          <Info className="mt-0.5 h-4 w-4 shrink-0" style={{ color: hsl(C.blue) }} />
          <span>
            Pekan & jenis pekan (efektif / PTS / PAS / libur) ditentukan admin melalui
            <b style={{ color: hsl(C.navy) }}> Kalender Akademik</b>. Kolom Rencana diambil
            dari <b style={{ color: hsl(C.navy) }}>Prosem</b> Anda, kolom Realisasi otomatis
            dari <b style={{ color: hsl(C.navy) }}>Jurnal Mengajar</b>.
          </span>
        </div>
      </div>
    </div>
  );
}
