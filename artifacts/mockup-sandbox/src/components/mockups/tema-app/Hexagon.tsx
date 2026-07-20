import "./_group.css";

const NAV = [
  { icon: "📊", label: "Dashboard", active: false },
  { icon: "📚", label: "Program Semester", active: true },
  { icon: "📖", label: "Jurnal Mengajar", active: false },
  { icon: "👥", label: "Data Siswa", active: false },
  { icon: "📝", label: "Penilaian", active: false },
  { icon: "⚙️", label: "Pengaturan", active: false },
];

const ROWS = [
  { pekan: "P.1", tanggal: "14–18 Jul", jenis: "KBM", cp: "TP 1", materi: "Bilangan Bulat & Operasinya", jp: 4 },
  { pekan: "P.2", tanggal: "21–25 Jul", jenis: "KBM", cp: "TP 2", materi: "Persamaan Linear Satu Variabel", jp: 4 },
  { pekan: "P.3", tanggal: "28 Jul–1 Ags", jenis: "KBM", cp: "TP 3", materi: "Pertidaksamaan Linear", jp: 4 },
  { pekan: "P.4", tanggal: "4–8 Ags", jenis: "Libur", cp: "—", materi: "Libur Nasional", jp: 0 },
  { pekan: "P.5", tanggal: "11–15 Ags", jenis: "KBM", cp: "TP 4", materi: "Himpunan & Operasinya", jp: 4 },
];

