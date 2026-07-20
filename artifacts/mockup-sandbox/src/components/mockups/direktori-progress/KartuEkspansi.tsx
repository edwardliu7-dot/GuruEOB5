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
  if (p >= 80) return { text:"#15803d", bg:"#dcfce7", bar:"#16a34a" };
  if (p >= 55) return { text:"#92400e", bg:"#fef3c7", bar:"#d97706" };
  return { text:"#991b1b", bg:"#fee2e2", bar:"#dc2626" };
}

const JABATAN_LABEL: Record<string, string> = { guru:"Guru", kepala_sekolah:"Kepala Sekolah", wali_kelas:"Wali Kelas", wakasek:"Wakasek" };
const JABATAN_COLOR: Record<string, string> = {
  kepala_sekolah:"#92400e:#fef3c7:#b45309",
  wakasek:"#5b21b6:#ede9fe:#7c3aed",
  guru:"#1e40af:#dbeafe:#2563eb",
  wali_kelas:"#14532d:#dcfce7:#16a34a",
};

export function KartuEkspansi() {
  return (
    <div style={{
      width: '1280px', height: '820px', overflow: 'hidden', 
      backgroundColor: '#f8fafc', fontFamily: "'Inter', sans-serif", boxSizing: 'border-box', padding: '40px'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px' }}>
        <div>
          <h1 style={{ margin: '0 0 8px 0', fontSize: '32px', fontWeight: 'bold', color: '#0f172a', letterSpacing: '-0.5px' }}>Direktori Guru</h1>
          <p style={{ margin: 0, fontSize: '16px', color: '#64748b' }}>Profil &amp; progres kinerja seluruh pendidik</p>
          <div style={{ marginTop: '16px', fontSize: '14px', color: '#334155', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontWeight: 600 }}>8 Guru Aktif</span>
            <span style={{ color: '#cbd5e1' }}>•</span>
            <span>Rata-rata Kelengkapan <strong style={{ color: '#0f172a' }}>67.5%</strong></span>
          </div>
        </div>
        <div>
          <div style={{
            display: 'flex', alignItems: 'center', backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '10px 16px', width: '300px', boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
          }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '10px' }}>
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
            <input type="text" placeholder="Cari nama atau mapel..." style={{ border: 'none', outline: 'none', width: '100%', fontSize: '14px', color: '#0f172a' }} />
          </div>
        </div>
      </div>

      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gridTemplateRows: 'repeat(2, 1fr)', gap: '20px'
      }}>
        {TEACHERS.map(teacher => {
          const pColor = progressColor(teacher.kelengkapan);
          const primaryRole = teacher.jabatan[0];
          const roleColorParts = JABATAN_COLOR[primaryRole]?.split(':') || ["#1e40af", "#dbeafe", "#2563eb"];
          const avatarText = roleColorParts[0];
          const avatarBg = roleColorParts[1];

          return (
            <div key={teacher.id} style={{
              backgroundColor: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
            }}>
              {/* TOP: Profil */}
              <div style={{ padding: '24px 20px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                  <div style={{
                    width: '48px', height: '48px', borderRadius: '50%', backgroundColor: avatarBg, color: avatarText, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', fontWeight: 'bold', flexShrink: 0
                  }}>
                    {initials(teacher.name)}
                  </div>
                  <div>
                    <h3 style={{ margin: '0 0 6px 0', fontSize: '16px', fontWeight: 600, color: '#0f172a', lineHeight: 1.2 }}>{teacher.name}</h3>
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                      {teacher.jabatan.map(jab => {
                        const jColor = JABATAN_COLOR[jab]?.split(':') || ["#1e40af", "#dbeafe", "#2563eb"];
                        return (
                          <span key={jab} style={{
                            backgroundColor: jColor[1], color: jColor[0], fontSize: '11px', fontWeight: 600, padding: '2px 8px', borderRadius: '100px'
                          }}>
                            {JABATAN_LABEL[jab]}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                </div>

                <div style={{ minHeight: '56px' }}>
                  {teacher.mapel.length > 0 && (
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '12px' }}>
                      {teacher.mapel.map(m => (
                        <span key={m} style={{
                          backgroundColor: '#f1f5f9', color: '#475569', fontSize: '12px', padding: '4px 8px', borderRadius: '6px', fontWeight: 500
                        }}>
                          {m}
                        </span>
                      ))}
                    </div>
                  )}

                  <p style={{ margin: 0, fontSize: '13px', color: '#64748b', lineHeight: '1.5', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {teacher.bio || <span style={{ fontStyle: 'italic', color: '#cbd5e1' }}>Belum ada bio</span>}
                  </p>
                </div>
              </div>

              {/* BOTTOM: Progress */}
              <div style={{ borderTop: '1px solid #f1f5f9', padding: '16px 20px', backgroundColor: '#fafafa' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <span style={{ fontSize: '12px', color: '#475569', backgroundColor: '#fff', border: '1px solid #e2e8f0', padding: '3px 8px', borderRadius: '6px', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 500 }}>
                      <span style={{ fontSize: '11px' }}>📖</span> {teacher.jurnal}
                    </span>
                    <span style={{ fontSize: '12px', color: '#475569', backgroundColor: '#fff', border: '1px solid #e2e8f0', padding: '3px 8px', borderRadius: '6px', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 500 }}>
                      <span style={{ fontSize: '11px' }}>📄</span> {teacher.dokSelesai}/{teacher.dokTotal}
                    </span>
                  </div>
                  <span style={{ fontSize: '14px', fontWeight: 700, color: pColor.text }}>{teacher.kelengkapan}%</span>
                </div>
                <div style={{ height: '6px', backgroundColor: '#e2e8f0', borderRadius: '3px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', backgroundColor: pColor.bar, width: `${teacher.kelengkapan}%`, borderRadius: '3px' }}></div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
