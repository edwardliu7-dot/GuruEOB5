import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth } from "@/lib/auth";
import { Link, useLocation } from "wouter";
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
import logoUrl from "@/assets/logo.png";
import { useToast } from "@/hooks/use-toast";
import { FadeIn, ScaleIn, motion } from "@/components/motion";

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
    <div className="min-h-screen flex w-full bg-background">
      <div className="flex-1 flex flex-col justify-center px-4 sm:px-6 lg:flex-none lg:px-20 xl:px-24">
        <div className="mx-auto w-full max-w-sm lg:w-[360px]">
          <FadeIn className="flex items-center justify-center mb-8">
            <motion.img
              src={logoUrl}
              alt="GuruEOB5"
              className="h-24 w-auto"
              initial={{ scale: 0.7, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            />
          </FadeIn>

          <ScaleIn delay={0.1}>
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
                <p className="text-sm text-muted-foreground text-center mt-4">
                  Belum punya akun?{" "}
                  <Link href="/register" className="text-primary font-medium hover:underline">
                    Daftar di sini
                  </Link>
                </p>
              </CardContent>
            </Card>
          </ScaleIn>
        </div>
      </div>

      <div className="hidden lg:block relative w-0 flex-1 bg-sidebar overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-sidebar-primary/20 to-transparent" />
        <motion.div
          className="flex h-full items-center justify-center p-12"
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="max-w-lg text-sidebar-foreground">
            <h1 className="text-4xl font-serif font-bold mb-4">Administrasi Sekolah, Lebih Tenang dan Tertata.</h1>
            <p className="text-sidebar-foreground/70 text-lg leading-relaxed">
              GuruEOB5 adalah pendamping harian Anda. Kelola data siswa, dokumen administrasi, jurnal mengajar, dan absensi dalam satu tempat yang dirancang khusus untuk kenyamanan guru.
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
