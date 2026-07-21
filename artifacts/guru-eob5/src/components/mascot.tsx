/**
 * Mascot — a floating owl teacher that pops up at random positions
 * with random animations and reminds the teacher about pending tasks.
 */
import { useEffect, useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { useGetDashboardSummary } from "@workspace/api-client-react";
import { useAuth } from "@/lib/auth";

// ── SVG mascot: owl with graduation cap ──────────────────────────────────────

function OwlSvg({ mood }: { mood: "happy" | "worried" | "wink" }) {
  // Eye expressions
  const eyes =
    mood === "wink" ? (
      <>
        {/* left eye normal */}
        <ellipse cx="36" cy="44" rx="7" ry="7.5" fill="#1a1a2e" />
        <circle cx="38" cy="42" r="2" fill="white" />
        {/* right eye winking */}
        <path d="M53 44 Q57 40 61 44" stroke="#1a1a2e" strokeWidth="2.5" strokeLinecap="round" fill="none" />
      </>
    ) : mood === "worried" ? (
      <>
        <ellipse cx="36" cy="45" rx="7" ry="7.5" fill="#1a1a2e" />
        <circle cx="38" cy="43" r="2" fill="white" />
        <ellipse cx="57" cy="45" rx="7" ry="7.5" fill="#1a1a2e" />
        <circle cx="59" cy="43" r="2" fill="white" />
        {/* worried brows */}
        <path d="M30 37 Q36 34 42 37" stroke="#6b3a2a" strokeWidth="2" strokeLinecap="round" fill="none" />
        <path d="M50 37 Q57 34 63 37" stroke="#6b3a2a" strokeWidth="2" strokeLinecap="round" fill="none" />
      </>
    ) : (
      <>
        <ellipse cx="36" cy="44" rx="7" ry="7.5" fill="#1a1a2e" />
        <circle cx="38" cy="42" r="2" fill="white" />
        <ellipse cx="57" cy="44" rx="7" ry="7.5" fill="#1a1a2e" />
        <circle cx="59" cy="42" r="2" fill="white" />
      </>
    );

  const mouth =
    mood === "worried" ? (
      <path d="M41 58 Q47 55 53 58" stroke="#c0783c" strokeWidth="2" strokeLinecap="round" fill="none" />
    ) : (
      <path d="M41 57 Q47 61 53 57" stroke="#c0783c" strokeWidth="2" strokeLinecap="round" fill="none" />
    );

  return (
    <svg viewBox="0 0 96 110" xmlns="http://www.w3.org/2000/svg" className="w-full h-full drop-shadow-lg">
      {/* Graduation cap */}
      <rect x="20" y="8" width="56" height="8" rx="2" fill="#1e293b" />
      <polygon points="48,2 72,10 48,18 24,10" fill="#334155" />
      <line x1="72" y1="10" x2="78" y2="22" stroke="#334155" strokeWidth="2" />
      <circle cx="78" cy="24" r="3" fill="#f59e0b" />

      {/* Body */}
      <ellipse cx="48" cy="72" rx="30" ry="32" fill="#c2773a" />
      {/* Belly */}
      <ellipse cx="48" cy="76" rx="18" ry="22" fill="#f5d9b0" />

      {/* Wings */}
      <path d="M18 60 Q8 72 14 88 Q20 80 22 68Z" fill="#a0521e" />
      <path d="M78 60 Q88 72 82 88 Q76 80 74 68Z" fill="#a0521e" />

      {/* Head */}
      <circle cx="48" cy="42" r="28" fill="#c2773a" />

      {/* Ear tufts */}
      <polygon points="26,18 20,6 32,14" fill="#a0521e" />
      <polygon points="70,18 76,6 64,14" fill="#a0521e" />

      {/* Face disc */}
      <ellipse cx="48" cy="46" rx="22" ry="20" fill="#f5d9b0" />

      {/* Eyes */}
      <circle cx="36" cy="44" r="9" fill="white" />
      <circle cx="57" cy="44" r="9" fill="white" />
      {eyes}

      {/* Beak */}
      <polygon points="48,50 43,57 53,57" fill="#f59e0b" />
      {mouth}

      {/* Feet */}
      <ellipse cx="38" cy="103" rx="9" ry="4" fill="#f59e0b" />
      <ellipse cx="58" cy="103" rx="9" ry="4" fill="#f59e0b" />
      {/* Claws */}
      <line x1="32" y1="105" x2="29" y2="109" stroke="#e07b00" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="38" y1="106" x2="38" y2="110" stroke="#e07b00" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="44" y1="105" x2="47" y2="109" stroke="#e07b00" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="52" y1="105" x2="49" y2="109" stroke="#e07b00" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="58" y1="106" x2="58" y2="110" stroke="#e07b00" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="64" y1="105" x2="67" y2="109" stroke="#e07b00" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

// ── Animation variants ────────────────────────────────────────────────────────

const ANIM_PRESETS = [
  // float up-down
  {
    animate: { y: [0, -14, 0] },
    transition: { duration: 2.4, repeat: Infinity, ease: "easeInOut" },
  },
  // bounce
  {
    animate: { y: [0, -20, 0] },
    transition: { duration: 0.7, repeat: Infinity, ease: "easeOut", repeatType: "loop" as const },
  },
  // sway side-to-side
  {
    animate: { rotate: [-6, 6, -6] },
    transition: { duration: 1.6, repeat: Infinity, ease: "easeInOut" },
  },
  // pulse scale
  {
    animate: { scale: [1, 1.08, 1] },
    transition: { duration: 1.8, repeat: Infinity, ease: "easeInOut" },
  },
  // jiggle
  {
    animate: { x: [0, -6, 6, -4, 4, 0], y: [0, -4, 0] },
    transition: { duration: 0.9, repeat: Infinity, ease: "easeInOut", repeatDelay: 1.5 },
  },
] as const;

// ── Reminder messages ─────────────────────────────────────────────────────────

interface ReminderCtx {
  jurnalHariIniTerisi: boolean;
  kelengkapanAdministrasiPersen: number;
  userName: string;
}

function buildReminders(ctx: ReminderCtx): Array<{ text: string; mood: "happy" | "worried" | "wink" }> {
  const reminders: Array<{ text: string; mood: "happy" | "worried" | "wink" }> = [];
  const name = ctx.userName.split(" ")[0];

  if (!ctx.jurnalHariIniTerisi) {
    reminders.push(
      { text: `Hei ${name}! Jangan lupa isi jurnal mengajar hari ini ya! 📖`, mood: "worried" },
      { text: `Jurnal hari ini belum terisi, ${name}. Yuk segera catat kegiatan mengajar!`, mood: "worried" },
    );
  }

  if (ctx.kelengkapanAdministrasiPersen < 100) {
    const sisa = 100 - ctx.kelengkapanAdministrasiPersen;
    reminders.push(
      { text: `Administrasi masih kurang ${sisa}% nih. Lengkapi sekarang, yuk!`, mood: "worried" },
      { text: `Ada dokumen administrasi yang belum lengkap. Cek menu Administrasi, ${name}!`, mood: "worried" },
    );
  }

  if (ctx.kelengkapanAdministrasiPersen === 100 && ctx.jurnalHariIniTerisi) {
    reminders.push(
      { text: `Keren, ${name}! Semua sudah beres hari ini. Tetap semangat mengajar! 🎉`, mood: "happy" },
      { text: `Jurnal & administrasi sudah lengkap. Guru teladan! 🦉✨`, mood: "wink" },
    );
  }

  // General motivational fillers
  reminders.push(
    { text: `Sudah cek Info Pekanan belum, ${name}? Lihat progres mengajar minggu ini!`, mood: "happy" },
    { text: `Ingat ${name}, prosem yang rapi bikin mengajar makin terarah! 📅`, mood: "wink" },
    { text: `Jangan lupa isi absensi siswa ya! Kehadiran perlu dicatat setiap hari.`, mood: "worried" },
    { text: `Halo ${name}! Sudah catat nilai siswa terbaru? Cek menu Nilai!`, mood: "happy" },
    { text: `Semangat mengajar, ${name}! Guru hebat lahir dari kebiasaan kecil yang konsisten. 🦉`, mood: "happy" },
  );

  return reminders;
}

// ── Random helpers ────────────────────────────────────────────────────────────

function pick<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomPosition() {
  // Keep mascot in the right 45% of viewport, away from sidebar & edges
  const x = 55 + Math.random() * 35; // 55%–90% from left
  const y = 15 + Math.random() * 60; // 15%–75% from top
  return { x, y };
}

// Interval between appearances: 3–7 minutes
function randomInterval() {
  return (3 + Math.random() * 4) * 60 * 1000;
}

// ── Main component ────────────────────────────────────────────────────────────

export function Mascot() {
  const { user } = useAuth();
  const { data: dashboard } = useGetDashboardSummary({
    query: { queryKey: ["/api/dashboard"], staleTime: 2 * 60 * 1000 },
  });

  const [visible, setVisible] = useState(false);
  const [pos, setPos] = useState({ x: 75, y: 40 });
  const [anim, setAnim] = useState(0);
  const [reminder, setReminder] = useState<{ text: string; mood: "happy" | "worried" | "wink" }>({
    text: "Semangat mengajar! 🦉",
    mood: "happy",
  });

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const autoDismissRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showMascot = useCallback(() => {
    const reminders = buildReminders({
      jurnalHariIniTerisi: dashboard?.jurnalHariIniTerisi ?? true,
      kelengkapanAdministrasiPersen: dashboard?.kelengkapanAdministrasiPersen ?? 100,
      userName: user?.name ?? "Guru",
    });

    setReminder(pick(reminders));
    setPos(randomPosition());
    setAnim(Math.floor(Math.random() * ANIM_PRESETS.length));
    setVisible(true);

    // Auto-dismiss after 12 seconds
    autoDismissRef.current = setTimeout(() => {
      setVisible(false);
    }, 12_000);
  }, [dashboard, user]);

  const dismiss = useCallback(() => {
    if (autoDismissRef.current) clearTimeout(autoDismissRef.current);
    setVisible(false);
  }, []);

  // Schedule next appearance after mascot hides
  useEffect(() => {
    if (!visible) {
      timerRef.current = setTimeout(showMascot, randomInterval());
    }
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [visible, showMascot]);

  // First appearance: 8 seconds after mount
  useEffect(() => {
    const t = setTimeout(showMascot, 8_000);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const preset = ANIM_PRESETS[anim];

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="mascot"
          className="fixed z-[9999] flex flex-col items-center select-none pointer-events-auto"
          style={{ left: `${pos.x}%`, top: `${pos.y}%`, transform: "translate(-50%, -50%)" }}
          initial={{ opacity: 0, scale: 0.4, y: 30 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.3, y: 20 }}
          transition={{ type: "spring", stiffness: 320, damping: 22 }}
        >
          {/* Speech bubble */}
          <motion.div
            initial={{ opacity: 0, y: 6, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ delay: 0.25, duration: 0.3 }}
            className="relative mb-2 max-w-[200px] rounded-2xl bg-white px-3 py-2 text-xs font-medium leading-snug text-gray-800 shadow-xl ring-1 ring-black/5"
          >
            {reminder.text}
            {/* Bubble tail */}
            <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[7px] border-r-[7px] border-t-[8px] border-l-transparent border-r-transparent border-t-white" />

            {/* Dismiss button */}
            <button
              onClick={dismiss}
              className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-gray-200 text-gray-500 hover:bg-gray-300 transition-colors"
            >
              <X className="h-2.5 w-2.5" />
            </button>
          </motion.div>

          {/* Owl */}
          <motion.div
            className="w-20 h-24 cursor-pointer"
            animate={preset.animate as any}
            transition={preset.transition as any}
            onClick={dismiss}
            whileHover={{ scale: 1.12 }}
            whileTap={{ scale: 0.9 }}
          >
            <OwlSvg mood={reminder.mood} />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
