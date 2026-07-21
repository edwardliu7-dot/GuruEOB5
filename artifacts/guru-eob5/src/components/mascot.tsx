/**
 * Kuku — maskot guru GuruEOB5.
 * Muncul di posisi & animasi random; lebih agresif saat momen mendesak:
 *   jadwal mengajar sudah selesai tapi absensi/jurnal masih kosong.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import {
  useListJadwal,
  useListAttendance,
  useListJournalEntries,
} from "@workspace/api-client-react";
import { useAuth } from "@/lib/auth";

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Today's date in Jakarta timezone (YYYY-MM-DD) */
function jakartaToday(): string {
  return new Date(Date.now() + 7 * 3600_000).toISOString().slice(0, 10);
}

/** Current time in Jakarta as "HH:MM" */
function jakartaNow(): string {
  const d = new Date(Date.now() + 7 * 3600_000);
  return d.toISOString().slice(11, 16); // "HH:MM"
}

/** Indonesian day name for today (Jakarta time) */
function jakartaDayName(): string {
  const days = ["Ahad", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
  const d = new Date(Date.now() + 7 * 3600_000);
  return days[d.getUTCDay()];
}

const normKelas = (k: string) => k.trim().toLowerCase();

// ── Urgency detection ─────────────────────────────────────────────────────────

interface UrgentSlot {
  subjectName: string;
  kelas: string;
  missingAbsensi: boolean;
  missingJurnal: boolean;
}

function detectUrgentSlots(
  jadwal: any[],
  attendance: any[],
  journals: any[],
): UrgentSlot[] {
  const today = jakartaToday();
  const now = jakartaNow();
  const todayDay = jakartaDayName();

  const urgent: UrgentSlot[] = [];

  for (const slot of jadwal) {
    // Only today's slots that have already ended
    if (slot.hari !== todayDay) continue;
    if (slot.jamSelesai > now) continue; // not yet finished

    // Check absensi: any attendance record for this subject today
    const hasAbsensi = attendance.some(
      (a) => a.subjectId === slot.subjectId && a.tanggal?.slice(0, 10) === today,
    );

    // Check jurnal: any journal entry for this subject+kelas today
    const hasJurnal = journals.some(
      (j) =>
        j.subjectId === slot.subjectId &&
        normKelas(j.kelas) === normKelas(slot.kelas) &&
        j.tanggal?.slice(0, 10) === today,
    );

    if (!hasAbsensi || !hasJurnal) {
      urgent.push({
        subjectName: slot.subjectName,
        kelas: slot.kelas,
        missingAbsensi: !hasAbsensi,
        missingJurnal: !hasJurnal,
      });
    }
  }

  return urgent;
}

// ── Reminder messages ─────────────────────────────────────────────────────────

function buildMessages(
  urgentSlots: UrgentSlot[],
  userName: string,
): string[] {
  const name = userName.split(" ")[0];
  const msgs: string[] = [];

  for (const s of urgentSlots) {
    const both = s.missingAbsensi && s.missingJurnal;
    const kelasStr = `${s.subjectName} - ${s.kelas}`;
    if (both) {
      msgs.push(`${kelasStr} sudah selesai tapi absensi & jurnal belum diisi, ${name}! Yuk cepat!`);
      msgs.push(`Hei ${name}! ${kelasStr} tadi belum ada absensi dan jurnal nih. Jangan sampai ketinggalan!`);
    } else if (s.missingAbsensi) {
      msgs.push(`Absensi ${kelasStr} belum diisi nih, ${name}! Segera rekap kehadiran siswa ya.`);
    } else {
      msgs.push(`Jurnal mengajar ${kelasStr} belum dicatat, ${name}. Isi sekarang sebelum lupa!`);
    }
  }

  // Fallback general reminders (non-urgent mode)
  msgs.push(
    `Hei ${name}! Sudah cek Info Pekanan hari ini? Pantau progres mengajar pekan ini!`,
    `Semangat terus, ${name}! Jurnal yang rutin bikin laporan akhir semester jadi gampang.`,
    `${name}, jangan lupa isi absensi kalau ada kelas tadi ya!`,
    `Cek Prosem-mu, ${name} — pastikan materi pekan ini sudah terencana dengan baik!`,
    `Guru kece selalu tepat waktu isi administrasi. Kamu pasti bisa, ${name}!`,
  );

  return msgs;
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

// ── Random position: kanan layar, hindari sidebar ─────────────────────────────

function randomPos() {
  return {
    x: 58 + Math.random() * 32, // 58–90% dari kiri
    y: 12 + Math.random() * 60, // 12–72% dari atas
  };
}

// ── Animation presets ─────────────────────────────────────────────────────────

const ANIMS = [
  { animate: { y: [0, -16, 0] },          transition: { duration: 2.2, repeat: Infinity, ease: "easeInOut" } },
  { animate: { y: [0, -22, -6, -14, 0] }, transition: { duration: 0.9, repeat: Infinity, ease: "easeOut", repeatType: "loop" as const } },
  { animate: { rotate: [-5, 5, -5] },      transition: { duration: 1.5, repeat: Infinity, ease: "easeInOut" } },
  { animate: { scale: [1, 1.07, 1] },      transition: { duration: 1.8, repeat: Infinity, ease: "easeInOut" } },
  {
    animate: { x: [0, -7, 7, -4, 4, 0], y: [0, -5, 0] },
    transition: { duration: 0.85, repeat: Infinity, ease: "easeInOut", repeatDelay: 1.2 },
  },
] as const;

// ── Kuku SVG (Pak Semangat) ───────────────────────────────────────────────────

function KukuSvg() {
  return (
    <svg
      viewBox="0 0 200 300"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="w-full h-full drop-shadow-xl overflow-visible"
    >
      <defs>
        <linearGradient id="kuku-hoodie" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#ff9900" />
          <stop offset="100%" stopColor="#e66a00" />
        </linearGradient>
      </defs>
      {/* Back arm */}
      <path d="M45,170 Q20,200 35,240 Q50,240 65,210 Z" stroke="#1e293b" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" fill="#e66a00" />
      <circle cx="38" cy="245" r="16" stroke="#1e293b" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" fill="#fcd9ba" />
      <path d="M25,245 Q38,255 48,245" fill="none" stroke="#1e293b" strokeWidth="4" strokeLinecap="round" />
      {/* Body */}
      <path d="M75,150 Q100,170 125,150 L120,260 Q100,275 80,260 Z" stroke="#1e293b" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" fill="white" />
      <path d="M60,140 Q100,220 140,140 L150,250 Q100,270 50,250 Z" stroke="#1e293b" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" fill="url(#kuku-hoodie)" />
      <path d="M60,140 Q80,190 85,255 M140,140 Q120,190 115,255" fill="none" stroke="#1e293b" strokeWidth="4" strokeLinecap="round" />
      <path d="M75,220 Q100,210 125,220" fill="none" stroke="#1e293b" strokeWidth="4" strokeLinecap="round" />
      <path d="M85,155 Q80,175 88,195" fill="none" stroke="#1e293b" strokeWidth="4.5" strokeLinecap="round" />
      <path d="M115,155 Q120,175 112,195" fill="none" stroke="#1e293b" strokeWidth="4.5" strokeLinecap="round" />
      <circle cx="88" cy="195" r="4" fill="#1e293b" />
      <circle cx="112" cy="195" r="4" fill="#1e293b" />
      {/* Raised right arm */}
      <path d="M135,150 Q170,120 165,70 L135,80 Q140,130 125,155 Z" stroke="#1e293b" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" fill="url(#kuku-hoodie)" />
      <path d="M135,80 Q150,75 165,70 L162,60 Q145,65 132,70 Z" stroke="#1e293b" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" fill="#cc5e00" />
      {/* Fist */}
      <circle cx="160" cy="55" r="20" stroke="#1e293b" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" fill="#fcd9ba" />
      <path d="M145,45 Q160,40 175,45" fill="none" stroke="#1e293b" strokeWidth="4" strokeLinecap="round" />
      <path d="M142,55 Q160,50 177,55" fill="none" stroke="#1e293b" strokeWidth="4" strokeLinecap="round" />
      <path d="M145,65 Q160,60 175,65" fill="none" stroke="#1e293b" strokeWidth="4" strokeLinecap="round" />
      <path d="M152,38 Q140,55 152,72" fill="none" stroke="#1e293b" strokeWidth="5" strokeLinecap="round" />
      {/* Neck */}
      <path d="M85,140 L85,155 L115,155 L115,140 Z" stroke="#1e293b" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" fill="#e5c0a1" />
      {/* Head */}
      <path d="M60,95 C45,55 155,55 140,95 C145,135 115,150 100,150 C85,150 55,135 60,95 Z" stroke="#1e293b" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" fill="#fcd9ba" />
      {/* Ears */}
      <path d="M57,95 C40,90 40,115 52,115 C54,115 56,113 58,110" stroke="#1e293b" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" fill="#fcd9ba" />
      <path d="M143,95 C160,90 160,115 148,115 C146,115 144,113 142,110" stroke="#1e293b" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" fill="#fcd9ba" />
      {/* Hair */}
      <path d="M53,88 Q35,55 68,45 Q65,15 90,30 Q105,5 120,25 Q145,10 138,40 Q165,55 147,88 Q135,65 100,60 Q65,65 53,88 Z" stroke="#1e293b" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" fill="#3a2214" />
      <path d="M85,32 L88,5 L102,28 Z" stroke="#1e293b" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" fill="#3a2214" />
      <path d="M65,48 L48,22 L75,40 Z" stroke="#1e293b" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" fill="#3a2214" />
      <path d="M115,28 L138,5 L128,38 Z" stroke="#1e293b" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" fill="#3a2214" />
      <path d="M135,42 L165,30 L145,55 Z" stroke="#1e293b" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" fill="#3a2214" />
      {/* Eyes */}
      <ellipse cx="78" cy="88" rx="14" ry="16" stroke="#1e293b" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" fill="white" />
      <ellipse cx="122" cy="88" rx="14" ry="16" stroke="#1e293b" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" fill="white" />
      <circle cx="82" cy="88" r="7" fill="#1e293b" />
      <circle cx="118" cy="88" r="7" fill="#1e293b" />
      <circle cx="84" cy="85" r="2.5" fill="white" />
      <circle cx="116" cy="85" r="2.5" fill="white" />
      {/* Eyebrows */}
      <path d="M62,68 Q75,55 88,65" fill="none" stroke="#1e293b" strokeWidth="5.5" strokeLinecap="round" />
      <path d="M112,65 Q125,55 138,68" fill="none" stroke="#1e293b" strokeWidth="5.5" strokeLinecap="round" />
      {/* Nose */}
      <path d="M96,98 Q100,108 106,102" fill="none" stroke="#1e293b" strokeWidth="4.5" strokeLinecap="round" />
      {/* Mouth */}
      <path d="M70,112 Q100,155 130,112 Q100,120 70,112 Z" stroke="#1e293b" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" fill="#7f1d1d" />
      <path d="M72,114 Q100,128 128,114 Q100,122 72,114 Z" stroke="#1e293b" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" fill="white" />
      <path d="M85,128 Q100,145 115,128 Q100,132 85,128 Z" stroke="#1e293b" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" fill="#fca5a5" />
      {/* Action lines */}
      <path d="M150,20 L160,10" fill="none" stroke="#1e293b" strokeWidth="4" strokeLinecap="round" />
      <path d="M175,25 L190,15" fill="none" stroke="#1e293b" strokeWidth="4" strokeLinecap="round" />
      <path d="M185,55 L200,55" fill="none" stroke="#1e293b" strokeWidth="4" strokeLinecap="round" />
    </svg>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export function Mascot() {
  const { user } = useAuth();
  const today = jakartaToday();
  const todayDay = jakartaDayName();

  // Fetch schedule, attendance (today), and journal entries
  const { data: jadwal = [] } = useListJadwal(undefined, {
    query: { queryKey: ["/api/jadwal", "mascot"], staleTime: 5 * 60_000 },
  });

  const { data: attendance = [] } = useListAttendance(
    { date: today },
    {
      query: {
        queryKey: ["/api/attendance", today],
        staleTime: 60_000,
        refetchInterval: 2 * 60_000,
      },
    },
  );

  const { data: journals = [] } = useListJournalEntries(undefined, {
    query: {
      queryKey: ["/api/journal-entries", "mascot"],
      staleTime: 60_000,
      refetchInterval: 2 * 60_000,
    },
  });

  const [visible, setVisible] = useState(false);
  const [pos, setPos] = useState({ x: 78, y: 40 });
  const [animIdx, setAnimIdx] = useState(0);
  const [message, setMessage] = useState("");
  const [isUrgent, setIsUrgent] = useState(false);

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const autoDismissRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimers = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (autoDismissRef.current) clearTimeout(autoDismissRef.current);
  };

  const showKuku = useCallback(
    (urgent: boolean, urgentSlots: UrgentSlot[]) => {
      const name = user?.name ?? "Guru";
      const msgs = buildMessages(urgentSlots, name);
      // Urgent messages are at the top of the array; pick from relevant ones
      const pool = urgent && urgentSlots.length > 0
        ? msgs.slice(0, urgentSlots.length * 2)  // pick from urgent-specific
        : msgs.slice(urgentSlots.length * 2);     // pick from general

      setMessage(pick(pool.length ? pool : msgs));
      setPos(randomPos());
      setAnimIdx(Math.floor(Math.random() * ANIMS.length));
      setIsUrgent(urgent);
      setVisible(true);

      // Auto-dismiss: 20s urgent, 12s normal
      autoDismissRef.current = setTimeout(() => setVisible(false), urgent ? 20_000 : 12_000);
    },
    [user],
  );

  const dismiss = useCallback(() => {
    clearTimers();
    setVisible(false);
  }, []);

  // Schedule next appearance after hide
  useEffect(() => {
    if (visible) return;

    const urgentSlots = detectUrgentSlots(
      jadwal as any[],
      attendance as any[],
      journals as any[],
    );
    const urgent = urgentSlots.length > 0;

    // Interval: 2–3 min urgent, 4–8 min normal
    const delayMs = urgent
      ? (2 + Math.random()) * 60_000
      : (4 + Math.random() * 4) * 60_000;

    timerRef.current = setTimeout(() => showKuku(urgent, urgentSlots), delayMs);
    return clearTimers;
  }, [visible, jadwal, attendance, journals, showKuku]);

  // First appearance: 6s after mount
  useEffect(() => {
    const t = setTimeout(() => {
      const urgentSlots = detectUrgentSlots(
        jadwal as any[],
        attendance as any[],
        journals as any[],
      );
      showKuku(urgentSlots.length > 0, urgentSlots);
    }, 6_000);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const anim = ANIMS[animIdx];

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="kuku"
          className="fixed z-[9999] flex flex-col items-center select-none pointer-events-auto"
          style={{ left: `${pos.x}%`, top: `${pos.y}%`, transform: "translate(-50%,-50%)" }}
          initial={{ opacity: 0, scale: 0.3, y: 24 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.25, y: 16 }}
          transition={{ type: "spring", stiffness: 340, damping: 22 }}
        >
          {/* Speech bubble */}
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.88 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ delay: 0.2, duration: 0.28 }}
            className={`relative mb-3 max-w-[220px] rounded-2xl px-3 py-2.5 text-xs font-medium leading-snug shadow-xl ring-2 ${
              isUrgent
                ? "bg-orange-50 ring-orange-400 text-orange-900"
                : "bg-white ring-slate-200 text-slate-800"
            }`}
          >
            {/* Kuku label */}
            <span className={`block mb-1 text-[10px] font-bold uppercase tracking-wide ${isUrgent ? "text-orange-500" : "text-slate-400"}`}>
              Kuku {isUrgent && "⚡"}
            </span>

            {message}

            {/* Bubble tail */}
            <span
              className={`absolute -bottom-2.5 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[8px] border-r-[8px] border-t-[10px] border-l-transparent border-r-transparent ${
                isUrgent ? "border-t-orange-400" : "border-t-slate-200"
              }`}
            />
            <span
              className={`absolute -bottom-[7px] left-1/2 -translate-x-1/2 w-0 h-0 border-l-[6px] border-r-[6px] border-t-[8px] border-l-transparent border-r-transparent ${
                isUrgent ? "border-t-orange-50" : "border-t-white"
              }`}
            />

            {/* Dismiss X */}
            <button
              onClick={dismiss}
              className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 transition-colors shadow"
            >
              <X className="h-2.5 w-2.5" />
            </button>
          </motion.div>

          {/* Kuku character */}
          <motion.div
            className="w-24 h-36 cursor-pointer"
            animate={anim.animate as any}
            transition={anim.transition as any}
            onClick={dismiss}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.88 }}
          >
            <KukuSvg />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
