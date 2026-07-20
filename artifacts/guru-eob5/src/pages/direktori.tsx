import { useState } from "react";
import { Layout } from "@/components/layout";
import { useListTeachers } from "@workspace/api-client-react";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, Users } from "lucide-react";
import { JABATAN_LABELS } from "@/lib/options";

// Strip + badge colours keyed by primary jabatan
const JABATAN_STRIP: Record<string, { strip: string; bgLight: string; textDark: string; textLight: string }> = {
  kepala_sekolah: { strip: "#d97706", bgLight: "#fef3c7", textDark: "#92400e", textLight: "#ffffff" },
  wakasek:        { strip: "#7c3aed", bgLight: "#ede9fe", textDark: "#5b21b6", textLight: "#ffffff" },
  wali_kelas:     { strip: "#16a34a", bgLight: "#dcfce7", textDark: "#14532d", textLight: "#ffffff" },
  guru:           { strip: "#2563eb", bgLight: "#dbeafe", textDark: "#1e40af", textLight: "#ffffff" },
};

const JABATAN_BADGE: Record<string, { bg: string; text: string; border: string }> = {
  kepala_sekolah: { bg: "#fef3c7", text: "#92400e", border: "#fde68a" },
  wakasek:        { bg: "#ede9fe", text: "#5b21b6", border: "#c4b5fd" },
  wali_kelas:     { bg: "#dcfce7", text: "#14532d", border: "#bbf7d0" },
  guru:           { bg: "#dbeafe", text: "#1e40af", border: "#bfdbfe" },
};

const JABATAN_ORDER = ["kepala_sekolah", "wakasek", "wali_kelas", "guru"];

function primaryJabatan(jabatan: string[]): string {
  for (const j of JABATAN_ORDER) {
    if (jabatan.includes(j)) return j;
  }
  return jabatan[0] ?? "guru";
}

