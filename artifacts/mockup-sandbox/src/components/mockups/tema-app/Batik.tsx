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
  { pekan: "P.3", tanggal: "28–1 Ags", jenis: "KBM", cp: "TP 3", materi: "Pertidaksamaan Linear", jp: 4 },
  { pekan: "P.4", tanggal: "4–8 Ags", jenis: "Libur", cp: "—", materi: "Libur Nasional", jp: 0 },
  { pekan: "P.5", tanggal: "11–15 Ags", jenis: "KBM", cp: "TP 4", materi: "Himpunan & Operasinya", jp: 4 },
];

const svgPattern = `data:image/svg+xml,%3Csvg width='20' height='20' viewBox='0 0 20 20' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M10 0 L20 10 L10 20 L0 10 Z' fill='none' stroke='rgba(255,200,100,0.15)' stroke-width='0.8'/%3E%3Ccircle cx='10' cy='10' r='1.5' fill='rgba(255,200,100,0.1)'/%3E%3C/svg%3E`;

export function Batik() {
  return (
    <div style={{ width: 920, height: 660, display: "flex", flexDirection: "column", fontFamily: "'Lora', serif", background: "#FEF7ED", overflow: "hidden" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Lora:ital,wght@0,400;0,500;0,600;0,700;1,400&display=swap');
      `}</style>
      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
        {/* Sidebar */}
        <div style={{ position: "relative", width: 210, background: "linear-gradient(160deg, #7C2D12 0%, #92400E 100%)", flexShrink: 0, overflow: "hidden" }}>
          {/* Overlay Pattern */}
          <div style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundImage: `url("${svgPattern}")`, opacity: 0.4, pointerEvents: "none" }} />
          
          <div style={{ position: "relative", zIndex: 1, display: "flex", flexDirection: "column", height: "100%" }}>
            {/* Logo */}
            <div style={{ padding: "20px 16px 16px", borderBottom: "1px solid rgba(253,230,138,0.15)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ width: 34, height: 34, borderRadius: 8, background: "#B45309", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>🎓</div>
                <div>
                  <div style={{ color: "white", fontWeight: 700, fontSize: 13, lineHeight: 1.2 }}>GuruPintar</div>
                  <div style={{ color: "#FDE68A", fontSize: 10 }}>Semester Ganjil 25/26</div>
                </div>
              </div>
            </div>

            {/* User */}
            <div style={{ padding: "12px 16px", borderBottom: "1px solid rgba(253,230,138,0.15)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ width: 28, height: 28, borderRadius: "50%", background: "#B45309", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, color: "white", fontWeight: 700 }}>AW</div>
                <div>
                  <div style={{ color: "white", fontSize: 11, fontWeight: 600 }}>Ani Widyastuti</div>
                  <div style={{ color: "#FDE68A", fontSize: 9 }}>Guru Matematika</div>
                </div>
              </div>
            </div>

            {/* Nav */}
            <nav style={{ flex: 1, padding: "8px 0" }}>
              {NAV.map((item) => (
                <div key={item.label} style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 16px", margin: "1px 8px", borderRadius: 6, background: item.active ? "#B45309" : "transparent", cursor: "pointer" }}>
                  <span style={{ fontSize: 13 }}>{item.icon}</span>
                  <span style={{ color: item.active ? "white" : "#FDE68A", fontSize: 12, fontWeight: item.active ? 600 : 400 }}>{item.label}</span>
                  {item.active && <div style={{ marginLeft: "auto", width: 6, height: 6, borderRadius: "50%", background: "#FDE68A" }} />}
                </div>
              ))}
            </nav>
          </div>
        </div>

        {/* Main */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", background: "#FEF7ED", overflow: "hidden" }}>
          {/* Header */}
          <div style={{ height: 56, background: "white", borderBottom: "1px solid #FDE68A", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 24px", flexShrink: 0, boxShadow: "0 1px 3px rgba(146,64,14,0.06)" }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#451A03" }}>Program Semester</div>
              <div style={{ fontSize: 10, color: "#92400E" }}>Matematika · Kelas 7A</div>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button style={{ padding: "6px 12px", background: "white", border: "1px solid #D97706", borderRadius: 6, fontSize: 11, color: "#92400E", fontWeight: 600, cursor: "pointer" }}>✨ Impor AI</button>
              <button style={{ padding: "6px 14px", background: "#B45309", border: "none", borderRadius: 6, fontSize: 11, color: "white", fontWeight: 600, cursor: "pointer", boxShadow: "0 1px 2px rgba(124,45,18,0.2)" }}>+ Tambah Materi</button>
            </div>
          </div>

          {/* Content */}
          <div style={{ flex: 1, padding: "16px 20px", overflow: "hidden" }}>
            {/* Stats row */}
            <div style={{ display: "flex", gap: 10, marginBottom: 14 }}>
              {[["24", "Total Pekan"], ["18", "KBM"], ["4", "Libur"]].map(([val, label]) => (
                <div key={label} style={{ flex: 1, background: "white", borderRadius: 8, padding: "10px 14px", border: "1px solid #FDE68A", boxShadow: "0 1px 2px rgba(0,0,0,0.02)" }}>
                  <div style={{ fontSize: 18, fontWeight: 700, color: "#B45309" }}>{val}</div>
                  <div style={{ fontSize: 10, color: "#92400E", marginTop: 1, fontWeight: 500 }}>{label}</div>
                </div>
              ))}
            </div>

            {/* Table */}
            <div style={{ background: "white", borderRadius: 10, border: "1px solid #FDE68A", overflow: "hidden", boxShadow: "0 1px 3px rgba(0,0,0,0.03)" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11 }}>
                <thead>
                  <tr style={{ background: "#FEF7ED", borderBottom: "1px solid #FDE68A" }}>
                    {["Pekan", "Tanggal", "Jenis", "CP", "Materi", "JP"].map(h => (
                      <th key={h} style={{ padding: "8px 10px", textAlign: "left", fontWeight: 700, color: "#92400E", fontSize: 10 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {ROWS.map((row, i) => (
                    <tr key={row.pekan} style={{ borderBottom: "1px solid #FEF7ED", background: i % 2 === 0 ? "white" : "#FFFBF5" }}>
                      <td style={{ padding: "7px 10px", fontWeight: 600, color: "#451A03" }}>{row.pekan}</td>
                      <td style={{ padding: "7px 10px", color: "#92400E" }}>{row.tanggal}</td>
                      <td style={{ padding: "7px 10px" }}>
                        <span style={{ padding: "2px 7px", borderRadius: 4, fontSize: 9, fontWeight: 600, background: row.jenis === "KBM" ? "#FDE68A" : "#FED7AA", color: row.jenis === "KBM" ? "#92400E" : "#7C2D12" }}>{row.jenis}</span>
                      </td>
                      <td style={{ padding: "7px 10px", color: "#B45309", fontWeight: 600 }}>{row.cp}</td>
                      <td style={{ padding: "7px 10px", color: "#451A03", maxWidth: 160, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{row.materi}</td>
                      <td style={{ padding: "7px 10px", color: "#92400E", fontWeight: 600 }}>{row.jp || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Theme info bar */}
      <div style={{ height: 48, background: "#451A03", display: "flex", alignItems: "center", padding: "0 20px", gap: 20, flexShrink: 0 }}>
        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
          {["#7C2D12", "#92400E", "#B45309", "#D97706", "#FDE68A", "#FEF7ED"].map(c => (
            <div key={c} style={{ width: 18, height: 18, borderRadius: 4, background: c, border: "1.5px solid rgba(255,255,255,0.2)" }} />
          ))}
        </div>
        <div style={{ color: "white", fontWeight: 700, fontSize: 12 }}>🏺 Batik Nusantara</div>
        <div style={{ color: "#FDE68A", fontSize: 11, marginLeft: "auto" }}>Font: Lora — serif elegan</div>
      </div>
    </div>
  );
}
