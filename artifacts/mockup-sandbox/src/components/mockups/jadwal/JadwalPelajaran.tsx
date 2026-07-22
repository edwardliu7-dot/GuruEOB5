import React from "react";
import { Download, Plus, Clock, MapPin, CalendarDays, MoreHorizontal } from "lucide-react";

interface ScheduleItem {
  id: string;
  time: string;
  subject: string;
  className: string;
  room: string;
  color: "blue" | "green" | "amber" | "violet" | "pink" | "rose" | "teal";
  jamKe: string;
}

interface DaySchedule {
  day: string;
  items: ScheduleItem[];
}

const scheduleData: DaySchedule[] = [
  {
    day: "Senin",
    items: [
      { id: "1", time: "07:00 - 08:20", subject: "Matematika", className: "VII A", room: "Ruang 101", color: "blue", jamKe: "1-2" },
      { id: "2", time: "08:20 - 09:40", subject: "Matematika", className: "VII B", room: "Ruang 102", color: "blue", jamKe: "3-4" },
      { id: "3", time: "10:00 - 11:20", subject: "IPA Terpadu", className: "VIII A", room: "Laboratorium 1", color: "green", jamKe: "5-6" },
    ]
  },
  {
    day: "Selasa",
    items: [
      { id: "4", time: "07:00 - 08:20", subject: "IPA Terpadu", className: "VIII B", room: "Laboratorium 1", color: "green", jamKe: "1-2" },
      { id: "5", time: "10:00 - 11:20", subject: "Bahasa Indonesia", className: "IX A", room: "Ruang 301", color: "violet", jamKe: "5-6" },
    ]
  },
  {
    day: "Rabu",
    items: [
      { id: "6", time: "08:20 - 09:40", subject: "Matematika", className: "VII C", room: "Ruang 103", color: "blue", jamKe: "3-4" },
      { id: "7", time: "13:00 - 14:20", subject: "IPS Terpadu", className: "VII A", room: "Ruang 101", color: "amber", jamKe: "8-9" },
    ]
  },
  {
    day: "Kamis",
    items: [
      { id: "8", time: "07:00 - 08:20", subject: "Seni Budaya", className: "VIII C", room: "Ruang Seni", color: "pink", jamKe: "1-2" },
      { id: "9", time: "08:20 - 09:40", subject: "Prakarya", className: "VII B", room: "Ruang 102", color: "teal", jamKe: "3-4" },
    ]
  },
  {
    day: "Jumat",
    items: [
      { id: "10", time: "07:30 - 08:50", subject: "Matematika", className: "VII D", room: "Ruang 104", color: "blue", jamKe: "1-2" },
    ]
  },
  {
    day: "Sabtu",
    items: []
  }
];

const getColorClasses = (color: ScheduleItem["color"]) => {
  const colors = {
    blue: "border-l-blue-500 bg-blue-50 text-blue-700",
    green: "border-l-emerald-500 bg-emerald-50 text-emerald-700",
    amber: "border-l-amber-500 bg-amber-50 text-amber-700",
    violet: "border-l-violet-500 bg-violet-50 text-violet-700",
    pink: "border-l-pink-500 bg-pink-50 text-pink-700",
    rose: "border-l-rose-500 bg-rose-50 text-rose-700",
    teal: "border-l-teal-500 bg-teal-50 text-teal-700",
  };
  return colors[color] || colors.blue;
};

const getBadgeClasses = (color: ScheduleItem["color"]) => {
  const colors = {
    blue: "bg-blue-100 text-blue-700",
    green: "bg-emerald-100 text-emerald-700",
    amber: "bg-amber-100 text-amber-700",
    violet: "bg-violet-100 text-violet-700",
    pink: "bg-pink-100 text-pink-700",
    rose: "bg-rose-100 text-rose-700",
    teal: "bg-teal-100 text-teal-700",
  };
  return colors[color] || colors.blue;
};