export function Hexagon() {
  const hexPattern = `url("data:image/svg+xml,%3Csvg width='24' height='28' viewBox='0 0 24 28' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M12 1 L22 6.5 L22 17.5 L12 23 L2 17.5 L2 6.5 Z' fill='none' stroke='rgba(14,165,233,0.2)' stroke-width='0.8'/%3E%3Cpath d='M12 4 L20 8.5 L20 16.5 L12 21 L4 16.5 L4 8.5 Z' fill='none' stroke='rgba(14,165,233,0.08)' stroke-width='0.5'/%3E%3C/svg%3E")`;
  
  const bigHex = `url("data:image/svg+xml,%3Csvg width='80' height='92' viewBox='0 0 80 92' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M40 2 L78 24 L78 68 L40 90 L2 68 L2 24 Z' fill='none' stroke='%230C1445' stroke-width='4'/%3E%3C/svg%3E")`;

  return (
    <div style={{ width: 920, height: 660, display: "flex", flexDirection: "column", fontFamily: "'Space Grotesk', sans-serif", background: "#F0F7FF", overflow: "hidden" }}>
      <style>
        {`@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&display=swap');`}
      </style>
      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
        {/* Sidebar */}
        <div style={{ 
          width: 210, 
          background: "linear-gradient(180deg, #0C1445 0%, #1E3A5F 100%)", 
          display: "flex", 
          flexDirection: "column", 
          flexShrink: 0,
          position: "relative"
        }}>
          {/* Hexagon Pattern Overlay */}
          <div style={{ position: "absolute", inset: 0, backgroundImage: hexPattern, backgroundSize: "24px 28px", zIndex: 0, pointerEvents: "none" }} />
          
          <div style={{ position: "relative", zIndex: 1, display: "flex", flexDirection: "column", height: "100%" }}>
            {/* Logo */}
            <div style={{ padding: "20px 16px 16px", borderBottom: "1px solid rgba(14,165,233,0.2)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ width: 34, height: 34, borderRadius: 8, background: "#0EA5E9", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>
                  💎
                </div>
                <div>
                  <div style={{ color: "white", fontWeight: 700, fontSize: 13, lineHeight: 1.2 }}>GuruPintar</div>
                  <div style={{ color: "#BAE6FD", fontSize: 10 }}>Semester Ganjil 25/26</div>
                </div>
              </div>
            </div>

            {/* User */}
            <div style={{ padding: "12px 16px", borderBottom: "1px solid rgba(14,165,233,0.2)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ width: 28, height: 28, borderRadius: "50%", background: "#0EA5E9", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, color: "white", fontWeight: 700 }}>AW</div>
                <div>
                  <div style={{ color: "white", fontSize: 11, fontWeight: 600 }}>Ani Widyastuti</div>
                  <div style={{ color: "#BAE6FD", fontSize: 9 }}>Guru Matematika</div>
                </div>
              </div>
            </div>

            {/* Nav */}
            <nav style={{ flex: 1, padding: "8px 0" }}>
              {NAV.map((item) => (
                <div key={item.label} style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 16px", margin: "1px 8px", borderRadius: 6, background: item.active ? "#0EA5E9" : "transparent", cursor: "pointer" }}>
                  <span style={{ fontSize: 13 }}>{item.icon}</span>
                  <span style={{ color: item.active ? "white" : "#BAE6FD", fontSize: 12, fontWeight: item.active ? 600 : 400 }}>{item.label}</span>
                  {item.active && <div style={{ marginLeft: "auto", width: 6, height: 6, borderRadius: "50%", background: "#F0F7FF" }} />}
                </div>
              ))}
            </nav>
          </div>
        </div>

        {/* Main */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", background: "#F0F7FF", overflow: "hidden" }}>
          {/* Header */}
          <div style={{ height: 56, background: "white", borderBottom: "1px solid #BAE6FD", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 24px", flexShrink: 0, boxShadow: "0 1px 3px rgba(14,165,233,0.06)" }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#0C1445" }}>Program Semester</div>
              <div style={{ fontSize: 10, color: "#0369A1" }}>Matematika · Kelas 7A</div>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button style={{ padding: "6px 12px", background: "white", border: "1px solid #BAE6FD", borderRadius: 6, fontSize: 11, color: "#0EA5E9", fontWeight: 600, cursor: "pointer" }}>Impor AI</button>
              <button style={{ padding: "6px 14px", background: "#0EA5E9", border: "none", borderRadius: 6, fontSize: 11, color: "white", fontWeight: 600, cursor: "pointer" }}>+ Tambah Materi</button>
            </div>
          </div>

          {/* Content */}
          <div style={{ flex: 1, padding: "16px 20px", overflow: "hidden", display: "flex", flexDirection: "column", position: "relative" }}>
            {/* Big Hexagon Watermark */}
            <div style={{ position: "absolute", right: 20, top: 16, width: 80, height: 92, backgroundImage: bigHex, opacity: 0.04, pointerEvents: "none", zIndex: 0 }} />
            
            {/* Stats row */}
            <div style={{ display: "flex", gap: 10, marginBottom: 14, position: "relative", zIndex: 1 }}>
              {[["24", "Total Pekan"], ["18", "KBM"], ["4", "Libur"]].map(([val, label]) => (
                <div key={label} style={{ flex: 1, background: "white", borderRadius: 8, padding: "10px 14px", border: "1px solid #BAE6FD", boxShadow: "0 1px 2px rgba(14,165,233,0.04)" }}>
                  <div style={{ fontSize: 18, fontWeight: 700, color: "#0EA5E9" }}>{val}</div>
                  <div style={{ fontSize: 10, color: "#0369A1", marginTop: 1 }}>{label}</div>
                </div>
              ))}
            </div>

            {/* Table */}
            <div style={{ background: "white", borderRadius: 10, border: "1px solid #BAE6FD", overflow: "hidden", boxShadow: "0 1px 3px rgba(14,165,233,0.05)", display: "flex", flexDirection: "column", position: "relative", zIndex: 1 }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11 }}>
                <thead>
                  <tr style={{ background: "#F0F7FF", borderBottom: "1px solid #BAE6FD" }}>
                    {["Pekan", "Tanggal", "Jenis", "CP", "Materi", "JP"].map(h => (
                      <th key={h} style={{ padding: "8px 10px", textAlign: "left", fontWeight: 700, color: "#0369A1", fontSize: 10 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {ROWS.map((row, i) => (
                    <tr key={row.pekan} style={{ borderBottom: "1px solid #F0F7FF", background: i % 2 === 0 ? "white" : "#F8FAFC" }}>
                      <td style={{ padding: "7px 10px", fontWeight: 700, color: "#0C1445" }}>{row.pekan}</td>
                      <td style={{ padding: "7px 10px", color: "#0369A1" }}>{row.tanggal}</td>
                      <td style={{ padding: "7px 10px" }}>
                        <span style={{ 
                          padding: "2px 7px", 
                          borderRadius: 4, 
                          fontSize: 9, 
                          fontWeight: 700, 
                          background: row.jenis === "KBM" ? "#BAE6FD" : "#F1F5F9", 
                          color: row.jenis === "KBM" ? "#0369A1" : "#64748B" 
                        }}>{row.jenis}</span>
                      </td>
                      <td style={{ padding: "7px 10px", color: "#0EA5E9", fontWeight: 600 }}>{row.cp}</td>
                      <td style={{ padding: "7px 10px", color: "#0C1445", maxWidth: 160, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{row.materi}</td>
                      <td style={{ padding: "7px 10px", color: "#0369A1", fontWeight: 700 }}>{row.jp || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Theme info bar */}
      <div style={{ height: 48, background: "#0C1445", display: "flex", alignItems: "center", padding: "0 20px", gap: 20, flexShrink: 0, position: "relative", zIndex: 10 }}>
        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
          {["#0C1445", "#1E3A5F", "#0EA5E9", "#BAE6FD", "#F0F7FF"].map(c => (
            <div key={c} style={{ width: 18, height: 18, borderRadius: 4, background: c, border: "1.5px solid rgba(255,255,255,0.2)" }} />
          ))}
        </div>
        <div style={{ color: "white", fontWeight: 700, fontSize: 12 }}>💎 Kristal Hexagon</div>
        <div style={{ color: "#BAE6FD", fontSize: 11, marginLeft: "auto" }}>Font: Space Grotesk — geometric sans</div>
      </div>
    </div>
  );
}
