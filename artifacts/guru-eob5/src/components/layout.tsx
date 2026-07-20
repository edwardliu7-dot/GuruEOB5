import { Link, useLocation } from "wouter";
import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { LogOut, LayoutDashboard, FolderOpen, Users, BookOpen, ClipboardCheck, GraduationCap, Star, BarChart3, ClipboardList, ShieldCheck, Home, CalendarDays, CalendarRange, Megaphone, Sparkles, ListChecks, KeyRound, Inbox, Bell, Settings2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { ProfileDialog } from "@/components/profile-dialog";
import { FeedbackWidget } from "@/components/feedback-widget";
import { WhatsNewDialog, useWhatsNew } from "@/components/whats-new-dialog";
import { hasUnseenUpdate } from "@/lib/changelog";
import { formatJabatan } from "@/lib/options";
import logoUrl from "@/assets/logo.png";
import { useQuery } from "@tanstack/react-query";
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarInset,
  SidebarTrigger,
} from "@/components/ui/sidebar";

const SIDEBAR_COOKIE_NAME = "sidebar_state";

function getStoredSidebarOpen(): boolean {
  if (typeof document === "undefined") return true;
  const match = document.cookie.match(new RegExp(`${SIDEBAR_COOKIE_NAME}=(true|false)`));
  return match ? match[1] === "true" : true;
}

