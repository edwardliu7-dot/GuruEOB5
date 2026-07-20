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

const RAW_SVG = `<svg width='30' height='26' viewBox='0 0 30 26' xmlns='http://www.w3.org/2000/svg'>
  <path d='M0 0 L15 26 L-15 26 Z' fill='none' stroke='rgba(196,181,253,0.15)' stroke-width='0.7'/>
  <path d='M30 0 L15 26 L45 26 Z' fill='none' stroke='rgba(196,181,253,0.1)' stroke-width='0.7'/>
  <path d='M15 0 L30 26 L0 26 Z' fill='none' stroke='rgba(196,181,253,0.12)' stroke-width='0.7'/>
  <circle cx='15' cy='0' r='1' fill='rgba(196,181,253,0.15)'/>
  <circle cx='0' cy='26' r='1' fill='rgba(196,181,253,0.1)'/>
  <circle cx='30' cy='26' r='1' fill='rgba(196,181,253,0.1)'/>
</svg>`;

const ENCODED_SVG = "data:image/svg+xml," + RAW_SVG.replace(/%/g, "%25").replace(/</g, "%3C").replace(/>/g, "%3E").replace(/#/g, "%23").replace(/"/g, "%22").replace(/'/g, "%27").replace(/\s+/g, "%20");

export function Origami() {
  return (
    <div style={{ width: 920, height: 660, display: "flex", flexDirection: "column", fontFamily: "'Plus Jakarta Sans', sans-serif", background: "#F5F3FF", overflow: "hidden" }}>
      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
        {/* Sidebar */}
        <div style={{ 
          width: 210, 
          background: `url("${ENCODED_SVG}"), linear-gradient(180deg, #1E1B4B 0%, #312E81 100%)`,
          display: "flex", 
          flexDirection: "column", 
          flexShrink: 0 
        }}>
          {/* Logo */}
          <div style={{ padding: "20px 16px 16px", borderBottom: "1px solid rgba(196,181,253,0.15)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 34, height: 34, borderRadius: 8, background: "#7C3AED", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2L2 22L12 16L22 22L12 2Z" fill="white" fillOpacity="0.2"/>
                </svg>
              </div>
              <div>
                <div style={{ color: "white", fontWeight: 700, fontSize: 13, lineHeight: 1.2 }}>GuruPintar</div>
                <div style={{ color: "#C4B5FD", fontSize: 10 }}>Semester Ganjil 25/26</div>
              </div>
            </div>
          </div>

          {/* User */}
          <div style={{ padding: "12px 16px", borderBottom: "1px solid rgba(196,181,253,0.15)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ width: 28, height: 28, borderRadius: "50%", background: "#7C3AED", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, color: "white", fontWeight: 700 }}>AW</div>
              <div>
                <div style={{ color: "white", fontSize: 11, fontWeight: 600 }}>Ani Widyastuti</div>
                <div style={{ color: "#C4B5FD", fontSize: 9 }}>Guru Matematika</div>
              </div>
            </div>
          </div>

          {/* Nav */}
          <nav style={{ flex: 1, padding: "8px 0" }}>
            {NAV.map((item) => (
              <div key={item.label} style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 16px", margin: "1px 8px", borderRadius: 6, background: item.active ? "#7C3AED" : "transparent", cursor: "pointer" }}>
                <span style={{ fontSize: 13 }}>{item.icon}</span>
                <span style={{ color: item.active ? "white" : "#E2E8F0", fontSize: 12, fontWeight: item.active ? 600 : 400 }}>{item.label}</span>
                {item.active && <div style={{ marginLeft: "auto", width: 6, height: 6, borderRadius: "50%", background: "#C4B5FD" }} />}
              </div>
            ))}
          </nav>
        </div>

        {/* Main */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", background: "#F5F3FF", overflow: "hidden" }}>
          {/* Header */}
          <div style={{ height: 56, background: "white", borderBottom: "1px solid #E2E8F0", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 24px", flexShrink: 0, boxShadow: "0 1px 3px rgba(30,27,75,0.04)", position: "relative" }}>
            
            {/* Header Triangles */}
            <div style={{ position: "absolute", right: 280, top: 0, height: "100%", display: "flex", alignItems: "center", opacity: 0.8 }}>
              <svg width="60" height="40" viewBox="0 0 60 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M20 5 L35 25 L5 25 Z" fill="#7C3AED" fillOpacity="0.15"/>
                <path d="M40 10 L50 30 L30 30 Z" fill="#C4B5FD" fillOpacity="0.2"/>
                <path d="M10 35 L25 20 L40 35 Z" fill="#7C3AED" fillOpacity="0.1"/>
              </svg>
            </div>

            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#1E1B4B" }}>Program Semester</div>
              <div style={{ fontSize: 10, color: "#5B21B6" }}>Matematika · Kelas 7A</div>
            </div>
            <div style={{ display: "flex", gap: 8, zIndex: 1 }}>
              <button style={{ padding: "6px 12px", background: "white", border: "1px solid #C4B5FD", borderRadius: 6, fontSize: 11, color: "#7C3AED", fontWeight: 600, cursor: "pointer" }}>Impor AI</button>
              <button style={{ padding: "6px 14px", background: "#7C3AED", border: "none", borderRadius: 6, fontSize: 11, color: "white", fontWeight: 600, cursor: "pointer" }}>+ Tambah Materi</button>
            </div>
          </div>

          {/* Content */}
          <div style={{ flex: 1, padding: "16px 20px", overflow: "hidden" }}>
            {/* Stats row */}
            <div style={{ display: "flex", gap: 10, marginBottom: 14 }}>
              {[["24", "Total Pekan"], ["18", "KBM"], ["4", "Libur"]].map(([val, label]) => (
                <div key={label} style={{ flex: 1, background: "white", borderRadius: 8, padding: "10px 14px", border: "1px solid #E2E8F0", boxShadow: "0 1px 2px rgba(30,27,75,0.03)" }}>
                  <div style={{ fontSize: 18, fontWeight: 700, color: "#7C3AED" }}>{val}</div>
                  <div style={{ fontSize: 10, color: "#5B21B6", marginTop: 1 }}>{label}</div>
                </div>
              ))}
            </div>

            {/* Table */}
            <div style={{ background: "white", borderRadius: 10, border: "1px solid #E2E8F0", overflow: "hidden", boxShadow: "0 1px 3px rgba(30,27,75,0.04)" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11 }}>
                <thead>
                  <tr style={{ background: "#F5F3FF", borderBottom: "1px solid #E2E8F0" }}>
                    {["Pekan", "Tanggal", "Jenis", "CP", "Materi", "JP"].map(h => (
                      <th key={h} style={{ padding: "8px 10px", textAlign: "left", fontWeight: 600, color: "#5B21B6", fontSize: 10 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {ROWS.map((row, i) => (
                    <tr key={row.pekan} style={{ borderBottom: "1px solid #F5F3FF", background: i % 2 === 0 ? "white" : "#FAFAFA" }}>
                      <td style={{ padding: "7px 10px", fontWeight: 600, color: "#1E1B4B" }}>{row.pekan}</td>
                      <td style={{ padding: "7px 10px", color: "#5B21B6" }}>{row.tanggal}</td>
                      <td style={{ padding: "7px 10px" }}>
                        <span style={{ padding: "2px 7px", borderRadius: 4, fontSize: 9, fontWeight: 600, background: row.jenis === "KBM" ? "#F5F3FF" : "#FEF3C7", color: row.jenis === "KBM" ? "#7C3AED" : "#B45309" }}>{row.jenis}</span>
                      </td>
                      <td style={{ padding: "7px 10px", color: "#7C3AED", fontWeight: 500 }}>{row.cp}</td>
                      <td style={{ padding: "7px 10px", color: "#1E1B4B", maxWidth: 160, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{row.materi}</td>
                      <td style={{ padding: "7px 10px", color: "#5B21B6", fontWeight: 600 }}>{row.jp || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Theme info bar */}
      <div style={{ height: 48, background: "#1E1B4B", display: "flex", alignItems: "center", padding: "0 20px", gap: 20, flexShrink: 0 }}>
        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
          {["#1E1B4B", "#312E81", "#7C3AED", "#C4B5FD", "#F5F3FF"].map(c => (
            <div key={c} style={{ width: 18, height: 18, borderRadius: 4, background: c, border: "1.5px solid rgba(255,255,255,0.2)" }} />
          ))}
        </div>
        <div style={{ color: "white", fontWeight: 700, fontSize: 12 }}>🔺 Segitiga Origami</div>
        <div style={{ color: "#C4B5FD", fontSize: 11, marginLeft: "auto" }}>Font: Plus Jakarta Sans — modern Indonesia</div>
      </div>
    </div>
  );
}
