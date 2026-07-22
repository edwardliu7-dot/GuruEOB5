import React from 'react';
import { ChevronRight, Users, CheckCircle2, AlertCircle, Download, KeyRound, RefreshCw } from 'lucide-react';

export function AkunSiswa() {
  const students = [
    { id: 1, name: 'Adelia Khaira', username: 'siswa.adeliakhaira', status: 'Aktif', avatar: 'AK', color: 'bg-indigo-100 text-indigo-600' },
    { id: 2, name: 'Ahmad Faisal', username: 'siswa.ahmadfaisal', status: 'Aktif', avatar: 'AF', color: 'bg-blue-100 text-blue-600' },
    { id: 3, name: 'Bintang Pradana', username: 'siswa.bintangpradana', status: 'Aktif', avatar: 'BP', color: 'bg-emerald-100 text-emerald-600' },
    { id: 4, name: 'Citra Lestari', username: 'siswa.citralestari', status: 'Aktif', avatar: 'CL', color: 'bg-pink-100 text-pink-600' },
    { id: 5, name: 'Dimas Anggara', username: '-', status: 'Belum Dibuat', avatar: 'DA', color: 'bg-amber-100 text-amber-600' },
    { id: 6, name: 'Eka Putri', username: 'siswa.ekaputri', status: 'Aktif', avatar: 'EP', color: 'bg-purple-100 text-purple-600' },
    { id: 7, name: 'Fajar Nugroho', username: '-', status: 'Belum Dibuat', avatar: 'FN', color: 'bg-teal-100 text-teal-600' },
    { id: 8, name: 'Gita Savitri', username: 'siswa.gitasavitri', status: 'Aktif', avatar: 'GS', color: 'bg-rose-100 text-rose-600' },
    { id: 9, name: 'Hafiz Maulana', username: 'siswa.hafizmaulana', status: 'Aktif', avatar: 'HM', color: 'bg-cyan-100 text-cyan-600' },
    { id: 10, name: 'Indah Permata', username: 'siswa.indahpermata', status: 'Aktif', avatar: 'IP', color: 'bg-orange-100 text-orange-600' },
  ];

  return (
    <div className="bg-[#f5f5f4] min-h-screen font-sans text-slate-800 p-6">
      {/* Top Section */}
      <div className="flex items-center text-xs text-slate-400 mb-2">
        <span>Dashboard</span>
        <ChevronRight className="w-3 h-3 mx-1" />
        <span>Kelas VII Ibnu Battutah</span>
        <ChevronRight className="w-3 h-3 mx-1" />
        <span className="text-slate-600">Akun Siswa</span>
      </div>
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-800">Akun Siswa</h1>
          <p className="text-sm text-slate-500">Kelola akun login siswa kelas perwalian VII Ibnu Battutah</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 rounded-full border border-slate-200 bg-white text-slate-600 px-4 py-2 text-sm font-medium hover:bg-slate-50 transition-colors shadow-sm">
            <Download className="w-4 h-4" />
            Download Daftar Akun
          </button>
          <button className="flex items-center gap-2 rounded-full bg-slate-800 text-white px-4 py-2 text-sm font-medium hover:bg-slate-700 transition-colors shadow-sm">
            <KeyRound className="w-4 h-4" />
            Generate Semua Akun
          </button>
        </div>
      </div>

      {/* Info Banner */}
      <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded-r-xl mb-6 flex items-start gap-3 shadow-sm border-y border-r border-amber-200">
        <AlertCircle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
        <div className="text-sm text-amber-800">
          <p className="font-medium mb-0.5 text-amber-900">Informasi Akun</p>
          <p className="text-amber-700">Simpan dan bagikan daftar akun kepada siswa. Password dapat direset kapan saja jika siswa lupa.</p>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-6">
        {/* Stat 1 */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 relative overflow-hidden flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs uppercase tracking-wide text-slate-500 font-semibold mb-1">Total Siswa</div>
            <div className="text-3xl font-black text-slate-800">32</div>
          </div>
          <div className="h-1 absolute bottom-0 left-0 right-0 bg-blue-500"></div>
        </div>
        {/* Stat 2 */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 relative overflow-hidden flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs uppercase tracking-wide text-slate-500 font-semibold mb-1">Akun Dibuat</div>
            <div className="text-3xl font-black text-slate-800">28</div>
          </div>
          <div className="h-1 absolute bottom-0 left-0 right-0 bg-emerald-500"></div>
        </div>
        {/* Stat 3 */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 relative overflow-hidden flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center shrink-0">
            <AlertCircle className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs uppercase tracking-wide text-slate-500 font-semibold mb-1">Belum Ada Akun</div>
            <div className="text-3xl font-black text-slate-800">4</div>
          </div>
          <div className="h-1 absolute bottom-0 left-0 right-0 bg-amber-500"></div>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden mb-6">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500 border-b border-slate-200">
              <tr>
                <th className="px-4 py-3 font-semibold w-16 text-center">No</th>
                <th className="px-4 py-3 font-semibold">Nama Siswa</th>
                <th className="px-4 py-3 font-semibold">Username</th>
                <th className="px-4 py-3 font-semibold">Status Akun</th>
                <th className="px-4 py-3 font-semibold text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {students.map((student, idx) => (
                <tr key={student.id} className="hover:bg-slate-50 transition-colors group">
                  <td className="px-4 py-4 text-center text-slate-500">{idx + 1}</td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${student.color}`}>
                        {student.avatar}
                      </div>
                      <span className="font-medium text-slate-800">{student.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    {student.username !== '-' ? (
                      <span className="font-mono text-slate-600 text-xs bg-slate-100 px-2 py-1 rounded">{student.username}</span>
                    ) : (
                      <span className="text-slate-400">-</span>
                    )}
                  </td>
                  <td className="px-4 py-4">
                    {student.status === 'Aktif' ? (
                      <span className="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700 ring-1 ring-inset ring-emerald-600/20">
                        Aktif
                      </span>
                    ) : (
                      <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600 ring-1 ring-inset ring-slate-500/20">
                        Belum Dibuat
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-4 text-right">
                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      {student.status === 'Aktif' ? (
                        <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 bg-white border border-slate-200 rounded-full hover:bg-slate-50 hover:text-slate-900 transition-colors shadow-sm">
                          <RefreshCw className="w-3 h-3" />
                          Reset Password
                        </button>
                      ) : (
                        <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 bg-white border border-slate-200 rounded-full hover:bg-slate-50 hover:text-slate-900 transition-colors shadow-sm">
                          <KeyRound className="w-3 h-3" />
                          Buat Akun
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {/* Table Footer */}
        <div className="bg-slate-50 border-t border-slate-200 p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-slate-500">Menampilkan 10 dari 32 siswa</p>
          <div className="flex gap-2">
            <button className="px-3 py-1.5 border border-slate-200 text-slate-600 text-xs font-medium rounded hover:bg-white transition-colors bg-transparent cursor-not-allowed opacity-50 shadow-sm">
              Sebelumnya
            </button>
            <button className="px-3 py-1.5 border border-slate-200 text-slate-600 text-xs font-medium rounded bg-white hover:bg-slate-50 transition-colors shadow-sm">
              Selanjutnya
            </button>
          </div>
        </div>
      </div>
      
      {/* Bottom Note */}
      <div className="flex justify-center mb-8">
        <button className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-800 transition-colors group">
          <div className="p-2 rounded-full bg-slate-200 group-hover:bg-slate-300 transition-colors">
            <Download className="w-4 h-4 text-slate-700" />
          </div>
          <span className="font-medium underline decoration-slate-300 underline-offset-4">Download credential sheet untuk dicetak (PDF)</span>
        </button>
      </div>

    </div>
  );
}
