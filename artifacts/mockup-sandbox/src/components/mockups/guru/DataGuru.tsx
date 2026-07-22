import React, { useState } from 'react';
import {
  ChevronRight,
  Plus,
  Search,
  Filter,
  Users,
  BookOpen,
  Briefcase,
  Edit2,
  Trash2,
  MoreVertical,
  ChevronLeft
} from 'lucide-react';

export function DataGuru() {
  const teachers = [
    { id: 1, name: 'Budi Santoso, S.Pd', email: 'budi.santoso@sekolah.id', jabatan: 'Guru Mapel', mapel: 'Matematika', perwalian: '-', status: 'Aktif', avatarColor: 'bg-blue-100 text-blue-600', initials: 'BS' },
    { id: 2, name: 'Siti Aminah, M.Pd', email: 'siti.aminah@sekolah.id', jabatan: 'Wali Kelas', mapel: 'Bahasa Indonesia', perwalian: 'X IPA 1', status: 'Aktif', avatarColor: 'bg-violet-100 text-violet-600', initials: 'SA' },
    { id: 3, name: 'Drs. Agus Wijaya', email: 'agus.wijaya@sekolah.id', jabatan: 'Kepala Sekolah', mapel: '-', perwalian: '-', status: 'Aktif', avatarColor: 'bg-amber-100 text-amber-600', initials: 'AW' },
    { id: 4, name: 'Rina Herawati, S.Pd', email: 'rina.hera@sekolah.id', jabatan: 'Guru Mapel', mapel: 'Fisika', perwalian: '-', status: 'Aktif', avatarColor: 'bg-emerald-100 text-emerald-600', initials: 'RH' },
    { id: 5, name: 'Ahmad Fauzi, S.Kom', email: 'ahmad.fauzi@sekolah.id', jabatan: 'TU', mapel: 'TIK', perwalian: '-', status: 'Aktif', avatarColor: 'bg-slate-100 text-slate-600', initials: 'AF' },
    { id: 6, name: 'Dewi Lestari, S.Pd', email: 'dewi.lestari@sekolah.id', jabatan: 'Wali Kelas', mapel: 'Biologi', perwalian: 'XI IPS 2', status: 'Aktif', avatarColor: 'bg-pink-100 text-pink-600', initials: 'DL' },
    { id: 7, name: 'Iwan Setiawan, S.Pd', email: 'iwan.setiawan@sekolah.id', jabatan: 'Guru Mapel', mapel: 'Pendidikan Jasmani', perwalian: '-', status: 'Aktif', avatarColor: 'bg-orange-100 text-orange-600', initials: 'IS' },
    { id: 8, name: 'Nita Rahmawati, S.Pd', email: 'nita.rahma@sekolah.id', jabatan: 'Guru Mapel', mapel: 'Sejarah', perwalian: '-', status: 'Aktif', avatarColor: 'bg-rose-100 text-rose-600', initials: 'NR' }
  ];

  const getJabatanBadge = (jabatan: string) => {
    switch (jabatan) {
      case 'Guru Mapel': return 'bg-blue-100 text-blue-700';
      case 'Wali Kelas': return 'bg-violet-100 text-violet-700';
      case 'Kepala Sekolah': return 'bg-amber-100 text-amber-700';
      case 'TU': return 'bg-slate-100 text-slate-700';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  const getStatusBadge = (status: string) => {
    return status === 'Aktif' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700';
  };

  return (
    <div className="min-h-screen bg-[#f5f5f4] font-sans text-slate-800 p-6">
      {/* Header Section */}
      <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center text-xs text-slate-400 mb-2 font-medium">
            <span>Beranda</span>
            <ChevronRight className="w-3 h-3 mx-1" />
            <span>Manajemen</span>
            <ChevronRight className="w-3 h-3 mx-1" />
            <span className="text-slate-600">Data Guru</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-800">Data Guru</h1>
          <p className="text-sm text-slate-500 mt-1">18 tenaga pendidik terdaftar</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 bg-slate-800 text-white px-4 py-2 rounded-full text-sm font-medium hover:bg-slate-700 transition-colors">
            <Plus className="w-4 h-4" />
            Tambah Guru
          </button>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-6">
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 relative overflow-hidden flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <div className="text-3xl font-black text-slate-800 leading-none mb-1">18</div>
            <div className="text-xs uppercase tracking-wide text-slate-500 font-semibold">Total Guru</div>
          </div>
          <div className="h-1 absolute bottom-0 left-0 right-0 bg-blue-500" />
        </div>
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 relative overflow-hidden flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-violet-100 text-violet-600 flex items-center justify-center shrink-0">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <div className="text-3xl font-black text-slate-800 leading-none mb-1">14</div>
            <div className="text-xs uppercase tracking-wide text-slate-500 font-semibold">Guru Mapel</div>
          </div>
          <div className="h-1 absolute bottom-0 left-0 right-0 bg-violet-500" />
        </div>
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 relative overflow-hidden flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center shrink-0">
            <Briefcase className="w-6 h-6" />
          </div>
          <div>
            <div className="text-3xl font-black text-slate-800 leading-none mb-1">4</div>
            <div className="text-xs uppercase tracking-wide text-slate-500 font-semibold">Staff TU / Wali Kelas</div>
          </div>
          <div className="h-1 absolute bottom-0 left-0 right-0 bg-amber-500" />
        </div>
      </div>

      {/* Filter Row */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <input 
            type="text" 
            placeholder="Cari nama atau NIP guru..." 
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-slate-200 focus:border-slate-300 transition-all placeholder:text-slate-400"
          />
        </div>
        <div className="relative shrink-0">
          <Filter className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <select className="pl-10 pr-10 py-2.5 bg-white border border-slate-200 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-slate-200 appearance-none text-slate-600 font-medium cursor-pointer">
            <option>Semua Jabatan</option>
            <option>Guru Mapel</option>
            <option>Wali Kelas</option>
            <option>Kepala Sekolah</option>
            <option>TU</option>
          </select>
          <ChevronRight className="w-4 h-4 absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 rotate-90 pointer-events-none" />
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500 border-b border-slate-200 font-semibold">
                <th className="p-4 w-1/3">Guru</th>
                <th className="p-4">Jabatan</th>
                <th className="p-4">Mata Pelajaran</th>
                <th className="p-4">Kelas Perwalian</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {teachers.map((teacher) => (
                <tr key={teacher.id} className="hover:bg-slate-50 transition-colors group">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shrink-0 ${teacher.avatarColor}`}>
                        {teacher.initials}
                      </div>
                      <div>
                        <div className="font-semibold text-slate-800">{teacher.name}</div>
                        <div className="text-xs text-slate-500 mt-0.5">{teacher.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${getJabatanBadge(teacher.jabatan)}`}>
                      {teacher.jabatan}
                    </span>
                  </td>
                  <td className="p-4">
                    {teacher.mapel !== '-' ? (
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200">
                        {teacher.mapel}
                      </span>
                    ) : (
                      <span className="text-slate-400">-</span>
                    )}
                  </td>
                  <td className="p-4">
                    {teacher.perwalian !== '-' ? (
                      <span className="font-medium text-slate-700">{teacher.perwalian}</span>
                    ) : (
                      <span className="text-slate-400">-</span>
                    )}
                  </td>
                  <td className="p-4">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${getStatusBadge(teacher.status)}`}>
                      {teacher.status}
                    </span>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" aria-label="Edit">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors" aria-label="Delete">
                        <Trash2 className="w-4 h-4" />
                      </button>
                      <button className="p-1.5 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors" aria-label="More">
                        <MoreVertical className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {/* Pagination */}
        <div className="p-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between text-sm text-slate-500 gap-4">
          <div>Menampilkan <span className="font-medium text-slate-800">1-8</span> dari <span className="font-medium text-slate-800">18</span> guru</div>
          <div className="flex items-center gap-1">
            <button className="p-1.5 rounded-lg border border-slate-200 text-slate-400 hover:text-slate-700 hover:bg-slate-50 transition-colors disabled:opacity-50" disabled>
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button className="w-8 h-8 rounded-lg bg-slate-800 text-white font-medium flex items-center justify-center">
              1
            </button>
            <button className="w-8 h-8 rounded-lg border border-slate-200 text-slate-600 font-medium hover:bg-slate-50 transition-colors flex items-center justify-center">
              2
            </button>
            <button className="w-8 h-8 rounded-lg border border-slate-200 text-slate-600 font-medium hover:bg-slate-50 transition-colors flex items-center justify-center">
              3
            </button>
            <button className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:text-slate-800 hover:bg-slate-50 transition-colors">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
