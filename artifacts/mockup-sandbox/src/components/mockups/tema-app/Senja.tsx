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

export function Senja() {
  return (
    <div style={{ width: 920, height: 660, display: "flex", flexDirection: "column", fontFamily: "'Nunito', sans-serif", overflow: "hidden" }}>
      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
        {/* Sidebar */}
        <div style={{ width: 210, background: "linear-gradient(180deg, #78350f 0%, #92400e 100%)", display: "flex", flexDirection: "column", flexShrink: 0 }}>
          {/* Logo */}
          <div style={{ padding: "20px 16px 16px", borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 34, height: 34, borderRadius: 8, background: "#f59e0b", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>🎓</div>
              <div>
                <div style={{ color: "white", fontWeight: 800, fontSize: 13, lineHeight: 1.2 }}>GuruPintar</div>
                <div style={{ color: "#fde68a", fontSize: 10 }}>Semester Ganjil 25/26</div>
              </div>
            </div>
          </div>

          {/* User */}
          <div style={{ padding: "12px 16px", borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ width: 28, height: 28, borderRadius: "50%", background: "#f59e0b", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, color: "white", fontWeight: 700 }}>AW</div>
              <div>
                <div style={{ color: "white", fontSize: 11, fontWeight: 700 }}>Ani Widyastuti</div>
                <div style={{ color: "#fde68a", fontSize: 9 }}>Guru Matematika</div>
              </div>
            </div>
          </div>

          {/* Nav */}
          <nav style={{ flex: 1, padding: "8px 0" }}>
            {NAV.map((item) => (
              <div key={item.label} style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 16px", margin: "1px 8px", borderRadius: 6, background: item.active ? "#f59e0b" : "transparent", cursor: "pointer" }}>
                <span style={{ fontSize: 13 }}>{item.icon}</span>
                <span style={{ color: item.active ? "#78350f" : "#fde68a", fontSize: 12, fontWeight: item.active ? 800 : 500 }}>{item.label}</span>
                {item.active && <div style={{ marginLeft: "auto", width: 6, height: 6, borderRadius: "50%", background: "#78350f" }} />}
              </div>
            ))}
          </nav>
        </div>

        {/* Main */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", background: "#fffbeb", overflow: "hidden" }}>
          {/* Header */}
          <div style={{ height: 56, background: "#fffbeb", borderBottom: "1px solid #fde68a", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 24px", flexShrink: 0, boxShadow: "0 1px 3px rgba(245,158,11,0.08)" }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 800, color: "#78350f" }}>Program Semester</div>
              <div style={{ fontSize: 10, color: "#d97706" }}>Matematika · Kelas 7A</div>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button style={{ padding: "6px 12px", background: "white", border: "1.5px solid #fcd34d", borderRadius: 6, fontSize: 11, color: "#b45309", fontWeight: 700, cursor: "pointer" }}>✨ Impor AI</button>
              <button style={{ padding: "6px 14px", background: "#f59e0b", border: "none", borderRadius: 6, fontSize: 11, color: "#78350f", fontWeight: 800, cursor: "pointer" }}>+ Tambah Materi</button>
            </div>
          </div>

          {/* Content */}
          <div style={{ flex: 1, padding: "16px 20px", overflow: "hidden" }}>
            {/* Stats row */}
            <div style={{ display: "flex", gap: 10, marginBottom: 14 }}>
              {[["24", "Total Pekan"], ["18", "KBM"], ["4", "Libur"]].map(([val, label]) => (
                <div key={label} style={{ flex: 1, background: "white", borderRadius: 8, padding: "10px 14px", border: "1px solid #fde68a", boxShadow: "0 1px 2px rgba(245,158,11,0.08)" }}>
                  <div style={{ fontSize: 18, fontWeight: 800, color: "#b45309" }}>{val}</div>
                  <div style={{ fontSize: 10, color: "#d97706", marginTop: 1 }}>{label}</div>
                </div>
              ))}
            </div>

            {/* Table */}
            <div style={{ background: "white", borderRadius: 10, border: "1px solid #fde68a", overflow: "hidden", boxShadow: "0 1px 3px rgba(245,158,11,0.07)" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11 }}>
                <thead>
                  <tr style={{ background: "#fffbeb", borderBottom: "1px solid #fde68a" }}>
                    {["Pekan", "Tanggal", "Jenis", "CP", "Materi", "JP"].map(h => (
                      <th key={h} style={{ padding: "8px 10px", textAlign: "left", fontWeight: 800, color: "#b45309", fontSize: 10 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {ROWS.map((row, i) => (
                    <tr key={row.pekan} style={{ borderBottom: "1px solid #fffbeb", background: i % 2 === 0 ? "white" : "#fffdf5" }}>
                      <td style={{ padding: "7px 10px", fontWeight: 700, color: "#78350f" }}>{row.pekan}</td>
                      <td style={{ padding: "7px 10px", color: "#d97706" }}>{row.tanggal}</td>
                      <td style={{ padding: "7px 10px" }}>
                        <span style={{ padding: "2px 7px", borderRadius: 4, fontSize: 9, fontWeight: 700, background: row.jenis === "KBM" ? "#fef9c3" : "#fce7f3", color: row.jenis === "KBM" ? "#854d0e" : "#9d174d" }}>{row.jenis}</span>
                      </td>
                      <td style={{ padding: "7px 10px", color: "#b45309", fontWeight: 600 }}>{row.cp}</td>
                      <td style={{ padding: "7px 10px", color: "#78350f", maxWidth: 160, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{row.materi}</td>
                      <td style={{ padding: "7px 10px", color: "#d97706", fontWeight: 700 }}>{row.jp || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Theme info bar */}
      <div style={{ height: 48, background: "#78350f", display: "flex", alignItems: "center", padding: "0 20px", gap: 20, flexShrink: 0 }}>
        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
          {["#78350f", "#b45309", "#f59e0b", "#fde68a", "#fffbeb"].map(c => (
            <div key={c} style={{ width: 18, height: 18, borderRadius: 4, background: c, border: "1.5px solid rgba(255,255,255,0.2)" }} />
          ))}
        </div>
        <div style={{ color: "#fde68a", fontWeight: 800, fontSize: 12 }}>🌅 Senja</div>
        <div style={{ color: "#fcd34d", fontSize: 11, marginLeft: "auto" }}>Font: Nunito — hangat & ramah</div>
      </div>
    </div>
  );
}