function initials(name: string): string {
  return name
    .split(" ")
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export default function Direktori() {
  const { data: teachers, isLoading } = useListTeachers();
  const [query, setQuery] = useState("");

  const filtered = (teachers ?? []).filter((t: any) => {
    if (!query.trim()) return true;
    const q = query.toLowerCase();
    return (
      t.name?.toLowerCase().includes(q) ||
      t.mapel?.some((m: string) => m.toLowerCase().includes(q)) ||
      t.jabatan?.some((j: string) =>
        (JABATAN_LABELS[j] ?? j).toLowerCase().includes(q),
      ) ||
      t.bio?.toLowerCase().includes(q)
    );
  });

  // Summary counts
  const total = (teachers ?? []).length;

  return (
    <Layout>
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4 flex-wrap">
            <h1 className="text-3xl font-bold tracking-tight font-serif text-foreground">
              Direktori Guru
            </h1>
            {!isLoading && total > 0 && (
              <div className="flex gap-2 flex-wrap">
                <span style={{ padding: "5px 14px", backgroundColor: "#e0e7ff", color: "#3730a3", borderRadius: 999, fontSize: 13, fontWeight: 700, border: "1px solid #c7d2fe" }}>
                  {total} Guru
                </span>
              </div>
            )}
          </div>
          <div className="relative w-full sm:w-72">
            <div style={{
              display: "flex",
              alignItems: "center",
              backgroundColor: "hsl(var(--card))",
              border: "1px solid hsl(var(--border))",
              borderRadius: 12,
              padding: "9px 14px",
              boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
              gap: 10,
            }}>
              <Search size={16} style={{ color: "hsl(var(--muted-foreground))", flexShrink: 0 }} />
              <input
                type="text"
                placeholder="Cari nama atau mapel..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                style={{
                  border: "none",
                  outline: "none",
                  fontSize: 14,
                  color: "hsl(var(--foreground))",
                  width: "100%",
                  background: "transparent",
                  fontWeight: 500,
                }}
              />
            </div>
          </div>
        </div>

        {/* Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {Array(8).fill(0).map((_, i) => (
              <Skeleton key={i} className="h-56 rounded-2xl" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-20 text-center text-muted-foreground bg-card rounded-2xl border border-dashed border-border">
            <Users className="w-12 h-12 mx-auto mb-3 opacity-20" />
            <p className="font-medium">Tidak ada guru ditemukan.</p>
            {query && (
              <p className="text-sm mt-1">
                Coba kata kunci lain atau hapus filter.
              </p>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {filtered.map((t: any) => {
              const pjab = primaryJabatan(t.jabatan ?? []);
              const colors = JABATAN_STRIP[pjab] ?? JABATAN_STRIP.guru;
              return (
                <div
                  key={t.id}
                  style={{
                    backgroundColor: "hsl(var(--card))",
                    borderRadius: 20,
                    overflow: "hidden",
                    boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05), 0 2px 4px -2px rgba(0,0,0,0.02), 0 0 0 1px rgba(0,0,0,0.03)",
                    display: "flex",
                    flexDirection: "column",
                  }}
                >
                  {/* Coloured header strip */}
                  <div style={{
                    height: 40,
                    backgroundColor: colors.strip,
                    backgroundImage: "repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(255,255,255,0.08) 10px, rgba(255,255,255,0.08) 20px)",
                    display: "flex",
                    alignItems: "center",
                    padding: "0 16px",
                    color: colors.textLight,
                  }}>
                    <span style={{ fontSize: 13, fontWeight: 700, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", textShadow: "0 1px 2px rgba(0,0,0,0.2)" }}>
                      {t.name}
                    </span>
                  </div>

                  {/* Body */}
                  <div style={{ padding: "16px 20px 20px", flex: 1, display: "flex", flexDirection: "column" }}>
                    {/* Avatar + name */}
                    <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 12 }}>
                      <div style={{
                        width: 48,
                        height: 48,
                        borderRadius: "50%",
                        backgroundColor: colors.bgLight,
                        color: colors.textDark,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 16,
                        fontWeight: 800,
                        flexShrink: 0,
                        border: `1px solid ${colors.strip}33`,
                      }}>
                        {t.photoUrl ? (
                          <img src={t.photoUrl} alt={t.name} style={{ width: 48, height: 48, borderRadius: "50%", objectFit: "cover" }} />
                        ) : initials(t.name ?? "?")}
                      </div>
                      <div style={{ overflow: "hidden", display: "flex", flexDirection: "column", gap: 4, minWidth: 0 }}>
                        <div style={{ fontSize: 15, fontWeight: 800, color: "hsl(var(--foreground))", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", letterSpacing: "-0.01em" }}>
                          {t.name}
                        </div>
                        {/* Jabatan badges */}
                        <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                          {(t.jabatan as string[] ?? []).map((j: string) => {
                            const b = JABATAN_BADGE[j] ?? { bg: "#f1f5f9", text: "#475569", border: "#e2e8f0" };
                            return (
                              <span key={j} style={{
                                fontSize: 10,
                                fontWeight: 700,
                                color: b.text,
                                backgroundColor: b.bg,
                                padding: "3px 8px",
                                borderRadius: 6,
                                border: `1px solid ${b.border}`,
                                whiteSpace: "nowrap",
                                textTransform: "uppercase",
                                letterSpacing: "0.02em",
                              }}>
                                {JABATAN_LABELS[j] ?? j}
                              </span>
                            );
                          })}
                        </div>
                      </div>
                    </div>

                    {/* Mapel chips */}
                    {t.mapel && t.mapel.length > 0 && (
                      <div style={{ display: "flex", gap: 6, marginBottom: 10, flexWrap: "nowrap", overflow: "hidden", height: 26 }}>
                        {(t.mapel as string[]).map((m: string, i: number) => (
                          <span key={i} style={{
                            fontSize: 12,
                            fontWeight: 600,
                            color: "hsl(var(--muted-foreground))",
                            backgroundColor: "hsl(var(--muted))",
                            padding: "4px 10px",
                            borderRadius: 999,
                            border: "1px solid hsl(var(--border))",
                            whiteSpace: "nowrap",
                          }}>
                            {m}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Bio */}
                    <div style={{ fontSize: 13, color: "hsl(var(--muted-foreground))", lineHeight: 1.5, flex: 1, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" as any }}>
                      {t.bio || <span style={{ fontStyle: "italic", opacity: 0.5 }}>Belum ada bio.</span>}
                    </div>

                    {/* Kelas diampu info */}
                    {t.kelasDiampu && t.kelasDiampu.length > 0 && (
                      <>
                        <div style={{ height: 1, backgroundColor: "hsl(var(--border))", margin: "14px -20px 14px -20px" }} />
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <div style={{
                            flex: 1,
                            backgroundColor: colors.bgLight,
                            borderRadius: 10,
                            padding: "8px",
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            border: `1px solid ${colors.strip}22`,
                          }}>
                            <div style={{ fontSize: 14, fontWeight: 800, color: colors.textDark, lineHeight: 1 }}>
                              {t.kelasDiampu.length}
                            </div>
                            <div style={{ fontSize: 10, fontWeight: 700, color: colors.textDark, marginTop: 3, textTransform: "uppercase", letterSpacing: "0.02em" }}>
                              Kelas
                            </div>
                          </div>
                          {t.waliKelasKelas && (
                            <div style={{
                              flex: 2,
                              backgroundColor: "hsl(var(--muted))",
                              borderRadius: 10,
                              padding: "8px",
                              display: "flex",
                              flexDirection: "column",
                              alignItems: "center",
                              border: "1px solid hsl(var(--border))",
                            }}>
                              <div style={{ fontSize: 12, fontWeight: 700, color: "hsl(var(--foreground))", lineHeight: 1 }}>
                                {t.waliKelasKelas}
                              </div>
                              <div style={{ fontSize: 10, fontWeight: 600, color: "hsl(var(--muted-foreground))", marginTop: 3, textTransform: "uppercase", letterSpacing: "0.02em" }}>
                                Wali Kelas
                              </div>
                            </div>
                          )}
                        </div>
                      </>
                    )}
                  </div>

                  {/* Bottom colour accent bar */}
                  <div style={{ height: 4, width: "100%", backgroundColor: colors.strip, opacity: 0.25 }} />
                </div>
              );
            })}
          </div>
        )}
      </div>
    </Layout>
  );
}
