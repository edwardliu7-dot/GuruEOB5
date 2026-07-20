import { Check, Palette, Type } from "lucide-react";
import { Layout } from "@/components/layout";
import { useTheme } from "@/lib/theme-context";
import { THEMES, FONTS, type ThemeId, type FontId } from "@/lib/theme";
import { cn } from "@/lib/utils";

export default function Pengaturan() {
  const { themeId, fontId, setTheme, setFont } = useTheme();

  return (
    <Layout>
      <div className="max-w-3xl space-y-10">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Pengaturan Tampilan</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Pilihan tema dan font tersimpan otomatis per akun di perangkat ini.
          </p>
        </div>

        {/* ── Tema Warna ── */}
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <Palette className="w-4 h-4 text-primary" />
            <h2 className="font-semibold text-base">Tema Warna</h2>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {THEMES.map((theme) => {
              const active = themeId === theme.id;
              return (
                <button
                  key={theme.id}
                  type="button"
                  onClick={() => setTheme(theme.id as ThemeId)}
                  className={cn(
                    "group relative rounded-xl overflow-hidden border-2 transition-all duration-150 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    active
                      ? "border-primary shadow-md shadow-primary/20 scale-[1.02]"
                      : "border-border hover:border-primary/40 hover:shadow-sm",
                  )}
                >
                  {/* Mini app preview */}
                  <div className="flex h-24 w-full">
                    {/* Sidebar strip */}
                    <div
                      className="w-8 h-full flex-shrink-0 flex flex-col items-center pt-2 gap-1.5"
                      style={{ background: theme.sidebarHex }}
                    >
                      <div className="w-3.5 h-3.5 rounded-full opacity-80" style={{ background: theme.primaryHex }} />
                      {[1, 2, 3, 4].map((i) => (
                        <div
                          key={i}
                          className="w-4 h-1 rounded-sm opacity-40"
                          style={{ background: "white", opacity: i === 1 ? 0.8 : 0.3 }}
                        />
                      ))}
                    </div>
                    {/* Content area */}
                    <div
                      className="flex-1 p-1.5 flex flex-col gap-1"
                      style={{ background: theme.bgHex }}
                    >
                      {/* Header bar */}
                      <div
                        className="h-2.5 rounded-sm w-full"
                        style={{ background: theme.dark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)" }}
                      />
                      {/* Primary button */}
                      <div
                        className="h-2 rounded-sm w-8 self-end"
                        style={{ background: theme.primaryHex }}
                      />
                      {/* Table rows */}
                      {[0.8, 0.5, 0.5, 0.5].map((op, i) => (
                        <div
                          key={i}
                          className="h-1.5 rounded-sm"
                          style={{
                            background: theme.dark ? `rgba(255,255,255,${op * 0.15})` : `rgba(0,0,0,${op * 0.08})`,
                            width: i === 0 ? "100%" : `${70 + i * 5}%`,
                          }}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Label */}
                  <div
                    className="px-2 py-1.5"
                    style={{
                      background: theme.dark ? "#0a0f1e" : "white",
                      color: theme.dark ? "rgba(255,255,255,0.85)" : "inherit",
                    }}
                  >
                    <span className="text-xs font-semibold">
                      {theme.emoji} {theme.label}
                    </span>
                    <p className="text-[10px] text-muted-foreground leading-tight mt-0.5 truncate">
                      {theme.description}
                    </p>
                  </div>

                  {/* Active checkmark */}
                  {active && (
                    <div className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-primary flex items-center justify-center shadow">
                      <Check className="w-3 h-3 text-primary-foreground" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </section>

        {/* ── Font Teks ── */}
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <Type className="w-4 h-4 text-primary" />
            <h2 className="font-semibold text-base">Font Teks</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {FONTS.map((font) => {
              const active = fontId === font.id;
              return (
                <button
                  key={font.id}
                  type="button"
                  onClick={() => setFont(font.id as FontId)}
                  className={cn(
                    "relative rounded-xl border-2 p-4 text-left transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    active
                      ? "border-primary bg-primary/5 shadow-sm shadow-primary/10 scale-[1.02]"
                      : "border-border bg-card hover:border-primary/40 hover:shadow-sm",
                  )}
                  style={{ fontFamily: font.family }}
                >
                  <p className="text-lg font-semibold leading-tight text-foreground">
                    {font.label}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">{font.sample}</p>
                  <p className="text-xs text-muted-foreground/60 mt-1">
                    Aa Bb Cc — 0123456789
                  </p>

                  {active && (
                    <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-primary flex items-center justify-center shadow">
                      <Check className="w-3 h-3 text-primary-foreground" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </section>

        {/* Hint */}
        <p className="text-xs text-muted-foreground border-t border-border pt-4">
          Preferensi disimpan di perangkat ini. Jika login di perangkat berbeda, tema dan font kembali ke bawaan.
        </p>
      </div>
    </Layout>
  );
}
