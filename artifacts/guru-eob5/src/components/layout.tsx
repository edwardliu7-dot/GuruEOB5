import { Link, useLocation } from "wouter";
import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { LogOut, LayoutDashboard, FolderOpen, Users, BookOpen, ClipboardCheck, GraduationCap, Star, BarChart3, ClipboardList, ShieldCheck, Home, CalendarDays, CalendarRange, Megaphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { ProfileDialog } from "@/components/profile-dialog";
import { formatJabatan } from "@/lib/options";
import logoUrl from "@/assets/logo.png";

export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { user, logout } = useAuth();
  const [profileOpen, setProfileOpen] = useState(false);

  const initials = (user?.name ?? "?")
    .split(" ")
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const handleLogout = async () => {
    await logout();
    window.location.href = "/login";
  };

  const isAdmin = user?.isAdmin ?? false;

  const navItems = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/administrasi", label: "Administrasi", icon: FolderOpen },
    ...(isAdmin ? [{ href: "/siswa", label: "Data Siswa", icon: Users }] : []),
    ...(isAdmin ? [{ href: "/kalender", label: "Kalender Akademik", icon: CalendarDays }] : []),
    { href: "/prosem", label: "Program Semester", icon: CalendarRange },
    { href: "/jurnal", label: "Jurnal Mengajar", icon: BookOpen },
    { href: "/info-pekanan", label: "Info Pekanan", icon: Megaphone },
    { href: "/absensi", label: "Absensi", icon: ClipboardCheck },
    { href: "/nilai", label: "Nilai", icon: GraduationCap },
    { href: "/poin", label: "Poin Siswa", icon: Star },
    ...(isAdmin ? [{ href: "/guru", label: "Data Guru", icon: Users }] : []),
  ];

  const jabatan = user?.jabatan ?? [];
  const roleNavItems = [
    ...(jabatan.includes("kepala_sekolah")
      ? [{ href: "/kepsek", label: "Progres Guru", icon: BarChart3 }]
      : []),
    ...(jabatan.includes("kepala_sekolah") ||
    (jabatan.includes("wakasek") && user?.wakasekBidang === "Kurikulum")
      ? [{ href: "/kurikulum", label: "Supervisi Kurikulum", icon: ShieldCheck }]
      : []),
    ...(jabatan.includes("kepala_sekolah") ||
    (jabatan.includes("wakasek") && user?.wakasekBidang === "Kesiswaan")
      ? [{ href: "/kesiswaan", label: "Rekap Kesiswaan", icon: ClipboardList }]
      : []),
    ...(jabatan.includes("wali_kelas")
      ? [{ href: "/walikelas", label: "Rekap Wali Kelas", icon: Home }]
      : []),
  ];

  return (
    <div className="flex h-screen w-full bg-background overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 bg-sidebar text-sidebar-foreground flex flex-col border-r border-sidebar-border shrink-0">
        <div className="h-16 flex items-center px-6 border-b border-sidebar-border shrink-0">
          <div className="flex items-center gap-2">
            <img src={logoUrl} alt="GuruEOB5" className="h-12 w-auto" />
          </div>
        </div>
        
        <div className="flex-1 py-6 px-4 flex flex-col gap-1 overflow-y-auto">
          <div className="text-xs font-semibold text-sidebar-foreground/50 uppercase tracking-wider mb-2 px-2">Menu Utama</div>
          {navItems.map((item) => {
            const isActive = location === item.href || (location === "/" && item.href === "/dashboard");
            const Icon = item.icon;
            return (
              <Link key={item.href} href={item.href} className={`flex items-center gap-3 px-3 py-2.5 rounded-md transition-colors ${
                isActive 
                  ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium" 
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
              }`}>
                <Icon className="w-4 h-4" />
                <span className="text-sm">{item.label}</span>
              </Link>
            );
          })}

          {roleNavItems.length > 0 && (
            <>
              <div className="text-xs font-semibold text-sidebar-foreground/50 uppercase tracking-wider mb-2 mt-6 px-2">Menu Jabatan</div>
              {roleNavItems.map((item) => {
                const isActive = location === item.href;
                const Icon = item.icon;
                return (
                  <Link key={item.href} href={item.href} className={`flex items-center gap-3 px-3 py-2.5 rounded-md transition-colors ${
                    isActive
                      ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                      : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                  }`}>
                    <Icon className="w-4 h-4" />
                    <span className="text-sm">{item.label}</span>
                  </Link>
                );
              })}
            </>
          )}
        </div>
        
        <div className="p-4 border-t border-sidebar-border shrink-0">
          <button
            type="button"
            onClick={() => setProfileOpen(true)}
            className="w-full flex items-center gap-3 mb-4 px-2 py-1.5 rounded-md hover:bg-sidebar-accent/50 transition-colors text-left"
          >
            <Avatar className="w-9 h-9">
              {user?.photoUrl ? <AvatarImage src={user.photoUrl} alt={user.name} /> : null}
              <AvatarFallback className="bg-sidebar-accent text-sidebar-foreground/70 text-xs">{initials}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{user?.name}</p>
              <p className="text-xs text-sidebar-foreground/50 truncate">{formatJabatan(user?.jabatan)}</p>
            </div>
          </button>
          <Button 
            variant="ghost" 
            className="w-full justify-start text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/50" 
            onClick={handleLogout}
          >
            <LogOut className="w-4 h-4 mr-2" />
            Keluar
          </Button>
        </div>
      </aside>

      <ProfileDialog open={profileOpen} onOpenChange={setProfileOpen} />

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative bg-[#F8FAFC]">
        <div className="flex-1 overflow-y-auto p-6 md:p-10">
          <div className="max-w-6xl mx-auto">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
