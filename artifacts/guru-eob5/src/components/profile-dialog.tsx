import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/lib/auth";
import { useUpdateTeacher, getGetMeQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { Camera, Loader2, Trash2 } from "lucide-react";

const MAX_DIMENSION = 256;
const MAX_FILE_SIZE = 5 * 1024 * 1024;

function resizeImageToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Gagal membaca berkas"));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error("Gagal memuat gambar"));
      img.onload = () => {
        const scale = Math.min(1, MAX_DIMENSION / Math.max(img.width, img.height));
        const w = Math.round(img.width * scale);
        const h = Math.round(img.height * scale);
        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Canvas tidak didukung"));
          return;
        }
        ctx.drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL("image/jpeg", 0.8));
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}

export function ProfileDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const { user } = useAuth();
  const updateTeacher = useUpdateTeacher();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [bio, setBio] = useState("");
  const [photoUrl, setPhotoUrl] = useState<string | undefined>(undefined);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (open) {
      setBio(user?.bio ?? "");
      setPhotoUrl(user?.photoUrl ?? undefined);
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
    if (file.size > MAX_FILE_SIZE) {
      toast({ variant: "destructive", title: "Gagal", description: "Ukuran gambar maksimal 5 MB" });
      return;
    }
    setProcessing(true);
    try {
      const dataUrl = await resizeImageToDataUrl(file);
      setPhotoUrl(dataUrl);
    } catch {
      toast({ variant: "destructive", title: "Gagal", description: "Tidak dapat memproses gambar" });
    } finally {
      setProcessing(false);
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Profil</DialogTitle>
          <DialogDescription>
            Foto dan bio Anda akan tampil di aplikasi GuruEOB5, BLP, dan TOMAT.
          </DialogDescription>
        </DialogHeader>

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

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Batal</Button>
          <Button onClick={handleSave} disabled={updateTeacher.isPending || processing}>
            {updateTeacher.isPending ? "Menyimpan..." : "Simpan"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
