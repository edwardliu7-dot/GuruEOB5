import { useState } from "react";
import { Layout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { CheckCheck, Trash2, Bug, Lightbulb, ThumbsDown, Inbox, RefreshCw, ExternalLink, ImageIcon } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

type Feedback = {
  id: string;
  teacherId: string;
  teacherName: string;
  kategori: "saran" | "kritik" | "bug";
  pesan: string;
  screenshotBase64: string | null;
  pageUrl: string | null;
  isRead: boolean;
  createdAt: string;
};

const KATEGORI_CONFIG = {
  saran: { label: "Saran", icon: Lightbulb, badge: "bg-amber-100 text-amber-700 border-amber-200" },
  kritik: { label: "Kritik", icon: ThumbsDown, badge: "bg-rose-100 text-rose-700 border-rose-200" },
  bug: { label: "Laporan Bug", icon: Bug, badge: "bg-purple-100 text-purple-700 border-purple-200" },
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

async function fetchFeedback(): Promise<Feedback[]> {
  const res = await fetch("/api/feedback", { credentials: "include" });
  if (!res.ok) throw new Error("Gagal memuat feedback");
  return res.json();
}

async function markRead(id: string) {
  const res = await fetch(`/api/feedback/${id}/read`, { method: "PATCH", credentials: "include" });
  if (!res.ok) throw new Error("Gagal menandai");
}

async function deleteFeedback(id: string) {
  const res = await fetch(`/api/feedback/${id}`, { method: "DELETE", credentials: "include" });
  if (!res.ok) throw new Error("Gagal menghapus");
}

export default function FeedbackAdmin() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [filter, setFilter] = useState<"all" | "unread" | "saran" | "kritik" | "bug">("all");

  const { data, isLoading, isError, refetch } = useQuery<Feedback[]>({
    queryKey: ["/api/feedback"],
    queryFn: fetchFeedback,
  });

  const readMut = useMutation({
    mutationFn: markRead,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["/api/feedback"] }),
    onError: () => toast({ variant: "destructive", title: "Gagal menandai sudah dibaca" }),
  });

  const deleteMut = useMutation({
    mutationFn: deleteFeedback,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/feedback"] });
      toast({ title: "Feedback dihapus" });
    },
    onError: () => toast({ variant: "destructive", title: "Gagal menghapus" }),
  });

  const handleMarkAllRead = async () => {
    const unread = (data ?? []).filter((f) => !f.isRead);
    await Promise.all(unread.map((f) => readMut.mutateAsync(f.id)));
    toast({ title: `${unread.length} pesan ditandai sudah dibaca` });
  };

  const filtered = (data ?? []).filter((f) => {
    if (filter === "all") return true;
    if (filter === "unread") return !f.isRead;
    return f.kategori === filter;
  });

  const unreadCount = (data ?? []).filter((f) => !f.isRead).length;

  return (
    <Layout>
      <div className="space-y-6 animate-in fade-in duration-500">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold font-serif">Kotak Masuk Feedback</h1>
            <p className="text-muted-foreground mt-1">
              Saran, kritik, dan laporan bug dari para guru.
            </p>
          </div>
          <div className="flex gap-2">
            {unreadCount > 0 && (
              <Button variant="outline" size="sm" onClick={handleMarkAllRead}>
                <CheckCheck className="w-4 h-4 mr-2" />
                Tandai semua dibaca
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>

        {/* Filter tabs */}
        <div className="flex flex-wrap gap-2">
          {[
            { key: "all", label: "Semua" },
            { key: "unread", label: `Belum dibaca${unreadCount ? ` (${unreadCount})` : ""}` },
            { key: "saran", label: "Saran" },
            { key: "kritik", label: "Kritik" },
            { key: "bug", label: "Laporan Bug" },
          ].map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setFilter(tab.key as typeof filter)}
              className={cn(
                "px-3 py-1.5 rounded-full text-sm font-medium border transition-colors",
                filter === tab.key
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-card text-muted-foreground border-border hover:border-primary/40",
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
          {isLoading ? (
            <div className="p-6 space-y-3">
              {Array(4).fill(0).map((_, i) => <Skeleton key={i} className="h-20 w-full" />)}
            </div>
          ) : isError ? (
            <div className="p-10 text-center text-muted-foreground">
              Gagal memuat data. <button className="underline" onClick={() => refetch()}>Coba lagi</button>
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-16 text-center text-muted-foreground">
              <Inbox className="w-10 h-10 opacity-30" />
              <p>
                {filter === "unread"
                  ? "Tidak ada pesan yang belum dibaca."
                  : "Belum ada feedback yang masuk."}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {filtered.map((item) => {
                const cfg = KATEGORI_CONFIG[item.kategori];
                const Icon = cfg.icon;
                return (
                  <div
                    key={item.id}
                    className={cn(
                      "p-4 sm:p-5 flex gap-4 transition-colors",
                      !item.isRead ? "bg-blue-50/40" : "bg-card",
                    )}
                  >
                    {/* Icon */}
                    <div className={cn("mt-0.5 p-2 rounded-xl border shrink-0 h-fit", cfg.badge)}>
                      <Icon className="w-4 h-4" />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0 space-y-1.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-semibold text-sm text-foreground">{item.teacherName}</span>
                        <span className={cn("text-xs font-medium px-2 py-0.5 rounded-full border", cfg.badge)}>
                          {cfg.label}
                        </span>
                        {!item.isRead && (
                          <Badge className="text-xs bg-blue-500 hover:bg-blue-500 border-0">Baru</Badge>
                        )}
                        <span className="text-xs text-muted-foreground ml-auto">{formatDate(item.createdAt)}</span>
                      </div>
                      {item.pageUrl && (
                        <a
                          href={item.pageUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                        >
                          <ExternalLink className="w-3 h-3" />
                          {item.pageUrl.replace(/^https?:\/\/[^/]+/, "")}
                        </a>
                      )}
                      <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">{item.pesan}</p>
                      {item.screenshotBase64 && (
                        <details className="mt-2">
                          <summary className="cursor-pointer text-xs text-muted-foreground flex items-center gap-1 select-none">
                            <ImageIcon className="w-3 h-3" />
                            Lihat screenshot
                          </summary>
                          <img
                            src={item.screenshotBase64}
                            alt="Screenshot"
                            className="mt-2 rounded-lg border border-border max-w-full max-h-96 object-contain"
                          />
                        </details>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col gap-1 shrink-0">
                      {!item.isRead && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="w-8 h-8 text-blue-500 hover:text-blue-700"
                          title="Tandai sudah dibaca"
                          onClick={() => readMut.mutate(item.id)}
                          disabled={readMut.isPending}
                        >
                          <CheckCheck className="w-4 h-4" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="w-8 h-8 text-destructive hover:text-destructive"
                        title="Hapus"
                        onClick={() => {
                          if (confirm("Hapus feedback ini?")) deleteMut.mutate(item.id);
                        }}
                        disabled={deleteMut.isPending}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
