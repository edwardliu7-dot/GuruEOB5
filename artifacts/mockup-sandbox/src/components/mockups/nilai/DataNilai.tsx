import React from 'react';
import { Download, Plus, ChevronDown, Percent, TrendingUp, TrendingDown, Award } from 'lucide-react';

export function DataNilai() {
  const students = [
    { id: 1, name: 'Aditya Pratama', initials: 'AP', color: 'bg-blue-100 text-blue-700', uh1: 85, uh2: 78, uts: 82, uas: 88 },
    { id: 2, name: 'Bunga Citra', initials: 'BC', color: 'bg-pink-100 text-pink-700', uh1: 92, uh2: 88, uts: 90, uas: 95 },
    { id: 3, name: 'Bima Sakti', initials: 'BS', color: 'bg-emerald-100 text-emerald-700', uh1: 70, uh2: 65, uts: 72, uas: 75 },
    { id: 4, name: 'Citra Kirana', initials: 'CK', color: 'bg-purple-100 text-purple-700', uh1: 88, uh2: 85, uts: 84, uas: 90 },
    { id: 5, name: 'Dian Sastro', initials: 'DS', color: 'bg-orange-100 text-orange-700', uh1: 95, uh2: 92, uts: 96, uas: 98 },
    { id: 6, name: 'Eka Putra', initials: 'EP', color: 'bg-indigo-100 text-indigo-700', uh1: 75, uh2: 72, uts: 78, uas: 80 },
    { id: 7, name: 'Fajar Siddiq', initials: 'FS', color: 'bg-teal-100 text-teal-700', uh1: 80, uh2: 82, uts: 75, uas: 85 },
    { id: 8, name: 'Gita Gutawa', initials: 'GG', color: 'bg-rose-100 text-rose-700', uh1: 85, uh2: 90, uts: 88, uas: 92 },
    { id: 9, name: 'Hadi Wijaya', initials: 'HW', color: 'bg-cyan-100 text-cyan-700', uh1: 65, uh2: 70, uts: 68, uas: 72 },
    { id: 10, name: 'Indah Permata', initials: 'IP', color: 'bg-fuchsia-100 text-fuchsia-700', uh1: 90, uh2: 85, uts: 88, uas: 94 },
  ];

  const calculateAvg = (student: typeof students[0]) => {
    return ((student.uh1 + student.uh2 + student.uts + student.uas) / 4).toFixed(1);
  };

  const calculateClassAvg = (key: 'uh1' | 'uh2' | 'uts' | 'uas') => {
    const sum = students.reduce((acc, student) => acc + student[key], 0);
    return (sum / students.length).toFixed(1);
  };

  return (
    <div className="bg-[#f5f5f4] min-h-screen font-sans text-slate-800 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <div className="text-xs text-slate-400 mb-2">Akademik / Penilaian / Data Nilai</div>
            <h1 className="text-xl font-bold text-slate-800">Data Nilai</h1>
            <p className="text-sm text-slate-500">Nilai formatif dan sumatif per mata pelajaran</p>
          </div>
          <div className="flex items-center gap-3">
            <button className="flex items-center gap-2 px-4 py-2 rounded-full border border-slate-300 bg-white text-slate-700 text-sm font-medium hover:bg-slate-50 transition-colors shadow-sm">
              <Download className="w-4 h-4" />
              Download Excel
            </button>
          </div>
        </div>

        {/* Selector Bar */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-4 flex-1">
            <div className="flex flex-col gap-1.5 w-full sm:w-48">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider ml-1">Kelas</label>
              <div className="relative">
                <select className="w-full appearance-none bg-slate-50 border border-slate-200 rounded-lg px-4 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-800/20 pr-10 cursor-pointer">
                  <option>X MIPA 1</option>
                  <option>X MIPA 2</option>
                  <option>X IPS 1</option>
                </select>
                <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>
            
            <div className="flex flex-col gap-1.5 w-full sm:w-56">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider ml-1">Mata Pelajaran</label>
              <div className="relative">
                <select className="w-full appearance-none bg-slate-50 border border-slate-200 rounded-lg px-4 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-800/20 pr-10 cursor-pointer">
                  <option>Matematika Wajib</option>
                  <option>Bahasa Indonesia</option>
                  <option>Fisika</option>
                </select>
                <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            <div className="flex flex-col gap-1.5 w-full sm:w-40">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider ml-1">Semester</label>
              <div className="relative">
                <select className="w-full appearance-none bg-slate-50 border border-slate-200 rounded-lg px-4 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-800/20 pr-10 cursor-pointer">
                  <option>Ganjil 2023/2024</option>
                  <option>Genap 2023/2024</option>
                </select>
                <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>
          </div>

          <div className="flex items-end mt-1 sm:mt-5">
            <button className="flex items-center gap-2 px-4 py-2 rounded-full bg-slate-800 text-white text-sm font-medium hover:bg-slate-700 transition-colors shadow-sm whitespace-nowrap">
              <Plus className="w-4 h-4" />
              Tambah Penilaian
            </button>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm relative overflow-hidden flex items-center gap-4 p-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
              <TrendingUp className="w-6 h-6" />
            </div>
            <div>
              <div className="text-xs uppercase tracking-wide text-slate-500 mb-1">Rata-rata</div>
              <div className="text-3xl font-black text-slate-800">82.4</div>
            </div>
            <div className="h-1 absolute bottom-0 left-0 right-0 bg-emerald-500" style={{ width: '82%' }}></div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-sm relative overflow-hidden flex items-center gap-4 p-4">
            <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
              <Award className="w-6 h-6" />
            </div>
            <div>
              <div className="text-xs uppercase tracking-wide text-slate-500 mb-1">Tertinggi</div>
              <div className="text-3xl font-black text-slate-800">98</div>
            </div>
            <div className="h-1 absolute bottom-0 left-0 right-0 bg-blue-500" style={{ width: '98%' }}></div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-sm relative overflow-hidden flex items-center gap-4 p-4">
            <div className="w-12 h-12 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center shrink-0">
              <TrendingDown className="w-6 h-6" />
            </div>
            <div>
              <div className="text-xs uppercase tracking-wide text-slate-500 mb-1">Terendah</div>
              <div className="text-3xl font-black text-slate-800">65</div>
            </div>
            <div className="h-1 absolute bottom-0 left-0 right-0 bg-orange-500" style={{ width: '65%' }}></div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-sm relative overflow-hidden flex items-center gap-4 p-4">
            <div className="w-12 h-12 rounded-xl bg-violet-100 text-violet-600 flex items-center justify-center shrink-0">
              <Percent className="w-6 h-6" />
            </div>
            <div>
              <div className="text-xs uppercase tracking-wide text-slate-500 mb-1">Tuntas KKM</div>
              <div className="text-3xl font-black text-slate-800">87%</div>
            </div>
            <div className="h-1 absolute bottom-0 left-0 right-0 bg-violet-500" style={{ width: '87%' }}></div>
          </div>
        </div>

        {/* Main Table */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left whitespace-nowrap">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-4 py-4 font-semibold w-12 text-center">No</th>
                  <th className="px-4 py-4 font-semibold">Nama Siswa</th>
                  <th className="px-4 py-4 font-semibold text-center">UH 1</th>
                  <th className="px-4 py-4 font-semibold text-center">UH 2</th>
                  <th className="px-4 py-4 font-semibold text-center">UTS</th>
                  <th className="px-4 py-4 font-semibold text-center">UAS</th>
                  <th className="px-4 py-4 font-semibold text-center text-slate-800">Rata-rata</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {students.map((student, idx) => {
                  const avg = parseFloat(calculateAvg(student));
                  return (
                    <tr key={student.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3 text-center text-slate-400">{idx + 1}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className={`rounded-full w-8 h-8 flex items-center justify-center text-xs font-bold ${student.color}`}>
                            {student.initials}
                          </div>
                          <span className="font-medium text-slate-700">{student.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className={`mx-auto w-12 py-1 text-center rounded-md font-medium ${student.uh1 < 75 ? 'bg-red-50 text-red-600' : 'bg-transparent text-slate-700'}`}>
                          {student.uh1}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className={`mx-auto w-12 py-1 text-center rounded-md font-medium ${student.uh2 < 75 ? 'bg-red-50 text-red-600' : 'bg-transparent text-slate-700'}`}>
                          {student.uh2}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className={`mx-auto w-12 py-1 text-center rounded-md font-medium ${student.uts < 75 ? 'bg-red-50 text-red-600' : 'bg-transparent text-slate-700'}`}>
                          {student.uts}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className={`mx-auto w-12 py-1 text-center rounded-md font-medium ${student.uas < 75 ? 'bg-red-50 text-red-600' : 'bg-transparent text-slate-700'}`}>
                          {student.uas}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`font-bold ${avg < 75 ? 'text-red-600' : 'text-slate-800'}`}>
                          {avg.toFixed(1)}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot className="bg-slate-100 font-semibold text-slate-700 border-t border-slate-200">
                <tr>
                  <td colSpan={2} className="px-4 py-4 text-right">Rata-rata Kelas</td>
                  <td className="px-4 py-4 text-center">{calculateClassAvg('uh1')}</td>
                  <td className="px-4 py-4 text-center">{calculateClassAvg('uh2')}</td>
                  <td className="px-4 py-4 text-center">{calculateClassAvg('uts')}</td>
                  <td className="px-4 py-4 text-center">{calculateClassAvg('uas')}</td>
                  <td className="px-4 py-4 text-center text-slate-900 font-bold">
                    {(students.reduce((acc, s) => acc + parseFloat(calculateAvg(s)), 0) / students.length).toFixed(1)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}
