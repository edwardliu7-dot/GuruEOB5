import React, { useState } from 'react';

const TEACHERS = [
  { id:1, name:"Ani Widyastuti",  jabatan:["guru"],           mapel:["Matematika","Statistika"], kelengkapan:85, jurnal:12, dokSelesai:8,  dokTotal:9,  bio:"Pengajar matematika berpengalaman 12 tahun." },
  { id:2, name:"Budi Santoso",    jabatan:["guru","wali_kelas"],mapel:["Bhs. Indonesia"],         kelengkapan:62, jurnal:7,  dokSelesai:5,  dokTotal:8,  bio:"Pembina literasi sekolah dan ketua ekskul debat." },
  { id:3, name:"Citra Dewi",      jabatan:["kepala_sekolah"], mapel:[],                           kelengkapan:96, jurnal:15, dokSelesai:9,  dokTotal:9,  bio:"Kepala sekolah sejak 2021, fokus digitalisasi." },
  { id:4, name:"Dedi Rahman",     jabatan:["guru"],           mapel:["IPA","Fisika"],             kelengkapan:38, jurnal:3,  dokSelesai:3,  dokTotal:8,  bio:"" },
  { id:5, name:"Eka Putri",       jabatan:["guru","wakasek"], mapel:["Sejarah","PKn"],            kelengkapan:74, jurnal:9,  dokSelesai:6,  dokTotal:8,  bio:"Wakasek Kurikulum dan penggerak P5." },
  { id:6, name:"Fajar Nugroho",   jabatan:["guru","wali_kelas"],mapel:["Bhs. Inggris"],          kelengkapan:51, jurnal:6,  dokSelesai:4,  dokTotal:7,  bio:"" },
  { id:7, name:"Gita Sari",       jabatan:["guru"],           mapel:["Seni Budaya","Prakarya"],  kelengkapan:89, jurnal:11, dokSelesai:8,  dokTotal:9,  bio:"Koordinator pameran seni tahunan sekolah." },
  { id:8, name:"Hendra Wijaya",   jabatan:["guru"],           mapel:["Penjasorkes"],             kelengkapan:45, jurnal:4,  dokSelesai:3,  dokTotal:6,  bio:"" },
];

function initials(n: string) { 
  return n.split(" ").map(p=>p[0]).slice(0,2).join("").toUpperCase(); 
}

function progressColor(p: number) {
  if (p >= 80) return { text:"#15803d", bg:"#dcfce7", bar:"#16a34a" };
  if (p >= 55) return { text:"#92400e", bg:"#fef3c7", bar:"#d97706" };
  return { text:"#991b1b", bg:"#fee2e2", bar:"#dc2626" };
}

const JABATAN_LABEL: Record<string, string> = { 
  guru: "Guru", 
  kepala_sekolah: "Kepala Sekolah", 
  wali_kelas: "Wali Kelas", 
  wakasek: "Wakasek" 
};

