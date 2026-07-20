import "./_group.css";

const NAV = [
  { icon: "📊", label: "Dashboard", active: false },
  { icon: "📚", label: "Program Semester", active: true },
  { icon: "📖", label: "Jurnal Mengajar", active: false },
  { icon: "👥", label: "Data Siswa", active: false },
  { icon: "📝", label: "Penilaian", active: false },
];

const ROWS = [
  { pekan: "P.1", tanggal: "14–18 Jul", jenis: "KBM", cp: "TP 1", materi: "Bilangan Bulat & Operasinya", jp: 4 },
  { pekan: "P.2", tanggal: "21–25 Jul", jenis: "KBM", cp: "TP 2", materi: "Persamaan Linear Satu Variabel", jp: 4 },
  { pekan: "P.3", tanggal: "28 Jul–1 Ags", jenis: "KBM", cp: "TP 3", materi: "Pertidaksamaan Linear", jp: 4 },
  { pekan: "P.4", tanggal: "4–8 Ags", jenis: "Libur", cp: "—", materi: "Libur Nasional", jp: 0 },
  { pekan: "P.5", tanggal: "11–15 Ags", jenis: "KBM", cp: "TP 4", materi: "Himpunan & Operasinya", jp: 4 },
];

const SVG_PATTERN = "data:image/svg+xml,%3Csvg%20width='40'%20height='40'%20viewBox='0%200%2040%2040'%20xmlns='http://www.w3.org/2000/svg'%3E%3Cg%20transform='translate(20,20)'%3E%3Crect%20x='-7'%20y='-7'%20width='14'%20height='14'%20fill='none'%20stroke='rgba(245,158,11,0.18)'%20stroke-width='0.6'/%3E%3Crect%20x='-7'%20y='-7'%20width='14'%20height='14'%20fill='none'%20stroke='rgba(245,158,11,0.12)'%20stroke-width='0.6'%20transform='rotate(45)'/%3E%3Cline%20x1='-20'%20y1='0'%20x2='-10'%20y2='0'%20stroke='rgba(245,158,11,0.08)'%20stroke-width='0.5'/%3E%3Cline%20x1='10'%20y1='0'%20x2='20'%20y2='0'%20stroke='rgba(245,158,11,0.08)'%20stroke-width='0.5'/%3E%3Cline%20x1='0'%20y1='-20'%20x2='0'%20y2='-10'%20stroke='rgba(245,158,11,0.08)'%20stroke-width='0.5'/%3E%3Cline%20x1='0'%20y1='10'%20x2='0'%20y2='20'%20stroke='rgba(245,158,11,0.08)'%20stroke-width='0.5'/%3E%3C/g%3E%3C/svg%3E";

const StarWatermark = () => (
  <svg style={{ position: "absolute", right: -5, bottom: -5, opacity: 0.08, width: 60, height: 60, pointerEvents: "none" }} viewBox="0 0 40 40">
    <g transform="translate(20,20)">
      <rect x="-10" y="-10" width="20" height="20" fill="none" stroke="#F59E0B" strokeWidth="2" />
      <rect x="-10" y="-10" width="20" height="20" fill="none" stroke="#F59E0B" strokeWidth="2" transform="rotate(45)" />
    </g>
  </svg>
);

