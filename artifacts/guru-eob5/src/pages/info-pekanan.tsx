import { Layout } from "@/components/layout";
import {
  useListAcademicCalendars,
  useListAcademicWeeks,
  useGetInfoPekanan,
} from "@workspace/api-client-react";
import { useEffect, useMemo, useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  CheckCircle2,
  AlertTriangle,
  ArrowUpRight,
  BookOpen,
  Info,
  Share2,
} from "lucide-react";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";

type Status = "sesuai" | "tertinggal" | "di_depan";

const statusMeta: Record<
  Status,
  { label: string; icon: typeof CheckCircle2; badgeClass: string }
> = {
  sesuai: {
    label: "Sesuai Rencana",
    icon: CheckCircle2,
    badgeClass: "bg-emerald-50 text-emerald-600",
  },
  tertinggal: {
    label: "Tertinggal",
    icon: AlertTriangle,
    badgeClass: "bg-red-50 text-red-600",
  },
  di_depan: { label: "Di Depan", icon: ArrowUpRight, badgeClass: "bg-blue-50 text-blue-600" },
};

const JENIS_LABEL: Record<string, string> = {
  efektif: "Pekan Efektif",
  pts: "Pekan PTS",
  pas: "Pekan PAS",
  libur: "Libur",
};

function StatCard({
  label,
  value,
  toneClass,
}: {
  label: string;
  value: number;
  toneClass: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-white px-5 py-4">
      <div className={`text-3xl font-bold font-serif ${toneClass}`}>{value}</div>
      <div className="mt-1 text-sm text-muted-foreground">{label}</div>
    </div>
  );
}

