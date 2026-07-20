import { Layout } from "@/components/layout";
import {
  useListAcademicCalendars,
  useListAcademicWeeks,
  useListSubjects,
  useListProsem,
  useCreateProsem,
  useDeleteProsem,
  useListProsemItems,
  useCreateProsemItem,
  useUpdateProsemItem,
  useDeleteProsemItem,
  useListTujuanPembelajaran,
  useGetMe,
} from "@workspace/api-client-react";
import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import * as XLSX from "xlsx";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2, Pencil, ChevronLeft, Download, Sparkles, Loader2, X, Lock, CalendarOff } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

const prosemSchema = z.object({
  subjectId: z.string().min(1, "Mata pelajaran harus dipilih"),
  kelas: z.string().min(1, "Kelas harus diisi"),
});

const itemSchema = z.object({
  weekId: z.string().min(1, "Pekan harus dipilih"),
  kd: z.string().optional(),
  materi: z.string().optional(),
  jp: z.string().optional(),
  catatan: z.string().optional(),
});

// ---- Types ----
interface MateriEntry {
  bab: string;
  materi: string;
  weekSlot?: number; // 1-based col slot (1=July wk1 … 24=Dec wk4), only if marked
}

interface VerifyItem {
  id: string;
  bab: string;
  materi: string;
  jp: string;
  catatan: string;
}

interface VerifyWeekGroup {
  weekId: string;
  pekanKe: number;
  jenis: string;
  tanggalMulai: string;
  tanggalSelesai: string;
  isLibur: boolean; // user toggles this for KBM weeks
  items: VerifyItem[];
}

// ---- Manual tambah materi types ----
interface ManualCPEntry {
  id: string;
  tpKey: string; // e.g. "TP 1" — empty if not yet matched
  aiMateri?: string; // hint from AI import
  jp: string;
}

interface ManualWeekGroup {
  weekId: string;
  pekanKe: number;
  jenis: string;
  tanggalMulai: string;
  tanggalSelesai: string;
  isLibur: boolean;
  cps: ManualCPEntry[];
}

// ---- Week type helpers ----
// "efektif" is the canonical active/KBM week type from the calendar.
// "kbm" is kept for backwards compatibility.
const isKBMWeek = (jenis: string) => {
  const n = jenis.toLowerCase().replace(/\s+/g, "");
  return n === "kbm" || n === "efektif";
};
const isExamWeek = (jenis: string) => {
  const n = jenis.toUpperCase().replace(/\s+/g, "");
  return n === "STS" || n === "SAS" || n === "PTS" || n === "PAS";
};
const isEditableWeek = (jenis: string) => isKBMWeek(jenis);

// ---- Date formatter ----
const fmtDate = (s: string) => {
  try {
    return new Date(s).toLocaleDateString("id-ID", { day: "numeric", month: "short" });
  } catch {
    return s;
  }
};

// ---- Client-side Excel parser ----
function parseExcelStructure(rows: string[][]): {
  materiList: MateriEntry[];
  hasMarks: boolean;
} {
  // Find month-header row and week-number row
  let weekRow = -1;
  for (let r = 0; r < Math.min(rows.length, 10); r++) {
    const joined = rows[r].join("").toLowerCase();
    if (joined.includes("juli") || joined.includes("agustus") || joined.includes("september")) {
      // Next row should be the 1,2,3,4 repeating week-number row
      if (r + 1 < rows.length) {
        const candidate = rows[r + 1];
        const nums = candidate.slice(3).map(Number).filter((v) => v >= 1 && v <= 4);
        if (nums.length >= 4) {
          weekRow = r + 1;
          break;
        }
      }
    }
  }

  const dataStart = weekRow >= 0 ? weekRow + 1 : 5;
  const EXAM_VALS = new Set(["STS", "SAS", "S T S", "S A S", "STSS", "SASS"]);

  const materiList: MateriEntry[] = [];
  let hasMarks = false;
  let currentBab = "";

  for (let r = dataStart; r < rows.length; r++) {
    const row = rows[r];
    const materi = row[2]?.trim() ?? "";
    if (!materi) continue;

    // Update current bab from col 1 when filled
    if (row[1]?.trim()) currentBab = row[1].trim();

    // Check week columns (col 3 onwards) for explicit marks
    let weekSlot: number | undefined;
    for (let c = 3; c < row.length; c++) {
      const val = row[c]?.trim() ?? "";
      if (!val) continue;
      const normalized = val.toUpperCase().replace(/\s+/g, "");
      // Skip STS/SAS markers — they're not materi marks
      if (EXAM_VALS.has(normalized)) continue;
      // Any other non-empty value = a materi mark
      weekSlot = c - 3 + 1; // 1-based slot (col 3 = slot 1)
      hasMarks = true;
      break;
    }

    materiList.push({ bab: currentBab, materi, weekSlot });
  }

  return { materiList, hasMarks };
}

// ---- Build week groups from AI/deterministic result ----
function buildVerifyGroups(
  aiItems: { pekanKe: number; bab: string; materi: string; jp?: number }[],
  allWeeks: { id: string; pekanKe: number; jenis: string; tanggalMulai: string; tanggalSelesai: string }[],
): VerifyWeekGroup[] {
  const sorted = [...allWeeks].sort((a, b) => a.pekanKe - b.pekanKe);

  // Group items by pekanKe
  const byPekan = new Map<number, VerifyItem[]>();
  aiItems.forEach((item, idx) => {
    const arr = byPekan.get(item.pekanKe) ?? [];
    arr.push({
      id: `ai-${idx}`,
      bab: item.bab ?? "",
      materi: item.materi ?? "",
      jp: item.jp != null ? String(item.jp) : "2",
      catatan: item.bab ?? "",
    });
    byPekan.set(item.pekanKe, arr);
  });

  return sorted.map((w) => ({
    weekId: w.id,
    pekanKe: w.pekanKe,
    jenis: w.jenis,
    tanggalMulai: w.tanggalMulai,
    tanggalSelesai: w.tanggalSelesai,
    isLibur: false,
    items: byPekan.get(w.pekanKe) ?? [],
  }));
}

// ---- Jenis badge ----
function JenisBadge({ jenis }: { jenis: string }) {
  const n = jenis.toUpperCase().replace(/\s+/g, "");
  if (n === "KBM" || n === "EFEKTIF")
    return (
      <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-green-100 text-green-700">
        efektif
      </span>
    );
  if (n === "STS" || n === "SAS" || n === "PTS" || n === "PAS")
    return (
      <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-red-100 text-red-700">
        {jenis}
      </span>
    );
  return (
    <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-gray-100 text-gray-600">
      {jenis}
    </span>
  );
}

