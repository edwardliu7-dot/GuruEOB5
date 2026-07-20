import React from 'react';

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

function initials(n: string) { return n.split(" ").map(p=>p[0]).slice(0,2).join("").toUpperCase(); }

function progressColor(p: number) {
  if (p >= 80) return { bgStrip:"#16a34a", text:"#ffffff", bar:"#16a34a", bgLight:"#dcfce7", textDark:"#15803d" };
  if (p >= 55) return { bgStrip:"#d97706", text:"#ffffff", bar:"#d97706", bgLight:"#fef3c7", textDark:"#92400e" };
  return { bgStrip:"#dc2626", text:"#ffffff", bar:"#dc2626", bgLight:"#fee2e2", textDark:"#991b1b" };
}

const JABATAN_LABEL: Record<string, string> = { guru:"Guru", kepala_sekolah:"Kepala Sekolah", wali_kelas:"Wali Kelas", wakasek:"Wakasek" };
const JABATAN_COLOR: Record<string, string> = {
  kepala_sekolah:"#92400e:#fef3c7:#b45309",
  wakasek:"#5b21b6:#ede9fe:#7c3aed",
  guru:"#1e40af:#dbeafe:#2563eb",
  wali_kelas:"#14532d:#dcfce7:#16a34a",
};

export function KartuDashboard() {
  return (
    <div style={{
      width: 1280,
      height: 820,
      overflow: 'hidden',
      backgroundColor: '#f8fafc', // Softer background
      fontFamily: "'Inter', sans-serif",
      display: 'flex',
      flexDirection: 'column',
      padding: '32px 40px',
      boxSizing: 'border-box'
    }}>
      {/* Header Halaman */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
          <h1 style={{ margin: 0, fontSize: 32, fontWeight: 800, color: '#0f172a', letterSpacing: '-0.03em' }}>Direktori Guru</h1>
          <div style={{ display: 'flex', gap: 12 }}>
            <div style={{ padding: '6px 14px', backgroundColor: '#e0e7ff', color: '#3730a3', borderRadius: 999, fontSize: 13, fontWeight: 700, border: '1px solid #c7d2fe' }}>8 Guru</div>
            <div style={{ padding: '6px 14px', backgroundColor: '#dcfce7', color: '#166534', borderRadius: 999, fontSize: 13, fontWeight: 700, border: '1px solid #bbf7d0' }}>67% Rata-rata</div>
            <div style={{ padding: '6px 14px', backgroundColor: '#fee2e2', color: '#991b1b', borderRadius: 999, fontSize: 13, fontWeight: 700, border: '1px solid #fecaca' }}>3 Perlu Perhatian</div>
          </div>
        </div>
        <div>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            backgroundColor: '#ffffff', 
            border: '1px solid #e2e8f0', 
            borderRadius: 12,
            padding: '10px 16px',
            width: 320,
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
          }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 12 }}>
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
            <input 
              type="text" 
              placeholder="Cari nama atau mapel..." 
              style={{
                border: 'none',
                outline: 'none',
                fontSize: 14,
                color: '#334155',
                width: '100%',
                background: 'transparent',
                fontWeight: 500
              }}
              readOnly
            />
          </div>
        </div>
      </div>

      {/* Grid Kartu */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(4, 1fr)', 
        gridTemplateRows: 'repeat(2, 1fr)', 
        gap: 20,
        flex: 1
      }}>
        {TEACHERS.map(teacher => {
          const colors = progressColor(teacher.kelengkapan);
          return (
            <div key={teacher.id} style={{
              backgroundColor: '#ffffff',
              borderRadius: 20,
              overflow: 'hidden',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -2px rgba(0, 0, 0, 0.02), 0 0 0 1px rgba(0,0,0,0.02)',
              display: 'flex',
              flexDirection: 'column',
              position: 'relative'
            }}>
              {/* Header Strip */}
              <div style={{
                height: 40,
                backgroundColor: colors.bgStrip,
                // Diagonal pattern very subtle
                backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(255,255,255,0.1) 10px, rgba(255,255,255,0.1) 20px)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '0 16px',
                color: colors.text
              }}>
                <span style={{ fontSize: 13, fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '70%', textShadow: '0 1px 2px rgba(0,0,0,0.2)' }}>{teacher.name}</span>
                <span style={{ fontSize: 18, fontWeight: 900, textShadow: '0 1px 2px rgba(0,0,0,0.2)' }}>{teacher.kelengkapan}%</span>
              </div>

              {/* Body */}
              <div style={{ padding: '16px 20px 20px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 14 }}>
                  <div style={{ 
                    width: 48, 
                    height: 48, 
                    borderRadius: '50%', 
                    backgroundColor: colors.bgLight, 
                    color: colors.textDark,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 16,
                    fontWeight: 800,
                    flexShrink: 0,
                    border: `1px solid ${colors.bgStrip}33`
                  }}>
                    {initials(teacher.name)}
                  </div>
                  <div style={{ overflow: 'hidden', display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <div style={{ fontSize: 16, fontWeight: 800, color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', letterSpacing: '-0.01em' }}>
                      {teacher.name}
                    </div>
                    <div style={{ display: 'flex', gap: 4, flexWrap: 'nowrap', overflow: 'hidden' }}>
                      {teacher.jabatan.map((jab, i) => {
                        const [text, bg, border] = JABATAN_COLOR[jab].split(':');
                        return (
                          <span key={i} style={{ 
                            fontSize: 10, 
                            fontWeight: 700, 
                            color: text, 
                            backgroundColor: bg,
                            padding: '3px 8px',
                            borderRadius: 6,
                            border: `1px solid ${border}40`,
                            whiteSpace: 'nowrap',
                            textTransform: 'uppercase',
                            letterSpacing: '0.02em'
                          }}>
                            {JABATAN_LABEL[jab]}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Mapel */}
                <div style={{ display: 'flex', gap: 6, marginBottom: 8, height: 24, overflow: 'hidden' }}>
                  {teacher.mapel.length > 0 ? teacher.mapel.map((m, i) => (
                    <span key={i} style={{ 
                      fontSize: 12, 
                      fontWeight: 600,
                      color: '#475569', 
                      backgroundColor: '#f1f5f9', 
                      padding: '4px 10px', 
                      borderRadius: 999,
                      border: '1px solid #e2e8f0',
                      whiteSpace: 'nowrap'
                    }}>
                      {m}
                    </span>
                  )) : <span style={{ fontSize: 12, color: '#94a3b8', fontStyle: 'italic', fontWeight: 500, padding: '4px 0' }}>—</span>}
                </div>

                {/* Bio */}
                <div style={{ fontSize: 13, color: '#64748b', marginBottom: 16, lineHeight: 1.5, height: 20, overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
                  {teacher.bio || "—"}
                </div>

                <div style={{ flex: 1 }} />

                {/* Divider */}
                <div style={{ height: 1, backgroundColor: '#f1f5f9', margin: '0 -20px 16px -20px' }} />

                {/* Stats */}
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10 }}>
                  <div style={{ flex: 1, backgroundColor: '#f8fafc', borderRadius: 10, padding: '10px 8px', display: 'flex', flexDirection: 'column', alignItems: 'center', border: '1px solid #f1f5f9', boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.01)' }}>
                    <div style={{ fontSize: 18, marginBottom: 4 }}>📖</div>
                    <div style={{ fontSize: 15, fontWeight: 800, color: '#0f172a', lineHeight: 1 }}>{teacher.jurnal}</div>
                    <div style={{ fontSize: 10, fontWeight: 600, color: '#64748b', marginTop: 4, textTransform: 'uppercase', letterSpacing: '0.02em' }}>Jurnal</div>
                  </div>
                  <div style={{ flex: 1, backgroundColor: '#f8fafc', borderRadius: 10, padding: '10px 8px', display: 'flex', flexDirection: 'column', alignItems: 'center', border: '1px solid #f1f5f9', boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.01)' }}>
                    <div style={{ fontSize: 18, marginBottom: 4 }}>📄</div>
                    <div style={{ fontSize: 15, fontWeight: 800, color: '#0f172a', lineHeight: 1 }}>{teacher.dokSelesai}/{teacher.dokTotal}</div>
                    <div style={{ fontSize: 10, fontWeight: 600, color: '#64748b', marginTop: 4, textTransform: 'uppercase', letterSpacing: '0.02em' }}>Dokumen</div>
                  </div>
                  <div style={{ flex: 1, backgroundColor: colors.bgLight, borderRadius: 10, padding: '10px 8px', display: 'flex', flexDirection: 'column', alignItems: 'center', border: `1px solid ${colors.bgStrip}33` }}>
                    <div style={{ fontSize: 18, marginBottom: 4 }}>✅</div>
                    <div style={{ fontSize: 15, fontWeight: 800, color: colors.textDark, lineHeight: 1 }}>{teacher.kelengkapan}%</div>
                    <div style={{ fontSize: 10, fontWeight: 700, color: colors.textDark, marginTop: 4, textTransform: 'uppercase', letterSpacing: '0.02em' }}>Lengkap</div>
                  </div>
                </div>
              </div>

              {/* Progress Bar Bottom */}
              <div style={{ height: 4, width: '100%', backgroundColor: '#f1f5f9' }}>
                <div style={{ height: '100%', width: `${teacher.kelengkapan}%`, backgroundColor: colors.bar, borderTopRightRadius: 4, borderBottomRightRadius: 4 }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
