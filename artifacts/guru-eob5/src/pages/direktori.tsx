import { useState } from "react";
import { Layout } from "@/components/layout";
import { useListTeachers } from "@workspace/api-client-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, Users } from "lucide-react";
import { formatJabatan, JABATAN_LABELS } from "@/lib/options";

const JABATAN_COLORS: Record<string, string> = {
  kepala_sekolah: "bg-amber-100 text-amber-800 border-amber-200",
  wakasek:        "bg-violet-100 text-violet-800 border-violet-200",
  guru:           "bg-blue-100 text-blue-800 border-blue-200",
  wali_kelas:     "bg-green-100 text-green-800 border-green-200",
};

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

  return (
    <Layout>
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight font-serif text-foreground">
              Direktori Guru
            </h1>
            <p className="text-muted-foreground mt-1">
              Profil seluruh pendidik dan tenaga kependidikan.
            </p>
          </div>
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
            <Input
              className="pl-9"
              placeholder="Cari nama, mapel, jabatan…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {Array(8)
              .fill(0)
              .map((_, i) => (
                <Skeleton key={i} className="h-52 rounded-2xl" />
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filtered.map((t: any) => (
              <div
                key={t.id}
                className="bg-card border border-border rounded-2xl p-5 flex flex-col gap-3 shadow-sm hover:shadow-md transition-shadow"
              >
                {/* Avatar + name */}
                <div className="flex items-center gap-3">
                  <Avatar className="w-12 h-12 border-2 border-border shrink-0">
                    {t.photoUrl ? (
                      <AvatarImage src={t.photoUrl} alt={t.name} />
                    ) : null}
                    <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                      {initials(t.name ?? "?")}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <p className="font-semibold text-sm leading-snug truncate">
                      {t.name}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {formatJabatan(t.jabatan)}
                    </p>
                  </div>
                </div>

                {/* Jabatan badges */}
                {t.jabatan?.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {(t.jabatan as string[]).map((j) => (
                      <span
                        key={j}
                        className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium ${JABATAN_COLORS[j] ?? "bg-gray-100 text-gray-700 border-gray-200"}`}
                      >
                        {JABATAN_LABELS[j] ?? j}
                      </span>
                    ))}
                  </div>
                )}

                {/* Mapel chips */}
                {t.mapel && t.mapel.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {(t.mapel as string[]).slice(0, 3).map((m) => (
                      <Badge
                        key={m}
                        variant="secondary"
                        className="text-[11px] px-2 py-0"
                      >
                        {m}
                      </Badge>
                    ))}
                    {t.mapel.length > 3 && (
                      <Badge
                        variant="secondary"
                        className="text-[11px] px-2 py-0 text-muted-foreground"
                      >
                        +{t.mapel.length - 3}
                      </Badge>
                    )}
                  </div>
                )}

                {/* Bio */}
                {t.bio ? (
                  <p className="text-xs text-muted-foreground line-clamp-3 leading-relaxed">
                    {t.bio}
                  </p>
                ) : (
                  <p className="text-xs text-muted-foreground/50 italic">
                    Belum ada bio.
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
