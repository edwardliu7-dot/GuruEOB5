import React, { useState } from "react";
import { 
  ChevronRight, 
  Download, 
  Calendar, 
  PieChart, 
  TrendingUp, 
  AlertTriangle,
  FileText,
  UserX,
  CheckCircle2,
  AlertCircle
} from "lucide-react";

export function RekapAnalitik() {
  const [activeTab, setActiveTab] = useState("Absensi");

  return (
    <div className="min-h-screen bg-[#f5f5f4] p-6 font-sans text-slate-800">
      {/* Top Header */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <div className="flex items-center text-xs text-slate-400 mb-2">
            <span>Dashboard</span>
            <ChevronRight className="w-3 h-3 mx-1" />
            <span className="text-slate-600">Rekap & Analitik</span>
          </div>
          <h1 className="text-xl font-bold text-slate-800">Rekap & Analitik</h1>
          <p className="text-sm text-slate-500 mt-1">Data agregat semester ini (Juli - Desember 2023)</p>
        </div>
        <div className="flex gap-2">
          <button className="flex items-center gap-2 rounded-full bg-white border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 shadow-sm transition-colors">
            <Calendar className="w-4 h-4" />
            Semester Ganjil
          </button>
          <button className="flex items-center gap-2 rounded-full bg-slate-800 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 shadow-sm transition-colors">
            <Download className="w-4 h-4" />
            Eksport Laporan
          </button>
        </div>
      </div>

      {/* Pill Switcher */}
      <div className="flex gap-2 mb-6">
        {["Absensi", "Nilai"].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-5 py-2 rounded-full text-sm font-medium transition-colors ${
              activeTab === tab
                ? "bg-slate-800 text-white shadow-sm"
                : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-6">
        {/* Stat 1 */}
        <div className="relative overflow-hidden bg-white rounded-xl border border-slate-200 shadow-sm p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center shrink-0">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs uppercase tracking-wide text-slate-500 font-semibold mb-1">Total Sesi</div>
            <div className="text-3xl font-black text-slate-800">84</div>
          </div>
          <div className="h-1 absolute bottom-0 left-0 right-0 bg-slate-200"></div>
        </div>

        {/* Stat 2 */}
        <div className="relative overflow-hidden bg-white rounded-xl border border-slate-200 shadow-sm p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs uppercase tracking-wide text-slate-500 font-semibold mb-1">Rata-rata Hadir</div>
            <div className="text-3xl font-black text-slate-800">91%</div>
          </div>
          <div className="h-1 absolute bottom-0 left-0 right-0 bg-emerald-500"></div>
        </div>

        {/* Stat 3 */}
        <div className="relative overflow-hidden bg-white rounded-xl border border-slate-200 shadow-sm p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-red-100 text-red-600 flex items-center justify-center shrink-0">
            <UserX className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs uppercase tracking-wide text-slate-500 font-semibold mb-1">Total Alpa</div>
            <div className="text-3xl font-black text-slate-800">23</div>
          </div>
          <div className="h-1 absolute bottom-0 left-0 right-0 bg-red-500"></div>
        </div>

        {/* Stat 4 */}
        <div className="relative overflow-hidden bg-white rounded-xl border border-slate-200 shadow-sm p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center shrink-0">
            <AlertCircle className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs uppercase tracking-wide text-slate-500 font-semibold mb-1">Total Izin+Sakit</div>
            <div className="text-3xl font-black text-slate-800">47</div>
          </div>
          <div className="h-1 absolute bottom-0 left-0 right-0 bg-amber-500"></div>
        </div>
      </div>

      {/* Main Chart Area */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 mb-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-lg font-bold text-slate-800">Tren Kehadiran Bulanan</h2>
            <p className="text-sm text-slate-500">Distribusi status absensi per bulan</p>
          </div>
          <div className="flex gap-4 text-xs font-medium bg-slate-50 px-4 py-2 rounded-full border border-slate-100">
            <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>Hadir</div>
            <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>Sakit</div>
            <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>Izin</div>
            <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-red-500"></span>Alpa</div>
          </div>
        </div>

        <div className="space-y-6 mt-8">
          {[
            { month: "Juli", h: 88, s: 5, i: 4, a: 3 },
            { month: "Agustus", h: 92, s: 4, i: 2, a: 2 },
            { month: "September", h: 85, s: 8, i: 4, a: 3 },
            { month: "Oktober", h: 89, s: 6, i: 3, a: 2 },
            { month: "November", h: 94, s: 3, i: 2, a: 1 },
            { month: "Desember", h: 82, s: 7, i: 6, a: 5 },
          ].map((data, i) => (
            <div key={i} className="flex items-center gap-4">
              <div className="w-20 text-sm font-medium text-slate-600">{data.month}</div>
              <div className="flex-1 h-8 flex rounded-md overflow-hidden bg-slate-100">
                <div 
                  className="bg-emerald-500 transition-all duration-500 hover:opacity-90 relative group flex items-center justify-center" 
                  style={{ width: `${data.h}%` }}
                >
                  {data.h > 10 && <span className="text-[10px] text-white font-bold opacity-0 group-hover:opacity-100">{data.h}%</span>}
                </div>
                <div 
                  className="bg-amber-500 transition-all duration-500 hover:opacity-90 relative group flex items-center justify-center" 
                  style={{ width: `${data.s}%` }}
                >
                  {data.s > 5 && <span className="text-[10px] text-white font-bold opacity-0 group-hover:opacity-100">{data.s}%</span>}
                </div>
                <div 
                  className="bg-blue-500 transition-all duration-500 hover:opacity-90 relative group flex items-center justify-center" 
                  style={{ width: `${data.i}%` }}
                >
                  {data.i > 5 && <span className="text-[10px] text-white font-bold opacity-0 group-hover:opacity-100">{data.i}%</span>}
                </div>
                <div 
                  className="bg-red-500 transition-all duration-500 hover:opacity-90 relative group flex items-center justify-center" 
                  style={{ width: `${data.a}%` }}
                >
                  {data.a > 5 && <span className="text-[10px] text-white font-bold opacity-0 group-hover:opacity-100">{data.a}%</span>}
                </div>
              </div>
            </div>
          ))}
          
          {/* X-axis labels */}
          <div className="flex items-center gap-4 mt-2">
            <div className="w-20"></div>
            <div className="flex-1 flex justify-between text-xs text-slate-400 border-t border-slate-200 pt-2 mt-2">
              <span>0%</span>
              <span>25%</span>
              <span>50%</span>
              <span>75%</span>
              <span>100%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Cards Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Kelas Terbaik */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          <div className="flex items-center gap-3 mb-6 border-b border-slate-100 pb-4">
            <div className="p-2 bg-emerald-100 rounded-lg text-emerald-600">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-800">Kelas Terbaik</h2>
              <p className="text-xs text-slate-500">Berdasarkan % kehadiran rata-rata</p>
            </div>
          </div>
          
          <div className="space-y-5">
            {[
              { rank: 1, name: "XII RPL 1", perc: 96, val: "96.4%" },
              { rank: 2, name: "XI TKJ 2", perc: 93, val: "93.1%" },
              { rank: 3, name: "X MM 1", perc: 89, val: "89.5%" },
            ].map((cls) => (
              <div key={cls.name} className="flex flex-col gap-2">
                <div className="flex justify-between items-center text-sm">
                  <div className="flex items-center gap-3">
                    <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center text-xs font-bold">{cls.rank}</span>
                    <span className="font-semibold text-slate-700">{cls.name}</span>
                  </div>
                  <span className="font-bold text-emerald-600">{cls.val}</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-1.5">
                  <div className="bg-emerald-500 h-1.5 rounded-full" style={{ width: `${cls.perc}%` }}></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Siswa Perlu Perhatian */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          <div className="flex items-center gap-3 mb-6 border-b border-slate-100 pb-4">
            <div className="p-2 bg-red-100 rounded-lg text-red-600">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-800">Siswa Perlu Perhatian</h2>
              <p className="text-xs text-slate-500">Akumulasi alpa terbanyak</p>
            </div>
          </div>
          
          <div className="space-y-4">
            {[
              { name: "Budi Santoso", cls: "XI TKJ 1", count: 7, init: "BS", color: "bg-orange-100 text-orange-700" },
              { name: "Ahmad Wijaya", cls: "XII RPL 2", count: 5, init: "AW", color: "bg-purple-100 text-purple-700" },
              { name: "Cici Paramida", cls: "X AKL 1", count: 4, init: "CP", color: "bg-pink-100 text-pink-700" },
            ].map((student) => (
              <div key={student.name} className="flex items-center justify-between p-3 rounded-lg hover:bg-slate-50 border border-transparent hover:border-slate-100 transition-colors">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold ${student.color}`}>
                    {student.init}
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-slate-800">{student.name}</div>
                    <div className="text-xs text-slate-500">{student.cls}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-red-50 text-red-600 text-xs font-bold">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
                    {student.count} Alpa
                  </span>
                </div>
              </div>
            ))}
          </div>
          
          <button className="w-full mt-4 py-2 text-sm font-medium text-slate-600 bg-slate-50 hover:bg-slate-100 rounded-lg transition-colors">
            Lihat Semua (12 Siswa)
          </button>
        </div>
      </div>
    </div>
  );
}