export function DaftarKompak() {
  const [hoveredId, setHoveredId] = useState<number | null>(null);

  return (
    <div style={{
      width: 1280, height: 820, overflow: 'hidden', display: 'flex', flexDirection: 'column', 
      fontFamily: "'Inter', sans-serif", backgroundColor: '#ffffff', color: '#111827'
    }}>
      {/* Page Header Area */}
      <div style={{ padding: '32px 32px 0 32px' }}>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0, letterSpacing: '-0.02em' }}>Direktori Guru</h1>
          <div style={{ display: 'flex', border: '1px solid #d1d5db', borderRadius: 6, overflow: 'hidden' }}>
            <button style={{ padding: '6px 16px', backgroundColor: '#ffffff', border: 'none', borderRight: '1px solid #d1d5db', fontSize: 13, fontWeight: 500, color: '#6b7280', cursor: 'pointer' }}>
              Grid
            </button>
            <button style={{ padding: '6px 16px', backgroundColor: '#f3f4f6', border: 'none', fontSize: 13, fontWeight: 600, color: '#111827', cursor: 'pointer', boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.05)' }}>
              List
            </button>
          </div>
        </div>

        <div style={{ marginTop: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', borderBottom: '1px solid #e5e7eb' }}>
          <div style={{ display: 'flex', gap: 32 }}>
            <div style={{ paddingBottom: 12, borderBottom: '2px solid #2563eb', color: '#2563eb', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
              Semua (8)
            </div>
            <div style={{ paddingBottom: 12, color: '#6b7280', fontSize: 14, fontWeight: 500, display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
              Belum Lengkap 
              <span style={{ backgroundColor: '#fee2e2', color: '#dc2626', padding: '2px 8px', borderRadius: 12, fontSize: 12, fontWeight: 600 }}>
                3
              </span>
            </div>
          </div>
          <div style={{ paddingBottom: 8 }}>
            <button style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 12px', border: '1px solid #d1d5db', borderRadius: 6, backgroundColor: '#ffffff', fontSize: 13, fontWeight: 500, color: '#374151', cursor: 'pointer' }}>
              Semua Jabatan
              <span style={{ fontSize: 10 }}>▼</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div style={{ flex: 1, padding: '24px 32px 32px 32px', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        
        {/* Summary Bar */}
        <div style={{ 
          display: 'flex', gap: 48, padding: '16px 24px', backgroundColor: '#f9fafb', 
          border: '1px solid #e5e7eb', borderRadius: 8, marginBottom: 24 
        }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <div style={{ fontSize: 24, fontWeight: 700, color: '#111827', lineHeight: 1 }}>8</div>
            <div style={{ fontSize: 13, fontWeight: 500, color: '#6b7280' }}>Total Guru</div>
          </div>
          <div style={{ width: 1, backgroundColor: '#e5e7eb' }}></div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <div style={{ fontSize: 24, fontWeight: 700, color: '#111827', lineHeight: 1 }}>67%</div>
            <div style={{ fontSize: 13, fontWeight: 500, color: '#6b7280' }}>Rata-rata Kelengkapan</div>
          </div>
          <div style={{ width: 1, backgroundColor: '#e5e7eb' }}></div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <div style={{ fontSize: 24, fontWeight: 700, color: '#dc2626', lineHeight: 1 }}>3</div>
            <div style={{ fontSize: 13, fontWeight: 500, color: '#6b7280' }}>Perlu Perhatian (&lt;55%)</div>
          </div>
        </div>

        {/* List Table Container */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', border: '1px solid #e5e7eb', borderRadius: 8, backgroundColor: '#ffffff' }}>
          
          {/* Table Header */}
          <div style={{ 
            display: 'flex', alignItems: 'center', height: 44, padding: '0 24px', 
            borderBottom: '1px solid #e5e7eb', backgroundColor: '#f9fafb',
            fontSize: 12, fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em'
          }}>
            <div style={{ width: 220, flexShrink: 0 }}>Guru</div>
            <div style={{ width: 140, flexShrink: 0 }}>Mata Pelajaran</div>
            <div style={{ width: 100, flexShrink: 0 }}>Jurnal Bulan Ini</div>
            <div style={{ width: 90, flexShrink: 0 }}>Dokumen</div>
            <div style={{ flex: 1, paddingLeft: 24 }}>Progres Kelengkapan</div>
          </div>

          {/* Table Body */}
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {TEACHERS.map((teacher, index) => {
              const isEven = index % 2 === 0;
              const isHovered = hoveredId === teacher.id;
              
              const j = teacher.jurnal;
              const jColor = j >= 10 ? { bg: '#dcfce7', text: '#16a34a' } : j >= 5 ? { bg: '#fef3c7', text: '#d97706' } : { bg: '#fee2e2', text: '#dc2626' };
              
              const pColor = progressColor(teacher.kelengkapan);
              const primaryJabatan = teacher.jabatan[0] ? JABATAN_LABEL[teacher.jabatan[0]] || teacher.jabatan[0] : '-';

              return (
                <div 
                  key={teacher.id}
                  onMouseEnter={() => setHoveredId(teacher.id)}
                  onMouseLeave={() => setHoveredId(null)}
                  style={{ 
                    display: 'flex', alignItems: 'center', height: 56, padding: '0 24px',
                    borderBottom: '1px solid #f3f4f6', 
                    backgroundColor: isHovered ? '#f3f6f8' : (isEven ? '#ffffff' : '#fafafa'),
                    transition: 'background-color 0.15s ease'
                  }}
                >
                  {/* COL 1: Guru */}
                  <div style={{ width: 220, flexShrink: 0, display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ 
                      width: 36, height: 36, borderRadius: '50%', backgroundColor: '#e5e7eb', 
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 13, fontWeight: 600, color: '#4b5563', flexShrink: 0
                    }}>
                      {initials(teacher.name)}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 2, overflow: 'hidden' }}>
                      <div style={{ fontSize: 14, fontWeight: 600, color: '#111827', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {teacher.name}
                      </div>
                      <div style={{ fontSize: 12, color: '#6b7280', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {primaryJabatan} {teacher.jabatan.length > 1 ? `+${teacher.jabatan.length - 1}` : ''}
                      </div>
                    </div>
                  </div>

                  {/* COL 2: Mata Pelajaran */}
                  <div style={{ width: 140, flexShrink: 0, display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
                    {teacher.mapel.slice(0, 2).map((m, i) => (
                      <div key={i} style={{ 
                        padding: '2px 8px', backgroundColor: '#f3f4f6', borderRadius: 4, 
                        fontSize: 11, fontWeight: 500, color: '#4b5563', whiteSpace: 'nowrap',
                        maxWidth: 70, overflow: 'hidden', textOverflow: 'ellipsis'
                      }}>
                        {m}
                      </div>
                    ))}
                    {teacher.mapel.length > 2 && (
                      <div style={{ 
                        padding: '2px 6px', backgroundColor: '#f3f4f6', borderRadius: 4, 
                        fontSize: 11, fontWeight: 500, color: '#6b7280'
                      }}>
                        +{teacher.mapel.length - 2}
                      </div>
                    )}
                    {teacher.mapel.length === 0 && (
                      <div style={{ fontSize: 13, color: '#9ca3af' }}>-</div>
                    )}
                  </div>

                  {/* COL 3: Jurnal Bulan Ini */}
                  <div style={{ width: 100, flexShrink: 0 }}>
                    <div style={{ 
                      display: 'inline-flex', alignItems: 'center', gap: 6,
                      padding: '4px 10px', backgroundColor: jColor.bg, borderRadius: 12,
                      fontSize: 12, fontWeight: 600, color: jColor.text
                    }}>
                      <span style={{ fontSize: 12 }}>📖</span>
                      {teacher.jurnal}
                    </div>
                  </div>

                  {/* COL 4: Dokumen */}
                  <div style={{ width: 90, flexShrink: 0, fontSize: 13, fontWeight: 500, color: '#4b5563' }}>
                    {teacher.dokSelesai} / {teacher.dokTotal} dok
                  </div>

                  {/* COL 5: Progres Kelengkapan */}
                  <div style={{ flex: 1, paddingLeft: 24, display: 'flex', alignItems: 'center', gap: 16 }}>
                    <div style={{ flex: 1, height: 8, backgroundColor: '#e5e7eb', borderRadius: 4, overflow: 'hidden' }}>
                      <div style={{ 
                        height: '100%', width: `${teacher.kelengkapan}%`, 
                        backgroundColor: pColor.bar, borderRadius: 4,
                        transition: 'width 0.5s ease-out'
                      }}></div>
                    </div>
                    <div style={{ width: 44, textAlign: 'right', fontSize: 13, fontWeight: 700, color: pColor.text }}>
                      {teacher.kelengkapan}%
                    </div>
                  </div>

                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
