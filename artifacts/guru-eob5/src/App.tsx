import { Switch, Route, Router as WouterRouter, useLocation } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/lib/auth";
import { useEffect } from "react";

// Pages
import Login from "@/pages/login";
import Dashboard from "@/pages/dashboard";
import Administrasi from "@/pages/administrasi";
import Siswa from "@/pages/siswa";
import Jurnal from "@/pages/jurnal";
import Absensi from "@/pages/absensi";
import Nilai from "@/pages/nilai";
import Poin from "@/pages/poin";
import Guru from "@/pages/guru";
import NotFound from "@/pages/not-found";

const queryClient = new QueryClient();

function ProtectedRoute({ component: Component }: { component: React.ComponentType }) {
  const { user, isLoading } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!isLoading && !user) {
      setLocation("/login");
    }
  }, [user, isLoading, setLocation]);

  if (isLoading) return <div className="min-h-screen flex items-center justify-center">Memuat...</div>;
  if (!user) return null;

  return <Component />;
}

function Router() {
  return (
    <Switch>
      <Route path="/login" component={Login} />
      <Route path="/" component={() => <ProtectedRoute component={Dashboard} />} />
      <Route path="/dashboard" component={() => <ProtectedRoute component={Dashboard} />} />
      <Route path="/administrasi" component={() => <ProtectedRoute component={Administrasi} />} />
      <Route path="/siswa" component={() => <ProtectedRoute component={Siswa} />} />
      <Route path="/jurnal" component={() => <ProtectedRoute component={Jurnal} />} />
      <Route path="/absensi" component={() => <ProtectedRoute component={Absensi} />} />
      <Route path="/nilai" component={() => <ProtectedRoute component={Nilai} />} />
      <Route path="/poin" component={() => <ProtectedRoute component={Poin} />} />
      <Route path="/guru" component={() => <ProtectedRoute component={Guru} />} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <Router />
          </WouterRouter>
          <Toaster />
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
