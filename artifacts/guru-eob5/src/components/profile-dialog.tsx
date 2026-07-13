import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/lib/auth";
import { useUpdateTeacher, getGetMeQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { Camera, Loader2, Trash2, ZoomIn } from "lucide-react";

const OUTPUT_DIMENSION = 256;
const LARGE_FILE_THRESHOLD = 5 * 1024 * 1024; // 5 MB: above this, we compress harder
const MAX_UPLOAD_SIZE = 20 * 1024 * 1024; // hard ceiling so the browser doesn't choke decoding huge images
const TARGET_DATA_URL_BYTES = 600 * 1024; // keep the stored base64 photo reasonably small
const CROP_VIEWPORT = 280; // px, square cropper shown to the user

interface PendingImage {
  img: HTMLImageElement;
  wasLarge: boolean;
}

function estimateDataUrlBytes(dataUrl: string): number {
  const base64 = dataUrl.slice(dataUrl.indexOf(",") + 1);
  return Math.round((base64.length * 3) / 4);
}

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Gagal membaca berkas"));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error("Gagal memuat gambar"));
      img.onload = () => resolve(img);
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}

/** Renders the current crop (position + zoom) to a square, compressed JPEG data URL. */
function renderCrop(img: HTMLImageElement, zoom: number, offset: { x: number; y: number }, wasLarge: boolean): string {
  const coverScale = Math.max(CROP_VIEWPORT / img.width, CROP_VIEWPORT / img.height);
  const scale = coverScale * zoom;

  const canvas = document.createElement("canvas");
  canvas.width = OUTPUT_DIMENSION;
  canvas.height = OUTPUT_DIMENSION;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas tidak didukung");

  const outputScale = OUTPUT_DIMENSION / CROP_VIEWPORT;
  const drawW = img.width * scale * outputScale;
  const drawH = img.height * scale * outputScale;
  // offset is the pan of the image center relative to the viewport center, in viewport px
  const drawX = OUTPUT_DIMENSION / 2 - drawW / 2 + offset.x * outputScale;
  const drawY = OUTPUT_DIMENSION / 2 - drawH / 2 + offset.y * outputScale;

  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(img, drawX, drawY, drawW, drawH);

  // Compress harder for originally-large uploads, then keep shrinking quality
  // until the resulting data URL is comfortably small.
  let quality = wasLarge ? 0.6 : 0.85;
  let dataUrl = canvas.toDataURL("image/jpeg", quality);
  while (estimateDataUrlBytes(dataUrl) > TARGET_DATA_URL_BYTES && quality > 0.35) {
    quality -= 0.1;
    dataUrl = canvas.toDataURL("image/jpeg", quality);
  }
  return dataUrl;
}