function StatusPill({ status }: { status: Status }) {
  const m = statusMeta[status] ?? statusMeta.tertinggal;
  const Icon = m.icon;
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${m.badgeClass}`}
    >
      <Icon className="h-3.5 w-3.5" />
      {m.label}
    </span>
  );
}

function LessonCard({ item }: { item: any }) {
  const status = item.status as Status;
  const hasPlan = item.prosemItemId != null;
  const hasReal = item.journalEntryId != null;
  return (
    <div className="rounded-xl border border-border bg-white p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-primary">
            <BookOpen className="h-5 w-5" />
          </div>
          <div>
            <div className="font-semibold">{item.subjectName}</div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className="rounded bg-muted px-1.5 py-0.5 font-medium text-foreground">
                Kelas {item.kelas}
              </span>
              {item.kd && <span>CP {item.kd}</span>}
              {item.jp != null && <span>· {item.jp} JP</span>}
            </div>
          </div>
        </div>
        <StatusPill status={status} />
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <div className="rounded-lg border border-border bg-background p-3">
          <div className="mb-1 text-[11px] font-bold uppercase tracking-wide text-accent">
            Rencana · Prosem
          </div>
          {hasPlan ? (
            <div className="text-sm leading-snug">{item.materi}</div>
          ) : (
            <div className="text-sm italic text-muted-foreground">
              Tidak ada rencana di prosem
            </div>
          )}
        </div>
        <div className="rounded-lg border border-border bg-background p-3">
          <div className="mb-1 text-[11px] font-bold uppercase tracking-wide text-primary">
            Realisasi · Jurnal
          </div>
          {hasReal ? (
            <div className="text-sm leading-snug">
              {hasPlan ? "Jurnal terisi pekan ini" : item.materi}
            </div>
          ) : (
            <div className="text-sm italic text-red-500">Belum ada jurnal pekan ini</div>
          )}
        </div>
      </div>
    </div>
  );
}

function buildWhatsAppText(
  items: any[],
  pekanKe: number | null,
  tanggalMulai: string | null,
  tanggalSelesai: string | null,
): string {
  if (!items.length) return "";

  // Group by subject name, preserving insertion order
  const bySubject = new Map<string, { kelas: string; materi: string }[]>();
  for (const item of items) {
    const key = item.subjectName ?? "-";
    const arr = bySubject.get(key) ?? [];
    arr.push({ kelas: item.kelas, materi: item.materi });
    bySubject.set(key, arr);
  }

  const lines: string[] = ["Bismillah", "Info pekanan"];
  if (pekanKe != null) {
    let weekLine = `Pekan ke-${pekanKe}`;
    if (tanggalMulai && tanggalSelesai) {
      const fmt = (d: string) => {
        const [y, m, day] = d.split("-");
        const months = ["Jan","Feb","Mar","Apr","Mei","Jun","Jul","Agu","Sep","Okt","Nov","Des"];
        return `${parseInt(day)} ${months[parseInt(m) - 1]}`;
      };
      weekLine += ` (${fmt(tanggalMulai)} – ${fmt(tanggalSelesai)})`;
    }
    lines.push(weekLine);
  }

  let first = true;
  for (const [subject, classItems] of bySubject) {
    if (!first) lines.push(""); // blank line between subjects
    first = false;
    lines.push(subject);
    for (const ci of classItems) {
      lines.push(`G. ${ci.kelas}`);
      lines.push(ci.materi);
    }
  }

  return lines.join("\n");
}

export default function InfoPekanan() {
  const { data: calendars, isLoading: calLoading } = useListAcademicCalendars();
  const [selectedCalendar, setSelectedCalendar] = useState<string>("");

  useEffect(() => {
    if (!selectedCalendar && calendars?.length) {
      setSelectedCalendar(calendars[0].id);
    }
  }, [calendars, selectedCalendar]);

  const { data: weeks } = useListAcademicWeeks(
    { calendarId: selectedCalendar || undefined },
    { query: { queryKey: ["/api/academic-weeks", selectedCalendar], enabled: !!selectedCalendar } },
  );

  const [weekIndex, setWeekIndex] = useState(0);

  useEffect(() => {
    if (!weeks?.length) {
      setWeekIndex(0);
      return;
    }
    const today = new Date().toISOString().split("T")[0];
    // 1. Try to find the week that contains today
    const current = weeks.findIndex(
      (w: any) => w.tanggalMulai <= today && w.tanggalSelesai >= today,
    );
    if (current >= 0) {
      setWeekIndex(current);
      return;
    }
    // 2. If today is before the first week, show week 0
    if (today < (weeks[0] as any).tanggalMulai) {
      setWeekIndex(0);
      return;
    }
    // 3. If today is after the last week, show the last week
    // (semester ended / new school year hasn't started yet)
    setWeekIndex(weeks.length - 1);
  }, [weeks]);

  const activeWeek = weeks?.[weekIndex];
  const activeCalendar = calendars?.find((c: any) => c.id === selectedCalendar);

  const { data: info, isLoading: infoLoading } = useGetInfoPekanan(
    { calendarId: selectedCalendar || undefined, weekId: activeWeek?.id || undefined },
    {
      query: {
        queryKey: ["/api/info-pekanan", selectedCalendar, activeWeek?.id],
        enabled: !!selectedCalendar && !!activeWeek?.id,
      },
    },
  );

  const dateRange = useMemo(() => {
    if (!activeWeek) return "";
    return `${format(new Date(activeWeek.tanggalMulai), "d MMM", { locale: idLocale })} – ${format(
      new Date(activeWeek.tanggalSelesai),
      "d MMM yyyy",
      { locale: idLocale },
    )}`;
  }, [activeWeek]);

  const noCalendar = !calLoading && !calendars?.length;

  return (
    <Layout>
      <div className="space-y-6 animate-in fade-in duration-500">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            {activeCalendar && (
              <div className="mb-1 inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-accent">
                <CalendarDays className="h-3.5 w-3.5" />
                Tahun Ajaran {activeCalendar.tahunAjaran} · Semester {activeCalendar.semester}
              </div>
            )}
            <h1 className="text-3xl font-bold font-serif">Info Pekanan</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Ringkasan capaian pekan ini — rencana Prosem vs realisasi Jurnal.
            </p>
          </div>
          {!noCalendar && (
            <div className="w-[260px]">
              {calLoading ? (
                <Skeleton className="h-9 w-full" />
              ) : (
                <Select value={selectedCalendar} onValueChange={setSelectedCalendar}>
                  <SelectTrigger className="bg-white">
                    <SelectValue placeholder="Pilih Kalender" />
                  </SelectTrigger>
                  <SelectContent>
                    {calendars?.map((c: any) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.tahunAjaran} — {c.semester}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          )}
        </div>

        {noCalendar ? (
          <div className="rounded-xl border border-border bg-white h-32 flex items-center justify-center text-muted-foreground">
            Belum ada kalender akademik. Minta admin membuat kalender terlebih dahulu.
          </div>
        ) : !weeks?.length ? (
          <div className="rounded-xl border border-border bg-white h-32 flex items-center justify-center text-muted-foreground">
            Kalender ini belum punya pekan.
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between rounded-xl border border-border bg-white px-4 py-3">
              <Button
                variant="outline"
                size="icon"
                disabled={weekIndex <= 0}
                onClick={() => setWeekIndex((i) => Math.max(0, i - 1))}
              >
                <ChevronLeft className="h-5 w-5" />
              </Button>
              <div className="text-center">
                <div className="flex items-center justify-center gap-2">
                  <span className="text-lg font-bold">Pekan ke-{activeWeek?.pekanKe}</span>
                  {activeWeek && (
                    <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-600">
                      {JENIS_LABEL[activeWeek.jenis] ?? activeWeek.jenis}
                    </span>
                  )}
                </div>
                <div className="text-sm text-muted-foreground">{dateRange}</div>
              </div>
              <div className="flex items-center gap-2">
                {!!info?.items?.length && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1.5 text-emerald-600 border-emerald-200 hover:bg-emerald-50"
                    onClick={() => {
                      const text = buildWhatsAppText(
                        info.items,
                        info.pekanKe ?? null,
                        info.tanggalMulai ?? null,
                        info.tanggalSelesai ?? null,
                      );
                      window.open(
                        `https://wa.me/?text=${encodeURIComponent(text)}`,
                        "_blank",
                      );
                    }}
                  >
                    <Share2 className="h-4 w-4" />
                    WhatsApp
                  </Button>
                )}
                <Button
                  variant="outline"
                  size="icon"
                  disabled={weekIndex >= (weeks.length - 1)}
                  onClick={() => setWeekIndex((i) => Math.min(weeks.length - 1, i + 1))}
                >
                  <ChevronRight className="h-5 w-5" />
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              <StatCard label="Total Rencana" value={info?.totalRencana ?? 0} toneClass="text-foreground" />
              <StatCard label="Sesuai Rencana" value={info?.totalSesuai ?? 0} toneClass="text-emerald-600" />
              <StatCard label="Tertinggal" value={info?.totalTertinggal ?? 0} toneClass="text-red-500" />
              <StatCard label="Di Depan" value={info?.totalDiDepan ?? 0} toneClass="text-primary" />
            </div>

            <div>
              <h2 className="mb-3 text-lg font-bold">Capaian per Kelas</h2>
              {infoLoading ? (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  {Array(2)
                    .fill(0)
                    .map((_, i) => (
                      <Skeleton key={i} className="h-40 w-full rounded-xl" />
                    ))}
                </div>
              ) : !info?.items?.length ? (
                <div className="rounded-xl border border-border bg-white h-32 flex items-center justify-center text-muted-foreground">
                  Belum ada rencana prosem atau jurnal untuk pekan ini.
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  {info.items.map((it: any, i: number) => (
                    <LessonCard key={it.prosemItemId ?? it.journalEntryId ?? i} item={it} />
                  ))}
                </div>
              )}
            </div>

            <div className="flex items-start gap-2 rounded-lg bg-blue-50/70 px-4 py-3 text-xs text-muted-foreground">
              <Info className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              <span>
                Pekan & jenisnya (efektif / PTS / PAS / libur) ditentukan admin melalui{" "}
                <b className="text-foreground">Kalender Akademik</b>. Kolom Rencana diambil dari{" "}
                <b className="text-foreground">Prosem</b> Anda, kolom Realisasi otomatis dari{" "}
                <b className="text-foreground">Jurnal Mengajar</b>.
              </span>
            </div>
          </>
        )}
      </div>
    </Layout>
  );
}
