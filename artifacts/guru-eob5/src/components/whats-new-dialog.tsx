import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sparkles, Wrench, TrendingUp, ShieldCheck, Gift } from "lucide-react";
import {
  RELEASES,
  APP_VERSION,
  STORAGE_KEY,
  hasUnseenUpdate,
  markAsSeen,
  type ReleaseTag,
} from "@/lib/changelog";

// ── Tag chip ────────────────────────────────────────────────────────────────

const TAG_META: Record<
  ReleaseTag,
  { label: string; icon: typeof Sparkles; cls: string }
> = {
  Baru: {
    label: "Baru",
    icon: Sparkles,
    cls: "bg-blue-50 text-blue-600 border-blue-100",
  },
  Perbaikan: {
    label: "Perbaikan",
    icon: Wrench,
    cls: "bg-amber-50 text-amber-600 border-amber-100",
  },
  Peningkatan: {
    label: "Peningkatan",
    icon: TrendingUp,
    cls: "bg-emerald-50 text-emerald-600 border-emerald-100",
  },
  Keamanan: {
    label: "Keamanan",
    icon: ShieldCheck,
    cls: "bg-red-50 text-red-600 border-red-100",
  },
};

function TagChip({ tag }: { tag: ReleaseTag }) {
  const m = TAG_META[tag];
  const Icon = m.icon;
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${m.cls}`}
    >
      <Icon className="h-3 w-3" />
      {m.label}
    </span>
  );
}

// ── Dialog ──────────────────────────────────────────────────────────────────

export function WhatsNewDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  function handleClose() {
    markAsSeen();
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) handleClose(); else onOpenChange(true); }}>
      <DialogContent className="max-w-lg p-0 gap-0 overflow-hidden rounded-2xl">
        {/* Header */}
        <div className="relative overflow-hidden bg-gradient-to-br from-primary/90 to-blue-600 px-6 pt-7 pb-6 text-white">
          <div className="absolute -right-6 -top-6 h-32 w-32 rounded-full bg-white/10" />
          <div className="absolute -right-2 top-8 h-16 w-16 rounded-full bg-white/10" />
          <DialogHeader className="relative">
            <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-xl bg-white/20">
              <Gift className="h-5 w-5 text-white" />
            </div>
            <DialogTitle className="text-xl font-bold text-white">
              Yang Baru di GuruEOB5
            </DialogTitle>
            <p className="mt-1 text-sm text-white/75">
              Versi {APP_VERSION.replace(/(\d{4})(\d{2})(\d{2})/, "$3/$2/$1")}
            </p>
          </DialogHeader>
        </div>

        {/* Release list */}
        <ScrollArea className="max-h-[55vh]">
          <div className="divide-y divide-border">
            {RELEASES.map((release, ri) => (
              <div key={release.id} className="px-6 py-5">
                {/* Release header */}
                <div className="mb-3 flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-foreground">{release.title}</div>
                    <div className="text-xs text-muted-foreground">{release.date}</div>
                  </div>
                  {ri === 0 && (
                    <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-[11px] font-bold text-primary">
                      Terbaru
                    </span>
                  )}
                </div>

                {/* Items */}
                <ul className="space-y-2.5">
                  {release.items.map((item, ii) => (
                    <li key={ii} className="flex items-start gap-3">
                      <TagChip tag={item.tag} />
                      <span className="flex-1 text-sm leading-relaxed text-foreground/80">
                        {item.text}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </ScrollArea>

        {/* Footer */}
        <div className="border-t border-border px-6 py-4">
          <Button className="w-full" onClick={handleClose}>
            Mengerti, terima kasih!
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ── Auto-show hook ───────────────────────────────────────────────────────────

export function useWhatsNew() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    // Small delay so the page has time to render first
    const t = setTimeout(() => {
      if (hasUnseenUpdate()) setOpen(true);
    }, 800);
    return () => clearTimeout(t);
  }, []);

  return { open, setOpen };
}
