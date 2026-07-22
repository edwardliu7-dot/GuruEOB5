import { Layout } from "@/components/layout";
import {
  useListAcademicCalendars,
  useListAcademicWeeks,
  useGetInfoPekanan,
} from "@workspace/api-client-react";
import { useEffect, useMemo, useState } from "react";
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
  MessageCircle,
  Clock,
  Copy,
  ChevronDown,
  Search,
  Filter,
  CalendarCheck,
} from "lucide-react";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";

// ─── Types ───────────────────────────────────────────────────────────────────

type Status = "sesuai" | "tertinggal" | "di_depan" | "belum";

const statusMeta: Record<
  Status,
  { label: string; icon: typeof CheckCircle2; badgeClass: string }
> = {
  sesuai: { label: "Sesuai Rencana", icon: CheckCircle2, badgeClass: "bg-emerald-50 text-emerald-600" },
  tertinggal: { label: "Tertinggal", icon: AlertTriangle, badgeClass: "bg-red-50 text-red-600" },
  di_depan: { label: "Di Depan", icon: ArrowUpRight, badgeClass: "bg-blue-50 text-blue-600" },
  belum: { label: "Belum", icon: Clock, badgeClass: "bg-slate-100 text-slate-500" },
};

const JENIS_LABEL: Record<string, string> = {
  efektif: "Pekan Efektif",
  pts: "Pekan PTS",
  pas: "Pekan PAS",
  libur: "Libur",
};

const STATUS_PRIORITY: Record<Status, number> = {
  tertinggal: 0,
  belum: 1,
  di_depan: 2,
  sesuai: 3,
};

interface GroupedItem {
  subjectName: string;
  kelas: string;
  rows: any[];
  worstStatus: Status;
  hasPlan: boolean;
  hasReal: boolean;
}

function groupItems(items: any[]): GroupedItem[] {
  const map = new Map<string, GroupedItem>();
  for (const item of items) {
    const key = `${item.subjectName ?? ""}|||${item.kelas ?? ""}`;
    const existing = map.get(key);
    const status = item.status as Status;
    if (existing) {
      existing.rows.push(item);
      if (STATUS_PRIORITY[status] < STATUS_PRIORITY[existing.worstStatus]) {
        existing.worstStatus = status;
      }
      if (item.prosemItemId != null) existing.hasPlan = true;
      if (item.journalEntryId != null) existing.hasReal = true;
    } else {
      map.set(key, {
        subjectName: item.subjectName ?? "-",
        kelas: item.kelas ?? "-",
        rows: [item],
        worstStatus: status,
        hasPlan: item.prosemItemId != null,
        hasReal: item.journalEntryId != null,
      });
    }
  }
  return Array.from(map.values());
}

