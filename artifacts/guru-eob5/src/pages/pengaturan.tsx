import { Check, Palette, Type, Settings2, ChevronRight, Home, Sparkles, Moon, Save } from "lucide-react";
import { Layout } from "@/components/layout";
import { useTheme } from "@/lib/theme-context";
import { THEMES, FONTS, type ThemeId, type FontId } from "@/lib/theme";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

export default function Pengaturan() {
  const { themeId, fontId, setTheme, setFont } = useTheme();
  const { toast } = useToast();

  const handleSave = () => {
    toast({ title: "Tersimpan", description: "Preferensi tampilan berhasil disimpan." });
  };

  return (
    <Layout>
      <div className="min-h-screen font-sans text-slate-800 p-0">
        {/* Top Section */}
        <div className="mb-8">
          <div className="flex items-center text-xs text-slate-400 mb-2">
            <Home className="w-3 h-3 mr-1" />
            <span>Beranda</span>
            <ChevronRight className="w-3 h-3 mx-1" />
            <span className="text-slate-600 font-medium">Pengaturan</span>
          </div>

          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                <Settings2 className="w-6 h-6 text-primary" />
                Pengaturan
              </h1>
              <p className="text-sm text-slate-500 mt-1">Personalisasi tampilan dan preferensi aplikasi</p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={handleSave}
                className="rounded-full bg-slate-800 text-white px-5 py-2 text-sm font-medium flex items-center gap-2 hover:bg-slate-700 transition-colors shadow-sm"
              >
                <Save className="w-4 h-4" />
                Simpan Perubahan
              </button>
            </div>
          </div>
        </div>

        <div className="max-w-4xl space-y-8 pb-12">
          {/* Tema Warna Section */}
          <section>
            <div className="flex items-center gap-2 mb-4">
              <Palette className="w-4 h-4 text-slate-400" />
              <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Tema Warna</h2>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {THEMES.map((theme) => {
                const isActive = themeId === theme.id;
                return (
                  <div
                    key={theme.id}
                    onClick={() => setTheme(theme.id as ThemeId)}
                    className={cn(
                      "bg-white rounded-xl border p-3 cursor-pointer transition-all duration-200 relative overflow-hidden group",
                      isActive
                        ? "border-slate-800 shadow-md ring-1 ring-slate-800"
                        : "border-slate-200 shadow-sm hover:border-slate-300",
                    )}
                  >
                    {/* Mini app preview using theme hex colours */}
                    <div className="w-full h-20 rounded-lg mb-3 shadow-inner relative overflow-hidden flex items-center justify-center" style={{ background: theme.primaryHex }}>
                      <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white to-transparent" />
                      {isActive && (
                        <div className="bg-white/20 backdrop-blur-sm rounded-full p-1.5 shadow-sm">
                          <Check className="w-6 h-6 text-white" />
                        </div>
                      )}
                    </div>
                    <div className="flex items-center justify-between px-1">
                      <span className={cn("text-sm font-medium", isActive ? "text-slate-800" : "text-slate-600")}>
                        {theme.emoji} {theme.label}
                      </span>
                      <div
                        className={cn("w-3 h-3 rounded-full")}
                        style={{ background: isActive ? theme.primaryHex : "transparent" }}
                      />
                    </div>
                    <p className="text-[10px] text-slate-400 px-1 mt-0.5 truncate">{theme.description}</p>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Font Section */}
          <section>
            <div className="flex items-center gap-2 mb-4">
              <Type className="w-4 h-4 text-slate-400" />
              <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Font Teks</h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {FONTS.map((font) => {
                const isActive = fontId === font.id;
                return (
                  <div
                    key={font.id}
                    onClick={() => setFont(font.id as FontId)}
                    className={cn(
                      "bg-white rounded-xl border p-4 cursor-pointer transition-all duration-200 flex items-center justify-between",
                      isActive
                        ? "border-slate-800 shadow-md ring-1 ring-slate-800"
                        : "border-slate-200 shadow-sm hover:border-slate-300",
                    )}
                  >
                    <div className="flex items-center gap-4">
                      <div
                        className="w-10 h-10 rounded-lg flex items-center justify-center bg-slate-50 border border-slate-100 text-base font-medium text-slate-700"
                        style={{ fontFamily: font.family }}
                      >
                        Aa
                      </div>
                      <div>
                        <div className="text-sm font-medium text-slate-800">{font.label}</div>
                        <div className="text-xs text-slate-500 truncate max-w-[120px]">{font.sample}</div>
                      </div>
                    </div>

                    {/* Radio button indicator */}
                    <div
                      className={cn(
                        "w-5 h-5 rounded-full border flex items-center justify-center flex-shrink-0",
                        isActive ? "border-slate-800 bg-slate-800" : "border-slate-300",
                      )}
                    >
                      {isActive && <div className="w-2 h-2 rounded-full bg-white" />}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Preferensi Lainnya Section */}
          <section>
            <div className="flex items-center gap-2 mb-4">
              <Settings2 className="w-4 h-4 text-slate-400" />
              <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Preferensi Lainnya</h2>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 shadow-sm divide-y divide-slate-100">
              {/* Animasi Transisi — note: animations always on in this app */}
              <div className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-sm font-medium text-slate-800">Animasi Transisi</div>
                    <div className="text-xs text-slate-500 mt-0.5">Aktifkan efek animasi pada antarmuka</div>
                  </div>
                </div>
                {/* Always-on toggle */}
                <div className="relative inline-flex h-6 w-11 items-center rounded-full transition-colors bg-primary">
                  <span className="inline-block h-4 w-4 transform rounded-full bg-white transition-transform translate-x-6" />
                </div>
              </div>

              {/* Mode Gelap */}
              <div className="p-4 flex items-center justify-between opacity-60">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center">
                    <Moon className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <div className="text-sm font-medium text-slate-800">Mode Gelap</div>
                      <span className="rounded-full bg-slate-100 text-slate-500 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider">
                        Gunakan tema Gelap
                      </span>
                    </div>
                    <div className="text-xs text-slate-500 mt-0.5">Ganti ke tampilan latar belakang gelap</div>
                  </div>
                </div>
                <div className="relative inline-flex h-6 w-11 items-center rounded-full bg-slate-200 cursor-not-allowed">
                  <span className="inline-block h-4 w-4 transform rounded-full bg-white translate-x-1" />
                </div>
              </div>
            </div>
          </section>

          {/* Bottom Note & Actions */}
          <div className="pt-4 border-t border-slate-200">
            <p className="text-xs text-slate-400 mb-4">
              Preferensi disimpan di perangkat ini. Jika login di perangkat berbeda, tema dan font kembali ke bawaan.
            </p>
            <div className="flex justify-end">
              <button
                onClick={handleSave}
                className="rounded-full bg-slate-800 text-white px-8 py-2.5 text-sm font-medium flex items-center gap-2 hover:bg-slate-700 transition-colors shadow-sm w-full md:w-auto justify-center"
              >
                <Save className="w-4 h-4" />
                Simpan Pengaturan
              </button>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
