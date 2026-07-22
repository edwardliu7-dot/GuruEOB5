import React from "react";
import { 
  ChevronRight, 
  Wand2, 
  Upload, 
  BookOpen, 
  CheckCircle2, 
  Clock, 
  MoreVertical, 
  Edit3, 
  Trash2, 
  Plus, 
  ChevronDown,
  AlertCircle
} from "lucide-react";

export function ProgramSemester() {
  const stats = [
    {
      label: "Total Topik",
      value: 24,
      color: "blue",
      icon: BookOpen,
      progress: "100%",
    },
    {
      label: "Sudah Terlaksana",
      value: 14,
      color: "emerald",
      icon: CheckCircle2,
      progress: "58%",
    },
    {
      label: "Belum Terlaksana",
      value: 10,
      color: "amber",
      icon: Clock,
      progress: "42%",
    },
  ];

  const weeks = Array.from({ length: 14 }).map((_, i) => {
    const pekan = i + 1;
    const isPast = pekan <= 7;
    const isCurrent = pekan === 8;
    
    // Generate dates starting from mid-July 2024
    const startDate = new Date(2024, 6, 15 + (i * 7));
    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + 5);
    
    const dateStr = `${startDate.getDate()} - ${endDate.getDate()} ${startDate.toLocaleString('id-ID', { month: 'short' })}`;
    
    let status = isPast ? "Terlaksana" : isCurrent ? "Terlewat" : "Rencana";
    
    // Hardcode some specific variations to make it look realistic
    if (pekan === 5) status = "Terlewat";
    if (pekan === 8) status = "Rencana";
    
    const topics = [
      "Bilangan Bulat dan Pecahan",
      "Operasi Hitung Bilangan Bulat",
      "KPK dan FPB",
      "Bilangan Berpangkat Bulat",
      "Himpunan dan Anggota Himpunan",
      "Sifat-sifat Operasi Himpunan",
      "Penilaian Tengah Semester (PTS)",
      "Bentuk Aljabar",
      "Operasi Bentuk Aljabar",
      "Persamaan Linear Satu Variabel",
      "Pertidaksamaan Linear Satu Variabel",
      "Perbandingan Senilai",
      "Perbandingan Berbalik Nilai",
      "Penilaian Akhir Semester (PAS)"
    ];
    
    return {
      id: pekan,
      pekan: pekan,
      tanggal: dateStr,
      topik: `BAB ${Math.floor(pekan / 3) + 1} - ${topics[i]}`,
      jp: (pekan === 7 || pekan === 14) ? 2 : 4,
      status: status,
      keterangan: (pekan === 7 || pekan === 14) ? "Ujian" : status === "Terlaksana" ? "Selesai tepat waktu" : status === "Terlewat" ? "Ditunda karena libur" : "-",
    };
  });

  return (
    <div className="bg-[#f5f5f4] min-h-screen font-sans text-slate-800 p-6">
      {/* Breadcrumb */}
      <div className="text-xs text-slate-400 mb-2 flex items-center gap-2">
        <span>Akademik</span>
        <ChevronRight className="w-3 h-3" />
        <span>Perencanaan</span>
        <ChevronRight className="w-3 h-3" />
        <span className="text-slate-600 font-medium">Program Semester</span>
      </div>

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <h1 className="text-xl font-bold text-slate-800">Program Semester</h1>
          <p className="text-sm text-slate-500 mt-1">Matematika — VII A — Semester Ganjil 2024/2025</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-full text-sm font-medium hover:bg-slate-50 transition-colors shadow-sm">
            <Upload className="w-4 h-4" />
            Import Excel
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-slate-800 text-white rounded-full text-sm font-medium hover:bg-slate-700 transition-colors shadow-sm">
            <Wand2 className="w-4 h-4 text-emerald-400" />
            Import dengan AI
          </button>
        </div>
      </div>

      {/* Selectors */}
      <div className="flex flex-wrap gap-3 mb-6">
        <div className="relative">
          <select className="appearance-none bg-white border border-slate-200 text-slate-700 text-sm rounded-full pl-4 pr-10 py-2 font-medium shadow-sm outline-none focus:border-slate-400 cursor-pointer">
            <option>Matematika</option>
            <option>IPA</option>
            <option>IPS</option>
          </select>
          <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>
        <div className="relative">
          <select className="appearance-none bg-white border border-slate-200 text-slate-700 text-sm rounded-full pl-4 pr-10 py-2 font-medium shadow-sm outline-none focus:border-slate-400 cursor-pointer">
            <option>Kelas VII A</option>
            <option>Kelas VII B</option>
            <option>Kelas VIII A</option>
          </select>
          <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>
        <div className="relative">
          <select className="appearance-none bg-white border border-slate-200 text-slate-700 text-sm rounded-full pl-4 pr-10 py-2 font-medium shadow-sm outline-none focus:border-slate-400 cursor-pointer">
            <option>Ganjil 2024/2025</option>
            <option>Genap 2024/2025</option>
          </select>
          <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-6">
        {stats.map((stat, i) => (
          <div key={i} className="bg-white rounded-xl border border-slate-200 shadow-sm relative overflow-hidden flex items-center p-5 gap-4">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 
              ${stat.color === 'blue' ? 'bg-blue-100 text-blue-600' : 
                stat.color === 'emerald' ? 'bg-emerald-100 text-emerald-600' : 
                'bg-amber-100 text-amber-600'}`}>
              <stat.icon className="w-6 h-6" />
            </div>
            <div>
              <div className="text-3xl font-black text-slate-800 leading-none mb-1">{stat.value}</div>
              <div className="text-xs uppercase tracking-wide text-slate-500 font-semibold">{stat.label}</div>
            </div>
            <div 
              className={`h-1 absolute bottom-0 left-0 
                ${stat.color === 'blue' ? 'bg-blue-500' : 
                  stat.color === 'emerald' ? 'bg-emerald-500' : 
                  'bg-amber-500'}`} 
              style={{ width: stat.progress }} 
            />
          </div>
        ))}
      </div>

      {/* Table Section */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col mb-10">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-xs uppercase text-slate-500 border-b border-slate-200">
                <th className="font-semibold p-4 w-16 text-center">Pekan</th>
                <th className="font-semibold p-4 w-32">Tanggal</th>
                <th className="font-semibold p-4 min-w-[280px]">Kompetensi Dasar / Topik</th>
                <th className="font-semibold p-4 w-24 text-center">Alokasi (JP)</th>
                <th className="font-semibold p-4 w-32">Status</th>
                <th className="font-semibold p-4">Keterangan</th>
                <th className="font-semibold p-4 w-16 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {weeks.map((row) => (
                <tr 
                  key={row.id} 
                  className={`group transition-colors ${row.status === 'Terlaksana' ? 'bg-emerald-50/30 hover:bg-emerald-50/60' : 'hover:bg-slate-50'}`}
                >
                  <td className="p-4 text-center">
                    <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-slate-100 text-xs font-semibold text-slate-600">
                      {row.pekan}
                    </span>
                  </td>
                  <td className="p-4 text-sm text-slate-600 whitespace-nowrap">
                    {row.tanggal}
                  </td>
                  <td className="p-4 text-sm font-medium text-slate-800">
                    {row.topik}
                  </td>
                  <td className="p-4 text-center text-sm font-medium text-slate-700">
                    {row.jp}
                  </td>
                  <td className="p-4">
                    {row.status === "Terlaksana" && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700 border border-emerald-200">
                        Terlaksana
                      </span>
                    )}
                    {row.status === "Rencana" && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200">
                        Rencana
                      </span>
                    )}
                    {row.status === "Terlewat" && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700 border border-red-200">
                        <AlertCircle className="w-3 h-3 mr-1" />
                        Terlewat
                      </span>
                    )}
                  </td>
                  <td className="p-4 text-sm text-slate-500">
                    {row.keterangan}
                  </td>
                  <td className="p-4">
                    <div className="flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-md transition-colors">
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {/* Add Topic Row */}
        <div className="p-4 border-t border-slate-200 bg-slate-50/50 flex justify-center">
          <button className="flex items-center gap-2 text-sm font-medium text-slate-600 bg-white border border-slate-200 border-dashed rounded-lg px-6 py-2.5 hover:border-slate-400 hover:text-slate-800 transition-colors">
            <Plus className="w-4 h-4" />
            Tambah Topik / Pekan
          </button>
        </div>
      </div>
    </div>
  );
}