function buildWhatsAppText(
  items: any[],
  pekanKe: number | null,
  tanggalMulai: string | null,
  tanggalSelesai: string | null,
): string {
  if (!items.length) return "";
  const groups = groupItems(items);
  const lines: string[] = ["Bismillah", "Info pekanan"];
  if (pekanKe != null) {
    let weekLine = `Pekan ke-${pekanKe}`;
    if (tanggalMulai && tanggalSelesai) {
      const fmt = (d: string) => {
        const [, m, day] = d.split("-");
        const months = ["Jan","Feb","Mar","Apr","Mei","Jun","Jul","Agu","Sep","Okt","Nov","Des"];
        return `${parseInt(day)} ${months[parseInt(m) - 1]}`;
      };
      weekLine += ` (${fmt(tanggalMulai)} – ${fmt(tanggalSelesai)})`;
    }
    lines.push(weekLine);
  }
  let first = true;
  for (const g of groups) {
    if (!first) lines.push("");
    first = false;
    lines.push(g.subjectName);
    lines.push(`G. ${g.kelas}`);
    const materiList = g.rows.map((r: any) => r.materi).filter(Boolean);
    if (materiList.length === 1) {
      lines.push(materiList[0]);
    } else {
      materiList.forEach((m: string, i: number) => lines.push(`${i + 1}. ${m}`));
    }
  }
  return lines.join("\n");
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const SUBJECT_COLORS = [
  { strip: "bg-blue-500",   icon: "bg-blue-100 text-blue-600",   initials: "bg-blue-100 text-blue-700"   },
  { strip: "bg-rose-500",   icon: "bg-rose-100 text-rose-600",   initials: "bg-rose-100 text-rose-700"   },
  { strip: "bg-emerald-500",icon: "bg-emerald-100 text-emerald-600",initials: "bg-emerald-100 text-emerald-700"},
  { strip: "bg-amber-500",  icon: "bg-amber-100 text-amber-600", initials: "bg-amber-100 text-amber-700" },
  { strip: "bg-indigo-500", icon: "bg-indigo-100 text-indigo-600",initials: "bg-indigo-100 text-indigo-700"},
  { strip: "bg-pink-500",   icon: "bg-pink-100 text-pink-600",   initials: "bg-pink-100 text-pink-700"   },
  { strip: "bg-teal-500",   icon: "bg-teal-100 text-teal-600",   initials: "bg-teal-100 text-teal-700"   },
];
function getSubjectColor(name: string) {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  return SUBJECT_COLORS[h % SUBJECT_COLORS.length];
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function StatusPill({ status }: { status: Status }) {
  const m = statusMeta[status] ?? statusMeta.tertinggal;
  const Icon = m.icon;
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${m.badgeClass}`}>
      <Icon className="h-3.5 w-3.5" />
      {m.label}
    </span>
  );
}

function SubjectCard({ group, index }: { group: GroupedItem; index: number }) {
  const col = getSubjectColor(group.subjectName);
  const jpTotal = group.rows.reduce((sum: number, r: any) => sum + (r.jp ?? 0), 0);
  const planRows = group.rows.filter((r: any) => r.prosemItemId != null);
  const realRows = group.rows.filter((r: any) => r.journalEntryId != null);

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col relative group">
      {/* Color strip */}
      <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${col.strip}`} />

      <div className="p-4 pl-5">
        {/* Header row */}
        <div className="flex justify-between items-start mb-3">
          <div className="min-w-0 flex-1 pr-3">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <h3 className="font-bold text-slate-800 text-base leading-tight">{group.subjectName}</h3>
              <span className="rounded-full px-2 py-0.5 text-[10px] font-bold bg-slate-100 text-slate-600 shrink-0">
                {group.kelas}
              </span>
              {jpTotal > 0 && (
                <span className="rounded-full px-2 py-0.5 text-[10px] font-bold bg-blue-50 text-blue-600 shrink-0">
                  {jpTotal} JP
                </span>
              )}
            </div>
          </div>
          <StatusPill status={group.worstStatus} />
        </div>

        {/* Rencana vs Realisasi */}
        <div className="grid grid-cols-2 gap-2 mb-3">
          <div className="bg-slate-50 rounded-lg p-3 border border-slate-100">
            <div className="text-[9px] uppercase tracking-wider text-slate-400 font-bold mb-1.5">Rencana · Prosem</div>
            {group.hasPlan ? (
              <ul className="space-y-1">
                {planRows.map((r: any, i: number) => (
                  <li key={r.prosemItemId ?? i} className="text-xs text-slate-700 leading-snug">
                    {planRows.length > 1 && <span className="mr-1 text-[10px] text-slate-400">{i + 1}.</span>}
                    {r.materi}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs italic text-slate-400">Tidak ada rencana prosem</p>
            )}
          </div>
          <div className="bg-slate-50 rounded-lg p-3 border border-slate-100">
            <div className="text-[9px] uppercase tracking-wider text-slate-400 font-bold mb-1.5">Realisasi · Jurnal</div>
            {group.hasReal ? (
              <ul className="space-y-1">
                {realRows.map((r: any, i: number) => (
                  <li key={r.journalEntryId ?? i} className="text-xs text-slate-700 leading-snug">
                    {realRows.length > 1 && <span className="mr-1 text-[10px] text-slate-400">{i + 1}.</span>}
                    {group.hasPlan ? "Jurnal terisi" : r.materi}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs italic text-red-400">Belum ada jurnal pekan ini</p>
            )}
          </div>
        </div>

        {/* Footer row: index */}
        <div className="flex items-center justify-between pt-1">
          <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${col.initials}`}>
            {(index + 1).toString().padStart(2, "0")}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function InfoPekanan() {
  const { toast } = useToast();
  const { data: calendars, isLoading: calLoading } = useListAcademicCalendars();
  const [selectedCalendar, setSelectedCalendar] = useState<string>("");
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

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
  const [weekDropOpen, setWeekDropOpen] = useState(false);

  useEffect(() => {
    if (!weeks?.length) { setWeekIndex(0); return; }
    const today = new Date().toISOString().split("T")[0];
    const current = weeks.findIndex((w: any) => w.tanggalMulai <= today && w.tanggalSelesai >= today);
    if (current >= 0) { setWeekIndex(current); return; }
    if (today < (weeks[0] as any).tanggalMulai) { setWeekIndex(0); return; }
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
    return `${format(new Date(activeWeek.tanggalMulai), "d MMM", { locale: idLocale })} – ${format(new Date(activeWeek.tanggalSelesai), "d MMM yyyy", { locale: idLocale })}`;
  }, [activeWeek]);

  const groups = useMemo(() => groupItems(info?.items ?? []), [info?.items]);
  const noCalendar = !calLoading && !calendars?.length;

  // ── Filtered groups ──
  const filteredGroups = useMemo(() => {
    if (!searchQuery.trim()) return groups;
    const q = searchQuery.toLowerCase();
    return groups.filter((g) => g.subjectName.toLowerCase().includes(q) || g.kelas.toLowerCase().includes(q));
  }, [groups, searchQuery]);

  // ── Stats ──
  const totalGroups = groups.length;
  const recordedGroups = groups.filter((g) => g.hasReal).length;
  const totalItems = info?.items?.length ?? 0;
  const sesuaiItems = info?.totalSesuai ?? 0;
  const diDepanItems = info?.totalDiDepan ?? 0;
  const totalRencana = info?.totalRencana ?? 0;
  const tertinggal = info?.totalTertinggal ?? 0;

  // ── WhatsApp text ──
  const waText = useMemo(
    () => buildWhatsAppText(info?.items ?? [], info?.pekanKe ?? null, info?.tanggalMulai ?? null, info?.tanggalSelesai ?? null),
    [info],
  );

  const handleCopyText = () => {
    if (!waText) return;
    navigator.clipboard.writeText(waText).then(() =>
      toast({ title: "Teks disalin!", description: "Teks pesan berhasil disalin ke clipboard." })
    );
  };

  const handleShareWhatsApp = () => {
    if (!waText) return;
    window.open(`https://wa.me/?text=${encodeURIComponent(waText)}`, "_blank");
  };

  const statCards = [
    {
      label: "Mapel Tercatat",
      value: totalGroups > 0 ? `${recordedGroups}/${totalGroups}` : "—",
      Icon: BookOpen,
      bg: "bg-blue-100", text: "text-blue-600", bar: "bg-blue-500",
      pct: totalGroups > 0 ? (recordedGroups / totalGroups) * 100 : 0,
    },
    {
      label: "Sesuai Rencana",
      value: totalRencana > 0 ? `${sesuaiItems + diDepanItems}/${totalRencana + diDepanItems}` : "—",
      Icon: CalendarCheck,
      bg: "bg-emerald-100", text: "text-emerald-600", bar: "bg-emerald-500",
      pct: (totalRencana + diDepanItems) > 0 ? ((sesuaiItems + diDepanItems) / (totalRencana + diDepanItems)) * 100 : 0,
    },
    {
      label: "Tertinggal",
      value: String(tertinggal),
      Icon: AlertTriangle,
      bg: tertinggal > 0 ? "bg-red-100" : "bg-slate-100",
      text: tertinggal > 0 ? "text-red-600" : "text-slate-400",
      bar: tertinggal > 0 ? "bg-red-500" : "bg-slate-200",
      pct: totalRencana > 0 ? (tertinggal / totalRencana) * 100 : 0,
    },
  ];

  return (
    <Layout>
      <div className="space-y-6">
        {/* ── Header ── */}
        <div>
          <div className="flex items-center text-xs text-slate-400 mb-2 font-medium">
            <span>Beranda</span>
            <ChevronRight className="w-3 h-3 mx-1" />
            <span>Laporan</span>
            <ChevronRight className="w-3 h-3 mx-1" />
            <span className="text-slate-600">Info Pekanan</span>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <h1 className="text-xl font-bold text-slate-800 mb-1">Info Pekanan</h1>
              <p className="text-sm text-slate-500">Ringkasan capaian pembelajaran mingguan untuk dibagikan.</p>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <button
                onClick={handleCopyText}
                disabled={!waText}
                className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-full text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors shadow-sm disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Share2 className="w-4 h-4" />
                Salin Tautan
              </button>
              <button
                onClick={handleShareWhatsApp}
                disabled={!waText}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-full text-sm font-medium hover:bg-emerald-700 transition-colors shadow-sm disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <MessageCircle className="w-4 h-4" />
                Bagikan via WhatsApp
              </button>
            </div>
          </div>
        </div>

        {noCalendar ? (
          <div className="bg-white rounded-xl border border-slate-200 h-40 flex items-center justify-center text-slate-400 text-sm">
            Belum ada kalender akademik. Minta admin membuat kalender terlebih dahulu.
          </div>
        ) : (
          <>
            {/* ── Selector Bar ── */}
            <div className="flex flex-wrap items-center gap-3 bg-white p-2 rounded-xl border border-slate-200 shadow-sm">
              {/* Week selector */}
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setWeekIndex((i) => Math.max(0, i - 1))}
                  disabled={weekIndex <= 0}
                  className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <div className="relative">
                  <div
                    className="flex items-center gap-2 bg-slate-50 px-3 py-2 rounded-lg border border-slate-200 cursor-pointer hover:bg-slate-100 transition-colors min-w-[180px]"
                    onClick={() => setWeekDropOpen((v) => !v)}
                  >
                    <span className="text-sm font-medium text-slate-500">Pekan:</span>
                    {calLoading || !activeWeek ? (
                      <Skeleton className="h-4 w-28 inline-block" />
                    ) : (
                      <span className="text-sm font-bold text-slate-800">
                        Pekan {activeWeek.pekanKe} ({dateRange})
                      </span>
                    )}
                    <ChevronDown className={`w-4 h-4 text-slate-400 ml-auto transition-transform ${weekDropOpen ? "rotate-180" : ""}`} />
                  </div>
                  {weekDropOpen && weeks?.length && (
                    <div className="absolute top-full left-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-lg z-50 min-w-[240px] max-h-72 overflow-y-auto">
                      {(weeks as any[]).map((w: any, i: number) => {
                        const fmt = (d: string) => {
                          const [y, m, day] = d.split("-");
                          const MONTHS = ["Jan","Feb","Mar","Apr","Mei","Jun","Jul","Agu","Sep","Okt","Nov","Des"];
                          return `${parseInt(day)} ${MONTHS[parseInt(m) - 1]}`;
                        };
                        const range = `${fmt(w.tanggalMulai)} – ${fmt(w.tanggalSelesai)}`;
                        return (
                          <button
                            key={w.id}
                            onClick={() => { setWeekIndex(i); setWeekDropOpen(false); }}
                            className={`w-full text-left px-4 py-2.5 text-sm transition-colors first:rounded-t-xl last:rounded-b-xl ${
                              i === weekIndex
                                ? "bg-slate-800 text-white font-semibold"
                                : "text-slate-700 hover:bg-slate-50"
                            }`}
                          >
                            Pekan {w.pekanKe} <span className="opacity-70 text-xs ml-1">({range})</span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
                <button
                  onClick={() => setWeekIndex((i) => Math.min((weeks?.length ?? 1) - 1, i + 1))}
                  disabled={weekIndex >= (weeks?.length ?? 1) - 1}
                  className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              {/* Divider */}
              <div className="w-px h-6 bg-slate-200 hidden sm:block" />

              {/* Calendar selector */}
              <div className="relative">
                <div
                  className="flex items-center gap-2 bg-slate-50 px-3 py-2 rounded-lg border border-slate-200 cursor-pointer hover:bg-slate-100 transition-colors"
                  onClick={() => setCalendarOpen((v) => !v)}
                >
                  <CalendarDays className="w-4 h-4 text-slate-400" />
                  {calLoading ? (
                    <Skeleton className="h-4 w-32" />
                  ) : (
                    <span className="text-sm font-medium text-slate-700">
                      {activeCalendar ? `${activeCalendar.tahunAjaran} · Smt ${activeCalendar.semester}` : "Pilih Kalender"}
                    </span>
                  )}
                  <ChevronDown className="w-4 h-4 text-slate-400 ml-1" />
                </div>
                {calendarOpen && calendars?.length && (
                  <div className="absolute top-full left-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-lg z-10 min-w-[200px]">
                    {calendars.map((c: any) => (
                      <button
                        key={c.id}
                        onClick={() => { setSelectedCalendar(c.id); setCalendarOpen(false); }}
                        className={`w-full text-left px-4 py-2.5 text-sm hover:bg-slate-50 first:rounded-t-xl last:rounded-b-xl transition-colors ${c.id === selectedCalendar ? "font-bold text-slate-800 bg-slate-50" : "text-slate-600"}`}
                      >
                        {c.tahunAjaran} — Semester {c.semester}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Week type badge */}
              {activeWeek && (
                <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                  {JENIS_LABEL[activeWeek.jenis] ?? activeWeek.jenis}
                </span>
              )}

              <div className="flex-1" />

              {/* Search */}
              <div className="flex items-center bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 focus-within:ring-2 focus-within:ring-slate-800/20 focus-within:border-slate-400 transition-all">
                <Search className="w-4 h-4 text-slate-400 mr-2 shrink-0" />
                <input
                  type="text"
                  placeholder="Cari mata pelajaran..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-transparent border-none outline-none text-sm text-slate-800 placeholder-slate-400 w-44"
                />
              </div>
            </div>

            {/* ── Stats Row ── */}
            {infoLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[1,2,3].map((i) => <Skeleton key={i} className="h-20 w-full rounded-xl" />)}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {statCards.map(({ label, value, Icon, bg, text, bar, pct }) => (
                  <div key={label} className="bg-white rounded-xl border border-slate-200 shadow-sm flex items-center gap-4 p-4 relative overflow-hidden">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${bg} ${text}`}>
                      <Icon className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="text-xs uppercase tracking-wide text-slate-500 font-semibold mb-1">{label}</div>
                      <div className="text-2xl font-black text-slate-800">{value}</div>
                    </div>
                    <div className="h-1 absolute bottom-0 left-0 right-0 bg-slate-100">
                      <div className={`h-1 ${bar} transition-all duration-500`} style={{ width: `${Math.min(pct, 100)}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* ── Main Content ── */}
            {!weeks?.length ? (
              <div className="bg-white rounded-xl border border-slate-200 h-32 flex items-center justify-center text-slate-400 text-sm">
                Kalender ini belum punya pekan.
              </div>
            ) : (
              <div className="flex flex-col lg:flex-row gap-6">
                {/* Left: Subject Cards */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-3">
                    <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">
                      Jurnal Mengajar{activeWeek ? ` — Pekan ${activeWeek.pekanKe}` : ""}
                    </h2>
                    <button className="text-xs font-medium text-blue-600 hover:text-blue-700 flex items-center gap-1">
                      <Filter className="w-3 h-3" />
                      Filter
                    </button>
                  </div>

                  {infoLoading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {[1,2,3,4].map((i) => <Skeleton key={i} className="h-48 w-full rounded-xl" />)}
                    </div>
                  ) : filteredGroups.length === 0 ? (
                    <div className="bg-white rounded-xl border border-slate-200 h-48 flex flex-col items-center justify-center text-slate-400 text-sm gap-2">
                      <BookOpen className="w-10 h-10 opacity-20" />
                      {searchQuery ? "Tidak ada mata pelajaran ditemukan." : "Belum ada rencana prosem atau jurnal untuk pekan ini."}
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {filteredGroups.map((g, i) => (
                        <SubjectCard key={`${g.subjectName}|||${g.kelas}|||${i}`} group={g} index={i} />
                      ))}
                    </div>
                  )}
                </div>

                {/* Right: WhatsApp Preview */}
                <div className="w-full lg:w-[360px] shrink-0">
                  <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                    <MessageCircle className="w-4 h-4" />
                    Preview Pesan WhatsApp
                  </h2>

                  <div
                    className="bg-[#e4ddcb] p-4 rounded-xl border border-[#d6ccb8] shadow-sm overflow-hidden"
                    style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23c8bb9a' fill-opacity='0.25'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")" }}
                  >
                    {!waText ? (
                      <div className="flex items-center justify-center h-48 text-slate-500 text-sm text-center p-4">
                        Pilih pekan dan kalender untuk melihat preview pesan.
                      </div>
                    ) : (
                      <>
                        <div className="bg-[#d9fdd3] p-3.5 rounded-xl rounded-tl-none shadow-sm mb-3">
                          <pre className="font-mono text-[12px] text-slate-800 whitespace-pre-wrap leading-relaxed max-h-80 overflow-y-auto">
                            {waText}
                          </pre>
                          <div className="flex justify-end mt-2 text-[10px] text-emerald-700 items-center gap-1 opacity-70">
                            <CheckCircle2 className="w-3 h-3" />
                          </div>
                        </div>

                        <button
                          onClick={handleCopyText}
                          className="w-full flex items-center justify-center gap-2 bg-white text-slate-700 border border-slate-200 rounded-full py-2.5 text-sm font-medium shadow-sm hover:bg-slate-50 transition-colors"
                        >
                          <Copy className="w-4 h-4" />
                          Salin Teks
                        </button>

                        <button
                          onClick={handleShareWhatsApp}
                          className="w-full mt-2 flex items-center justify-center gap-2 bg-emerald-600 text-white rounded-full py-2.5 text-sm font-medium shadow-sm hover:bg-emerald-700 transition-colors"
                        >
                          <MessageCircle className="w-4 h-4" />
                          Bagikan via WhatsApp
                        </button>
                      </>
                    )}
                  </div>

                  {/* Info note */}
                  <div className="mt-4 flex items-start gap-2 rounded-xl bg-blue-50 border border-blue-100 px-4 py-3 text-xs text-slate-500">
                    <Info className="mt-0.5 h-4 w-4 shrink-0 text-blue-400" />
                    <span>
                      Rencana dari <b className="text-slate-700">Prosem</b>, realisasi otomatis dari{" "}
                      <b className="text-slate-700">Jurnal Mengajar</b>.
                    </span>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </Layout>
  );
}
