import { useState, useRef, useEffect, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Layout } from "@/components/layout";
import { Skeleton } from "@/components/ui/skeleton";
import { Inbox, Search, Send, MessageCircle, ArrowLeft, CheckCheck } from "lucide-react";

// ── Types ────────────────────────────────────────────────────────────────────

type Conversation = {
  studentId: string;
  namaLengkap: string;
  kelas: string;
  lastMessage: string;
  lastSenderRole: "guru" | "siswa";
  lastAt: string;
  unreadCount: number;
};

type Message = {
  id: number;
  senderId: string;
  senderRole: "guru" | "siswa";
  body: string;
  createdAt: string;
  isRead: boolean;
};

// ── Helpers ──────────────────────────────────────────────────────────────────

function initials(name: string) {
  return name.split(" ").map((p) => p[0]).filter(Boolean).slice(0, 2).join("").toUpperCase();
}

function avatarColor(name: string) {
  const PALETTES = [
    "bg-blue-100 text-blue-700",
    "bg-rose-100 text-rose-700",
    "bg-violet-100 text-violet-700",
    "bg-emerald-100 text-emerald-700",
    "bg-amber-100 text-amber-700",
    "bg-cyan-100 text-cyan-700",
    "bg-fuchsia-100 text-fuchsia-700",
    "bg-orange-100 text-orange-700",
    "bg-teal-100 text-teal-700",
    "bg-indigo-100 text-indigo-700",
  ];
  let h = 0;
  for (const c of name) h = (h * 31 + c.charCodeAt(0)) & 0xffff;
  return PALETTES[h % PALETTES.length];
}

function relativeTime(isoStr: string) {
  const d = new Date(isoStr);
  const diff = (Date.now() - d.getTime()) / 1000;
  if (diff < 60) return "Baru saja";
  if (diff < 3600) return `${Math.floor(diff / 60)} mnt lalu`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} jam lalu`;
  return d.toLocaleDateString("id-ID", { day: "numeric", month: "short" });
}

function formatTime(isoStr: string) {
  return new Date(isoStr).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
}

function formatDate(isoStr: string) {
  return new Date(isoStr).toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long" });
}

// ── Fetch functions ───────────────────────────────────────────────────────────

const apiFetch = (path: string, opts?: RequestInit) =>
  fetch(path, { credentials: "include", ...opts }).then((r) => {
    if (!r.ok) throw new Error("Gagal memuat data");
    return r.json();
  });

// ── Conversation list panel ───────────────────────────────────────────────────

function ConversationList({
  selected,
  onSelect,
}: {
  selected: string | null;
  onSelect: (id: string) => void;
}) {
  const [query, setQuery] = useState("");

  const { data: conversations = [], isLoading } = useQuery<Conversation[]>({
    queryKey: ["/api/inbox"],
    queryFn: () => apiFetch("/api/inbox"),
    refetchInterval: 30_000,
    staleTime: 10_000,
  });

  const filtered = conversations.filter((c) => {
    if (!query) return true;
    const q = query.toLowerCase();
    return c.namaLengkap.toLowerCase().includes(q) || c.kelas.toLowerCase().includes(q);
  });

  return (
    <div className="flex flex-col h-full border-r border-slate-200">
      {/* Search */}
      <div className="p-3 border-b border-slate-100">
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Cari siswa…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-full pl-8 pr-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-transparent placeholder:text-slate-400"
          />
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="p-3 space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex gap-3 items-center">
                <Skeleton className="w-10 h-10 rounded-full shrink-0" />
                <div className="flex-1 space-y-1.5">
                  <Skeleton className="h-3.5 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16 flex flex-col items-center gap-3 text-slate-400">
            <MessageCircle className="w-10 h-10 opacity-25" />
            <p className="text-sm font-medium text-center px-4">
              {conversations.length === 0
                ? "Belum ada pesan masuk dari siswa"
                : "Tidak ada percakapan yang cocok"}
            </p>
          </div>
        ) : (
          filtered.map((c) => (
            <button
              key={c.studentId}
              onClick={() => onSelect(c.studentId)}
              className={`w-full text-left flex gap-3 items-start px-3 py-3 border-b border-slate-100 transition-colors hover:bg-slate-50 ${
                selected === c.studentId ? "bg-blue-50 border-l-2 border-l-blue-500" : ""
              }`}
            >
              {/* Avatar */}
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shrink-0 ${avatarColor(c.namaLengkap)}`}
              >
                {initials(c.namaLengkap)}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-1">
                  <span className={`text-sm font-semibold truncate ${c.unreadCount > 0 ? "text-slate-800" : "text-slate-700"}`}>
                    {c.namaLengkap}
                  </span>
                  <span className="text-[10px] text-slate-400 shrink-0">{relativeTime(c.lastAt)}</span>
                </div>
                <p className="text-[11px] text-slate-400 truncate">{c.kelas}</p>
                <div className="flex items-center justify-between gap-1 mt-0.5">
                  <p className={`text-xs truncate ${c.unreadCount > 0 ? "text-slate-700 font-medium" : "text-slate-400"}`}>
                    {c.lastSenderRole === "guru" ? "Anda: " : ""}
                    {c.lastMessage}
                  </p>
                  {c.unreadCount > 0 && (
                    <span className="shrink-0 min-w-[18px] h-[18px] flex items-center justify-center rounded-full bg-blue-500 text-white text-[10px] font-bold px-1">
                      {c.unreadCount > 99 ? "99+" : c.unreadCount}
                    </span>
                  )}
                </div>
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );
}

