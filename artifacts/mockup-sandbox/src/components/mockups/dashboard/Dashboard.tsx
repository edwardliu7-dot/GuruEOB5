import React from 'react';
import { 
  Users, 
  PenLine, 
  FileText, 
  CheckCircle, 
  AlertTriangle,
  Clock,
  Calendar,
  ChevronRight,
  BookOpen,
  FileCheck,
  TrendingUp
} from 'lucide-react';

export function Dashboard() {
  return (
    <div className="bg-[#f5f5f4] min-h-screen p-6 font-sans text-slate-800">
      {/* Header */}
      <div className="flex justify-between items-end mb-6">
        <div>
          <div className="text-xs text-slate-400 mb-2 flex items-center gap-1">
            <span>Dashboard</span>
            <ChevronRight className="w-3 h-3" />
            <span className="text-slate-600 font-medium">Overview</span>
          </div>
          <h1 className="text-xl font-bold text-slate-800">Overview</h1>
          <p className="text-sm text-slate-500 mt-1">Selamat datang kembali, Koko Komarudin</p>
        </div>
        <div>
          <button className="rounded-full bg-slate-800 text-white px-4 py-2 text-sm font-medium hover:bg-slate-700 transition-colors">
            Tulis Jurnal
          </button>
        </div>
      </div>

      {/* Pill Switcher */}
      <div className="flex items-center gap-2 mb-6">
        <button className="px-4 py-1.5 rounded-full bg-slate-800 text-white text-sm font-medium shadow-sm">
          Ringkasan
        </button>
        <button className="px-4 py-1.5 rounded-full bg-white border border-slate-200 text-slate-600 text-sm font-medium hover:bg-slate-50 shadow-sm transition-colors">
          Jadwal Mengajar
        </button>
        <button className="px-4 py-1.5 rounded-full bg-white border border-slate-200 text-slate-600 text-sm font-medium hover:bg-slate-50 shadow-sm transition-colors">
          Tugas & Nilai
        </button>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-4 gap-5 mb-6">
        <StatCard 
          title="Total Siswa" 
          value="128" 
          color="blue" 
          icon={<Users className="w-6 h-6" />}
          progress="100%"
        />
        <StatCard 
          title="Jurnal Bulan Ini" 
          value="18/22" 
          color="violet" 
          icon={<PenLine className="w-6 h-6" />}
          progress="81%"
        />
        <StatCard 
          title="Total Dokumen" 
          value="47" 
          color="amber" 
          icon={<FileText className="w-6 h-6" />}
          progress="65%"
        />
        <StatCard 
          title="Rata-rata Kehadiran" 
          value="94%" 
          color="emerald" 
          icon={<CheckCircle className="w-6 h-6" />}
          progress="94%"
        />
      </div>

      {/* Main Content */}
      <div className="flex gap-5 items-start">
        {/* Left Column */}
        <div className="flex-1 flex flex-col gap-5">
          {/* Chart Section */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 relative overflow-hidden">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-base font-bold text-slate-800">Progres Jurnal Mengajar</h2>
                <p className="text-sm text-slate-500 mt-0.5">22 dari 24 pekan tercatat pada semester ini</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-100 px-3 py-1 rounded-full">
                  <TrendingUp className="w-3.5 h-3.5" /> Sesuai Target
                </span>
              </div>
            </div>
            
            <div className="h-56 flex items-end gap-6 mt-8 pb-2 px-4">
              <Bar label="Senin" value={4} max={5} />
              <Bar label="Selasa" value={5} max={5} />
              <Bar label="Rabu" value={3} max={5} />
              <Bar label="Kamis" value={5} max={5} />
              <Bar label="Jumat" value={5} max={5} />
            </div>
          </div>

          {/* Attention Needed */}
          <div>
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Perlu Perhatian</h3>
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="divide-y divide-slate-100">
                <AttentionItem 
                  title="Kelas VII A"
                  desc="2 siswa alpa pada pelajaran Matematika hari ini"
                  time="2 jam yang lalu"
                />
                <AttentionItem 
                  title="Kelas VIII B"
                  desc="Nilai Ulangan Harian 2 belum diinput"
                  time="Kemarin"
                />
                <AttentionItem 
                  title="Perangkat Ajar"
                  desc="RPP untuk pekan depan belum diunggah"
                  time="Kemarin"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="w-72 flex flex-col gap-5">
          {/* Recent Activity */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
            <div className="flex items-center gap-2 mb-5 pb-3 border-b border-slate-100">
              <Clock className="w-4 h-4 text-slate-500" />
              <h2 className="text-sm font-bold text-slate-800">Aktivitas Terbaru</h2>
            </div>
            <div className="flex flex-col gap-5">
              <ActivityItem icon={<BookOpen />} color="blue" title="Jurnal diisi" desc="Kelas VII A - Matematika" time="10:30" />
              <ActivityItem icon={<FileCheck />} color="emerald" title="Tugas dinilai" desc="15 siswa Kelas VIII B" time="09:15" />
              <ActivityItem icon={<Users />} color="violet" title="Absensi" desc="Kelas VII C disubmit" time="07:45" />
              <ActivityItem icon={<BookOpen />} color="blue" title="Jurnal diisi" desc="Kelas IX A - Fisika" time="Kemrn" />
              <ActivityItem icon={<FileText />} color="amber" title="Modul diunggah" desc="Bab 4: Tata Surya" time="Kemrn" />
              <ActivityItem icon={<FileCheck />} color="emerald" title="Tugas dinilai" desc="28 siswa Kelas VII A" time="2 hr" />
            </div>
          </div>

          {/* Academic Calendar */}
          <div className="bg-slate-800 rounded-xl shadow-sm p-6 text-white relative overflow-hidden">
            <div className="absolute -top-4 -right-4 opacity-10">
              <Calendar className="w-32 h-32" />
            </div>
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-3">
                <Calendar className="w-4 h-4 text-slate-300" />
                <h2 className="text-xs uppercase tracking-wider font-bold text-slate-300">Kalender Akademik</h2>
              </div>
              <p className="text-2xl font-black mb-1">Semester Ganjil</p>
              <p className="text-slate-400 text-sm mb-5">Tahun Ajaran 2023/2024</p>
              
              <div className="bg-white/10 rounded-xl p-3.5 backdrop-blur-sm border border-white/10">
                <p className="text-xs text-slate-300 mb-1.5 font-medium">Pekan Penilaian Tengah Semester</p>
                <p className="text-sm font-bold text-white">9 - 14 Oktober 2023</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, color, icon, progress }: { title: string, value: string, color: string, icon: React.ReactNode, progress: string }) {
  const colorMap: Record<string, string> = {
    blue: "bg-blue-100 text-blue-600 bg-blue-500",
    violet: "bg-violet-100 text-violet-600 bg-violet-500",
    amber: "bg-amber-100 text-amber-600 bg-amber-500",
    emerald: "bg-emerald-100 text-emerald-600 bg-emerald-500"
  };
  
  const colors = colorMap[color].split(" ");

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 relative overflow-hidden">
      <div className="flex items-center gap-4">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${colors[0]} ${colors[1]}`}>
          {icon}
        </div>
        <div>
          <div className="text-3xl font-black text-slate-800 tracking-tight leading-none mb-1">{value}</div>
          <div className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">{title}</div>
        </div>
      </div>
      <div className="h-1 absolute bottom-0 left-0 right-0 bg-slate-100">
        <div className={`h-full ${colors[2]}`} style={{ width: progress }}></div>
      </div>
    </div>
  );
}

function Bar({ label, value, max }: { label: string, value: number, max: number }) {
  const height = (value / max) * 100;
  const isFull = value === max;
  return (
    <div className="flex-1 flex flex-col items-center gap-3 group h-full justify-end">
      <div className="w-full bg-slate-100 rounded-t-lg relative h-full flex items-end overflow-hidden">
        <div 
          className={`w-full rounded-t-lg transition-all duration-500 ${isFull ? 'bg-slate-800' : 'bg-slate-300'}`}
          style={{ height: `${height}%` }}
        ></div>
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900/40 backdrop-blur-sm rounded-t-lg">
          <span className="text-white text-xs font-bold">{value}</span>
        </div>
      </div>
      <span className="text-xs font-bold text-slate-500">{label}</span>
    </div>
  );
}

function AttentionItem({ title, desc, time }: { title: string, desc: string, time: string }) {
  return (
    <div className="flex items-start gap-4 p-4 hover:bg-slate-50 transition-colors">
      <div className="w-8 h-8 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center shrink-0 mt-0.5">
        <AlertTriangle className="w-4 h-4" />
      </div>
      <div className="flex-1">
        <h4 className="text-sm font-bold text-slate-800">{title}</h4>
        <p className="text-sm text-slate-600 mt-0.5">{desc}</p>
        <span className="text-[11px] font-medium text-slate-400 mt-2 block">{time}</span>
      </div>
      <button className="text-xs font-bold text-slate-600 border border-slate-200 rounded-full px-3.5 py-1.5 hover:bg-slate-100 transition-colors">
        Tinjau
      </button>
    </div>
  );
}

function ActivityItem({ icon, color, title, desc, time }: { icon: React.ReactElement, color: string, title: string, desc: string, time: string }) {
  const colorMap: Record<string, string> = {
    blue: "bg-blue-100 text-blue-600",
    emerald: "bg-emerald-100 text-emerald-600",
    violet: "bg-violet-100 text-violet-600",
    amber: "bg-amber-100 text-amber-600"
  };
  
  return (
    <div className="flex items-start gap-3.5">
      <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${colorMap[color]}`}>
        {React.cloneElement(icon, { className: "w-4 h-4" })}
      </div>
      <div className="flex-1 min-w-0 pt-0.5">
        <div className="flex justify-between items-baseline gap-2 mb-0.5">
          <h4 className="text-sm font-bold text-slate-800 truncate">{title}</h4>
          <span className="text-[10px] font-medium text-slate-400 whitespace-nowrap">{time}</span>
        </div>
        <p className="text-xs text-slate-500 truncate">{desc}</p>
      </div>
    </div>
  );
}