export function Bintang() {
  return (
    <div style={{ width: 920, height: 660, display: "flex", flexDirection: "column", fontFamily: "'Nunito', sans-serif", background: "#F8FAFC", overflow: "hidden" }}>
      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
        {/* Sidebar */}
        <div style={{ 
          width: 210, 
          background: `linear-gradient(180deg, rgba(5,13,31,0.95) 0%, rgba(15,27,45,0.95) 100%), url("${SVG_PATTERN}")`, 
          backgroundColor: "#050D1F",
          display: "flex", 
          flexDirection: "column", 
          flexShrink: 0 
        }}>
          {/* Logo */}
          <div style={{ padding: "20px 16px 16px", borderBottom: "1px solid rgba(245,158,11,0.15)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 34, height: 34, borderRadius: 8, background: "linear-gradient(135deg, #D97706 0%, #F59E0B 100%)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, boxShadow: "0 2px 4px rgba(0,0,0,0.3)" }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
                </svg>
              </div>
              <div>
                <div style={{ color: "white", fontWeight: 700, fontSize: 14, lineHeight: 1.2 }}>GuruPintar</div>
                <div style={{ color: "#FDE68A", fontSize: 10 }}>Semester Ganjil 25/26</div>
              </div>
            </div>
          </div>

          {/* User */}
          <div style={{ padding: "12px 16px", borderBottom: "1px solid rgba(245,158,11,0.15)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ width: 28, height: 28, borderRadius: "50%", background: "#0F1B2D", border: "1px solid #D97706", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, color: "#FDE68A", fontWeight: 700 }}>
                AW
              </div>
              <div>
                <div style={{ color: "white", fontSize: 12, fontWeight: 700 }}>Ani Widyastuti</div>
                <div style={{ color: "#FDE68A", fontSize: 10 }}>Guru Matematika</div>
              </div>
            </div>
          </div>

          {/* Nav */}
          <nav style={{ flex: 1, padding: "12px 0" }}>
            {NAV.map((item) => (
              <div key={item.label} style={{ 
                display: "flex", 
                alignItems: "center", 
                gap: 10, 
                padding: "9px 16px", 
                margin: "2px 12px", 
                borderRadius: 8, 
                background: item.active ? "#D97706" : "transparent", 
                cursor: "pointer",
                transition: "all 0.2s"
              }}>
                <span style={{ fontSize: 13, opacity: item.active ? 1 : 0.8, filter: item.active ? "none" : "grayscale(0.5)" }}>{item.icon}</span>
                <span style={{ color: item.active ? "white" : "#FDE68A", fontSize: 13, fontWeight: item.active ? 700 : 500, letterSpacing: "0.2px" }}>{item.label}</span>
                {item.active && <div style={{ marginLeft: "auto", width: 6, height: 6, borderRadius: "50%", background: "#FDE68A", boxShadow: "0 0 4px #FDE68A" }} />}
              </div>
            ))}
          </nav>
        </div>

        {/* Main */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", background: "#F8FAFC", overflow: "hidden" }}>
          {/* Header */}
          <div style={{ height: 56, background: "white", borderBottom: "2px solid #D97706", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 24px", flexShrink: 0, boxShadow: "0 2px 8px rgba(5,13,31,0.05)" }}>
            <div>
              <div style={{ fontSize: 15, fontWeight: 800, color: "#0F1B2D" }}>Program Semester</div>
              <div style={{ fontSize: 11, color: "#D97706", fontWeight: 600 }}>Matematika · Kelas 7A</div>
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <button style={{ padding: "6px 14px", background: "white", border: "1.5px solid #F59E0B", borderRadius: 8, fontSize: 12, color: "#D97706", fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                Impor AI
              </button>
              <button style={{ padding: "6px 16px", background: "linear-gradient(to bottom, #F59E0B, #D97706)", border: "none", borderRadius: 8, fontSize: 12, color: "white", fontWeight: 700, cursor: "pointer", boxShadow: "0 2px 4px rgba(217,119,6,0.3)", display: "flex", alignItems: "center", gap: 6 }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                Tambah Materi
              </button>
            </div>
          </div>

          {/* Content */}
          <div style={{ flex: 1, padding: "20px 24px", overflow: "hidden", display: "flex", flexDirection: "column" }}>
            {/* Stats row */}
            <div style={{ display: "flex", gap: 12, marginBottom: 16 }}>
              {[["24", "Total Pekan"], ["18", "KBM"], ["4", "Libur"]].map(([val, label]) => (
                <div key={label} style={{ flex: 1, background: "white", borderRadius: 10, padding: "14px 16px", border: "1px solid rgba(217,119,6,0.15)", boxShadow: "0 2px 6px rgba(5,13,31,0.03)", position: "relative", overflow: "hidden" }}>
                  <StarWatermark />
                  <div style={{ fontSize: 22, fontWeight: 800, color: "#0F1B2D", position: "relative" }}>{val}</div>
                  <div style={{ fontSize: 11, color: "#D97706", fontWeight: 700, marginTop: 2, position: "relative" }}>{label}</div>
                </div>
              ))}
            </div>

            {/* Table */}
            <div style={{ background: "white", borderRadius: 12, border: "1px solid rgba(217,119,6,0.2)", overflow: "hidden", boxShadow: "0 4px 12px rgba(5,13,31,0.03)", display: "flex", flexDirection: "column", flex: 1 }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                <thead>
                  <tr style={{ background: "#050D1F" }}>
                    {["Pekan", "Tanggal", "Jenis", "CP", "Materi", "JP"].map(h => (
                      <th key={h} style={{ padding: "10px 14px", textAlign: "left", fontWeight: 700, color: "#FDE68A", fontSize: 11, letterSpacing: "0.5px", textTransform: "uppercase" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {ROWS.map((row, i) => (
                    <tr key={row.pekan} style={{ borderBottom: "1px solid #F1F5F9", background: i % 2 === 0 ? "white" : "#FAFAFA" }}>
                      <td style={{ padding: "10px 14px", fontWeight: 700, color: "#0F1B2D" }}>{row.pekan}</td>
                      <td style={{ padding: "10px 14px", color: "#64748B", fontWeight: 500 }}>{row.tanggal}</td>
                      <td style={{ padding: "10px 14px" }}>
                        <span style={{ 
                          padding: "3px 8px", 
                          borderRadius: 6, 
                          fontSize: 10, 
                          fontWeight: 800, 
                          background: row.jenis === "KBM" ? "rgba(245,158,11,0.15)" : "#F1F5F9", 
                          color: row.jenis === "KBM" ? "#D97706" : "#475569" 
                        }}>{row.jenis}</span>
                      </td>
                      <td style={{ padding: "10px 14px", color: "#0F1B2D", fontWeight: 700 }}>{row.cp}</td>
                      <td style={{ padding: "10px 14px", color: "#334155", maxWidth: 180, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", fontWeight: 500 }}>{row.materi}</td>
                      <td style={{ padding: "10px 14px", color: "#D97706", fontWeight: 800 }}>{row.jp || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Theme info bar */}
      <div style={{ height: 48, background: "#050D1F", display: "flex", alignItems: "center", padding: "0 20px", gap: 20, flexShrink: 0, borderTop: "1px solid rgba(253,230,138,0.2)" }}>
        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
          {["#050D1F", "#0F1B2D", "#F8FAFC", "#F59E0B", "#D97706"].map(c => (
            <div key={c} style={{ width: 20, height: 20, borderRadius: 6, background: c, border: "2px solid rgba(255,255,255,0.15)", boxShadow: "0 2px 4px rgba(0,0,0,0.2)" }} />
          ))}
        </div>
        <div style={{ color: "#FDE68A", fontWeight: 800, fontSize: 13, display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ fontSize: 16 }}>✦</span> Bintang Fajar
        </div>
        <div style={{ color: "rgba(253,230,138,0.7)", fontSize: 12, marginLeft: "auto", fontWeight: 600 }}>
          Font: Nunito — rounded & friendly
        </div>
      </div>
    </div>
  );
}
