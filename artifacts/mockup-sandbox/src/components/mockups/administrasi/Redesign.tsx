import React, { useState } from "react";
import { 
  FolderOpen, 
  FileText, 
  BookOpen, 
  Target, 
  History, 
  MoreVertical, 
  Plus, 
  ChevronRight, 
  Home,
  CheckCircle2,
  Clock
} from "lucide-react";

export function Redesign() {
  const [activeTab, setActiveTab] = useState("administrasi");

  const stats = [
    { label: "Mata Pelajaran", count: 6, icon: FolderOpen, color: "blue" },
    { label: "Total Dokumen", count: 24, icon: FileText, color: "violet" },
    { label: "Bahan Ajar", count: 11, icon: BookOpen, color: "amber" },
    { label: "Tujuan Pembelajaran", count: 18, icon: CheckCircle2, color: "emerald" },
  ];

  const folders = [
    { name: "Matematika", docs: 8, tp: 3, teacher: "Budi Santoso, S.Pd", color: "blue", active: true },
    { name: "Bahasa Indonesia", docs: 5, tp: 2, teacher: "Siti Aminah, S.Pd", color: "emerald", active: false },
    { name: "IPA", docs: 4, tp: 4, teacher: "Rina Wijaya, S.Pd", color: "violet", active: false },
    { name: "IPS", docs: 3, tp: 2, teacher: "Agus Pratama, S.Pd", color: "amber", active: false },
    { name: "PJOK", docs: 2, tp: 5, teacher: "Hendra Gunawan, S.Pd", color: "emerald", active: false },
    { name: "Seni Budaya", docs: 2, tp: 2, teacher: "Diana Fitri, S.Pd", color: "blue", active: false },
  ];

  const activities = [
    { title: "RPP Matematika Bab 1", subject: "Matematika", time: "2 jam lalu", icon: FileText, color: "blue" },
    { title: "Modul Teks Deskripsi", subject: "Bahasa Indonesia", time: "5 jam lalu", icon: BookOpen, color: "emerald" },
    { title: "Kisi-kisi PTS Ganjil", subject: "IPA", time: "kemarin", icon: FileText, color: "violet" },
    { title: "Laporan Praktikum", subject: "IPA", time: "kemarin", icon: FileText, color: "violet" },
    { title: "Materi Senam Lantai", subject: "PJOK", time: "2 hari lalu", icon: BookOpen, color: "emerald" },
    { title: "Capaian Pembelajaran", subject: "IPS", time: "2 hari lalu", icon: Target, color: "amber" },
    { title: "Tugas Seni Rupa", subject: "Seni Budaya", time: "3 hari lalu", icon: FileText, color: "blue" },
  ];

  const colorStyles = {
    blue: { bg: "bg-blue-100", text: "text-blue-600", border: "border-blue-500", progress: "bg-blue-500", ring: "ring-blue-500" },
    violet: { bg: "bg-violet-100", text: "text-violet-600", border: "border-violet-500", progress: "bg-violet-500", ring: "ring-violet-500" },
    amber: { bg: "bg-amber-100", text: "text-amber-600", border: "border-amber-500", progress: "bg-amber-500", ring: "ring-amber-500" },
    emerald: { bg: "bg-emerald-100", text: "text-emerald-600", border: "border-emerald-500", progress: "bg-emerald-500", ring: "ring-emerald-500" },
  };

  return (
    <div className="min-h-screen bg-[#f5f5f4] p-6 lg:p-8 font-sans text-slate-800">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Breadcrumbs */}
        <div className="flex items-center space-x-2 text-sm text-slate-500">
          <Home className="w-4 h-4" />
          <ChevronRight className="w-4 h-4" />
          <span>Dashboard</span>
          <ChevronRight className="w-4 h-4" />
          <span className="font-medium text-slate-800">Administrasi Guru</span>
        </div>

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Administrasi Guru</h1>
            <p className="text-sm text-slate-500 mt-1">Kelola folder mata pelajaran dan dokumen administrasi.</p>
          </div>
          
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <div className="flex bg-slate-200/60 p-1 rounded-full">
              <button 
                onClick={() => setActiveTab("administrasi")}
                className={`px-4 py-1.5 text-sm font-semibold rounded-full transition-all ${activeTab === "administrasi" ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
              >
                Administrasi
              </button>
              <button 
                onClick={() => setActiveTab("bahan_ajar")}
                className={`px-4 py-1.5 text-sm font-semibold rounded-full transition-all ${activeTab === "bahan_ajar" ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
              >
                Bahan Ajar
              </button>
            </div>
            
            <button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-full text-sm font-medium transition-colors shadow-sm">
              <Plus className="w-4 h-4" />
              Tambah Mata Pelajaran
            </button>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat, idx) => {
            const Icon = stat.icon;
            const styles = colorStyles[stat.color as keyof typeof colorStyles];
            
            return (
              <div key={idx} className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden relative flex flex-col">
                <div className="p-5 flex-1">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm font-semibold text-slate-500 mb-1">{stat.label}</p>
                      <h3 className="text-3xl font-bold text-slate-800">{stat.count}</h3>
                    </div>
                    <div className={`p-3 rounded-xl ${styles.bg} ${styles.text}`}>
                      <Icon className="w-6 h-6" />
                    </div>
                  </div>
                </div>
                {/* Progress bar at bottom */}
                <div className="h-1.5 w-full bg-slate-100">
                  <div className={`h-full ${styles.progress} rounded-r-full`} style={{ width: '65%' }}></div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Main Content Layout */}
        <div className="flex flex-col lg:flex-row gap-6">
          
          {/* Left Column: Folders */}
          <div className="flex-1 space-y-4">
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {folders.map((folder, idx) => {
                const styles = colorStyles[folder.color as keyof typeof colorStyles];
                
                return (
                  <div 
                    key={idx} 
                    className={`bg-white rounded-xl shadow-sm border p-5 transition-all group hover:shadow-md cursor-pointer flex flex-col gap-4 ${folder.active ? `ring-2 ${styles.ring} border-transparent bg-slate-50/50` : 'border-slate-200 hover:border-slate-300'}`}
                  >
                    <div className="flex justify-between items-start">
                      <div className={`p-3 rounded-xl ${styles.bg} ${styles.text}`}>
                        <FolderOpen className="w-6 h-6" />
                      </div>
                      <button className="text-slate-400 hover:text-slate-600 p-1.5 rounded-md hover:bg-slate-100 transition-colors">
                        <MoreVertical className="w-5 h-5" />
                      </button>
                    </div>
                    
                    <div>
                      <h3 className={`text-lg font-bold text-slate-800 transition-colors`}>{folder.name}</h3>
                      
                      <div className="flex items-center gap-2 mt-2">
                        <span className="inline-flex items-center gap-1.5 text-xs font-semibold bg-slate-100 text-slate-600 px-2.5 py-1 rounded-md">
                          <FileText className="w-3.5 h-3.5" />
                          {folder.docs} Dokumen
                        </span>
                        <span className="inline-flex items-center gap-1.5 text-xs font-semibold bg-slate-100 text-slate-600 px-2.5 py-1 rounded-md">
                          <Target className="w-3.5 h-3.5" />
                          {folder.tp} TP
                        </span>
                      </div>
                    </div>
                    
                    <div className="mt-2 pt-4 border-t border-slate-100 flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-full bg-slate-200 flex items-center justify-center text-[11px] font-bold text-slate-600">
                          {folder.teacher.split(' ').map(n => n[0]).join('').substring(0, 2)}
                        </div>
                        <span className="text-sm font-medium text-slate-600">{folder.teacher}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          
          {/* Right Sidebar: Aktivitas Terbaru */}
          <div className="w-full lg:w-80 flex-shrink-0 space-y-4">
            <div className="flex items-center justify-between px-1">
              <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <History className="w-5 h-5 text-slate-500" />
                Aktivitas Terbaru
              </h2>
            </div>
            
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="divide-y divide-slate-100">
                {activities.map((activity, idx) => {
                  const Icon = activity.icon;
                  const styles = colorStyles[activity.color as keyof typeof colorStyles];
                  
                  return (
                    <div key={idx} className="p-4 hover:bg-slate-50 transition-colors flex gap-3.5 items-start cursor-pointer">
                      <div className={`p-2.5 rounded-lg ${styles.bg} ${styles.text}`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0 py-0.5">
                        <p className="text-sm font-bold text-slate-800 truncate">{activity.title}</p>
                        <div className="flex items-center gap-2 mt-1.5">
                          <span className="text-[11px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md truncate max-w-[120px]">
                            {activity.subject}
                          </span>
                          <span className="text-[11px] font-medium text-slate-400 flex items-center gap-1 flex-shrink-0">
                            <Clock className="w-3 h-3" />
                            {activity.time}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              <button className="w-full py-3 text-sm font-semibold text-blue-600 hover:bg-blue-50 transition-colors border-t border-slate-100 text-center">
                Lihat Semua Aktivitas
              </button>
            </div>
          </div>
          
        </div>
      </div>
    </div>
  );
}
