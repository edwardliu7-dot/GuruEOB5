import { useRef, useState } from "react";
import {
  MessageSquarePlus,
  X,
  Send,
  CheckCircle2,
  Bug,
  Lightbulb,
  ThumbsDown,
  Camera,
  Loader2,
  ImageOff,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import html2canvas from "html2canvas";

type Kategori = "saran" | "kritik" | "bug";

const KATEGORI_OPTIONS: {
  value: Kategori;
  label: string;
  icon: React.ElementType;
  color: string;
  bg: string;
}[] = [
  {
    value: "saran",
    label: "Saran",
    icon: Lightbulb,
    color: "text-amber-600",
    bg: "bg-amber-50 border-amber-200 hover:bg-amber-100",
  },
  {
    value: "kritik",
    label: "Kritik",
    icon: ThumbsDown,
    color: "text-rose-600",
    bg: "bg-rose-50 border-rose-200 hover:bg-rose-100",
  },
  {
    value: "bug",
    label: "Laporan Bug",
    icon: Bug,
    color: "text-purple-600",
    bg: "bg-purple-50 border-purple-200 hover:bg-purple-100",
  },
];

export function FeedbackWidget() {
  const [open, setOpen] = useState(false);
  const [kategori, setKategori] = useState<Kategori | null>(null);
  const [pesan, setPesan] = useState("");
  const [screenshot, setScreenshot] = useState<string | null>(null);
  const [capturingScreen, setCapturingScreen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const { toast } = useToast();
  const panelRef = useRef<HTMLDivElement>(null);

  const resetForm = () => {
    setKategori(null);
    setPesan("");
    setScreenshot(null);
  };

  const handleOpen = () => {
    setOpen(true);
    setSent(false);
    resetForm();
  };

  const handleClose = () => {
    setOpen(false);
  };

  const captureScreenshot = async () => {
    setCapturingScreen(true);
    // Temporarily hide the feedback panel so it doesn't appear in the screenshot
    if (panelRef.current) panelRef.current.style.visibility = "hidden";
    try {
      const canvas = await html2canvas(document.body, {
        scale: 0.6,          // 60% scale → keeps file small
        useCORS: true,
        logging: false,
        ignoreElements: (el) => el.classList.contains("feedback-ignore"),
      });
      // Convert to JPEG at 70% quality to keep size manageable
      const dataUrl = canvas.toDataURL("image/jpeg", 0.7);
      setScreenshot(dataUrl);
    } catch (err) {
      toast({ variant: "destructive", title: "Gagal mengambil screenshot" });
    } finally {
      if (panelRef.current) panelRef.current.style.visibility = "";
      setCapturingScreen(false);
    }
  };

  const handleSubmit = async () => {
    if (!kategori) {
      toast({ variant: "destructive", title: "Pilih kategori terlebih dahulu." });
      return;
    }
    if (!pesan.trim()) {
      toast({ variant: "destructive", title: "Pesan tidak boleh kosong." });
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kategori,
          pesan: pesan.trim(),
          screenshotBase64: screenshot ?? undefined,
          pageUrl: window.location.href,
        }),
        credentials: "include",
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Gagal mengirim feedback");
      }
      setSent(true);
    } catch (err: any) {
      toast({ variant: "destructive", title: "Gagal mengirim", description: err.message });
    } finally {
      setLoading(false);
    }
  };

  const selectedOption = KATEGORI_OPTIONS.find((o) => o.value === kategori);

  return (
    <>
      {/* Floating trigger — mark with feedback-ignore so html2canvas skips it */}
      <button
        type="button"
        onClick={open ? handleClose : handleOpen}
        className={cn(
          "feedback-ignore fixed bottom-5 right-5 z-50 flex items-center gap-2 rounded-full shadow-lg transition-all duration-200",
          "bg-primary text-primary-foreground hover:bg-primary/90 active:scale-95",
          "px-4 py-2.5",
        )}
        aria-label="Kirim saran / laporan"
      >
        {open ? (
          <>
            <X className="w-4 h-4 shrink-0" />
            <span className="text-sm font-medium">Tutup</span>
          </>
        ) : (
          <>
            <MessageSquarePlus className="w-4 h-4 shrink-0" />
            <span className="text-sm font-medium">Saran & Laporan</span>
          </>
        )}
      </button>

      {/* Panel — also excluded from its own screenshot */}
      {open && (
        <div
          ref={panelRef}
          className={cn(
            "feedback-ignore fixed bottom-16 right-5 z-50 w-[340px] max-w-[calc(100vw-2.5rem)]",
            "bg-white rounded-2xl shadow-2xl border border-border",
            "animate-in fade-in slide-in-from-bottom-4 duration-200",
          )}
        >
          {sent ? (
            /* Success state */
            <div className="flex flex-col items-center gap-3 p-8 text-center">
              <CheckCircle2 className="w-12 h-12 text-green-500" />
              <p className="font-semibold text-foreground">Terima kasih!</p>
              <p className="text-sm text-muted-foreground">
                Pesan Anda telah diterima oleh admin. Kami akan segera meninjau dan merespons.
              </p>
              <Button
                variant="outline"
                size="sm"
                className="mt-1"
                onClick={() => {
                  setSent(false);
                  resetForm();
                }}
              >
                Kirim lagi
              </Button>
            </div>
          ) : (
            /* Form */
            <div className="p-4 space-y-4">
              <div>
                <p className="font-semibold text-sm text-foreground">Kirim Pesan ke Admin</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Sampaikan saran, kritik, atau laporkan bug.
                </p>
              </div>

              {/* Kategori */}
              <div className="grid grid-cols-3 gap-2">
                {KATEGORI_OPTIONS.map((opt) => {
                  const Icon = opt.icon;
                  const selected = kategori === opt.value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setKategori(opt.value)}
                      className={cn(
                        "flex flex-col items-center gap-1 p-2.5 rounded-xl border text-xs font-medium transition-all",
                        opt.bg,
                        opt.color,
                        selected && "ring-2 ring-offset-1 ring-primary scale-[1.03]",
                      )}
                    >
                      <Icon className="w-4 h-4" />
                      {opt.label}
                    </button>
                  );
                })}
              </div>

              {/* Pesan */}
              <div>
                {selectedOption && (
                  <p className="text-xs text-muted-foreground mb-1.5">
                    {kategori === "saran" &&
                      "Tuliskan ide atau saran untuk meningkatkan aplikasi."}
                    {kategori === "kritik" &&
                      "Sampaikan kritik atau keluhan Anda secara konstruktif."}
                    {kategori === "bug" &&
                      "Jelaskan bug yang Anda temukan: halaman, langkah reproduksi, dan dampaknya."}
                  </p>
                )}
                <Textarea
                  placeholder={
                    !kategori
                      ? "Pilih kategori dulu, lalu tulis pesan..."
                      : "Tulis pesan Anda di sini..."
                  }
                  value={pesan}
                  onChange={(e) => setPesan(e.target.value)}
                  disabled={!kategori}
                  rows={4}
                  maxLength={2000}
                  className="resize-none text-sm"
                />
                <p className="text-right text-xs text-muted-foreground mt-1">
                  {pesan.length}/2000
                </p>
              </div>

              {/* Screenshot section */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-medium text-foreground">
                    Screenshot halaman{" "}
                    <span className="text-muted-foreground font-normal">(opsional)</span>
                  </p>
                  {screenshot ? (
                    <button
                      type="button"
                      onClick={() => setScreenshot(null)}
                      className="text-xs text-destructive hover:underline flex items-center gap-1"
                    >
                      <ImageOff className="w-3 h-3" />
                      Hapus
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={captureScreenshot}
                      disabled={capturingScreen}
                      className={cn(
                        "flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-lg border transition-colors",
                        "bg-muted/60 border-border text-foreground hover:bg-muted active:scale-95",
                        capturingScreen && "opacity-60 cursor-not-allowed",
                      )}
                    >
                      {capturingScreen ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        <Camera className="w-3 h-3" />
                      )}
                      {capturingScreen ? "Mengambil..." : "Ambil screenshot"}
                    </button>
                  )}
                </div>

                {screenshot && (
                  <div className="rounded-lg overflow-hidden border border-border">
                    <img
                      src={screenshot}
                      alt="Screenshot halaman"
                      className="w-full object-cover max-h-32"
                    />
                  </div>
                )}
              </div>

              <Button
                className="w-full"
                onClick={handleSubmit}
                disabled={loading || !kategori || !pesan.trim()}
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <span className="animate-spin border-2 border-primary-foreground/40 border-t-primary-foreground rounded-full w-3.5 h-3.5" />
                    Mengirim...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <Send className="w-3.5 h-3.5" />
                    Kirim Pesan
                  </span>
                )}
              </Button>
            </div>
          )}
        </div>
      )}
    </>
  );
}