export function JadwalPelajaran() {
  const totalJP = scheduleData.reduce((acc, day) => acc + (day.items.length * 2), 0); // Approx 2 JP per item for demo

  return (
    <div className="bg-[#f5f5f4] min-h-screen font-sans text-slate-800 p-6">
      {/* Breadcrumb & Header */}
      <div className="mb-8">
        <div className="text-xs text-slate-400 mb-2 flex items-center gap-1">
          <span>Beranda</span>
          <span className="text-slate-300">/</span>
          <span className="text-slate-600">Jadwal Mengajar</span>
        </div>
        
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-slate-800">Jadwal Pelajaran</h1>
            <p className="text-sm text-slate-500 mt-1">Semester Ganjil Tahun Ajaran 2024/2025</p>
          </div>
          
          <div className="flex items-center gap-3">
            <button className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-full text-sm font-medium hover:bg-slate-50 transition-colors shadow-sm">
              <Download className="w-4 h-4" />
              Import PDF
            </button>
            <button className="flex items-center gap-2 px-4 py-2 bg-slate-800 text-white rounded-full text-sm font-medium hover:bg-slate-900 transition-colors shadow-sm">
              <Plus className="w-4 h-4" />
              Tambah Jadwal
            </button>
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          {scheduleData.map((dayData, idx) => (
            <div key={idx} className="flex flex-col">
              {/* Day Header */}
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100">
                <h3 className="font-semibold text-slate-800">{dayData.day}</h3>
                <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                  {dayData.items.length > 0 ? `${dayData.items.length * 2} JP` : 'Libur'}
                </span>
              </div>

              {/* Cards Container */}
              <div className="flex flex-col gap-3 flex-1">
                {dayData.items.length > 0 ? (
                  dayData.items.map((item) => (
                    <div 
                      key={item.id} 
                      className={`relative bg-white rounded-lg shadow-sm border border-slate-200 border-l-4 p-3 hover:shadow-md transition-shadow group ${getColorClasses(item.color).split(' ')[0]}`}
                    >
                      {/* Hover action menu trigger */}
                      <button className="absolute top-2 right-2 text-slate-400 hover:text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity">
                        <MoreHorizontal className="w-4 h-4" />
                      </button>

                      <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-2 font-medium">
                        <Clock className="w-3.5 h-3.5" />
                        <span>{item.time}</span>
                        <span className="text-slate-300 mx-0.5">•</span>
                        <span>Ke-{item.jamKe}</span>
                      </div>
                      
                      <div className="mb-2.5">
                        <h4 className="font-bold text-sm text-slate-800 leading-tight mb-1">{item.subject}</h4>
                        <div className="flex items-center gap-1 text-xs text-slate-500">
                          <MapPin className="w-3 h-3" />
                          <span className="truncate">{item.room}</span>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${getBadgeClasses(item.color)}`}>
                          Kelas {item.className}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="flex flex-col items-center justify-center py-10 h-full border-2 border-dashed border-slate-100 rounded-lg bg-slate-50/50">
                    <CalendarDays className="w-8 h-8 text-slate-300 mb-2" />
                    <p className="text-xs text-slate-400 font-medium">Tidak ada jadwal</p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Summary Footer */}
      <div className="flex items-center justify-between bg-white rounded-xl border border-slate-200 shadow-sm p-4">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-semibold text-slate-600 mr-2">Rekap Mingguan:</span>
          {scheduleData.filter(d => d.items.length > 0).map(d => (
            <div key={d.day} className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-full px-3 py-1 text-xs">
              <span className="text-slate-500">{d.day}:</span>
              <span className="font-bold text-slate-800">{d.items.length * 2} JP</span>
            </div>
          ))}
        </div>
        
        <div className="shrink-0 ml-4">
          <span className="inline-flex items-center justify-center px-4 py-1.5 rounded-full bg-slate-800 text-white text-sm font-bold shadow-sm">
            Total {totalJP} JP / Minggu
          </span>
        </div>
      </div>
    </div>
  );
}
