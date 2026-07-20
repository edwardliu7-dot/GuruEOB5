import { Switch, Route, Router as WouterRouter, useLocation } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/lib/auth";
import { ThemeProvider } from "@/lib/theme-context";
import { useEffect } from "react";

// Pages
import Login from "@/pages/login";
import Dashboard from "@/pages/dashboard";
import Administrasi from "@/pages/administrasi";
import Siswa from "@/pages/siswa";
import Jurnal from "@/pages/jurnal";
import Kalender from "@/pages/kalender";
import Prosem from "@/pages/prosem";
import InfoPekanan from "@/pages/info-pekanan";
import Absensi from "@/pages/absensi";
import Nilai from "@/pages/nilai";
import Poin from "@/pages/poin";
import Guru from "@/pages/guru";
import Register from "@/pages/register";
import Kepsek from "@/pages/kepsek";
import Kurikulum from "@/pages/kurikulum";
import Kesiswaan from "@/pages/kesiswaan";
import WaliKelas from "@/pages/walikelas";
import AkunSiswa from "@/pages/akun-siswa";
import ModulAjar from "@/pages/modul-ajar";
import SoalOtomatis from "@/pages/soal-otomatis";
import FeedbackAdmin from "@/pages/feedback";
import Pengaturan from "@/pages/pengaturan";
import Direktori from "@/pages/direktori";
import Jadwal from "@/pages/jadwal";
import Rekap from "@/pages/rekap";
import NotFound from "@/pages/not-found";

const queryClient = new QueryClient();

function ProtectedRoute({
  component: Component,
  adminOnly = false,
}: {
  component: React.ComponentType;
  adminOnly?: boolean;
}) {
  const { user, isLoading } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!isLoading && !user) {
      setLocation("/login");
    } else if (!isLoading && user && adminOnly && !user.isAdmin) {
      setLocation("/dashboard");
    }
  }, [user, isLoading, adminOnly, setLocation]);

  if (isLoading) return <div className="min-h-screen flex items-center justify-center">Memuat...</div>;
  if (!user) return null;
  if (adminOnly && !user.isAdmin) return null;

  return <Component />;
}

function Router() {
  return (
    <Switch>
      <Route path="/login" component={Login} />
      <Route path="/register" component={Register} />
      <Route path="/" component={() => <ProtectedRoute component={Dashboard} />} />
      <Route path="/dashboard" component={() => <ProtectedRoute component={Dashboard} />} />
      <Route path="/administrasi" component={() => <ProtectedRoute component={Administrasi} />} />
      <Route path="/siswa" component={() => <ProtectedRoute component={Siswa} adminOnly />} />
      <Route path="/jurnal" component={() => <ProtectedRoute component={Jurnal} />} />
      <Route path="/kalender" component={() => <ProtectedRoute component={Kalender} adminOnly />} />
      <Route path="/prosem" component={() => <ProtectedRoute component={Prosem} />} />
      <Route path="/info-pekanan" component={() => <ProtectedRoute component={InfoPekanan} />} />
      <Route path="/absensi" component={() => <ProtectedRoute component={Absensi} />} />
      <Route path="/nilai" component={() => <ProtectedRoute component={Nilai} />} />
      <Route path="/poin" component={() => <ProtectedRoute component={Poin} />} />
      <Route path="/guru" component={() => <ProtectedRoute component={Guru} adminOnly />} />
      <Route path="/kepsek" component={() => <ProtectedRoute component={Kepsek} />} />
      <Route path="/kurikulum" component={() => <ProtectedRoute component={Kurikulum} />} />
      <Route path="/kesiswaan" component={() => <ProtectedRoute component={Kesiswaan} />} />
      <Route path="/walikelas" component={() => <ProtectedRoute component={WaliKelas} />} />
      <Route path="/akun-siswa" component={() => <ProtectedRoute component={AkunSiswa} />} />
      <Route path="/modul-ajar" component={() => <ProtectedRoute component={ModulAjar} />} />
      <Route path="/soal-otomatis" component={() => <ProtectedRoute component={SoalOtomatis} />} />
      <Route path="/feedback" component={() => <ProtectedRoute component={FeedbackAdmin} adminOnly />} />
      <Route path="/pengaturan" component={() => <ProtectedRoute component={Pengaturan} />} />
      <Route path="/direktori" component={() => <ProtectedRoute component={Direktori} />} />
      <Route path="/jadwal" component={() => <ProtectedRoute component={Jadwal} />} />
      <Route path="/rekap" component={() => <ProtectedRoute component={Rekap} />} />
      <Route component={NotFound} />
    </Switch>
  );
}

function AppWithTheme() {
  const { user } = useAuth();
  return (
    <ThemeProvider userId={user?.id ?? null}>
      <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
        <Router />
      </WouterRouter>
      <Toaster />
    </ThemeProvider>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <AppWithTheme />
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
