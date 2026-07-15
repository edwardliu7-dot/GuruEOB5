import { useEffect, useState } from "react";
import { Layout } from "@/components/layout";
import {
  useListStudentAccounts,
  useGenerateAllStudentAccounts,
  useGenerateStudentAccount,
} from "@workspace/api-client-react";
import { useAuth } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { KeyRound, Download, Loader2, RotateCw, AlertCircle } from "lucide-react";

export default function AkunSiswa() {
  const { user } = useAuth();
  const { data, isLoading, isError, refetch } = useListStudentAccounts();
  const { toast } = useToast();
  const waliKelasKelas = user?.waliKelasKelas ?? null;
  const generateOne = useGenerateStudentAccount();
  const generateAll = useGenerateAllStudentAccounts();
  const [accounts, setAccounts] = useState<Record<string, { username: string; password: string }>>({});
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [downloadingAll, setDownloadingAll] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    studentId?: string;
    studentName?: string;
    isRegenerateAll?: boolean;
  }>({ open: false });
  const [pendingAction, setPendingAction] = useState<{
    studentId?: string;
    regenerate?: boolean;
    isAll?: boolean;
  }>({});

  useEffect(() => {
    if (!data) return;
    setAccounts((prev) => {
      const next = { ...prev };
      for (const s of data) {
        if (s.hasAccount && s.username && s.password && !next[s.studentId]) {
          next[s.studentId] = { username: s.username, password: s.password };
        }
      }
      return next;
    });
  }, [data]);

  const handleGenerate = async (studentId: string, regenerate = false) => {
    try {
      const account = await generateOne.mutateAsync({
        id: studentId,
        data: { regenerate },
      });
      setAccounts((prev) => ({
        ...prev,
        [studentId]: { username: account.username, password: account.password },
      }));
      toast({ title: regenerate ? "Akun berhasil diperbaharui" : "Akun berhasil dibuat" });
    } catch {
      toast({ title: "Gagal membuat akun", variant: "destructive" });
    }
  };

  const handleGenerateAll = async () => {
    try {
      const result = await generateAll.mutateAsync();
      const map: Record<string, { username: string; password: string }> = {};
      for (const a of result.accounts) {
        map[a.studentId] = { username: a.username, password: a.password };
      }
      setAccounts((prev) => ({ ...prev, ...map }));
      toast({
        title: "Selesai",
        description: `${result.generated} akun baru dibuat, ${result.alreadyExisted} sudah ada sebelumnya.`,
      });
    } catch {
      toast({ title: "Gagal membuat akun siswa", variant: "destructive" });
    }
  };

  const openConfirmDialog = (
    studentId?: string,
    studentName?: string,
    regenerate = false,
    isAll = false
  ) => {
    setConfirmDialog({
      open: true,
      studentId,
      studentName,
      isRegenerateAll: regenerate && !isAll,
    });
    setPendingAction({
      studentId,
      regenerate,
      isAll,
    });
  };

  const handleConfirmAction = async () => {
    if (pendingAction.isAll) {
      await handleGenerateAll();
    } else if (pendingAction.studentId) {
      await handleGenerate(pendingAction.studentId, pendingAction.regenerate || false);
    }
    setConfirmDialog({ open: false });
    setPendingAction({});
  };

  const downloadFile = async (url: string, fallbackName: string) => {
    const response = await fetch(url, { credentials: "include" });
    if (!response.ok) throw new Error("Gagal mengunduh berkas");
    const blob = await response.blob();
    const disposition = response.headers.get("Content-Disposition") ?? "";
    const match = disposition.match(/filename="(.+)"/);
    const a = document.createElement("a");
    const objectUrl = URL.createObjectURL(blob);
    a.href = objectUrl;
    a.download = match?.[1] ?? fallbackName;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(objectUrl);
  };

  const handleDownloadCard = async (studentId: string) => {
    setDownloadingId(studentId);
    try {
      await downloadFile(`/api/walikelas/akun-siswa/${studentId}/card`, "Kartu_Akun.pdf");
    } catch {
      toast({ title: "Gagal mengunduh kartu", variant: "destructive" });
    } finally {
      setDownloadingId(null);
    }
  };

  const handleDownloadAllCards = async () => {
    setDownloadingAll(true);
    try {
      await downloadFile("/api/walikelas/akun-siswa/cards", "Kartu_Akun_Siswa.pdf");
    } catch {
      toast({ title: "Gagal mengunduh kartu", variant: "destructive" });
    } finally {
      setDownloadingAll(false);
    }
  };

  // Not configured as wali_kelas
  if (!isLoading && !waliKelasKelas) {
    return (
      <Layout>
        <div className="space-y-4 animate-in fade-in duration-500">
          <h1 className="text-3xl font-bold tracking-tight font-serif text-foreground">Akun Siswa</h1>
          <Card className="border-none shadow-sm ring-1 ring-black/5">
            <CardContent className="py-10 flex flex-col items-center gap-3 text-center">
              <AlertCircle className="w-10 h-10 text-amber-500" />
              <p className="font-medium text-foreground">Akun Anda belum dikonfigurasi sebagai Wali Kelas</p>
              <p className="text-sm text-muted-foreground max-w-sm">
                Fitur ini hanya tersedia untuk guru yang memiliki jabatan Wali Kelas dengan kelas yang sudah ditentukan.
                Hubungi admin untuk memperbarui profil Anda.
              </p>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight font-serif text-foreground">
              Akun Siswa
            </h1>
            {isLoading ? (
              <Skeleton className="h-5 w-64 mt-1" />
            ) : (
              <p className="text-muted-foreground mt-1">
                Buat akun BLP & TOMAT untuk siswa kelas <span className="font-semibold text-foreground">{waliKelasKelas}</span>
              </p>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleDownloadAllCards} disabled={downloadingAll}>
              {downloadingAll ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Download className="w-4 h-4 mr-2" />
              )}
              Unduh Semua Kartu (PDF)
            </Button>
            <Button
              onClick={() => openConfirmDialog(undefined, undefined, false, true)}
              disabled={generateAll.isPending}
            >
              {generateAll.isPending ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <KeyRound className="w-4 h-4 mr-2" />
              )}
              Generate Semua Akun
            </Button>
          </div>
        </div>

        <Card className="border-none shadow-sm ring-1 ring-black/5">
          <CardHeader>
            <CardTitle className="text-lg font-serif">Daftar Siswa</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : isError ? (
              <div className="flex flex-col items-center gap-2 py-10 text-center">
                <AlertCircle className="w-8 h-8 text-destructive" />
                <p className="font-medium text-foreground">Gagal memuat data siswa</p>
                <p className="text-sm text-muted-foreground">
                  {(isError as any)?.status === 403
                    ? "Akun Anda belum dikonfigurasi sebagai Wali Kelas. Hubungi admin."
                    : "Terjadi kesalahan pada server. Coba lagi atau hubungi admin jika masalah berlanjut."}
                </p>
                <Button variant="outline" size="sm" onClick={() => refetch()} className="mt-2">Coba lagi</Button>
              </div>
            ) : !data || data.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-10 text-center">
                <p className="font-medium text-foreground">Belum ada siswa di kelas {waliKelasKelas}</p>
                <p className="text-sm text-muted-foreground max-w-sm">
                  Minta admin untuk menambahkan data siswa kelas <span className="font-semibold">{waliKelasKelas}</span> melalui menu Data Siswa.
                  Pastikan kolom <span className="font-semibold">kelas</span> diisi dengan tepat.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nama</TableHead>
                      <TableHead>Username</TableHead>
                      <TableHead>Password</TableHead>
                      <TableHead className="text-right">Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.map((s) => {
                      const account = accounts[s.studentId];
                      return (
                        <TableRow key={s.studentId}>
                          <TableCell className="font-medium">{s.namaLengkap}</TableCell>
                          <TableCell className="font-mono text-sm">
                            {account ? account.username : <Badge variant="secondary">Belum ada akun</Badge>}
                          </TableCell>
                          <TableCell className="font-mono text-sm">
                            {account ? account.password : "-"}
                          </TableCell>
                          <TableCell className="text-right space-x-2 whitespace-nowrap">
                            {account ? (
                              <>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => openConfirmDialog(s.studentId, s.namaLengkap, true)}
                                  disabled={generateOne.isPending}
                                  title="Ganti username dan password"
                                >
                                  <RotateCw className="w-3.5 h-3.5" />
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleDownloadCard(s.studentId)}
                                  disabled={downloadingId === s.studentId}
                                >
                                  {downloadingId === s.studentId ? (
                                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                  ) : (
                                    <Download className="w-3.5 h-3.5" />
                                  )}
                                </Button>
                              </>
                            ) : (
                              <Button
                                size="sm"
                                onClick={() => openConfirmDialog(s.studentId, s.namaLengkap, false)}
                                disabled={generateOne.isPending}
                              >
                                <KeyRound className="w-3.5 h-3.5 mr-1.5" />
                                Generate
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {data && data.length > 0 && (
          <Button
            variant="link"
            className="text-muted-foreground text-sm px-0"
            onClick={() => refetch()}
          >
            Muat ulang daftar siswa
          </Button>
        )}
      </div>

      {/* Confirmation Dialog */}
      <AlertDialog open={confirmDialog.open} onOpenChange={(open) => setConfirmDialog({ ...confirmDialog, open })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {pendingAction.isAll
                ? "Generate Semua Akun Siswa?"
                : pendingAction.regenerate
                ? "Ganti Username dan Password?"
                : "Buat Akun Baru?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {pendingAction.isAll ? (
                <div className="space-y-2">
                  <p>
                    Anda akan membuat akun baru untuk semua siswa di kelas <strong>{waliKelasKelas}</strong> yang belum memiliki akun.
                  </p>
                  <p className="text-amber-600 font-medium">
                    <strong>⚠️ Perhatian:</strong> Jika siswa sudah memiliki akun, username dan password lama akan diganti dengan yang baru.
                  </p>
                </div>
              ) : pendingAction.regenerate ? (
                <div className="space-y-2">
                  <p>
                    Username dan password lama untuk <strong>{confirmDialog.studentName}</strong> akan diganti dengan yang baru.
                  </p>
                  <div className="bg-amber-50 border border-amber-200 rounded p-3 mt-3">
                    <p className="text-amber-900 text-sm font-medium">
                      <strong>⚠️ Perhatian Penting:</strong>
                    </p>
                    <ul className="text-sm text-amber-800 mt-2 space-y-1 ml-4 list-disc">
                      <li>Akun lama <strong>tidak akan bisa digunakan</strong></li>
                      <li>Siswa harus menggunakan username dan password baru untuk login</li>
                      <li>Download kartu akun terbaru untuk memberikan ke siswa</li>
                    </ul>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <p>
                    Akun BLP & TOMAT akan dibuat untuk siswa <strong>{confirmDialog.studentName}</strong>.
                  </p>
                  <p>Pastikan data siswa sudah benar sebelum melanjutkan.</p>
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmAction}
              disabled={generateOne.isPending || generateAll.isPending}
              className={pendingAction.regenerate ? "bg-amber-600 hover:bg-amber-700" : ""}
            >
              {generateOne.isPending || generateAll.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Memproses...
                </>
              ) : pendingAction.regenerate ? (
                "Ganti Akun"
              ) : pendingAction.isAll ? (
                "Generate Semua"
              ) : (
                "Generate"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Layout>
  );
}
