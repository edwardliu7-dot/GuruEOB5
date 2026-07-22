import React from 'react';
import { 
  ChevronRight, 
  Download, 
  Plus, 
  Search, 
  Filter, 
  Users, 
  User, 
  Pencil, 
  Trash2, 
  ChevronLeft,
  ChevronDown
} from 'lucide-react';

export function DataSiswa() {
  const students = [
    { id: 1, name: 'Ahmad Budi Santoso', initials: 'AB', color: 'bg-blue-100 text-blue-700', kelas: 'VII A', nis: '2023001', gender: 'Laki-laki', phone: '0812-3456-7890' },
    { id: 2, name: 'Siti Nurhaliza', initials: 'SN', color: 'bg-pink-100 text-pink-700', kelas: 'VII A', nis: '2023002', gender: 'Perempuan', phone: '0812-3456-7891' },
    { id: 3, name: 'Reza Pratama', initials: 'RP', color: 'bg-orange-100 text-orange-700', kelas: 'VIII B', nis: '2022015', gender: 'Laki-laki', phone: '0813-5555-4444' },
    { id: 4, name: 'Dina Karmila', initials: 'DK', color: 'bg-purple-100 text-purple-700', kelas: 'VIII B', nis: '2022016', gender: 'Perempuan', phone: '0857-1111-2222' },
    { id: 5, name: 'Bagas Wibowo', initials: 'BW', color: 'bg-indigo-100 text-indigo-700', kelas: 'IX C', nis: '2021045', gender: 'Laki-laki', phone: '0819-9999-8888' },
    { id: 6, name: 'Rina Amelia', initials: 'RA', color: 'bg-rose-100 text-rose-700', kelas: 'IX C', nis: '2021046', gender: 'Perempuan', phone: '0821-7777-6666' },
    { id: 7, name: 'Agus Setiawan', initials: 'AS', color: 'bg-teal-100 text-teal-700', kelas: 'VII B', nis: '2023032', gender: 'Laki-laki', phone: '0811-2222-3333' },
    { id: 8, name: 'Nadia Putri', initials: 'NP', color: 'bg-emerald-100 text-emerald-700', kelas: 'VII B', nis: '2023033', gender: 'Perempuan', phone: '0815-4444-5555' },
  ];

  return (
    <div className="bg-[#f5f5f4] min-h-screen font-sans text-slate-800 p-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-slate-400 mb-2">
        <span>Dashboard</span>
        <ChevronRight className="w-3 h-3" />
        <span className="text-slate-600 font-medium">Manajemen Siswa</span>
        <ChevronRight className="w-3 h-3" />
        <span className="text-slate-600 font-medium">Data Siswa</span>
      </div>

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl font-bold text-slate-800">Data Siswa</h1>
          <p className="text-sm text-slate-500">128 siswa terdaftar aktif</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-4 py-2 rounded-full border border-slate-200 bg-white text-slate-600 text-sm font-medium hover:bg-slate-50 transition-colors shadow-sm">
            <Download className="w-4 h-4" />
            Import Excel
          </button>
          <button className="flex items-center gap-2 px-4 py-2 rounded-full bg-slate-800 text-white text-sm font-medium hover:bg-slate-900 transition-colors shadow-sm">
            <Plus className="w-4 h-4" />
            Tambah Siswa
          </button>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-6">
        {/* Total Stat */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 flex items-center gap-4 relative overflow-hidden">
          <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center shrink-0">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <div className="text-3xl font-black text-slate-800">128</div>
            <div className="text-xs uppercase tracking-wide text-slate-500 font-semibold mt-0.5">Total Siswa</div>
          </div>
          <div className="h-1 absolute bottom-0 left-0 right-0 bg-slate-300"></div>
        </div>

        {/* Laki-laki Stat */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 flex items-center gap-4 relative overflow-hidden">
          <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
            <User className="w-6 h-6" />
          </div>
          <div>
            <div className="text-3xl font-black text-slate-800">64</div>
            <div className="text-xs uppercase tracking-wide text-slate-500 font-semibold mt-0.5">Laki-laki</div>
          </div>
          <div className="h-1 absolute bottom-0 left-0 right-0 bg-blue-500"></div>
        </div>

        {/* Perempuan Stat */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 flex items-center gap-4 relative overflow-hidden">
          <div className="w-12 h-12 rounded-xl bg-pink-100 text-pink-600 flex items-center justify-center shrink-0">
            <User className="w-6 h-6" />
          </div>
          <div>
            <div className="text-3xl font-black text-slate-800">64</div>
            <div className="text-xs uppercase tracking-wide text-slate-500 font-semibold mt-0.5">Perempuan</div>
          </div>
          <div className="h-1 absolute bottom-0 left-0 right-0 bg-pink-500"></div>
        </div>
      </div>

      {/* Filter Row */}
      <div className="flex flex-col sm:flex-row items-center gap-3 mb-4">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input 
            type="text" 
            placeholder="Cari nama atau NIS..." 
            className="w-full pl-9 pr-4 py-2 rounded-full border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-slate-800 focus:border-transparent shadow-sm"
          />
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative w-full sm:w-36">
            <select className="w-full appearance-none px-4 py-2 pr-8 rounded-full border border-slate-200 bg-white text-sm text-slate-600 focus:outline-none focus:ring-2 focus:ring-slate-800 shadow-sm font-medium">
              <option value="">Semua Kelas</option>
              <option value="7">Kelas VII</option>
              <option value="8">Kelas VIII</option>
              <option value="9">Kelas IX</option>
            </select>
            <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
          <div className="relative w-full sm:w-44">
            <select className="w-full appearance-none px-4 py-2 pr-8 rounded-full border border-slate-200 bg-white text-sm text-slate-600 focus:outline-none focus:ring-2 focus:ring-slate-800 shadow-sm font-medium">
              <option value="">Semua Gender</option>
              <option value="L">Laki-laki</option>
              <option value="P">Perempuan</option>
            </select>
            <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
          <button className="flex items-center justify-center p-2 rounded-full border border-slate-200 bg-white text-slate-500 hover:text-slate-800 hover:bg-slate-50 shadow-sm">
            <Filter className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-xs uppercase text-slate-500 font-semibold border-b border-slate-200">
                <th className="p-4 w-16 text-center">No</th>
                <th className="p-4">Nama Lengkap</th>
                <th className="p-4">Kelas</th>
                <th className="p-4">NIS</th>
                <th className="p-4">Jenis Kelamin</th>
                <th className="p-4">Telepon</th>
                <th className="p-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {students.map((student, idx) => (
                <tr key={student.id} className="hover:bg-slate-50 transition-colors group">
                  <td className="p-4 text-center text-slate-500 font-medium">
                    {idx + 1}
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${student.color}`}>
                        {student.initials}
                      </div>
                      <span className="font-semibold text-slate-800">{student.name}</span>
                    </div>
                  </td>
                  <td className="p-4">
                    <span className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-semibold">
                      {student.kelas}
                    </span>
                  </td>
                  <td className="p-4 text-slate-600 font-mono text-xs">{student.nis}</td>
                  <td className="p-4">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                      student.gender === 'Laki-laki' 
                        ? 'bg-blue-50 text-blue-600' 
                        : 'bg-pink-50 text-pink-600'
                    }`}>
                      {student.gender}
                    </span>
                  </td>
                  <td className="p-4 text-slate-600">{student.phone}</td>
                  <td className="p-4">
                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button className="p-1.5 rounded-md text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors">
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button className="p-1.5 rounded-md text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {/* Pagination */}
        <div className="p-4 border-t border-slate-100 flex items-center justify-between text-sm text-slate-500">
          <div>Menampilkan <span className="font-semibold text-slate-800">1-8</span> dari <span className="font-semibold text-slate-800">128</span> siswa</div>
          <div className="flex items-center gap-1">
            <button className="p-1 rounded-md text-slate-400 hover:text-slate-800 hover:bg-slate-100 disabled:opacity-50 disabled:pointer-events-none" disabled>
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button className="w-8 h-8 rounded-md bg-slate-800 text-white font-medium flex items-center justify-center">1</button>
            <button className="w-8 h-8 rounded-md text-slate-600 hover:bg-slate-100 font-medium flex items-center justify-center">2</button>
            <button className="w-8 h-8 rounded-md text-slate-600 hover:bg-slate-100 font-medium flex items-center justify-center">3</button>
            <span className="px-1 text-slate-400">...</span>
            <button className="w-8 h-8 rounded-md text-slate-600 hover:bg-slate-100 font-medium flex items-center justify-center">16</button>
            <button className="p-1 rounded-md text-slate-400 hover:text-slate-800 hover:bg-slate-100">
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