// ── Thread panel ──────────────────────────────────────────────────────────────

function ThreadPanel({
  studentId,
  onBack,
}: {
  studentId: string;
  onBack: () => void;
}) {
  const qc = useQueryClient();
  const [reply, setReply] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const { data: conversations = [] } = useQuery<Conversation[]>({
    queryKey: ["/api/inbox"],
    staleTime: 10_000,
  });
  const conv = conversations.find((c) => c.studentId === studentId);

  const { data: messages = [], isLoading } = useQuery<Message[]>({
    queryKey: ["/api/inbox", studentId],
    queryFn: () => apiFetch(`/api/inbox/${studentId}`),
    refetchInterval: 15_000,
    staleTime: 5_000,
  });

  // Mark as read when opening thread
  useEffect(() => {
    fetch(`/api/inbox/${studentId}/read`, {
      method: "PATCH",
      credentials: "include",
    }).then(() => {
      qc.invalidateQueries({ queryKey: ["/api/inbox"] });
      qc.invalidateQueries({ queryKey: ["/api/inbox/unread-count"] });
    });
  }, [studentId, qc]);

  // Scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  const sendMutation = useMutation({
    mutationFn: async (body: string) =>
      apiFetch(`/api/inbox/${studentId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body }),
      }),
    onSuccess: () => {
      setReply("");
      qc.invalidateQueries({ queryKey: ["/api/inbox", studentId] });
      qc.invalidateQueries({ queryKey: ["/api/inbox"] });
    },
  });

  const handleSend = useCallback(() => {
    const trimmed = reply.trim();
    if (!trimmed || sendMutation.isPending) return;
    sendMutation.mutate(trimmed);
  }, [reply, sendMutation]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Group messages by date
  const groups: { date: string; msgs: Message[] }[] = [];
  for (const msg of messages) {
    const d = formatDate(msg.createdAt);
    const last = groups[groups.length - 1];
    if (last?.date === d) last.msgs.push(msg);
    else groups.push({ date: d, msgs: [msg] });
  }

  const studentName = conv?.namaLengkap ?? studentId;
  const studentKelas = conv?.kelas ?? "";

  return (
    <div className="flex flex-col h-full">
      {/* Thread header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-200 bg-white shrink-0">
        <button
          onClick={onBack}
          className="md:hidden p-1.5 rounded-full hover:bg-slate-100 text-slate-500"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div
          className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm shrink-0 ${avatarColor(studentName)}`}
        >
          {initials(studentName)}
        </div>
        <div>
          <p className="text-sm font-semibold text-slate-800">{studentName}</p>
          {studentKelas && <p className="text-xs text-slate-400">{studentKelas}</p>}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-1">
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className={`flex ${i % 2 === 0 ? "justify-start" : "justify-end"}`}>
                <Skeleton className={`h-10 rounded-2xl ${i % 2 === 0 ? "w-1/2" : "w-2/5"}`} />
              </div>
            ))}
          </div>
        ) : messages.length === 0 ? (
          <div className="py-20 flex flex-col items-center gap-3 text-slate-400">
            <MessageCircle className="w-12 h-12 opacity-20" />
            <p className="text-sm">Belum ada pesan di percakapan ini</p>
          </div>
        ) : (
          groups.map((group) => (
            <div key={group.date}>
              {/* Date separator */}
              <div className="flex items-center gap-3 my-4">
                <div className="flex-1 h-px bg-slate-100" />
                <span className="text-[10px] text-slate-400 font-medium px-2">{group.date}</span>
                <div className="flex-1 h-px bg-slate-100" />
              </div>

              {/* Messages in this date group */}
              {group.msgs.map((msg, i) => {
                const isGuru = msg.senderRole === "guru";
                const prev = group.msgs[i - 1];
                const sameSenderAsPrev = prev?.senderRole === msg.senderRole;
                return (
                  <div
                    key={msg.id}
                    className={`flex ${isGuru ? "justify-end" : "justify-start"} ${sameSenderAsPrev ? "mt-0.5" : "mt-3"}`}
                  >
                    <div className={`max-w-[72%] group`}>
                      <div
                        className={`px-3.5 py-2 rounded-2xl text-sm leading-relaxed break-words ${
                          isGuru
                            ? "bg-blue-500 text-white rounded-br-md"
                            : "bg-white border border-slate-200 text-slate-800 rounded-bl-md shadow-sm"
                        }`}
                      >
                        {msg.body}
                      </div>
                      <div className={`flex items-center gap-1 mt-0.5 ${isGuru ? "justify-end" : "justify-start"}`}>
                        <span className="text-[10px] text-slate-400">{formatTime(msg.createdAt)}</span>
                        {isGuru && (
                          <CheckCheck className={`w-3 h-3 ${msg.isRead ? "text-blue-400" : "text-slate-300"}`} />
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>

      {/* Reply box */}
      <div className="shrink-0 border-t border-slate-200 bg-white p-3">
        <div className="flex gap-2 items-end">
          <textarea
            ref={textareaRef}
            rows={1}
            value={reply}
            onChange={(e) => {
              setReply(e.target.value);
              // Auto-grow
              e.target.style.height = "auto";
              e.target.style.height = Math.min(e.target.scrollHeight, 120) + "px";
            }}
            onKeyDown={handleKeyDown}
            placeholder="Tulis balasan… (Enter untuk kirim)"
            className="flex-1 resize-none bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-transparent placeholder:text-slate-400 leading-relaxed"
            style={{ minHeight: 40, maxHeight: 120 }}
          />
          <button
            onClick={handleSend}
            disabled={!reply.trim() || sendMutation.isPending}
            className="shrink-0 w-10 h-10 rounded-xl bg-blue-500 text-white flex items-center justify-center hover:bg-blue-600 active:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
        <p className="text-[10px] text-slate-400 mt-1.5 pl-1">Shift+Enter untuk baris baru</p>
      </div>
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function KotakMasuk() {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [mobileView, setMobileView] = useState<"list" | "thread">("list");

  const handleSelect = (id: string) => {
    setSelectedId(id);
    setMobileView("thread");
  };

  const handleBack = () => {
    setMobileView("list");
    setSelectedId(null);
  };

  return (
    <Layout>
      {/* Page header */}
      <div className="flex items-start justify-between mb-5">
        <div>
          <div className="text-xs text-slate-400 mb-1 font-medium">GuruEOB5 / Kotak Masuk Siswa</div>
          <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <Inbox className="w-5 h-5 text-blue-500" />
            Kotak Masuk Siswa
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">Pesan dari siswa via aplikasi TOMAT • balas langsung dari sini</p>
        </div>
      </div>

      {/* Two-panel layout */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden" style={{ height: "calc(100vh - 220px)", minHeight: 480 }}>
        <div className="flex h-full">
          {/* Left panel — conversation list */}
          <div
            className={`flex-none md:flex md:flex-col ${
              mobileView === "list" ? "flex flex-col w-full" : "hidden"
            } md:w-72 lg:w-80 xl:w-96`}
          >
            {/* Panel title */}
            <div className="px-4 py-3 border-b border-slate-100">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Percakapan</p>
            </div>
            <div className="flex-1 overflow-hidden">
              <ConversationList selected={selectedId} onSelect={handleSelect} />
            </div>
          </div>

          {/* Right panel — thread */}
          <div
            className={`flex-1 flex flex-col min-w-0 ${
              mobileView === "thread" ? "flex" : "hidden md:flex"
            }`}
          >
            {selectedId ? (
              <ThreadPanel studentId={selectedId} onBack={handleBack} />
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-slate-400 gap-4">
                <div className="w-20 h-20 rounded-full bg-slate-100 flex items-center justify-center">
                  <MessageCircle className="w-10 h-10 opacity-30" />
                </div>
                <div className="text-center">
                  <p className="font-medium text-slate-500">Pilih percakapan</p>
                  <p className="text-sm mt-0.5">untuk mulai membaca dan membalas pesan siswa</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