// ---- Counter helper ----
let _nextId = 0;
const nextId = () => `new-${++_nextId}`;

export default function Prosem() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: calendars, isLoading: calLoading } = useListAcademicCalendars();
  const { data: subjects } = useListSubjects();
  const { data: me } = useGetMe();
  const FALLBACK_KELAS = ["VII Ibnu Battutah", "VIII Ibnu Sina", "IX Al Khawarizmi"];
  const kelasOptions: string[] =
    (me as any)?.kelasDiampu?.length ? (me as any).kelasDiampu : FALLBACK_KELAS;
  const [selectedCalendar, setSelectedCalendar] = useState<string>("");

  useEffect(() => {
    if (!selectedCalendar && calendars?.length) {
      setSelectedCalendar(calendars[0].id);
    }
  }, [calendars, selectedCalendar]);

  const { data: prosemList, isLoading: prosemLoading } = useListProsem(
    { calendarId: selectedCalendar || undefined },
    { query: { queryKey: ["/api/prosem", selectedCalendar], enabled: !!selectedCalendar } },
  );

  const createProsem = useCreateProsem();
  const deleteProsem = useDeleteProsem();
  const [prosemDialogOpen, setProsemDialogOpen] = useState(false);
  const [openProsemId, setOpenProsemId] = useState<string | null>(null);

  const prosemForm = useForm<z.infer<typeof prosemSchema>>({
    resolver: zodResolver(prosemSchema),
    defaultValues: { subjectId: "", kelas: "" },
  });

  const { data: weeks } = useListAcademicWeeks(
    { calendarId: selectedCalendar || undefined },
    { query: { queryKey: ["/api/academic-weeks", selectedCalendar], enabled: !!selectedCalendar } },
  );

  const { data: items, isLoading: itemsLoading } = useListProsemItems(
    { prosemId: openProsemId || undefined },
    { query: { queryKey: ["/api/prosem-items", openProsemId], enabled: !!openProsemId } },
  );

  const createItem = useCreateProsemItem();
  const updateItem = useUpdateProsemItem();
  const deleteItem = useDeleteProsemItem();
  const [itemDialogOpen, setItemDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<string | null>(null);

  const itemForm = useForm<z.infer<typeof itemSchema>>({
    resolver: zodResolver(itemSchema),
    defaultValues: { weekId: "", kd: "", materi: "", jp: "", catatan: "" },
  });

  // ---- AI import state ----
  const importFileRef = useRef<HTMLInputElement>(null);
  const [importSheets, setImportSheets] = useState<{ name: string; rows: string[][] }[]>([]);
  const [sheetPickerOpen, setSheetPickerOpen] = useState(false);
  const [importLoading, setImportLoading] = useState(false);
  const [verifyGroups, setVerifyGroups] = useState<VerifyWeekGroup[]>([]);
  const [verifyOpen, setVerifyOpen] = useState(false);
  const [bulkLoading, setBulkLoading] = useState(false);

  // ---- Manual tambah materi state ----
  const [manualOpen, setManualOpen] = useState(false);
  const [manualGroups, setManualGroups] = useState<ManualWeekGroup[]>([]);
  const [manualLoading, setManualLoading] = useState(false);

  const subjectName = (id: string) => subjects?.find((s: any) => s.id === id)?.name ?? "-";
  const weekLabel = (id: string) => {
    const w = weeks?.find((x: any) => x.id === id);
    return w ? `Pekan ${w.pekanKe}` : "-";
  };

  const onCreateProsem = async (data: z.infer<typeof prosemSchema>) => {
    try {
      await createProsem.mutateAsync({ data: { ...data, calendarId: selectedCalendar } });
      toast({ title: "Berhasil", description: "Prosem dibuat" });
      setProsemDialogOpen(false);
      prosemForm.reset();
      queryClient.invalidateQueries({ queryKey: ["/api/prosem", selectedCalendar] });
    } catch {
      toast({ variant: "destructive", title: "Gagal", description: "Terjadi kesalahan" });
    }
  };

  const handleDeleteProsem = async (id: string) => {
    if (!confirm("Hapus prosem ini beserta semua materinya?")) return;
    try {
      await deleteProsem.mutateAsync({ id });
      queryClient.invalidateQueries({ queryKey: ["/api/prosem", selectedCalendar] });
      toast({ title: "Berhasil", description: "Prosem dihapus" });
    } catch {
      toast({ variant: "destructive", title: "Gagal", description: "Terjadi kesalahan" });
    }
  };

  const invalidateItems = () =>
    queryClient.invalidateQueries({ queryKey: ["/api/prosem-items", openProsemId] });

  const openNewItem = () => {
    setEditingItem(null);
    itemForm.reset({ weekId: "", kd: "", materi: "", jp: "", catatan: "" });
    setItemDialogOpen(true);
  };

  const openEditItem = (it: any) => {
    setEditingItem(it.id);
    itemForm.reset({
      weekId: it.weekId,
      kd: it.kd ?? "",
      materi: it.materi,
      jp: it.jp != null ? String(it.jp) : "",
      catatan: it.catatan ?? "",
    });
    setItemDialogOpen(true);
  };

  const onSubmitItem = async (data: z.infer<typeof itemSchema>) => {
    if (!openProsemId) return;
    try {
      const resolvedMateri =
        data.materi?.trim() ||
        (data.kd
          ? tpList?.find((t: any) => `TP ${t.tpNumber}` === data.kd)?.description ?? data.kd
          : "");
      const payload = {
        prosemId: openProsemId,
        weekId: data.weekId,
        kd: data.kd || undefined,
        materi: resolvedMateri,
        jp: data.jp ? Number(data.jp) : undefined,
        catatan: data.catatan || undefined,
      };
      if (editingItem) {
        await updateItem.mutateAsync({ id: editingItem, data: payload });
        toast({ title: "Berhasil", description: "Materi diperbarui" });
      } else {
        await createItem.mutateAsync({ data: payload });
        toast({ title: "Berhasil", description: "Materi ditambahkan" });
      }
      setItemDialogOpen(false);
      invalidateItems();
    } catch {
      toast({ variant: "destructive", title: "Gagal", description: "Terjadi kesalahan" });
    }
  };

  const handleDeleteItem = async (id: string) => {
    if (!confirm("Hapus materi ini?")) return;
    try {
      await deleteItem.mutateAsync({ id });
      invalidateItems();
      toast({ title: "Berhasil", description: "Materi dihapus" });
    } catch {
      toast({ variant: "destructive", title: "Gagal", description: "Terjadi kesalahan" });
    }
  };

  const openProsem = prosemList?.find((p: any) => p.id === openProsemId);

  const { data: tpList } = useListTujuanPembelajaran(
    { subjectId: openProsem?.subjectId || undefined, calendarId: selectedCalendar || undefined },
    {
      query: {
        queryKey: ["/api/tp", openProsem?.subjectId, selectedCalendar],
        enabled: !!openProsem?.subjectId && !!selectedCalendar,
      },
    },
  );

  // ---- Manual dialog helpers ----
  const openManualDialog = () => {
    if (!weeks?.length) return;
    const sorted = [...(weeks as any[])].sort((a: any, b: any) => a.pekanKe - b.pekanKe);
    const existingItems = (items as any[]) ?? [];

    const groups: ManualWeekGroup[] = sorted.map((w: any) => {
      const weekItems = existingItems.filter((it: any) => it.weekId === w.id);
      const isLiburWeek = weekItems.length === 1 && weekItems[0].materi === "Libur";

      let cps: ManualCPEntry[] = [];
      if (!isLiburWeek && weekItems.length > 0 && isKBMWeek(w.jenis ?? "")) {
        cps = weekItems.map((it: any) => ({
          id: nextId(),
          tpKey: it.kd ?? "",
          jp: it.jp != null ? String(it.jp) : "",
        }));
      } else if (isKBMWeek(w.jenis ?? "") && weekItems.length === 0) {
        cps = [{ id: nextId(), tpKey: "", jp: "" }];
      }

      return {
        weekId: w.id,
        pekanKe: w.pekanKe,
        jenis: w.jenis ?? "KBM",
        tanggalMulai: w.tanggalMulai,
        tanggalSelesai: w.tanggalSelesai,
        isLibur: isLiburWeek,
        cps,
      };
    });

    setManualGroups(groups);
    setManualOpen(true);
  };

  const updateManualGroup = (weekId: string, updater: (g: ManualWeekGroup) => ManualWeekGroup) => {
    setManualGroups((prev) => prev.map((g) => (g.weekId === weekId ? updater(g) : g)));
  };

  const toggleManualLibur = (weekId: string, isLibur: boolean) => {
    updateManualGroup(weekId, (g) => ({
      ...g,
      isLibur,
      cps: isLibur ? [] : [{ id: nextId(), tpKey: "", jp: "" }],
    }));
  };

  const addCPToWeek = (weekId: string) => {
    updateManualGroup(weekId, (g) => {
      if (g.cps.length >= 3) return g;
      return { ...g, cps: [...g.cps, { id: nextId(), tpKey: "", jp: "" }] };
    });
  };

  const removeCPFromWeek = (weekId: string, cpId: string) => {
    updateManualGroup(weekId, (g) => ({ ...g, cps: g.cps.filter((c) => c.id !== cpId) }));
  };

  const updateCP = (weekId: string, cpId: string, field: keyof ManualCPEntry, value: string) => {
    updateManualGroup(weekId, (g) => ({
      ...g,
      cps: g.cps.map((c) => (c.id === cpId ? { ...c, [field]: value } : c)),
    }));
  };

  const handleManualSave = async () => {
    if (!openProsemId) return;
    setManualLoading(true);
    try {
      const existingItems = (items as any[]) ?? [];
      const newItems: { weekId: string; kd?: string; materi: string; jp?: number; catatan?: string }[] = [];

      // Collect IDs to delete (existing items for KBM weeks we're touching)
      const idsToDelete: string[] = [];
      for (const group of manualGroups) {
        if (!isKBMWeek(group.jenis)) continue;
        const weekExisting = existingItems.filter((it: any) => it.weekId === group.weekId);
        weekExisting.forEach((it: any) => idsToDelete.push(it.id));

        if (group.isLibur) {
          newItems.push({ weekId: group.weekId, materi: "Libur", catatan: "Libur" });
        } else {
          group.cps.forEach((cp) => {
            // Skip if both tpKey and aiMateri are empty
            if (!cp.tpKey && !cp.aiMateri) return;
            const tp = cp.tpKey
              ? (tpList as any[] | undefined)?.find((t: any) => `TP ${t.tpNumber}` === cp.tpKey)
              : undefined;
            newItems.push({
              weekId: group.weekId,
              kd: cp.tpKey || undefined,
              // prefer TP description if matched, else aiMateri hint, else tpKey text
              materi: tp?.description ?? cp.aiMateri ?? cp.tpKey,
              jp: cp.jp ? Number(cp.jp) : undefined,
            });
          });
        }
      }

      // Delete existing items for touched weeks
      for (const id of idsToDelete) {
        await fetch(`/api/prosem-items/${id}`, { method: "DELETE", credentials: "include" });
      }

      // Bulk insert new items
      if (newItems.length > 0) {
        const res = await fetch("/api/prosem-items/bulk", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ prosemId: openProsemId, items: newItems }),
        });
        if (!res.ok) throw new Error("Gagal menyimpan");
      }

      const saved = newItems.filter((it) => it.materi !== "Libur").length;
      toast({ title: "Berhasil", description: `${saved} materi berhasil disimpan.` });
      setManualOpen(false);
      setManualGroups([]);
      invalidateItems();
    } catch {
      toast({ variant: "destructive", title: "Gagal menyimpan", description: "Terjadi kesalahan" });
    } finally {
      setManualLoading(false);
    }
  };

  // AI-import: build manualGroups from AI result and open the manual dialog
  const openManualDialogWithAI = (
    aiItems: { pekanKe: number; bab?: string; materi: string; jp?: number }[],
    allWeeks: any[],
  ) => {
    const sorted = [...allWeeks].sort((a: any, b: any) => a.pekanKe - b.pekanKe);
    const byPekan = new Map<number, { bab?: string; materi: string; jp?: number }[]>();
    aiItems.forEach((item) => {
      const arr = byPekan.get(item.pekanKe) ?? [];
      arr.push(item);
      byPekan.set(item.pekanKe, arr);
    });

    const groups: ManualWeekGroup[] = sorted.map((w: any) => {
      const pekanItems = byPekan.get(w.pekanKe) ?? [];
      let cps: ManualCPEntry[];
      if (isKBMWeek(w.jenis ?? "")) {
        if (pekanItems.length > 0) {
          cps = pekanItems.slice(0, 3).map((item) => ({
            id: nextId(),
            tpKey: "",
            aiMateri: item.materi || item.bab || "",
            jp: item.jp ? String(item.jp) : "2",
          }));
        } else {
          cps = [{ id: nextId(), tpKey: "", jp: "" }];
        }
      } else {
        cps = [];
      }
      return {
        weekId: w.id,
        pekanKe: w.pekanKe,
        jenis: w.jenis ?? "KBM",
        tanggalMulai: w.tanggalMulai,
        tanggalSelesai: w.tanggalSelesai,
        isLibur: false,
        cps,
      };
    });

    setManualGroups(groups);
    setManualOpen(true);
  };

  const manualFilledCount = manualGroups.reduce((acc, g) => {
    if (!isKBMWeek(g.jenis)) return acc;
    if (g.isLibur) return acc;
    // count CPs that have either a tpKey selected OR an AI hint (will be saved as free-text)
    return acc + g.cps.filter((c) => c.tpKey || c.aiMateri).length;
  }, 0);

  // ---- Download Template ----
  const handleDownloadTemplate = () => {
    const months = ["Juli", "Agustus", "September", "Oktober", "November", "Desember"];
    const headerRow1 = ["No", "Bab", "Materi"];
    const headerRow2: (string | null)[] = [null, null, null];
    months.forEach((m) => {
      headerRow1.push(m, null as any, null as any, null as any);
      headerRow2.push(1 as any, 2 as any, 3 as any, 4 as any);
    });

    const aoa: (string | number | null)[][] = [
      ["PROGRAM SEMESTER _ KELAS _"],
      ["T.A ____-____"],
      ["NAMA SEKOLAH"],
      ["MAPEL : "],
      headerRow1,
      headerRow2,
      [1, "BAB I ...", "Topik 1"],
      [null, null, "Topik 2"],
      [2, "BAB II ...", "Topik 3"],
      [null, null, "Topik 4"],
    ];

    const ws = XLSX.utils.aoa_to_sheet(aoa);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Prosem");
    XLSX.writeFile(wb, "Format_Prosem.xlsx");
  };

  // ---- Handle file pick for AI import — dispatch by type ----
  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";

    const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
    const isSpreadsheet = ["xlsx", "xls", "ods", "csv", "tsv"].includes(ext);

    if (isSpreadsheet) {
      // Client-side Excel parse → AI or deterministic distribution
      const reader = new FileReader();
      reader.onload = (ev) => {
        try {
          const buffer = ev.target?.result as ArrayBuffer;
          const workbook = XLSX.read(buffer, { type: "array" });
          const parsed: { name: string; rows: string[][] }[] = workbook.SheetNames.map((name) => {
            const ws = workbook.Sheets[name];
            if (!ws) return { name, rows: [] };
            const raw = XLSX.utils.sheet_to_json<unknown[]>(ws, {
              header: 1,
              raw: false,
              defval: "",
            });
            return {
              name,
              rows: raw.map((row) => (row as unknown[]).map((c) => String(c ?? "").trim())),
            };
          });
          if (parsed.length === 0) {
            toast({ variant: "destructive", title: "File kosong", description: "Tidak ada sheet di file ini." });
            return;
          }
          if (parsed.length === 1) {
            runImport(parsed[0].rows);
          } else {
            setImportSheets(parsed);
            setSheetPickerOpen(true);
          }
        } catch {
          toast({ variant: "destructive", title: "Gagal membaca file", description: "Pastikan file berformat spreadsheet yang valid." });
        }
      };
      reader.readAsArrayBuffer(file);
    } else {
      // PDF / image / docx / txt → send raw to backend AI
      runImportFile(file);
    }
  };

  // ---- Handle non-spreadsheet file upload → backend AI → open manual dialog ----
  const runImportFile = async (file: File) => {
    if (!openProsemId || !weeks?.length) return;
    setImportLoading(true);
    try {
      const arrayBuffer = await file.arrayBuffer();
      const bytes = new Uint8Array(arrayBuffer);
      let binary = "";
      for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
      const fileBase64 = btoa(binary);

      const weeksPayload = (weeks as any[]).map((w) => ({
        id: w.id,
        pekanKe: w.pekanKe,
        jenis: w.jenis ?? "KBM",
      }));

      const res = await fetch("/api/prosem/import-ai-file", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          fileBase64,
          mimeType: file.type || "application/octet-stream",
          fileName: file.name,
          weeks: weeksPayload,
          prosemId: openProsemId,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error((err as any).error ?? "Gagal menganalisis file");
      }

      const { items: aiItems } = (await res.json()) as {
        items: { pekanKe: number; materi: string; jp?: number }[];
      };

      if (!aiItems?.length) {
        toast({ variant: "destructive", title: "Tidak ada data", description: "AI tidak menemukan materi dalam file ini." });
        return;
      }

      openManualDialogWithAI(aiItems, weeks as any[]);
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Gagal impor AI",
        description: err instanceof Error ? err.message : "Terjadi kesalahan",
      });
    } finally {
      setImportLoading(false);
    }
  };

  const runImport = async (rows: string[][]) => {
    if (!openProsemId || !weeks?.length) return;

    const { materiList, hasMarks } = parseExcelStructure(rows);

    if (!materiList.length) {
      toast({
        variant: "destructive",
        title: "Tidak ada data",
        description: "Tidak ditemukan materi dalam sheet ini.",
      });
      return;
    }

    const allWeeks = weeks as any[];

    if (!hasMarks) {
      // --- Deterministic distribution: 1 materi → 1 KBM week, sequential ---
      const kbmWeeks = allWeeks
        .filter((w) => isKBMWeek(w.jenis ?? ""))
        .sort((a, b) => a.pekanKe - b.pekanKe);

      const aiItems = materiList.map((item, idx) => ({
        pekanKe:
          kbmWeeks[Math.min(idx, Math.max(kbmWeeks.length - 1, 0))]?.pekanKe ??
          allWeeks[0]?.pekanKe ??
          1,
        bab: item.bab,
        materi: item.materi,
        jp: 2,
      }));

      openManualDialogWithAI(aiItems, allWeeks);
      return;
    }

    // --- AI path: file has explicit marks, call backend AI ---
    setImportLoading(true);
    try {
      const weeksPayload = allWeeks.map((w) => ({
        id: w.id,
        pekanKe: w.pekanKe,
        jenis: w.jenis ?? "KBM",
      }));

      const res = await fetch("/api/prosem/import-ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ materiList, hasMarks: true, weeks: weeksPayload, prosemId: openProsemId }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error((err as any).error ?? "Gagal menganalisis file");
      }

      const { items: aiItems } = (await res.json()) as {
        items: { pekanKe: number; bab: string; materi: string; jp?: number }[];
      };

      if (!aiItems?.length) {
        toast({ variant: "destructive", title: "Tidak ada data", description: "AI tidak menemukan materi." });
        return;
      }

      openManualDialogWithAI(aiItems, allWeeks);
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Gagal impor AI",
        description: err instanceof Error ? err.message : "Terjadi kesalahan",
      });
    } finally {
      setImportLoading(false);
    }
  };

  // ---- Verify dialog helpers ----
  const updateGroup = (weekId: string, updater: (g: VerifyWeekGroup) => VerifyWeekGroup) => {
    setVerifyGroups((prev) => prev.map((g) => (g.weekId === weekId ? updater(g) : g)));
  };

  const toggleLibur = (weekId: string, isLibur: boolean) => {
    updateGroup(weekId, (g) => ({ ...g, isLibur }));
  };

  const addItemToWeek = (weekId: string) => {
    updateGroup(weekId, (g) => ({
      ...g,
      items: [...g.items, { id: nextId(), bab: "", materi: "", jp: "2", catatan: "" }],
    }));
  };

  const updateWeekItem = (
    weekId: string,
    itemId: string,
    field: keyof VerifyItem,
    value: string,
  ) => {
    updateGroup(weekId, (g) => ({
      ...g,
      items: g.items.map((it) => (it.id === itemId ? { ...it, [field]: value } : it)),
    }));
  };

  const removeWeekItem = (weekId: string, itemId: string) => {
    updateGroup(weekId, (g) => ({
      ...g,
      items: g.items.filter((it) => it.id !== itemId),
    }));
  };

  // ---- Bulk save ----
  const handleBulkSave = async () => {
    if (!openProsemId) return;

    // Validate: all KBM weeks must have materi or be marked libur
    const unfilled = verifyGroups.filter(
      (g) =>
        isKBMWeek(g.jenis) &&
        !g.isLibur &&
        g.items.filter((it) => it.materi.trim()).length === 0,
    );
    if (unfilled.length > 0) {
      toast({
        variant: "destructive",
        title: `${unfilled.length} pekan KBM masih kosong`,
        description: "Isi materi atau tandai sebagai Libur untuk setiap pekan KBM.",
      });
      return;
    }

    setBulkLoading(true);
    try {
      const allItems: {
        weekId: string;
        materi: string;
        jp?: number;
        catatan?: string;
      }[] = [];

      for (const group of verifyGroups) {
        if (!isKBMWeek(group.jenis)) continue; // skip non-KBM

        if (group.isLibur) {
          allItems.push({ weekId: group.weekId, materi: "Libur", catatan: "Libur" });
        } else {
          group.items
            .filter((it) => it.materi.trim())
            .forEach((it) => {
              allItems.push({
                weekId: group.weekId,
                materi: it.materi,
                jp: it.jp ? Number(it.jp) : undefined,
                catatan: it.catatan || it.bab || undefined,
              });
            });
        }
      }

      if (!allItems.length) {
        toast({ variant: "destructive", title: "Tidak ada materi valid" });
        return;
      }

      const res = await fetch("/api/prosem-items/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ prosemId: openProsemId, items: allItems }),
      });
      if (!res.ok) throw new Error("Gagal menyimpan");
      const { inserted } = (await res.json()) as { inserted: number };
      toast({ title: "Berhasil", description: `${inserted} materi berhasil diimpor.` });
      setVerifyOpen(false);
      setVerifyGroups([]);
      invalidateItems();
    } catch {
      toast({
        variant: "destructive",
        title: "Gagal menyimpan",
        description: "Terjadi kesalahan saat menyimpan.",
      });
    } finally {
      setBulkLoading(false);
    }
  };

  const noCalendar = !calLoading && !calendars?.length;

  // Count KBM items for save button label
  const kbmItemCount = verifyGroups.reduce((acc, g) => {
    if (!isKBMWeek(g.jenis)) return acc;
    if (g.isLibur) return acc + 1;
    return acc + g.items.filter((it) => it.materi.trim()).length;
  }, 0);

  return (
    <Layout>
      <div className="space-y-6 animate-in fade-in duration-500">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold font-serif">Program Semester</h1>
            <p className="text-muted-foreground mt-1">
              Rencana materi tiap pekan sebagai dasar Info Pekanan.
            </p>
          </div>
          {!openProsemId && selectedCalendar && (
            <Dialog open={prosemDialogOpen} onOpenChange={setProsemDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" /> Prosem Baru
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Buat Program Semester</DialogTitle>
                </DialogHeader>
                <Form {...prosemForm}>
                  <form onSubmit={prosemForm.handleSubmit(onCreateProsem)} className="space-y-4">
                    <FormField
                      control={prosemForm.control}
                      name="subjectId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Mata Pelajaran</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Pilih Mapel" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {subjects?.map((s: any) => (
                                <SelectItem key={s.id} value={s.id}>
                                  {s.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={prosemForm.control}
                      name="kelas"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Kelas</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Pilih Kelas" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {kelasOptions.map((k) => (
                                <SelectItem key={k} value={k}>{k}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <DialogFooter>
                      <Button type="submit" disabled={createProsem.isPending}>
                        Simpan
                      </Button>
                    </DialogFooter>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          )}
        </div>

        {noCalendar ? (
          <div className="bg-white border border-border rounded-xl shadow-sm h-32 flex items-center justify-center text-muted-foreground">
            Belum ada kalender akademik. Minta admin membuat kalender terlebih dahulu.
          </div>
        ) : !openProsemId ? (
          <div className="bg-white border border-border rounded-xl shadow-sm overflow-hidden">
            <div className="p-4 border-b border-border bg-gray-50/50">
              {calLoading ? (
                <Skeleton className="h-9 w-[280px]" />
              ) : (
                <Select value={selectedCalendar} onValueChange={setSelectedCalendar}>
                  <SelectTrigger className="w-[280px] bg-white">
                    <SelectValue placeholder="Pilih Kalender" />
                  </SelectTrigger>
                  <SelectContent>
                    {calendars?.map((c: any) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.tahunAjaran} — {c.semester}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50/50">
                    <TableHead>Mata Pelajaran</TableHead>
                    <TableHead>Kelas</TableHead>
                    <TableHead className="text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {prosemLoading ? (
                    Array(3)
                      .fill(0)
                      .map((_, i) => (
                        <TableRow key={i}>
                          <TableCell colSpan={3}>
                            <Skeleton className="h-6 w-full" />
                          </TableCell>
                        </TableRow>
                      ))
                  ) : !prosemList?.length ? (
                    <TableRow>
                      <TableCell colSpan={3} className="h-24 text-center text-muted-foreground">
                        Belum ada prosem. Buat prosem baru.
                      </TableCell>
                    </TableRow>
                  ) : (
                    prosemList.map((p: any) => (
                      <TableRow
                        key={p.id}
                        className="cursor-pointer"
                        onClick={() => setOpenProsemId(p.id)}
                      >
                        <TableCell className="font-medium">{subjectName(p.subjectId)}</TableCell>
                        <TableCell>{p.kelas}</TableCell>
                        <TableCell
                          className="text-right"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Button variant="outline" size="sm" onClick={() => setOpenProsemId(p.id)}>
                            Kelola Materi
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive ml-1"
                            onClick={() => handleDeleteProsem(p.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        ) : (
          <div className="bg-white border border-border rounded-xl shadow-sm overflow-hidden">
            <div className="p-4 border-b border-border bg-gray-50/50 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Button variant="ghost" size="icon" onClick={() => setOpenProsemId(null)}>
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <div>
                  <p className="font-medium">
                    {openProsem ? subjectName(openProsem.subjectId) : ""}{" "}
                    {openProsem ? `· ${openProsem.kelas}` : ""}
                  </p>
                  <p className="text-xs text-muted-foreground">Materi per pekan</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {/* Download Template */}
                <Button variant="ghost" size="sm" onClick={handleDownloadTemplate} title="Download format Excel">
                  <Download className="w-4 h-4 mr-1.5" /> Format
                </Button>

                {/* Impor AI */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => importFileRef.current?.click()}
                  disabled={importLoading || !weeks?.length}
                >
                  {importLoading ? (
                    <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
                  ) : (
                    <Sparkles className="w-4 h-4 mr-1.5" />
                  )}
                  {importLoading ? "Menganalisis…" : "Impor AI"}
                </Button>
                <input
                  ref={importFileRef}
                  type="file"
                  accept=".xlsx,.xls,.ods,.csv,.tsv,.pdf,.docx,.doc,.txt,.png,.jpg,.jpeg,.webp"
                  className="hidden"
                  onChange={handleImportFile}
                />

                {/* Tambah Manual */}
                <Button variant="outline" onClick={openManualDialog} disabled={!weeks?.length}>
                  <Plus className="w-4 h-4 mr-2" /> Tambah Materi
                </Button>
              </div>
            </div>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50/50">
                    <TableHead className="w-24">Pekan</TableHead>
                    <TableHead>CP</TableHead>
                    <TableHead>Materi</TableHead>
                    <TableHead className="w-16">JP</TableHead>
                    <TableHead>Catatan</TableHead>
                    <TableHead className="text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {!weeks?.length ? (
                    <TableRow>
                      <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                        Kalender ini belum punya pekan. Minta admin menambah pekan.
                      </TableCell>
                    </TableRow>
                  ) : itemsLoading ? (
                    Array(3)
                      .fill(0)
                      .map((_, i) => (
                        <TableRow key={i}>
                          <TableCell colSpan={6}>
                            <Skeleton className="h-6 w-full" />
                          </TableCell>
                        </TableRow>
                      ))
                  ) : !items?.length ? (
                    <TableRow>
                      <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                        Belum ada materi. Klik "Tambah Materi" untuk mengisi materi tiap pekan.
                      </TableCell>
                    </TableRow>
                  ) : (
                    items.map((it: any) => (
                      <TableRow key={it.id}>
                        <TableCell className="font-medium">{weekLabel(it.weekId)}</TableCell>
                        <TableCell>{it.kd || "-"}</TableCell>
                        <TableCell>{it.materi}</TableCell>
                        <TableCell>{it.jp ?? "-"}</TableCell>
                        <TableCell className="text-muted-foreground max-w-[200px] truncate">
                          {it.catatan || "-"}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="icon" onClick={() => openEditItem(it)}>
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive"
                            onClick={() => handleDeleteItem(it.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        )}
      </div>

      {/* ---- Dialog: Tambah Materi (week-by-week) ---- */}
      <Dialog
        open={manualOpen}
        onOpenChange={(open) => {
          if (!open) {
            setManualOpen(false);
            setManualGroups([]);
          }
        }}
      >
        <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="w-4 h-4 text-primary" />
              Tambah Materi — {manualGroups.length} pekan
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground -mt-1">
            Pilih CP untuk setiap pekan KBM. Satu pekan bisa memuat 1–3 CP. Isi Jam Pelajaran secara manual.
          </p>

          {/* Scrollable week list */}
          <div className="border rounded-lg overflow-y-auto flex-1 divide-y divide-gray-100">
            {manualGroups.map((group) => {
              const exam = isExamWeek(group.jenis);
              const kbm = isKBMWeek(group.jenis);
              const calLibur = !kbm && !exam;

              return (
                <div
                  key={group.weekId}
                  className={cn(
                    "text-sm",
                    exam && "bg-red-50/40",
                    calLibur && "bg-gray-50/60",
                    kbm && group.isLibur && "bg-orange-50/40",
                  )}
                >
                  {/* Week header row */}
                  <div className="flex items-center gap-2 px-3 py-2">
                    <span className="font-semibold w-16 shrink-0">P.{group.pekanKe}</span>
                    <span className="text-xs text-muted-foreground w-28 shrink-0">
                      {fmtDate(group.tanggalMulai)} – {fmtDate(group.tanggalSelesai)}
                    </span>
                    <JenisBadge jenis={group.jenis} />

                    {/* Right side */}
                    {(exam || calLibur) && (
                      <span className="ml-auto flex items-center gap-1 text-xs text-muted-foreground">
                        <Lock className="w-3 h-3" /> Tidak ada KBM
                      </span>
                    )}
                    {kbm && group.isLibur && (
                      <button
                        type="button"
                        className="ml-auto text-xs text-orange-600 hover:underline"
                        onClick={() => toggleManualLibur(group.weekId, false)}
                      >
                        Batalkan Libur
                      </button>
                    )}
                    {kbm && !group.isLibur && group.cps.length === 0 && (
                      <button
                        type="button"
                        className="ml-auto text-xs text-orange-500 hover:underline"
                        onClick={() => toggleManualLibur(group.weekId, true)}
                      >
                        Tandai Libur
                      </button>
                    )}
                  </div>

                  {/* KBM libur state */}
                  {kbm && group.isLibur && (
                    <div className="px-3 pb-2">
                      <span className="inline-flex items-center gap-1 text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full">
                        <CalendarOff className="w-3 h-3" /> Libur / Tidak ada KBM
                      </span>
                    </div>
                  )}

                  {/* KBM CP entries */}
                  {kbm && !group.isLibur && (
                    <div className="px-3 pb-2 space-y-1.5">
                      {group.cps.map((cp, idx) => (
                        <div key={cp.id} className="flex items-center gap-1.5">
                          <span className="text-xs text-muted-foreground w-4 shrink-0">{idx + 1}.</span>
                          {/* CP dropdown */}
                          <div className="flex-1 min-w-0 space-y-0.5">
                            <Select
                              value={cp.tpKey || "__none__"}
                              onValueChange={(v) =>
                                updateCP(group.weekId, cp.id, "tpKey", v === "__none__" ? "" : v)
                              }
                            >
                              <SelectTrigger className="h-7 text-xs">
                                <SelectValue placeholder="Pilih CP…" />
                              </SelectTrigger>
                              <SelectContent className="max-h-64 overflow-y-auto">
                                <SelectItem value="__none__">— Pilih CP —</SelectItem>
                                {(tpList as any[] | undefined)?.map((tp: any) => (
                                  <SelectItem key={tp.id} value={`TP ${tp.tpNumber}`}>
                                    LM {tp.lingkupMateri} · TP {tp.tpNumber} — {tp.description}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            {/* AI hint — shown when AI suggested materi but user hasn't picked CP yet */}
                            {cp.aiMateri && !cp.tpKey && (
                              <p className="text-[10px] text-blue-500 italic truncate pl-0.5" title={cp.aiMateri}>
                                AI: {cp.aiMateri}
                              </p>
                            )}
                          </div>
                          {/* JP input */}
                          <Input
                            className="h-7 text-xs w-14 shrink-0"
                            type="number"
                            min={0}
                            placeholder="JP"
                            title="Jam Pelajaran"
                            value={cp.jp}
                            onChange={(e) => updateCP(group.weekId, cp.id, "jp", e.target.value)}
                          />
                          {/* Remove CP */}
                          <button
                            type="button"
                            className="text-muted-foreground hover:text-destructive shrink-0"
                            onClick={() => removeCPFromWeek(group.weekId, cp.id)}
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}

                      {/* Add CP button (max 3) */}
                      {group.cps.length < 3 && (
                        <button
                          type="button"
                          className="flex items-center gap-1 text-xs text-primary hover:underline mt-0.5"
                          onClick={() => addCPToWeek(group.weekId)}
                        >
                          <Plus className="w-3 h-3" /> Tambah CP
                          {group.cps.length === 0 && (
                            <span className="ml-1 text-orange-500">
                              (atau{" "}
                              <span
                                className="underline cursor-pointer"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleManualLibur(group.weekId, true);
                                }}
                              >
                                tandai Libur
                              </span>
                              )
                            </span>
                          )}
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}

            {manualGroups.length === 0 && (
              <div className="py-8 text-center text-sm text-muted-foreground">
                Tidak ada data pekan.
              </div>
            )}
          </div>

          <DialogFooter className="gap-2 pt-2">
            <Button
              variant="ghost"
              onClick={() => {
                setManualOpen(false);
                setManualGroups([]);
              }}
              disabled={manualLoading}
            >
              Batal
            </Button>
            <Button onClick={handleManualSave} disabled={manualLoading || manualFilledCount === 0}>
              {manualLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Menyimpan…
                </>
              ) : (
                `Simpan ${manualFilledCount} CP`
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ---- Dialog: Edit Materi (single item) ---- */}
      <Dialog open={itemDialogOpen} onOpenChange={setItemDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingItem ? "Edit Materi" : "Tambah Materi"}</DialogTitle>
          </DialogHeader>
          <Form {...itemForm}>
            <form onSubmit={itemForm.handleSubmit(onSubmitItem)} className="space-y-4">
              <FormField
                control={itemForm.control}
                name="weekId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Pekan</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Pilih Pekan" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="max-h-60 overflow-y-auto">
                        {(weeks as any[] ?? [])
                          .filter((w: any) => isKBMWeek(w.jenis ?? ""))
                          .map((w: any) => (
                            <SelectItem key={w.id} value={w.id}>
                              Pekan {w.pekanKe}
                              {w.tanggalMulai ? ` · ${fmtDate(w.tanggalMulai)}` : ""}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={itemForm.control}
                  name="kd"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>CP (Opsional)</FormLabel>
                      {tpList && tpList.length > 0 ? (
                        <Select
                          onValueChange={(v) => {
                            const cleared = v === "__none__";
                            field.onChange(cleared ? "" : v);
                            if (cleared) {
                              itemForm.setValue("materi", "");
                            } else {
                              const tp = tpList?.find((t: any) => `TP ${t.tpNumber}` === v);
                              if (tp) itemForm.setValue("materi", tp.description);
                            }
                          }}
                          value={field.value ? field.value : "__none__"}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Pilih TP" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="max-h-64 overflow-y-auto">
                            <SelectItem value="__none__">— Tidak ada —</SelectItem>
                            {tpList.map((tp: any) => (
                              <SelectItem key={tp.id} value={`TP ${tp.tpNumber}`}>
                                LM {tp.lingkupMateri} · TP {tp.tpNumber} — {tp.description}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <p className="text-xs text-muted-foreground pt-1">
                          {tpList ? "Belum ada TP untuk mapel ini." : "Memuat TP…"}
                        </p>
                      )}
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={itemForm.control}
                  name="jp"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>JP (Opsional)</FormLabel>
                      <FormControl>
                        <Input type="number" min={0} placeholder="2" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              {!itemForm.watch("kd") && (
                <FormField
                  control={itemForm.control}
                  name="materi"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Materi</FormLabel>
                      <FormControl>
                        <Input placeholder="Topik bahasan" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
              <FormField
                control={itemForm.control}
                name="catatan"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Catatan (Opsional)</FormLabel>
                    <FormControl>
                      <Input placeholder="Keterangan tambahan" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button type="submit" disabled={createItem.isPending || updateItem.isPending}>
                  Simpan
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* ---- Dialog: Pilih Sheet ---- */}
      <Dialog open={sheetPickerOpen} onOpenChange={setSheetPickerOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Pilih Sheet</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            File ini memiliki beberapa sheet. Pilih sheet yang ingin diimpor.
          </p>
          <div className="flex flex-col gap-2 mt-2">
            {importSheets.map((sheet) => (
              <Button
                key={sheet.name}
                variant="outline"
                className="justify-start"
                onClick={() => {
                  setSheetPickerOpen(false);
                  setImportSheets([]);
                  runImport(sheet.rows);
                }}
              >
                {sheet.name}
              </Button>
            ))}
          </div>
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => {
                setSheetPickerOpen(false);
                setImportSheets([]);
              }}
            >
              Batal
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ---- Dialog: Verifikasi Impor — Week-centric ---- */}
      <Dialog
        open={verifyOpen}
        onOpenChange={(open) => {
          if (!open) {
            setVerifyOpen(false);
            setVerifyGroups([]);
          }
        }}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-violet-500" />
              Verifikasi Impor — {verifyGroups.length} pekan
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground -mt-1">
            Setiap pekan KBM harus diisi materi atau ditandai Libur. Pekan STS/SAS/nonaktif
            tidak dapat menerima materi.
          </p>

          {/* Week list */}
          <div className="border rounded-lg overflow-hidden divide-y divide-gray-100">
            {verifyGroups.map((group) => {
              const exam = isExamWeek(group.jenis);
              const kbm = isKBMWeek(group.jenis);
              const calLibur = !kbm && !exam; // already a non-KBM, non-exam week in calendar

              return (
                <div
                  key={group.weekId}
                  className={cn(
                    "text-sm",
                    exam && "bg-red-50/40",
                    calLibur && "bg-gray-50/60",
                    kbm && group.isLibur && "bg-orange-50/40",
                  )}
                >
                  {/* Week header */}
                  <div className="flex items-center gap-2 px-3 py-2">
                    <span className="font-semibold w-16 shrink-0">P.{group.pekanKe}</span>
                    <span className="text-xs text-muted-foreground w-28 shrink-0">
                      {fmtDate(group.tanggalMulai)} – {fmtDate(group.tanggalSelesai)}
                    </span>
                    <JenisBadge jenis={group.jenis} />

                    {/* Right actions */}
                    {exam && (
                      <span className="ml-auto flex items-center gap-1 text-xs text-muted-foreground">
                        <Lock className="w-3 h-3" /> Tidak ada KBM
                      </span>
                    )}
                    {calLibur && (
                      <span className="ml-auto flex items-center gap-1 text-xs text-muted-foreground">
                        <CalendarOff className="w-3 h-3" /> Tidak ada KBM
                      </span>
                    )}
                    {kbm && group.isLibur && (
                      <button
                        type="button"
                        className="ml-auto text-xs text-orange-600 hover:underline"
                        onClick={() => toggleLibur(group.weekId, false)}
                      >
                        Batalkan Libur
                      </button>
                    )}
                    {kbm && !group.isLibur && group.items.length === 0 && (
                      <button
                        type="button"
                        className="ml-auto text-xs text-orange-500 hover:underline"
                        onClick={() => toggleLibur(group.weekId, true)}
                      >
                        Tandai Libur
                      </button>
                    )}
                  </div>

                  {/* KBM week — libur state */}
                  {kbm && group.isLibur && (
                    <div className="px-3 pb-2">
                      <span className="inline-flex items-center gap-1 text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full">
                        <CalendarOff className="w-3 h-3" /> Libur / Tidak ada KBM
                      </span>
                    </div>
                  )}

                  {/* KBM week — editable items */}
                  {kbm && !group.isLibur && (
                    <div className="px-3 pb-2 space-y-1">
                      {group.items.map((item) => (
                        <div key={item.id} className="flex items-center gap-1.5">
                          <Input
                            className="h-7 text-xs flex-1 min-w-0"
                            placeholder="Materi / topik"
                            value={item.materi}
                            onChange={(e) =>
                              updateWeekItem(group.weekId, item.id, "materi", e.target.value)
                            }
                          />
                          <Input
                            className="h-7 text-xs w-12 shrink-0"
                            type="number"
                            min={0}
                            placeholder="JP"
                            title="Jam Pelajaran"
                            value={item.jp}
                            onChange={(e) =>
                              updateWeekItem(group.weekId, item.id, "jp", e.target.value)
                            }
                          />
                          <button
                            type="button"
                            className="text-muted-foreground hover:text-destructive shrink-0"
                            onClick={() => removeWeekItem(group.weekId, item.id)}
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}

                      {/* Empty state hint */}
                      {group.items.length === 0 && (
                        <p className="text-xs text-amber-600 italic">
                          Pekan ini kosong — tambah materi atau{" "}
                          <button
                            type="button"
                            className="underline"
                            onClick={() => toggleLibur(group.weekId, true)}
                          >
                            tandai Libur
                          </button>
                        </p>
                      )}

                      {/* Add materi button */}
                      <button
                        type="button"
                        className="flex items-center gap-1 text-xs text-primary hover:underline mt-0.5"
                        onClick={() => addItemToWeek(group.weekId)}
                      >
                        <Plus className="w-3 h-3" /> Tambah materi
                      </button>
                    </div>
                  )}
                </div>
              );
            })}

            {verifyGroups.length === 0 && (
              <div className="py-8 text-center text-sm text-muted-foreground">
                Tidak ada data pekan.
              </div>
            )}
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="ghost"
              onClick={() => {
                setVerifyOpen(false);
                setVerifyGroups([]);
              }}
              disabled={bulkLoading}
            >
              Batal
            </Button>
            <Button onClick={handleBulkSave} disabled={bulkLoading || kbmItemCount === 0}>
              {bulkLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Menyimpan…
                </>
              ) : (
                `Simpan ${kbmItemCount} Entri`
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