export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { user, logout } = useAuth();
  const [profileOpen, setProfileOpen] = useState(false);
  const { open: whatsNewOpen, setOpen: setWhatsNewOpen } = useWhatsNew();
  const [hasBadge, setHasBadge] = useState(() => hasUnseenUpdate());

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

  // Fetch unread feedback count for admin badge
  const { data: unreadData } = useQuery<{ count: number }>({
    queryKey: ["/api/feedback/unread-count"],
    queryFn: () =>
      fetch("/api/feedback/unread-count", { credentials: "include" }).then((r) => r.json()),
    enabled: isAdmin,
    refetchInterval: 60_000, // refresh every minute
    staleTime: 30_000,
  });
  const unreadCount = unreadData?.count ?? 0;

  const utamaNavItems = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/pengaturan", label: "Pengaturan Tampilan", icon: Settings2 },
  ];

  const perangkatMengajarNavItems = [
    { href: "/administrasi", label: "Administrasi", icon: FolderOpen },
    { href: "/modul-ajar", label: "Buat Modul Ajar", icon: Sparkles },
    { href: "/soal-otomatis", label: "Buat Soal Otomatis", icon: ListChecks },
    { href: "/prosem", label: "Program Semester", icon: CalendarRange },
    { href: "/info-pekanan", label: "Info Pekanan", icon: Megaphone },
    ...(isAdmin ? [{ href: "/kalender", label: "Kalender Akademik", icon: CalendarDays }] : []),
    ...(isAdmin ? [{ href: "/siswa", label: "Data Siswa", icon: Users }] : []),
    ...(isAdmin ? [{ href: "/guru", label: "Data Guru", icon: Users }] : []),
    ...(isAdmin ? [{ href: "/feedback", label: "Kotak Masuk", icon: Inbox, badge: unreadCount }] : []),
  ];

  const kegiatanBelajarMengajarNavItems = [
    { href: "/absensi", label: "Absensi", icon: ClipboardCheck },
    { href: "/jurnal", label: "Jurnal Mengajar", icon: BookOpen },
    { href: "/nilai", label: "Nilai", icon: GraduationCap },
    { href: "/poin", label: "Poin Siswa", icon: Star },
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
      ? [
          { href: "/walikelas", label: "Rekap Wali Kelas", icon: Home },
          { href: "/akun-siswa", label: "Akun Siswa", icon: KeyRound },
        ]
      : []),
  ];

  return (
    <SidebarProvider defaultOpen={getStoredSidebarOpen()}>
      <Sidebar collapsible="icon">
        <SidebarHeader className="h-16 flex-row items-center justify-center border-b border-sidebar-border px-2">
          <img src={logoUrl} alt="GuruEOB5" className="h-10 w-auto group-data-[collapsible=icon]:h-7" />
        </SidebarHeader>

        <SidebarContent className="px-2 py-4">
          <SidebarGroup>
            <SidebarGroupLabel>Utama</SidebarGroupLabel>
            <SidebarMenu>
              {utamaNavItems.map((item) => {
                const isActive = location === item.href || (location === "/" && item.href === "/dashboard");
                const Icon = item.icon;
                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton asChild isActive={isActive} tooltip={item.label}>
                      <Link href={item.href}>
                        <Icon />
                        <span>{item.label}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroup>

          <SidebarGroup>
            <SidebarGroupLabel>Perangkat Mengajar</SidebarGroupLabel>
            <SidebarMenu>
              {perangkatMengajarNavItems.map((item) => {
                const isActive = location === item.href;
                const Icon = item.icon;
                const badge = (item as any).badge ?? 0;
                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton asChild isActive={isActive} tooltip={item.label}>
                      <Link href={item.href}>
                        <Icon />
                        <span className="flex-1">{item.label}</span>
                        {badge > 0 && (
                          <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1.5 text-[10px] font-bold text-white group-data-[collapsible=icon]:hidden">
                            {badge > 99 ? "99+" : badge}
                          </span>
                        )}
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroup>

          <SidebarGroup>
            <SidebarGroupLabel>Kegiatan Belajar Mengajar</SidebarGroupLabel>
            <SidebarMenu>
              {kegiatanBelajarMengajarNavItems.map((item) => {
                const isActive = location === item.href;
                const Icon = item.icon;
                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton asChild isActive={isActive} tooltip={item.label}>
                      <Link href={item.href}>
                        <Icon />
                        <span>{item.label}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroup>

          {roleNavItems.length > 0 && (
            <SidebarGroup>
              <SidebarGroupLabel>Menu Jabatan</SidebarGroupLabel>
              <SidebarMenu>
                {roleNavItems.map((item) => {
                  const isActive = location === item.href;
                  const Icon = item.icon;
                  return (
                    <SidebarMenuItem key={item.href}>
                      <SidebarMenuButton asChild isActive={isActive} tooltip={item.label}>
                        <Link href={item.href}>
                          <Icon />
                          <span>{item.label}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroup>
          )}
        </SidebarContent>

        <SidebarFooter className="border-t border-sidebar-border p-3">
          <button
            type="button"
            onClick={() => setProfileOpen(true)}
            className="w-full flex items-center gap-3 mb-3 px-2 py-1.5 rounded-md hover:bg-sidebar-accent/50 transition-colors text-left group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0"
          >
            <Avatar className="w-9 h-9 shrink-0">
              {user?.photoUrl ? <AvatarImage src={user.photoUrl} alt={user.name} /> : null}
              <AvatarFallback className="bg-sidebar-accent text-sidebar-foreground/70 text-xs">{initials}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0 group-data-[collapsible=icon]:hidden">
              <p className="text-sm font-medium truncate">{user?.name}</p>
              <p className="text-xs text-sidebar-foreground/50 truncate">{formatJabatan(user?.jabatan)}</p>
            </div>
          </button>
          {/* What's New button */}
          <Button
            variant="ghost"
            className="w-full justify-start text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/50 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0 mb-1"
            onClick={() => { setWhatsNewOpen(true); setHasBadge(false); }}
          >
            <span className="relative group-data-[collapsible=icon]:mr-0 mr-2">
              <Bell className="w-4 h-4" />
              {hasBadge && (
                <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-red-500 ring-1 ring-sidebar" />
              )}
            </span>
            <span className="group-data-[collapsible=icon]:hidden">Yang Baru</span>
            {hasBadge && (
              <span className="ml-auto rounded-full bg-red-500 px-1.5 py-0.5 text-[10px] font-bold text-white group-data-[collapsible=icon]:hidden">
                Baru
              </span>
            )}
          </Button>

          <Button
            variant="ghost"
            className="w-full justify-start text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/50 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0"
            onClick={handleLogout}
          >
            <LogOut className="w-4 h-4 group-data-[collapsible=icon]:mr-0 mr-2" />
            <span className="group-data-[collapsible=icon]:hidden">Keluar</span>
          </Button>
        </SidebarFooter>
      </Sidebar>

      <ProfileDialog open={profileOpen} onOpenChange={setProfileOpen} />
      <WhatsNewDialog
        open={whatsNewOpen}
        onOpenChange={(v) => {
          setWhatsNewOpen(v);
          if (!v) setHasBadge(false);
        }}
      />
      <FeedbackWidget />

      <SidebarInset className="h-svh min-w-0 overflow-hidden bg-[#F8FAFC]">
        <div className="h-14 flex items-center gap-2 px-4 border-b border-border shrink-0 md:h-16 md:px-6 bg-white">
          <SidebarTrigger />
          <img src={logoUrl} alt="GuruEOB5" className="h-8 w-auto md:hidden" />
        </div>
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-10">
          <div className="max-w-6xl mx-auto">
            {children}
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
