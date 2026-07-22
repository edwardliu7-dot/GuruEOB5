import { useEffect, useState } from "react";
import { Layout } from "@/components/layout";
import {
  useListStudentAccounts,
  useGenerateAllStudentAccounts,
  useGenerateStudentAccount,
} from "@workspace/api-client-react";
import { useAuth } from "@/lib/auth";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
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
import {
  KeyRound,
  Download,
  Loader2,
  RefreshCw,
  AlertCircle,
  ChevronRight,
  Users,
  CheckCircle2,
} from "lucide-react";

export default function AkunSiswa() {
  const { user } = useAuth();
  const { data, isLoading, isError, refetch } = useListStudentAccounts();
  const { toast } = useToast();
  const waliKelasKelas = user?.waliKelasKelas ?? null;
  const generateOne = useGenerateStudentAccount();
  const generateAll = useGenerateAllStudentAccounts();
  const [accounts, setAccounts] = useState<
    Record<string, { username: string; password: string }>
  >({});
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
      toast({
        title: regenerate ? "Akun berhasil diperbaharui" : "Akun berhasil dibuat",
      });
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
        description:
          result.alreadyExisted > 0
            ? `${result.generated} akun baru dibuat, ${result.alreadyExisted} akun lama diperbarui.`
            : `${result.generated} akun baru dibuat.`,
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
    setPendingAction({ studentId, regenerate, isAll });
  };

  const handleConfirmAction = async () => {
    if (pendingAction.isAll) {
      await handleGenerateAll();
    } else if (pendingAction.studentId) {
      await handleGenerate(
        pendingAction.studentId,
        pendingAction.regenerate || false
      );
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
      await downloadFile(
        `/api/walikelas/akun-siswa/${studentId}/card`,
        "Kartu_Akun.pdf"
      );
    } catch {
      toast({ title: "Gagal mengunduh kartu", variant: "destructive" });
    } finally {
      setDownloadingId(null);
    }
  };

  const handleDownloadAllCards = async () => {
    setDownloadingAll(true);
    try {
      await downloadFile(
        "/api/walikelas/akun-siswa/cards",
        "Kartu_Akun_Siswa.pdf"
      );
    } catch {
      toast({ title: "Gagal mengunduh kartu", variant: "destructive" });
    } finally {
      setDownloadingAll(false);
    }
  };

  const totalSiswa = data?.length ?? 0;
  const totalAkunDibuat = data?.filter((s) => s.hasAccount || accounts[s.studentId])?.length ?? 0;
  const totalBelumAkun = totalSiswa - totalAkunDibuat;

  // Not configured as wali_kelas
  if (!isLoading && !waliKelasKelas) {
    return (
      <Layout>
        <div className="flex items-center text-xs text-slate-400 mb-2">
          <span>Dashboard</span>
          <ChevronRight className="w-3 h-3 mx-1" />
          <span className="text-slate-600">Akun Siswa</span>
        </div>
        <h1 className="text-xl font-bold text-slate-800 mb-2">Akun Siswa</h1>
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-10 flex flex-col items-center gap-3 text-center">
          <AlertCircle className="w-10 h-10 text-amber-500" />
          <p className="font-medium text-slate-800">
            Akun Anda belum dikonfigurasi sebagai Wali Kelas
          </p>
          <p className="text-sm text-slate-500 max-w-sm">
            Fitur ini hanya tersedia untuk guru yang memiliki jabatan Wali Kelas
            dengan kelas yang sudah ditentukan. Hubungi admin untuk memperbarui
            profil Anda.
          </p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      {/* Breadcrumb */}
      <div className="flex items-center text-xs text-slate-400 mb-2">
        <span>Dashboard</span>
        <ChevronRight className="w-3 h-3 mx-1" />
        <span>Kelas {waliKelasKelas}</span>
        <ChevronRight className="w-3 h-3 mx-1" />
        <span className="text-slate-600">Akun Siswa</span>
      </div>

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-800">Akun Siswa</h1>
          <p className="text-sm text-slate-500">
            Kelola akun login siswa kelas perwalian{" "}
            <span className="font-semibold text-slate-700">{waliKelasKelas}</span>
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleDownloadAllCards}
            disabled={downloadingAll}
            className="flex items-center gap-2 rounded-full border border-slate-200 bg-white text-slate-600 px-4 py-2 text-sm font-medium hover:bg-slate-50 transition-colors shadow-sm disabled:opacity-60"
          >
            {downloadingAll ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Download className="w-4 h-4" />
            )}
            Download Daftar Akun
          </button>
          <button
            onClick={() => openConfirmDialog(undefined, undefined, false, true)}
            disabled={generateAll.isPending}
            className="flex items-center gap-2 rounded-full bg-slate-800 text-white px-4 py-2 text-sm font-medium hover:bg-slate-700 transition-colors shadow-sm disabled:opacity-60"
          >
            {generateAll.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <KeyRound className="w-4 h-4" />
            )}
            Generate Semua Akun
          </button>
        </div>
      </div>

      {/* Info Banner */}
      <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded-r-xl mb-6 flex items-start gap-3 shadow-sm border-y border-r border-amber-200">
        <AlertCircle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
        <div className="text-sm text-amber-800">
          <p className="font-medium mb-0.5 text-amber-900">Informasi Akun</p>
          <p className="text-amber-700">
            Simpan dan bagikan daftar akun kepada siswa. Password dapat direset
            kapan saja jika siswa lupa.
          </p>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-6">
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 relative overflow-hidden flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs uppercase tracking-wide text-slate-500 font-semibold mb-1">
              Total Siswa
            </div>
            {isLoading ? (
              <Skeleton className="h-9 w-12" />
            ) : (
              <div className="text-3xl font-black text-slate-800">{totalSiswa}</div>
            )}
          </div>
          <div className="h-1 absolute bottom-0 left-0 right-0 bg-blue-500" />
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 relative overflow-hidden flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs uppercase tracking-wide text-slate-500 font-semibold mb-1">
              Akun Dibuat
            </div>
            {isLoading ? (
              <Skeleton className="h-9 w-12" />
            ) : (
              <div className="text-3xl font-black text-slate-800">{totalAkunDibuat}</div>
            )}
          </div>
          <div className="h-1 absolute bottom-0 left-0 right-0 bg-emerald-500" />
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 relative overflow-hidden flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center shrink-0">
            <AlertCircle className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs uppercase tracking-wide text-slate-500 font-semibold mb-1">
              Belum Ada Akun
            </div>
            {isLoading ? (
              <Skeleton className="h-9 w-12" />
            ) : (
              <div className="text-3xl font-black text-slate-800">{totalBelumAkun}</div>
            )}
          </div>
          <div className="h-1 absolute bottom-0 left-0 right-0 bg-amber-500" />
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden mb-6">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500 border-b border-slate-200">
              <tr>
                <th className="px-4 py-3 font-semibold w-14 text-center">No</th>
                <th className="px-4 py-3 font-semibold">Nama Siswa</th>
                <th className="px-4 py-3 font-semibold">Username</th>
                <th className="px-4 py-3 font-semibold">Status Akun</th>
                <th className="px-4 py-3 font-semibold text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    <td colSpan={5} className="px-4 py-4">
                      <Skeleton className="h-8 w-full" />
                    </td>
                  </tr>
                ))
              ) : isError ? (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <AlertCircle className="w-8 h-8 text-red-400" />
                      <p className="font-medium text-slate-700">
                        Gagal memuat data siswa
                      </p>
                      <button
                        onClick={() => refetch()}
                        className="text-sm text-blue-600 hover:underline"
                      >
                        Coba lagi
                      </button>
                    </div>
                  </td>
                </tr>
              ) : !data || data.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-slate-500 text-sm">
                    Belum ada siswa di kelas {waliKelasKelas}.
                  </td>
                </tr>
              ) : (
                data.map((s, idx) => {
                  const account = accounts[s.studentId];
                  const hasAccount = !!(account || s.hasAccount);
                  const displayUsername = account?.username ?? s.username;
                  const initials = s.namaLengkap
                    .split(" ")
                    .map((p: string) => p[0])
                    .filter(Boolean)
                    .slice(0, 2)
                    .join("")
                    .toUpperCase();
                  const avatarColors = [
                    "bg-indigo-100 text-indigo-600",
                    "bg-blue-100 text-blue-600",
                    "bg-emerald-100 text-emerald-600",
                    "bg-pink-100 text-pink-600",
                    "bg-amber-100 text-amber-600",
                    "bg-purple-100 text-purple-600",
                    "bg-teal-100 text-teal-600",
                    "bg-rose-100 text-rose-600",
                    "bg-cyan-100 text-cyan-600",
                    "bg-orange-100 text-orange-600",
                  ];
                  const color = avatarColors[idx % avatarColors.length];

                  return (
                    <tr key={s.studentId} className="hover:bg-slate-50 transition-colors group">
                      <td className="px-4 py-4 text-center text-slate-500 text-sm">{idx + 1}</td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${color}`}>
                            {initials}
                          </div>
                          <span className="font-medium text-slate-800">{s.namaLengkap}</span>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        {displayUsername ? (
                          <span className="font-mono text-slate-600 text-xs bg-slate-100 px-2 py-1 rounded">
                            {displayUsername}
                          </span>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>
                      <td className="px-4 py-4">
                        {hasAccount ? (
                          <span className="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700 ring-1 ring-inset ring-emerald-600/20">
                            Aktif
                          </span>
                        ) : (
                          <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600 ring-1 ring-inset ring-slate-500/20">
                            Belum Dibuat
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-4 text-right">
                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          {hasAccount ? (
                            <>
                              <button
                                onClick={() => openConfirmDialog(s.studentId, s.namaLengkap, true)}
                                disabled={generateOne.isPending}
                                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 bg-white border border-slate-200 rounded-full hover:bg-slate-50 hover:text-slate-900 transition-colors shadow-sm disabled:opacity-50"
                              >
                                <RefreshCw className="w-3 h-3" />
                                Reset Password
                              </button>
                              <button
                                onClick={() => handleDownloadCard(s.studentId)}
                                disabled={downloadingId === s.studentId}
                                className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              >
                                {downloadingId === s.studentId ? (
                                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                ) : (
                                  <Download className="w-3.5 h-3.5" />
                                )}
                              </button>
                            </>
                          ) : (
                            <button
                              onClick={() => openConfirmDialog(s.studentId, s.namaLengkap, false)}
                              disabled={generateOne.isPending}
                              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 bg-white border border-slate-200 rounded-full hover:bg-slate-50 hover:text-slate-900 transition-colors shadow-sm disabled:opacity-50"
                            >
                              <KeyRound className="w-3 h-3" />
                              Buat Akun
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Table Footer */}
        <div className="bg-slate-50 border-t border-slate-200 p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-slate-500">
            Menampilkan {totalSiswa} siswa kelas {waliKelasKelas}
          </p>
          <button
            onClick={() => refetch()}
            className="text-xs font-medium text-slate-500 hover:text-slate-800 transition-colors"
          >
            Muat ulang
          </button>
        </div>
      </div>

      {/* Bottom Download Note */}
      <div className="flex justify-center mb-8">
        <button
          onClick={handleDownloadAllCards}
          disabled={downloadingAll}
          className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-800 transition-colors group disabled:opacity-60"
        >
          <div className="p-2 rounded-full bg-slate-200 group-hover:bg-slate-300 transition-colors">
            {downloadingAll ? (
              <Loader2 className="w-4 h-4 text-slate-700 animate-spin" />
            ) : (
              <Download className="w-4 h-4 text-slate-700" />
            )}
          </div>
          <span className="font-medium underline decoration-slate-300 underline-offset-4">
            Download credential sheet untuk dicetak (PDF)
          </span>
        </button>
      </div>

      {/* Confirmation Dialog */}
      <AlertDialog
        open={confirmDialog.open}
        onOpenChange={(open) => setConfirmDialog({ ...confirmDialog, open })}
      >
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
                    Anda akan membuat akun baru untuk semua siswa di kelas{" "}
                    <strong>{waliKelasKelas}</strong> yang belum memiliki akun.
                  </p>
                  <p className="text-amber-600 font-medium">
                    ⚠️ Jika siswa sudah memiliki akun, username dan password
                    lama akan diganti dengan yang baru.
                  </p>
                </div>
              ) : pendingAction.regenerate ? (
                <div className="space-y-2">
                  <p>
                    Username dan password lama untuk{" "}
                    <strong>{confirmDialog.studentName}</strong> akan diganti
                    dengan yang baru.
                  </p>
                  <div className="bg-amber-50 border border-amber-200 rounded p-3 mt-3">
                    <p className="text-amber-900 text-sm font-medium">
                      ⚠️ Perhatian Penting:
                    </p>
                    <ul className="text-sm text-amber-800 mt-2 space-y-1 ml-4 list-disc">
                      <li>Akun lama tidak akan bisa digunakan</li>
                      <li>Siswa harus login dengan akun baru</li>
                    </ul>
                  </div>
                </div>
              ) : (
                <p>
                  Akun akan dibuat untuk siswa{" "}
                  <strong>{confirmDialog.studentName}</strong>. Pastikan data
                  sudah benar sebelum melanjutkan.
                </p>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmAction}
              disabled={generateOne.isPending || generateAll.isPending}
              className={
                pendingAction.regenerate ? "bg-amber-600 hover:bg-amber-700" : ""
              }
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
