import { Layout } from "@/components/layout";
import { useGetDashboardSummary } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, UserSquare2, FileText, CheckCircle2, XCircle } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

export default function Dashboard() {
  const { data: summary, isLoading } = useGetDashboardSummary();

  return (
    <Layout>
      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight font-serif text-foreground">Overview</h1>
          <p className="text-muted-foreground mt-1">
            {isLoading ? <Skeleton className="h-5 w-64" /> : `${summary?.schoolName} • Tahun Ajaran ${summary?.tahunAjaran} • Semester ${summary?.semester}`}
          </p>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="border-none shadow-sm ring-1 ring-black/5">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                  <Users className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Siswa</p>
                  {isLoading ? <Skeleton className="h-8 w-16 mt-1" /> : <h2 className="text-3xl font-bold">{summary?.totalSiswa}</h2>}
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-none shadow-sm ring-1 ring-black/5">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-500">
                  <UserSquare2 className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Guru</p>
                  {isLoading ? <Skeleton className="h-8 w-16 mt-1" /> : <h2 className="text-3xl font-bold">{summary?.totalGuru}</h2>}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm ring-1 ring-black/5">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-500">
                  <FileText className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Dokumen</p>
                  {isLoading ? <Skeleton className="h-8 w-16 mt-1" /> : <h2 className="text-3xl font-bold">{summary?.totalDokumen}</h2>}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className={`border-none shadow-sm ring-1 ring-black/5 relative overflow-hidden ${summary?.jurnalHariIniTerisi ? 'bg-emerald-500' : 'bg-rose-500'}`}>
            <CardContent className="p-6 text-white">
              <div className="flex items-center gap-4 relative z-10">
                <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center text-white">
                  {summary?.jurnalHariIniTerisi ? <CheckCircle2 className="w-6 h-6" /> : <XCircle className="w-6 h-6" />}
                </div>
                <div>
                  <p className="text-sm font-medium text-white/80">Jurnal Hari Ini</p>
                  {isLoading ? (
                    <Skeleton className="h-8 w-24 mt-1 bg-white/20" />
                  ) : (
                    <h2 className="text-xl font-bold leading-tight mt-1">
                      {summary?.jurnalHariIniTerisi ? "Sudah Terisi" : "Belum Terisi"}
                    </h2>
                  )}
                </div>
              </div>
              <div className="absolute -right-4 -bottom-4 opacity-10">
                 {summary?.jurnalHariIniTerisi ? <CheckCircle2 className="w-32 h-32" /> : <XCircle className="w-32 h-32" />}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="col-span-1 lg:col-span-2 border-none shadow-sm ring-1 ring-black/5">
            <CardHeader>
              <CardTitle className="text-lg font-serif">Progres Jurnal Bulan Ini</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-[300px] w-full" />
              ) : (
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={summary?.progresJurnalBulanIni || []}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                      <XAxis dataKey="minggu" axisLine={false} tickLine={false} tick={{fill: 'hsl(var(--muted-foreground))', fontSize: 12}} dy={10} />
                      <YAxis axisLine={false} tickLine={false} tick={{fill: 'hsl(var(--muted-foreground))', fontSize: 12}} dx={-10} />
                      <RechartsTooltip 
                        cursor={{fill: 'hsl(var(--muted)/0.5)'}}
                        contentStyle={{borderRadius: '8px', border: '1px solid hsl(var(--border))', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
                      />
                      <Bar dataKey="jumlah" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} maxBarSize={50} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="col-span-1 border-none shadow-sm ring-1 ring-black/5">
            <CardHeader>
              <CardTitle className="text-lg font-serif">Kelengkapan Administrasi</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center pt-8 pb-12">
              {isLoading ? (
                <div className="flex flex-col items-center w-full">
                  <Skeleton className="h-32 w-32 rounded-full mb-6" />
                  <Skeleton className="h-4 w-full" />
                </div>
              ) : (
                <>
                  <div className="relative w-40 h-40 flex items-center justify-center mb-8">
                    <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                      <circle
                        className="text-muted stroke-current"
                        strokeWidth="10"
                        cx="50"
                        cy="50"
                        r="40"
                        fill="transparent"
                      />
                      <circle
                        className="text-primary stroke-current transition-all duration-1000 ease-out"
                        strokeWidth="10"
                        strokeLinecap="round"
                        cx="50"
                        cy="50"
                        r="40"
                        fill="transparent"
                        strokeDasharray={`${(summary?.kelengkapanAdministrasiPersen || 0) * 2.51} 251.2`}
                      />
                    </svg>
                    <div className="absolute flex flex-col items-center justify-center">
                      <span className="text-4xl font-bold font-serif">{summary?.kelengkapanAdministrasiPersen}%</span>
                    </div>
                  </div>
                  <div className="w-full space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Status</span>
                      <span className="font-medium">
                        {(summary?.kelengkapanAdministrasiPersen || 0) >= 80 ? 'Sangat Baik' : 
                         (summary?.kelengkapanAdministrasiPersen || 0) >= 50 ? 'Cukup' : 'Perlu Perhatian'}
                      </span>
                    </div>
                    <Progress value={summary?.kelengkapanAdministrasiPersen || 0} className="h-2" />
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}
