import React from 'react';
import { 
  CalendarDays, 
  Calendar,
  CheckCircle2, 
  Clock,
  MoreVertical,
  Plus,
  ChevronDown,
  Info,
  CalendarCheck,
  CalendarX,
  MapPin
} from 'lucide-react';

export function KalenderAkademik() {
  const pekanData = [
    { no: 1, pekan: "Pekan 1", mulai: "15 Jul 2024", selesai: "19 Jul 2024", status: "Selesai", ket: "MPLS" },
    { no: 2, pekan: "Pekan 2", mulai: "22 Jul 2024", selesai: "26 Jul 2024", status: "Selesai", ket: "KBM Normal" },
    { no: 3, pekan: "Pekan 3", mulai: "29 Jul 2024", selesai: "02 Agu 2024", status: "Selesai", ket: "KBM Normal" },
    { no: 4, pekan: "Pekan 4", mulai: "05 Agu 2024", selesai: "09 Agu 2024", status: "Selesai", ket: "KBM Normal" },
    { no: 5, pekan: "Pekan 5", mulai: "12 Agu 2024", selesai: "16 Agu 2024", status: "Selesai", ket: "Persiapan HUT RI" },
    { no: 6, pekan: "Pekan 6", mulai: "19 Agu 2024", selesai: "23 Agu 2024", status: "Selesai", ket: "KBM Normal" },
    { no: 7, pekan: "Pekan 7", mulai: "26 Agu 2024", selesai: "30 Agu 2024", status: "Selesai", ket: "KBM Normal" },
    { no: 8, pekan: "Pekan 8", mulai: "02 Sep 2024", selesai: "06 Sep 2024", status: "Selesai", ket: "KBM Normal" },
    { no: 9, pekan: "Pekan 9", mulai: "09 Sep 2024", selesai: "13 Sep 2024", status: "Selesai", ket: "KBM Normal" },
    { no: 10, pekan: "Pekan 10", mulai: "16 Sep 2024", selesai: "20 Sep 2024", status: "Selesai", ket: "PTS Ganjil" },
    { no: 11, pekan: "Pekan 11", mulai: "23 Sep 2024", selesai: "27 Sep 2024", status: "Selesai", ket: "KBM Normal" },
    { no: 12, pekan: "Pekan 12", mulai: "30 Sep 2024", selesai: "04 Okt 2024", status: "Selesai", ket: "KBM Normal" },
    { no: 13, pekan: "Pekan 13", mulai: "07 Okt 2024", selesai: "11 Okt 2024", status: "Aktif", ket: "KBM Normal", isCurrent: true },
    { no: 14, pekan: "Pekan 14", mulai: "14 Okt 2024", selesai: "18 Okt 2024", status: "Libur", ket: "Cuti Bersama" },
    { no: 15, pekan: "Pekan 15", mulai: "21 Okt 2024", selesai: "25 Okt 2024", status: "Selesai", ket: "KBM Normal" }, // Future, but using standard statuses
  ];

  // Fix up future statuses
  pekanData[14].status = "-";

  return (
    <div className="bg-[#f5f5f4] min-h-screen p-6 font-sans text-slate-800">
      {/* Breadcrumb & Header */}
      <div className="mb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="text-xs text-slate-400 mb-2 flex items-center gap-1.5">
            <span>Manajemen Sekolah</span>
            <span>/</span>
            <span className="text-slate-600 font-medium">Kalender Akademik</span>
          </div>
          <h1 className="text-xl font-bold text-slate-800">Kalender Akademik</h1>
          <p className="text-sm text-slate-500">Tahun Ajaran 2024/2025</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="rounded-full bg-slate-800 text-white px-4 py-2 text-sm font-medium flex items-center gap-2 hover:bg-slate-700 transition-colors">
            <Plus className="w-4 h-4" />
            Tambah Pekan
          </button>
        </div>
      </div>

      {/* Selectors */}
      <div className="flex flex-wrap items-center gap-4 mb-6">
        <div className="relative">
          <select className="appearance-none bg-white border border-slate-200 rounded-full px-4 py-2 pr-10 text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-800 shadow-sm cursor-pointer min-w-[200px]">
            <option>Tahun Ajaran 2024/2025</option>
            <option>Tahun Ajaran 2023/2024</option>
          </select>
          <ChevronDown className="w-4 h-4 text-slate-500 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>
        
        <div className="flex bg-white border border-slate-200 rounded-full p-1 shadow-sm">
          <button className="px-4 py-1.5 text-sm font-medium rounded-full bg-slate-800 text-white transition-colors">
            Semester Ganjil
          </button>
          <button className="px-4 py-1.5 text-sm font-medium rounded-full bg-transparent text-slate-600 hover:bg-slate-50 transition-colors">
            Semester Genap
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-6">
        {/* Card 1 */}
        <div className="relative overflow-hidden bg-white rounded-xl border border-slate-200 shadow-sm flex items-center gap-4 p-5 pb-6">
          <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
            <Calendar className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs uppercase tracking-wide text-slate-500 font-semibold mb-1">Total Pekan Efektif</div>
            <div className="text-3xl font-black text-slate-800 leading-none">24</div>
          </div>
          <div className="h-1 absolute bottom-0 left-0 right-0 bg-blue-500"></div>
        </div>

        {/* Card 2 */}
        <div className="relative overflow-hidden bg-white rounded-xl border border-slate-200 shadow-sm flex items-center gap-4 p-5 pb-6">
          <div className="w-12 h-12 rounded-xl bg-violet-100 text-violet-600 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs uppercase tracking-wide text-slate-500 font-semibold mb-1">Pekan Sudah Lewat</div>
            <div className="text-3xl font-black text-slate-800 leading-none">12</div>
          </div>
          <div className="h-1 absolute bottom-0 left-0 right-0 bg-violet-500"></div>
        </div>

        {/* Card 3 */}
        <div className="relative overflow-hidden bg-white rounded-xl border border-slate-200 shadow-sm flex items-center gap-4 p-5 pb-6">
          <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center shrink-0">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs uppercase tracking-wide text-slate-500 font-semibold mb-1">Sisa Pekan</div>
            <div className="text-3xl font-black text-slate-800 leading-none">12</div>
          </div>
          <div className="h-1 absolute bottom-0 left-0 right-0 bg-amber-500"></div>
        </div>
      </div>

      {/* Main Two-Column Layout */}
      <div className="flex flex-col lg:flex-row gap-5">
        
        {/* Left: Table */}
        <div className="flex-1">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Daftar Pekan Efektif</div>
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-xs uppercase text-slate-500 border-b border-slate-200">
                    <th className="p-4 font-semibold w-12 text-center">No</th>
                    <th className="p-4 font-semibold">Pekan Ke-</th>
                    <th className="p-4 font-semibold">Tanggal Mulai</th>
                    <th className="p-4 font-semibold">Tanggal Selesai</th>
                    <th className="p-4 font-semibold">Status</th>
                    <th className="p-4 font-semibold">Keterangan</th>
                    <th className="p-4 font-semibold text-center w-16">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {pekanData.map((item) => (
                    <tr 
                      key={item.no} 
                      className={`hover:bg-slate-50 transition-colors ${item.isCurrent ? 'bg-blue-50/50 relative' : ''}`}
                    >
                      {item.isCurrent && (
                        <td className="absolute left-0 top-0 bottom-0 w-1 bg-blue-500"></td>
                      )}
                      <td className="p-4 text-center text-slate-500">{item.no}</td>
                      <td className="p-4 font-medium text-slate-800">
                        {item.pekan}
                        {item.isCurrent && (
                          <span className="ml-2 inline-flex items-center rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-semibold text-blue-600">
                            SAAT INI
                          </span>
                        )}
                      </td>
                      <td className="p-4 text-slate-600">{item.mulai}</td>
                      <td className="p-4 text-slate-600">{item.selesai}</td>
                      <td className="p-4">
                        {item.status === "Selesai" && (
                          <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600">
                            Selesai
                          </span>
                        )}
                        {item.status === "Aktif" && (
                          <span className="inline-flex items-center rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-medium text-emerald-700">
                            Aktif
                          </span>
                        )}
                        {item.status === "Libur" && (
                          <span className="inline-flex items-center rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-700">
                            Libur
                          </span>
                        )}
                        {item.status === "-" && (
                          <span className="inline-flex items-center rounded-full bg-slate-50 border border-slate-200 px-2.5 py-0.5 text-xs font-medium text-slate-400">
                            Belum
                          </span>
                        )}
                      </td>
                      <td className="p-4 text-slate-600">{item.ket}</td>
                      <td className="p-4 text-center">
                        <button className="text-slate-400 hover:text-slate-600 rounded-full p-1 hover:bg-slate-100 transition-colors">
                          <MoreVertical className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right: Info Semester & Events */}
        <div className="w-full lg:w-72 shrink-0 flex flex-col gap-5">
          <div>
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Info Semester</div>
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 relative overflow-hidden">
              <div className="absolute -right-4 -top-4 text-slate-50 opacity-50">
                <Calendar className="w-32 h-32" />
              </div>
              
              <div className="relative z-10">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 rounded-full bg-slate-800 text-white flex items-center justify-center">
                    <Info className="w-4 h-4" />
                  </div>
                  <h3 className="font-bold text-slate-800">Semester Ganjil</h3>
                </div>

                <div className="space-y-4">
                  <div>
                    <p className="text-xs text-slate-500 mb-1">Periode</p>
                    <p className="text-sm font-medium text-slate-800">15 Jul 2024 - 20 Des 2024</p>
                  </div>
                  
                  <div>
                    <p className="text-xs text-slate-500 mb-1">Total Hari Sekolah</p>
                    <p className="text-sm font-medium text-slate-800">120 Hari</p>
                  </div>

                  <div>
                    <p className="text-xs text-slate-500 mb-1">Progress Semester</p>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-semibold text-blue-600">Pekan 13</span>
                      <span className="text-xs font-medium text-slate-400">dari 24</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2">
                      <div className="bg-blue-500 h-2 rounded-full" style={{ width: '54%' }}></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div>
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Agenda Terdekat</div>
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
              <div className="space-y-4">
                <div className="flex gap-3">
                  <div className="mt-0.5 w-8 h-8 rounded-lg bg-orange-50 text-orange-600 flex flex-col items-center justify-center shrink-0 border border-orange-100">
                    <span className="text-[10px] font-bold uppercase leading-none mb-0.5">Okt</span>
                    <span className="text-sm font-black leading-none">14</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-800">Cuti Bersama</p>
                    <p className="text-xs text-slate-500 flex items-center gap-1 mt-1">
                      <CalendarX className="w-3 h-3" /> Libur Nasional
                    </p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="mt-0.5 w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex flex-col items-center justify-center shrink-0 border border-emerald-100">
                    <span className="text-[10px] font-bold uppercase leading-none mb-0.5">Okt</span>
                    <span className="text-sm font-black leading-none">28</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-800">Upacara Sumpah Pemuda</p>
                    <p className="text-xs text-slate-500 flex items-center gap-1 mt-1">
                      <MapPin className="w-3 h-3" /> Lapangan Utama
                    </p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="mt-0.5 w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex flex-col items-center justify-center shrink-0 border border-blue-100">
                    <span className="text-[10px] font-bold uppercase leading-none mb-0.5">Nov</span>
                    <span className="text-sm font-black leading-none">15</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-800">Batas Input Nilai Harian</p>
                    <p className="text-xs text-slate-500 flex items-center gap-1 mt-1">
                      <CalendarCheck className="w-3 h-3" /> Akademik
                    </p>
                  </div>
                </div>
              </div>
              
              <button className="w-full mt-4 py-2 text-xs font-semibold text-slate-600 bg-slate-50 hover:bg-slate-100 rounded-lg transition-colors">
                Lihat Semua Agenda
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
