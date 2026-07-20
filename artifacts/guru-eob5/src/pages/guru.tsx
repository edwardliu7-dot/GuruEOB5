import { Layout } from "@/components/layout";
import { useListTeachers, useUpdateTeacher, useDeleteTeacher } from "@workspace/api-client-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Trash2, Edit2 } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { formatJabatan, JABATAN_LABELS } from "@/lib/options";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

const teacherSchema = z.object({
  name: z.string().min(1, "Nama harus diisi"),
  role: z.enum(["admin", "guru"]),
});

export default function Guru() {
  const { data: teachers, isLoading } = useListTeachers();
  const updateTeacher = useUpdateTeacher();
  const deleteTeacher = useDeleteTeacher();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState<any | null>(null);

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<z.infer<typeof teacherSchema>>({
    resolver: zodResolver(teacherSchema),
    defaultValues: { name: "", role: "guru" },
  });

  const onSubmit = async (data: z.infer<typeof teacherSchema>) => {
    try {
      if (editingTeacher) {
        await updateTeacher.mutateAsync({ id: editingTeacher.id, data });
        toast({ title: "Berhasil", description: "Data guru diperbarui" });
      }
      setIsDialogOpen(false);
      form.reset();
      setEditingTeacher(null);
      queryClient.invalidateQueries({ queryKey: ["/api/teachers"] });
    } catch {
      toast({ variant: "destructive", title: "Gagal", description: "Terjadi kesalahan" });
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("Hapus guru ini?")) {
      try {
        await deleteTeacher.mutateAsync({ id });
        queryClient.invalidateQueries({ queryKey: ["/api/teachers"] });
        toast({ title: "Berhasil", description: "Data dihapus" });
      } catch {
        toast({ variant: "destructive", title: "Gagal", description: "Terjadi kesalahan" });
      }
    }
  };

  return (
    <Layout>
      <div className="space-y-6 animate-in fade-in duration-500">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold font-serif">Data Guru</h1>
            <p className="text-muted-foreground mt-1">Daftar akun pendidik dan tenaga kependidikan.</p>
          </div>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if(!open) { setEditingTeacher(null); form.reset(); } }}>
          <DialogContent>
            <DialogHeader><DialogTitle>Edit Data Guru</DialogTitle></DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField control={form.control} name="name" render={({ field }) => (
                  <FormItem><FormLabel>Nama Lengkap</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="role" render={({ field }) => (
                  <FormItem><FormLabel>Peran</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl><SelectTrigger><SelectValue placeholder="Pilih Peran" /></SelectTrigger></FormControl>
                      <SelectContent>
                        <SelectItem value="guru">Guru</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                      </SelectContent>
                    </Select><FormMessage />
                  </FormItem>
                )} />
                <DialogFooter><Button type="submit" disabled={updateTeacher.isPending}>Simpan</Button></DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>

        <div className="bg-white border border-border rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50/50">
                <TableHead>Guru</TableHead>
                <TableHead>Username</TableHead>
                <TableHead>Jabatan & Mapel</TableHead>
                <TableHead>Peran</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array(3).fill(0).map((_, i) => <TableRow key={i}><TableCell colSpan={5}><Skeleton className="h-10 w-full" /></TableCell></TableRow>)
              ) : (
                teachers?.map((t:any) => {
                  const ini = (t.name ?? "?").split(" ").map((p: string) => p[0]).filter(Boolean).slice(0, 2).join("").toUpperCase();
                  return (
                    <TableRow key={t.id}>
                      {/* Avatar + name + bio */}
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="w-9 h-9 shrink-0 border border-border">
                            {t.photoUrl ? <AvatarImage src={t.photoUrl} alt={t.name} /> : null}
                            <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">{ini}</AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <p className="font-medium text-sm truncate max-w-[160px]">{t.name}</p>
                            {t.bio && (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <p className="text-xs text-muted-foreground truncate max-w-[160px] cursor-default">{t.bio}</p>
                                </TooltipTrigger>
                                <TooltipContent side="bottom" className="max-w-xs whitespace-pre-wrap">{t.bio}</TooltipContent>
                              </Tooltip>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">{t.username}</TableCell>
                      {/* Jabatan + mapel */}
                      <TableCell>
                        <div className="flex flex-wrap gap-1 max-w-[200px]">
                          {(t.jabatan as string[] | undefined)?.map((j: string) => (
                            <Badge key={j} variant="outline" className="text-[11px] px-1.5 py-0">
                              {JABATAN_LABELS[j] ?? j}
                            </Badge>
                          ))}
                          {(t.mapel as string[] | undefined)?.slice(0, 2).map((m: string) => (
                            <Badge key={m} variant="secondary" className="text-[11px] px-1.5 py-0">{m}</Badge>
                          ))}
                          {(t.mapel?.length ?? 0) > 2 && (
                            <Badge variant="secondary" className="text-[11px] px-1.5 py-0 text-muted-foreground">+{t.mapel.length - 2}</Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={t.role === 'admin' ? 'bg-primary/10 text-primary border-primary/20' : 'bg-secondary text-secondary-foreground'}>
                          {t.role}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground" onClick={() => {
                            setEditingTeacher(t);
                            form.reset({ name: t.name, role: t.role });
                            setIsDialogOpen(true);
                          }}><Edit2 className="w-4 h-4" /></Button>
                          <Button variant="ghost" size="icon" className="text-destructive hover:bg-destructive/10" onClick={() => handleDelete(t.id)}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
          </div>
        </div>
      </div>
    </Layout>
  );
}