export function ProfileDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const { user } = useAuth();
  const updateTeacher = useUpdateTeacher();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dragState = useRef<{ startX: number; startY: number; originX: number; originY: number } | null>(null);

  const [bio, setBio] = useState("");
  const [photoUrl, setPhotoUrl] = useState<string | undefined>(undefined);
  const [processing, setProcessing] = useState(false);

  // Cropper state, active only while the user is adjusting a newly selected image
  const [pending, setPending] = useState<PendingImage | null>(null);
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });

  useEffect(() => {
    if (open) {
      setBio(user?.bio ?? "");
      setPhotoUrl(user?.photoUrl ?? undefined);
      setPending(null);
    }
  }, [open, user]);

  const initials = (user?.name ?? "?")
    .split(" ")
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast({ variant: "destructive", title: "Gagal", description: "Berkas harus berupa gambar" });
      return;
    }
    if (file.size > MAX_UPLOAD_SIZE) {
      toast({ variant: "destructive", title: "Gagal", description: "Ukuran gambar maksimal 20 MB" });
      return;
    }
    const wasLarge = file.size > LARGE_FILE_THRESHOLD;
    setProcessing(true);
    try {
      const img = await loadImage(file);
      setPending({ img, wasLarge });
      setZoom(1);
      setOffset({ x: 0, y: 0 });
      if (wasLarge) {
        toast({ title: "Gambar besar terdeteksi", description: "Foto akan dipadatkan otomatis setelah dipotong." });
      }
    } catch {
      toast({ variant: "destructive", title: "Gagal", description: "Tidak dapat memproses gambar" });
    } finally {
      setProcessing(false);
    }
  };

  const clampOffset = (next: { x: number; y: number }, currentZoom: number, img: HTMLImageElement) => {
    const coverScale = Math.max(CROP_VIEWPORT / img.width, CROP_VIEWPORT / img.height);
    const scale = coverScale * currentZoom;
    const maxX = Math.max(0, (img.width * scale - CROP_VIEWPORT) / 2);
    const maxY = Math.max(0, (img.height * scale - CROP_VIEWPORT) / 2);
    return {
      x: Math.min(maxX, Math.max(-maxX, next.x)),
      y: Math.min(maxY, Math.max(-maxY, next.y)),
    };
  };

  const onPointerDown = (e: React.PointerEvent) => {
    (e.target as Element).setPointerCapture(e.pointerId);
    dragState.current = { startX: e.clientX, startY: e.clientY, originX: offset.x, originY: offset.y };
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragState.current || !pending) return;
    const dx = e.clientX - dragState.current.startX;
    const dy = e.clientY - dragState.current.startY;
    setOffset(clampOffset({ x: dragState.current.originX + dx, y: dragState.current.originY + dy }, zoom, pending.img));
  };

  const onPointerUp = () => {
    dragState.current = null;
  };

  const handleZoomChange = (value: number[]) => {
    if (!pending) return;
    const nextZoom = value[0] ?? 1;
    setZoom(nextZoom);
    setOffset((prev) => clampOffset(prev, nextZoom, pending.img));
  };

  const applyCrop = () => {
    if (!pending) return;
    try {
      const dataUrl = renderCrop(pending.img, zoom, offset, pending.wasLarge);
      setPhotoUrl(dataUrl);
      setPending(null);
    } catch {
      toast({ variant: "destructive", title: "Gagal", description: "Tidak dapat memotong gambar" });
    }
  };

  const handleSave = async () => {
    if (!user) return;
    try {
      await updateTeacher.mutateAsync({
        id: user.id,
        data: { bio: bio.trim(), photoUrl: photoUrl ?? "" },
      });
      await queryClient.invalidateQueries({ queryKey: getGetMeQueryKey() });
      await queryClient.invalidateQueries({ queryKey: ["/api/teachers"] });
      toast({ title: "Berhasil", description: "Profil diperbarui" });
      onOpenChange(false);
    } catch {
      toast({ variant: "destructive", title: "Gagal", description: "Terjadi kesalahan" });
    }
  };

  const coverScale = pending ? Math.max(CROP_VIEWPORT / pending.img.width, CROP_VIEWPORT / pending.img.height) : 1;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Profil</DialogTitle>
          <DialogDescription>
            Foto dan bio Anda akan tampil di aplikasi GuruEOB5, BLP, dan TOMAT.
          </DialogDescription>
        </DialogHeader>

        {pending ? (
          <div className="space-y-4 py-2">
            <p className="text-sm font-medium text-center">Sesuaikan posisi &amp; ukuran foto</p>
            <div
              className="mx-auto overflow-hidden rounded-full border-2 border-border bg-muted touch-none select-none cursor-move"
              style={{ width: CROP_VIEWPORT, height: CROP_VIEWPORT }}
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp}
              onPointerLeave={onPointerUp}
            >
              <img
                src={pending.img.src}
                alt="Pratinjau potong"
                draggable={false}
                className="pointer-events-none"
                style={{
                  width: pending.img.width * coverScale * zoom,
                  height: pending.img.height * coverScale * zoom,
                  transform: `translate(${CROP_VIEWPORT / 2 - (pending.img.width * coverScale * zoom) / 2 + offset.x}px, ${CROP_VIEWPORT / 2 - (pending.img.height * coverScale * zoom) / 2 + offset.y}px)`,
                }}
              />
            </div>
            <div className="flex items-center gap-3 px-2">
              <ZoomIn className="w-4 h-4 text-muted-foreground shrink-0" />
              <Slider min={1} max={3} step={0.01} value={[zoom]} onValueChange={handleZoomChange} />
            </div>
            {pending.wasLarge ? (
              <p className="text-xs text-muted-foreground text-center">
                Berkas asli berukuran besar (&gt; 5 MB) — akan dipadatkan otomatis saat disimpan.
              </p>
            ) : null}
            <div className="flex justify-center gap-2">
              <Button type="button" variant="outline" onClick={() => setPending(null)}>Batal</Button>
              <Button type="button" onClick={applyCrop}>Terapkan</Button>
            </div>
          </div>
        ) : (
          <div className="space-y-5 py-2">
            <div className="flex flex-col items-center gap-3">
              <div className="relative">
                <Avatar className="w-24 h-24 border-2 border-border">
                  {photoUrl ? <AvatarImage src={photoUrl} alt={user?.name} /> : null}
                  <AvatarFallback className="text-2xl bg-primary/10 text-primary">{initials}</AvatarFallback>
                </Avatar>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={processing}
                  className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow hover:opacity-90 disabled:opacity-50"
                  aria-label="Ganti foto"
                >
                  {processing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
                </button>
              </div>
              {photoUrl ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="text-muted-foreground h-7"
                  onClick={() => setPhotoUrl(undefined)}
                >
                  <Trash2 className="w-3.5 h-3.5 mr-1.5" /> Hapus foto
                </Button>
              ) : null}
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="bio">Bio</Label>
              <Textarea
                id="bio"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Ceritakan sedikit tentang Anda..."
                rows={4}
                maxLength={500}
              />
              <p className="text-xs text-muted-foreground text-right">{bio.length}/500</p>
            </div>
          </div>
        )}

        {!pending && (
          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>Batal</Button>
            <Button onClick={handleSave} disabled={updateTeacher.isPending || processing}>
              {updateTeacher.isPending ? "Menyimpan..." : "Simpan"}
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
