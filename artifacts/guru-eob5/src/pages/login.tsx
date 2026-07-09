import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth } from "@/lib/auth";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const loginSchema = z.object({
  username: z.string().min(1, "Username harus diisi"),
  password: z.string().min(1, "Password harus diisi"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function Login() {
  const { login, isLoggingIn } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  const onSubmit = async (data: LoginFormValues) => {
    try {
      await login({ data });
      setLocation("/dashboard");
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Login Gagal",
        description: "Username atau password salah, atau terjadi kesalahan server.",
      });
    }
  };

  return (
    <div className="min-h-screen flex w-full bg-[#F8FAFC]">
      <div className="flex-1 flex flex-col justify-center px-4 sm:px-6 lg:flex-none lg:px-20 xl:px-24">
        <div className="mx-auto w-full max-w-sm lg:w-[360px]">
          <div className="flex items-center gap-2 mb-8">
            <div className="w-10 h-10 rounded bg-primary flex items-center justify-center text-primary-foreground">
              <BookOpen className="w-6 h-6" />
            </div>
            <span className="font-serif font-bold text-2xl tracking-tight text-foreground">GuruEOB5</span>
          </div>

          <Card className="border-0 shadow-xl shadow-black/5 ring-1 ring-black/5">
            <CardHeader className="space-y-1 pb-6">
              <CardTitle className="text-2xl font-serif">Selamat Datang</CardTitle>
              <CardDescription>
                Silakan masuk menggunakan akun guru atau admin Anda.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="username"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Username</FormLabel>
                        <FormControl>
                          <Input placeholder="Masukkan username" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Password</FormLabel>
                        <FormControl>
                          <Input type="password" placeholder="Masukkan password" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit" className="w-full mt-2" disabled={isLoggingIn}>
                    {isLoggingIn ? "Memproses..." : "Masuk"}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>
      </div>
      <div className="hidden lg:block relative w-0 flex-1 bg-sidebar">
        <div className="absolute inset-0 h-full w-full object-cover bg-sidebar overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-sidebar-primary/20 to-transparent" />
          <div className="flex h-full items-center justify-center p-12">
            <div className="max-w-lg text-sidebar-foreground">
              <h1 className="text-4xl font-serif font-bold mb-4">Administrasi Sekolah, Lebih Tenang dan Tertata.</h1>
              <p className="text-sidebar-foreground/70 text-lg leading-relaxed">
                GuruEOB5 adalah pendamping harian Anda. Kelola data siswa, dokumen administrasi, jurnal mengajar, dan absensi dalam satu tempat yang dirancang khusus untuk kenyamanan guru.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
