import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useRegister, getGetMeQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { BookOpen, ArrowLeft, ArrowRight, Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  JABATAN_OPTIONS,
  WAKASEK_BIDANG_OPTIONS,
  KELAS_OPTIONS,
  MAPEL_OPTIONS,
  SCHOOL_OPTIONS,
} from "@/lib/options";

const STEPS = ["Data Diri", "Jabatan", "Kelas & Sekolah", "Akun"] as const;

export default function Register() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const registerMutation = useRegister();

  const [step, setStep] = useState(0);

  const [name, setName] = useState("");
  const [jabatan, setJabatan] = useState<string[]>([]);
  const [mapel, setMapel] = useState<string[]>([]);
  const [customMapel, setCustomMapel] = useState<string[]>([]);
  const [newMapel, setNewMapel] = useState("");
  const [wakasekBidang, setWakasekBidang] = useState<string>("");
  const [waliKelasKelas, setWaliKelasKelas] = useState<string>("");
  const [kelasDiampu, setKelasDiampu] = useState<string[]>([]);
  const [school, setSchool] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const isGuru = jabatan.includes("guru");
  const isWakasek = jabatan.includes("wakasek");
  const isWaliKelas = jabatan.includes("wali_kelas");
  const allMapelOptions = [...MAPEL_OPTIONS, ...customMapel];

  const toggle = (list: string[], value: string, setter: (v: string[]) => void) => {
    setter(list.includes(value) ? list.filter((v) => v !== value) : [...list, value]);
  };

  const addCustomMapel = () => {
    const trimmed = newMapel.trim();
    if (!trimmed) return;
    if (!allMapelOptions.includes(trimmed)) {
      setCustomMapel([...customMapel, trimmed]);
    }
    if (!mapel.includes(trimmed)) {
      setMapel([...mapel, trimmed]);
    }
    setNewMapel("");
  };

  const validateStep = (): string | null => {
    if (step === 0) {
      if (!name.trim()) return "Nama beserta gelar harus diisi";
    }
    if (step === 1) {
      if (jabatan.length === 0) return "Pilih minimal satu jabatan";
      if (isGuru && mapel.length === 0) return "Pilih minimal satu mata pelajaran";
      if (isWakasek && !wakasekBidang) return "Pilih bidang wakasek";
      if (isWaliKelas && !waliKelasKelas) return "Pilih kelas untuk wali kelas";
    }
    if (step === 2) {
      if (kelasDiampu.length === 0) return "Pilih minimal satu kelas yang diampu";
      if (!school) return "Pilih nama sekolah";
    }
    if (step === 3) {
      if (!username.trim()) return "Username harus diisi";
      if (username.trim().length < 3) return "Username minimal 3 karakter";
      if (!password) return "Password harus diisi";
      if (password.length < 6) return "Password minimal 6 karakter";
      if (password !== confirmPassword) return "Konfirmasi password tidak cocok";
    }
    return null;
  };

  const handleNext = () => {
    const error = validateStep();
    if (error) {
      toast({ variant: "destructive", title: "Periksa kembali", description: error });
      return;
    }
    setStep((s) => s + 1);
  };

  const handleSubmit = async () => {
    const error = validateStep();
    if (error) {
      toast({ variant: "destructive", title: "Periksa kembali", description: error });
      return;
    }
    try {
      await registerMutation.mutateAsync({
        data: {
          name: name.trim(),
          jabatan: jabatan as ("kepala_sekolah" | "wakasek" | "guru" | "wali_kelas")[],
          ...(isGuru ? { mapel } : {}),
          ...(isWakasek ? { wakasekBidang: wakasekBidang as "Kurikulum" | "Kesiswaan" } : {}),
          ...(isWaliKelas ? { waliKelasKelas } : {}),
          kelasDiampu,
          school: school.trim(),
          username: username.trim(),
          password,
        },
      });
      await queryClient.invalidateQueries({ queryKey: getGetMeQueryKey() });
      toast({ title: "Pendaftaran berhasil", description: "Selamat datang di GuruEOB5!" });
      setLocation("/dashboard");
    } catch (err: unknown) {
      const message =
        err && typeof err === "object" && "response" in err
          ? ((err as { response?: { data?: { error?: string } } }).response?.data?.error ??
            "Terjadi kesalahan server")
          : "Terjadi kesalahan server";
      toast({ variant: "destructive", title: "Pendaftaran gagal", description: message });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center w-full bg-[#F8FAFC] py-10 px-4">
      <div className="w-full max-w-xl">
        <div className="flex items-center gap-2 mb-6 justify-center">
          <div className="w-10 h-10 rounded bg-primary flex items-center justify-center text-primary-foreground">
            <BookOpen className="w-6 h-6" />
          </div>
          <span className="font-serif font-bold text-2xl tracking-tight text-foreground">GuruEOB5</span>
        </div>

        <Card className="border-0 shadow-xl shadow-black/5 ring-1 ring-black/5">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-2 mb-3">
              {STEPS.map((label, i) => (
                <div key={label} className="flex-1 flex flex-col items-center gap-1">
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold ${
                      i <= step
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {i + 1}
                  </div>
                  <span className={`text-[11px] ${i === step ? "text-foreground font-medium" : "text-muted-foreground"}`}>
                    {label}
                  </span>
                </div>
              ))}
            </div>
            <CardTitle className="text-xl font-serif">Daftar Akun Guru</CardTitle>
            <CardDescription>
              {step === 0 && "Masukkan nama lengkap Anda beserta gelar."}
              {step === 1 && "Pilih jabatan Anda di sekolah (boleh lebih dari satu)."}
              {step === 2 && "Pilih kelas yang Anda ampu dan nama sekolah."}
              {step === 3 && "Buat username dan password untuk masuk."}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {step === 0 && (
              <div className="space-y-2">
                <Label htmlFor="name">Nama beserta gelar</Label>
                <Input
                  id="name"
                  placeholder="cth: Ahmad Fauzi, S.Pd."
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
            )}

            {step === 1 && (
              <div className="space-y-5">
                <div className="space-y-3">
                  <Label>Jabatan</Label>
                  {JABATAN_OPTIONS.map((opt) => (
                    <div key={opt.value} className="flex items-center gap-2">
                      <Checkbox
                        id={`jabatan-${opt.value}`}
                        checked={jabatan.includes(opt.value)}
                        onCheckedChange={() => toggle(jabatan, opt.value, setJabatan)}
                      />
                      <Label htmlFor={`jabatan-${opt.value}`} className="font-normal cursor-pointer">
                        {opt.label}
                      </Label>
                    </div>
                  ))}
                </div>

                {isGuru && (
                  <div className="space-y-3 rounded-lg border p-4">
                    <Label>Mata pelajaran yang diajar</Label>
                    <div className="grid grid-cols-2 gap-2">
                      {allMapelOptions.map((m) => (
                        <div key={m} className="flex items-center gap-2">
                          <Checkbox
                            id={`mapel-${m}`}
                            checked={mapel.includes(m)}
                            onCheckedChange={() => toggle(mapel, m, setMapel)}
                          />
                          <Label htmlFor={`mapel-${m}`} className="font-normal cursor-pointer text-sm">
                            {m}
                          </Label>
                        </div>
                      ))}
                    </div>
                    <div className="flex gap-2 pt-1">
                      <Input
                        placeholder="Tambah mapel lain..."
                        value={newMapel}
                        onChange={(e) => setNewMapel(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            addCustomMapel();
                          }
                        }}
                      />
                      <Button type="button" variant="outline" size="icon" onClick={addCustomMapel}>
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                )}

                {isWakasek && (
                  <div className="space-y-3 rounded-lg border p-4">
                    <Label>Bidang Wakasek</Label>
                    <RadioGroup value={wakasekBidang} onValueChange={setWakasekBidang}>
                      {WAKASEK_BIDANG_OPTIONS.map((b) => (
                        <div key={b} className="flex items-center gap-2">
                          <RadioGroupItem value={b} id={`bidang-${b}`} />
                          <Label htmlFor={`bidang-${b}`} className="font-normal cursor-pointer">
                            {b}
                          </Label>
                        </div>
                      ))}
                    </RadioGroup>
                  </div>
                )}

                {isWaliKelas && (
                  <div className="space-y-3 rounded-lg border p-4">
                    <Label>Wali kelas untuk kelas</Label>
                    <RadioGroup value={waliKelasKelas} onValueChange={setWaliKelasKelas}>
                      {KELAS_OPTIONS.map((k) => (
                        <div key={k} className="flex items-center gap-2">
                          <RadioGroupItem value={k} id={`walikelas-${k}`} />
                          <Label htmlFor={`walikelas-${k}`} className="font-normal cursor-pointer">
                            {k}
                          </Label>
                        </div>
                      ))}
                    </RadioGroup>
                  </div>
                )}
              </div>
            )}

            {step === 2 && (
              <div className="space-y-5">
                <div className="space-y-3">
                  <Label>Kelas yang diampu</Label>
                  {KELAS_OPTIONS.map((k) => (
                    <div key={k} className="flex items-center gap-2">
                      <Checkbox
                        id={`kelas-${k}`}
                        checked={kelasDiampu.includes(k)}
                        onCheckedChange={() => toggle(kelasDiampu, k, setKelasDiampu)}
                      />
                      <Label htmlFor={`kelas-${k}`} className="font-normal cursor-pointer">
                        {k}
                      </Label>
                    </div>
                  ))}
                </div>
                <div className="space-y-2">
                  <Label>Nama sekolah</Label>
                  <RadioGroup value={school} onValueChange={setSchool} className="space-y-1">
                    {SCHOOL_OPTIONS.map((s) => (
                      <div key={s} className="flex items-center gap-2">
                        <RadioGroupItem value={s} id={`school-${s}`} />
                        <Label htmlFor={`school-${s}`} className="font-normal cursor-pointer">
                          {s}
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="username">Username</Label>
                  <Input
                    id="username"
                    placeholder="cth: ahmadfauzi"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Minimal 6 karakter"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Ulangi Password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="Ketik ulang password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                </div>
              </div>
            )}

            <div className="flex justify-between pt-2">
              {step > 0 ? (
                <Button type="button" variant="outline" onClick={() => setStep((s) => s - 1)}>
                  <ArrowLeft className="w-4 h-4 mr-1" /> Kembali
                </Button>
              ) : (
                <span />
              )}
              {step < STEPS.length - 1 ? (
                <Button type="button" onClick={handleNext}>
                  Lanjut <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              ) : (
                <Button type="button" onClick={handleSubmit} disabled={registerMutation.isPending}>
                  {registerMutation.isPending ? "Mendaftar..." : "Daftar"}
                </Button>
              )}
            </div>

            <p className="text-sm text-muted-foreground text-center pt-1">
              Sudah punya akun?{" "}
              <Link href="/login" className="text-primary font-medium hover:underline">
                Masuk di sini
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
