/**
 * SebetanDialog — wajib diisi sebelum menggunakan aplikasi.
 * Tidak bisa ditutup sampai user memilih sebutan.
 */
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";
import { getGetMeQueryKey } from "@workspace/api-client-react";
import type { Teacher } from "@workspace/api-client-react";
import { KukuSvg } from "@/components/mascot";
import logoUrl from "@/assets/logo.png";

const SEBUTAN_OPTIONS = [
  { value: "Pak",     label: "Pak",      desc: "Sapaan guru laki-laki" },
  { value: "Bu",      label: "Bu",       desc: "Sapaan guru perempuan (Ibu)" },
  { value: "Mr.",     label: "Mr.",      desc: "English — male" },
  { value: "Ms.",     label: "Ms.",      desc: "English — female" },
  { value: "Ust.",    label: "Ust.",     desc: "Ustaz — guru pria" },
  { value: "Ustazah", label: "Ustazah",  desc: "Ustazah — guru wanita" },
] as const;

export function SebetanDialog({ onDone }: { onDone: () => void }) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [selected, setSelected] = useState<string>("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave() {
    if (!selected || !user) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/teachers/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ sebutan: selected }),
      });
      if (!res.ok) throw new Error("Gagal menyimpan");
      // Optimistically update the cache so the new Layout instance that mounts
      // after navigation already sees the sebutan — avoids the dialog re-appearing.
      qc.setQueryData<Teacher>(getGetMeQueryKey(), (old) =>
        old ? { ...old, sebutan: selected } : old,
      );
      // Also kick off a background refetch so the cache is eventually consistent
      qc.invalidateQueries({ queryKey: getGetMeQueryKey() });
      onDone();
    } catch {
      setError("Terjadi kesalahan. Coba lagi.");
    } finally {
      setSaving(false);
    }
  }

  const firstName = (user?.name ?? "Guru").split(" ")[0];

  return (
    <Dialog open modal>
      <DialogContent
        // Prevent any dismissal — no close button, no outside click, no Escape
        className="max-w-md gap-0 p-0 overflow-visible rounded-2xl [&>button]:hidden"
        onInteractOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        {/* Header */}
        <div className="relative bg-gradient-to-br from-primary/90 to-blue-600 px-6 pt-6 pb-5 text-white rounded-t-2xl overflow-hidden">
          {/* Decorative circles */}
          <div className="absolute -right-6 -top-6 h-32 w-32 rounded-full bg-white/10 pointer-events-none" />
          <div className="absolute right-20 -bottom-8 h-20 w-20 rounded-full bg-white/10 pointer-events-none" />

          <img src={logoUrl} alt="GuruEOB5" className="relative h-8 mb-4 opacity-90" />
          <DialogTitle className="relative text-lg font-bold text-white leading-snug">
            Hai, {firstName}! 👋
          </DialogTitle>
          <DialogDescription className="relative mt-1 text-sm text-white/80 pr-28">
            Sebelum mulai, pilih sapaan yang ingin Kuku gunakan saat memanggil kamu.
          </DialogDescription>

          {/* Kuku character — peeking from the bottom-right of the header */}
          <div
            className="absolute bottom-0 right-4 translate-y-1/2 w-24 h-36 drop-shadow-xl pointer-events-none select-none z-10"
            aria-hidden
          >
            <KukuSvg />
          </div>
        </div>

        {/* Options grid */}
        <div className="px-6 pt-10 pb-5">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
            Pilih sapaan kamu
          </p>
          <div className="grid grid-cols-3 gap-2">
            {SEBUTAN_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setSelected(opt.value)}
                className={`flex flex-col items-center gap-1 rounded-xl border-2 px-3 py-3 text-center transition-all ${
                  selected === opt.value
                    ? "border-primary bg-primary/10 text-primary shadow-sm"
                    : "border-border bg-card text-foreground hover:border-primary/40 hover:bg-accent"
                }`}
              >
                <span className="text-xl font-bold">{opt.label}</span>
                <span className="text-[10px] text-muted-foreground leading-tight">{opt.desc}</span>
              </button>
            ))}
          </div>

          {error && (
            <p className="mt-3 text-xs text-destructive text-center">{error}</p>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 pb-6">
          <Button
            className="w-full"
            disabled={!selected || saving}
            onClick={handleSave}
          >
            {saving ? "Menyimpan…" : selected ? `Pakai "${selected}" — Lanjutkan` : "Pilih sapaan dulu"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
