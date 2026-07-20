import { useState } from "react";
import { Layout } from "@/components/layout";
import { useListTeachers, useListTeachersProgress } from "@workspace/api-client-react";
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
  for (const j of JABATAN_ORDER) if (jabatan.includes(j)) return j;
  return jabatan[0] ?? "guru";
}

function initials(name: string): string {
  return name.split(" ").map((p) => p[0]).filter(Boolean).slice(0, 2).join("").toUpperCase();
}

function progressColor(persen: number): { strip: string; bgLight: string; textDark: string; bar: string } {
  if (persen >= 80) return { strip: "#16a34a", bgLight: "#dcfce7", textDark: "#15803d", bar: "#16a34a" };
  if (persen >= 50) return { strip: "#d97706", bgLight: "#fef3c7", textDark: "#92400e", bar: "#d97706" };
  return { strip: "#dc2626", bgLight: "#fee2e2", textDark: "#991b1b", bar: "#dc2626" };
}

export default function Direktori() {
  const { data: teachers, isLoading: loadingTeachers } = useListTeachers();
  const { data: progressList, isLoading: loadingProgress } = useListTeachersProgress();
  const [query, setQuery] = useState("");

  const progressById = new Map(
    (progressList ?? []).map((p) => [p.teacherId, p])
  );

  const filtered = (teachers ?? []).filter((t: any) => {
    if (!query.trim()) return true;
    const q = query.toLowerCase();
    return (
      t.name?.toLowerCase().includes(q) ||
      t.mapel?.some((m: string) => m.toLowerCase().includes(q)) ||
      t.jabatan?.some((j: string) => (JABATAN_LABELS[j] ?? j).toLowerCase().includes(q)) ||
      t.bio?.toLowerCase().includes(q)
    );
  });

  const isLoading = loadingTeachers || loadingProgress;
  const total = (teachers ?? []).length;
  const perluPerhatian = (progressList ?? []).filter((p) => p.kelengkapanPersen < 50).length;
  const rataKelengkapan =
    (progressList ?? []).length > 0
      ? Math.round((progressList ?? []).reduce((s, p) => s + p.kelengkapanPersen, 0) / (progressList ?? []).length)
      : null;

  return (
    <Layout>
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-3xl font-bold tracking-tight font-serif text-foreground">
              Direktori Guru
            </h1>
            {!isLoading && total > 0 && (
              <div className="flex gap-2 flex-wrap">
                <span style={{ padding: "5px 14px", backgroundColor: "#e0e7ff", color: "#3730a3", borderRadius: 999, fontSize: 13, fontWeight: 700, border: "1px solid #c7d2fe" }}>
                  {total} Guru
                </span>
                {rataKelengkapan !== null && (
                  <span style={{ padding: "5px 14px", backgroundColor: "#dcfce7", color: "#166534", borderRadius: 999, fontSize: 13, fontWeight: 700, border: "1px solid #bbf7d0" }}>
                    {rataKelengkapan}% Rata-rata
                  </span>
                )}
                {perluPerhatian > 0 && (
                  <span style={{ padding: "5px 14px", backgroundColor: "#fee2e2", color: "#991b1b", borderRadius: 999, fontSize: 13, fontWeight: 700, border: "1px solid #fecaca" }}>
                    {perluPerhatian} Perlu Perhatian
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Search */}
          <div style={{
            display: "flex", alignItems: "center",
            backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))",
            borderRadius: 12, padding: "9px 14px",
            boxShadow: "0 1px 3px rgba(0,0,0,0.05)", gap: 10,
            width: 300, flexShrink: 0,
          }}>
            <Search size={16} style={{ color: "hsl(var(--muted-foreground))", flexShrink: 0 }} />
            <input
              type="text"
              placeholder="Cari nama atau mapel..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              style={{ border: "none", outline: "none", fontSize: 14, color: "hsl(var(--foreground))", width: "100%", background: "transparent", fontWeight: 500 }}
            />
          </div>
        </div>

        {/* Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {Array(8).fill(0).map((_, i) => (
              <Skeleton key={i} className="h-64 rounded-2xl" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-20 text-center text-muted-foreground bg-card rounded-2xl border border-dashed border-border">
            <Users className="w-12 h-12 mx-auto mb-3 opacity-20" />
            <p className="font-medium">Tidak ada guru ditemukan.</p>
            {query && <p className="text-sm mt-1">Coba kata kunci lain atau hapus filter.</p>}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {filtered.map((t: any) => {
              const prog = progressById.get(t.id);
              const hasProgress = prog != null;
              const persen = prog?.kelengkapanPersen ?? 0;
              const pc = hasProgress ? progressColor(persen) : null;

              // strip colour: progress-based if we have data, jabatan-based otherwise
              const pjab = primaryJabatan(t.jabatan ?? []);
              const jabColors = JABATAN_STRIP[pjab] ?? JABATAN_STRIP.guru;
              const stripColor = pc?.strip ?? jabColors.strip;
              const bgLight = pc?.bgLight ?? jabColors.bgLight;
              const textDark = pc?.textDark ?? jabColors.textDark;

              return (
                <div key={t.id} style={{
                  backgroundColor: "hsl(var(--card))", borderRadius: 20, overflow: "hidden",
                  boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05), 0 2px 4px -2px rgba(0,0,0,0.02), 0 0 0 1px rgba(0,0,0,0.03)",
                  display: "flex", flexDirection: "column",
                }}>
                  {/* Coloured header strip */}
                  <div style={{
                    height: 40, backgroundColor: stripColor,
                    backgroundImage: "repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(255,255,255,0.08) 10px, rgba(255,255,255,0.08) 20px)",
                    display: "flex", justifyContent: "space-between", alignItems: "center",
                    padding: "0 16px", color: "#ffffff",
                  }}>
                    <span style={{ fontSize: 13, fontWeight: 700, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: "70%", textShadow: "0 1px 2px rgba(0,0,0,0.2)" }}>
                      {t.name}
                    </span>
                    {hasProgress && (
                      <span style={{ fontSize: 18, fontWeight: 900, textShadow: "0 1px 2px rgba(0,0,0,0.2)" }}>
                        {persen}%
                      </span>
                    )}
                  </div>

                  {/* Body */}
                  <div style={{ padding: "16px 20px 20px", flex: 1, display: "flex", flexDirection: "column" }}>
                    {/* Avatar + name */}
                    <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 12 }}>
                      <div style={{
                        width: 48, height: 48, borderRadius: "50%",
                        backgroundColor: bgLight, color: textDark,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: 16, fontWeight: 800, flexShrink: 0,
                        border: `1px solid ${stripColor}33`, overflow: "hidden",
                      }}>
                        {t.photoUrl
                          ? <img src={t.photoUrl} alt={t.name} style={{ width: 48, height: 48, objectFit: "cover" }} />
                          : initials(t.name ?? "?")}
                      </div>
                      <div style={{ overflow: "hidden", display: "flex", flexDirection: "column", gap: 4, minWidth: 0 }}>
                        <div style={{ fontSize: 15, fontWeight: 800, color: "hsl(var(--foreground))", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", letterSpacing: "-0.01em" }}>
                          {t.name}
                        </div>
                        <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                          {(t.jabatan as string[] ?? []).map((j: string) => {
                            const b = JABATAN_BADGE[j] ?? { bg: "#f1f5f9", text: "#475569", border: "#e2e8f0" };
                            return (
                              <span key={j} style={{
                                fontSize: 10, fontWeight: 700, color: b.text, backgroundColor: b.bg,
                                padding: "3px 8px", borderRadius: 6, border: `1px solid ${b.border}`,
                                whiteSpace: "nowrap", textTransform: "uppercase", letterSpacing: "0.02em",
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
                      <div style={{ display: "flex", gap: 6, marginBottom: 8, flexWrap: "nowrap", overflow: "hidden", height: 26 }}>
                        {(t.mapel as string[]).map((m: string, i: number) => (
                          <span key={i} style={{
                            fontSize: 12, fontWeight: 600, color: "hsl(var(--muted-foreground))",
                            backgroundColor: "hsl(var(--muted))", padding: "4px 10px",
                            borderRadius: 999, border: "1px solid hsl(var(--border))", whiteSpace: "nowrap",
                          }}>
                            {m}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Bio */}
                    <div style={{
                      fontSize: 13, color: "hsl(var(--muted-foreground))", lineHeight: 1.5,
                      flex: 1, overflow: "hidden",
                      display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" as any,
                      marginBottom: hasProgress ? 14 : 0,
                    }}>
                      {t.bio || <span style={{ fontStyle: "italic", opacity: 0.5 }}>Belum ada bio.</span>}
                    </div>

                    {/* Progress stats */}
                    {hasProgress && (
                      <>
                        <div style={{ height: 1, backgroundColor: "hsl(var(--border))", margin: "0 -20px 14px -20px" }} />
                        <div style={{ display: "flex", gap: 8 }}>
                          {/* Jurnal */}
                          <div style={{
                            flex: 1, backgroundColor: "hsl(var(--muted))", borderRadius: 10,
                            padding: "9px 6px", display: "flex", flexDirection: "column", alignItems: "center",
                            border: "1px solid hsl(var(--border))",
                          }}>
                            <div style={{ fontSize: 15, fontWeight: 800, color: "hsl(var(--foreground))", lineHeight: 1 }}>{prog!.jurnalBulanIni}</div>
                            <div style={{ fontSize: 10, fontWeight: 600, color: "hsl(var(--muted-foreground))", marginTop: 3, textTransform: "uppercase", letterSpacing: "0.02em" }}>Jurnal</div>
                          </div>
                          {/* Dokumen */}
                          <div style={{
                            flex: 1, backgroundColor: "hsl(var(--muted))", borderRadius: 10,
                            padding: "9px 6px", display: "flex", flexDirection: "column", alignItems: "center",
                            border: "1px solid hsl(var(--border))",
                          }}>
                            <div style={{ fontSize: 15, fontWeight: 800, color: "hsl(var(--foreground))", lineHeight: 1 }}>
                              {prog!.dokumenSelesai}/{prog!.dokumenTotal}
                            </div>
                            <div style={{ fontSize: 10, fontWeight: 600, color: "hsl(var(--muted-foreground))", marginTop: 3, textTransform: "uppercase", letterSpacing: "0.02em" }}>Dokumen</div>
                          </div>
                          {/* Kelengkapan */}
                          <div style={{
                            flex: 1, backgroundColor: bgLight, borderRadius: 10,
                            padding: "9px 6px", display: "flex", flexDirection: "column", alignItems: "center",
                            border: `1px solid ${stripColor}33`,
                          }}>
                            <div style={{ fontSize: 15, fontWeight: 800, color: textDark, lineHeight: 1 }}>{persen}%</div>
                            <div style={{ fontSize: 10, fontWeight: 700, color: textDark, marginTop: 3, textTransform: "uppercase", letterSpacing: "0.02em" }}>Lengkap</div>
                          </div>
                        </div>
                      </>
                    )}
                  </div>

                  {/* Progress bar at bottom */}
                  <div style={{ height: 4, width: "100%", backgroundColor: "hsl(var(--muted))" }}>
                    <div style={{
                      height: "100%",
                      width: hasProgress ? `${persen}%` : "100%",
                      backgroundColor: hasProgress ? pc!.bar : stripColor,
                      opacity: hasProgress ? 1 : 0.25,
                      borderTopRightRadius: 4, borderBottomRightRadius: 4,
                      transition: "width 0.6s ease",
                    }} />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </Layout>
  );
}
