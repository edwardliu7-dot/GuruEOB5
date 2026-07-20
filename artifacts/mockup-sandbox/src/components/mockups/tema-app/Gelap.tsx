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

export function Gelap() {
  return (
    <div style={{ width: 920, height: 660, display: "flex", flexDirection: "column", fontFamily: "'DM Sans', sans-serif", background: "#0f172a", overflow: "hidden" }}>
      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
        {/* Sidebar */}
        <div style={{ width: 210, background: "#0a0f1e", display: "flex", flexDirection: "column", flexShrink: 0, borderRight: "1px solid #1e293b" }}>
          {/* Logo */}
          <div style={{ padding: "20px 16px 16px", borderBottom: "1px solid #1e293b" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 34, height: 34, borderRadius: 8, background: "linear-gradient(135deg, #0ea5e9, #38bdf8)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, boxShadow: "0 2px 10px rgba(14,165,233,0.35)" }}>🎓</div>
              <div>
                <div style={{ color: "#f8fafc", fontWeight: 700, fontSize: 13, lineHeight: 1.2 }}>GuruPintar</div>
                <div style={{ color: "#38bdf8", fontSize: 10 }}>Semester Ganjil 25/26</div>
              </div>
            </div>
          </div>

          {/* User */}
          <div style={{ padding: "12px 16px", borderBottom: "1px solid #1e293b" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ width: 28, height: 28, borderRadius: "50%", background: "linear-gradient(135deg, #0ea5e9, #38bdf8)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, color: "white", fontWeight: 700 }}>AW</div>
              <div>
                <div style={{ color: "#f8fafc", fontSize: 11, fontWeight: 500 }}>Ani Widyastuti</div>
                <div style={{ color: "#38bdf8", fontSize: 9 }}>Guru Matematika</div>
              </div>
            </div>
          </div>

          {/* Nav */}
          <nav style={{ flex: 1, padding: "8px 0" }}>
            {NAV.map((item) => (
              <div key={item.label} style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 16px", margin: "1px 8px", borderRadius: 6, background: item.active ? "#1e293b" : "transparent", cursor: "pointer", borderLeft: item.active ? "2px solid #38bdf8" : "2px solid transparent" }}>
                <span style={{ fontSize: 13, filter: item.active ? "none" : "grayscale(0.4)" }}>{item.icon}</span>
                <span style={{ color: item.active ? "#38bdf8" : "#64748b", fontSize: 12, fontWeight: item.active ? 600 : 400 }}>{item.label}</span>
              </div>
            ))}
          </nav>
        </div>

        {/* Main */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", background: "#0f172a", overflow: "hidden" }}>
          {/* Header */}
          <div style={{ height: 56, background: "#0f172a", borderBottom: "1px solid #1e293b", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 24px", flexShrink: 0 }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 600, color: "#f8fafc" }}>Program Semester</div>
              <div style={{ fontSize: 10, color: "#38bdf8" }}>Matematika · Kelas 7A</div>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button style={{ padding: "6px 12px", background: "transparent", border: "1px solid #334155", borderRadius: 6, fontSize: 11, color: "#94a3b8", fontWeight: 500, cursor: "pointer" }}>✨ Impor AI</button>
              <button style={{ padding: "6px 14px", background: "linear-gradient(135deg, #0ea5e9, #38bdf8)", border: "none", borderRadius: 6, fontSize: 11, color: "#0f172a", fontWeight: 700, cursor: "pointer", boxShadow: "0 2px 8px rgba(14,165,233,0.3)" }}>+ Tambah Materi</button>
            </div>
          </div>

          {/* Content */}
          <div style={{ flex: 1, padding: "16px 20px", overflow: "hidden" }}>
            {/* Stats row */}
            <div style={{ display: "flex", gap: 10, marginBottom: 14 }}>
              {[["24", "Total Pekan", "#38bdf8"], ["18", "KBM", "#34d399"], ["4", "Libur", "#f472b6"]].map(([val, label, color]) => (
                <div key={label} style={{ flex: 1, background: "#1e293b", borderRadius: 8, padding: "10px 14px", border: "1px solid #334155" }}>
                  <div style={{ fontSize: 18, fontWeight: 700, color }}>{val}</div>
                  <div style={{ fontSize: 10, color: "#475569", marginTop: 1 }}>{label}</div>
                </div>
              ))}
            </div>

            {/* Table */}
            <div style={{ background: "#1e293b", borderRadius: 10, border: "1px solid #334155", overflow: "hidden" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11 }}>
                <thead>
                  <tr style={{ background: "#162032", borderBottom: "1px solid #334155" }}>
                    {["Pekan", "Tanggal", "Jenis", "CP", "Materi", "JP"].map(h => (
                      <th key={h} style={{ padding: "8px 10px", textAlign: "left", fontWeight: 600, color: "#38bdf8", fontSize: 10 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {ROWS.map((row, i) => (
                    <tr key={row.pekan} style={{ borderBottom: "1px solid #1e293b", background: i % 2 === 0 ? "#1e293b" : "#1a2538" }}>
                      <td style={{ padding: "7px 10px", fontWeight: 600, color: "#f8fafc" }}>{row.pekan}</td>
                      <td style={{ padding: "7px 10px", color: "#475569" }}>{row.tanggal}</td>
                      <td style={{ padding: "7px 10px" }}>
                        <span style={{ padding: "2px 7px", borderRadius: 4, fontSize: 9, fontWeight: 600, background: row.jenis === "KBM" ? "rgba(52,211,153,0.15)" : "rgba(251,191,36,0.15)", color: row.jenis === "KBM" ? "#34d399" : "#fbbf24" }}>{row.jenis}</span>
                      </td>
                      <td style={{ padding: "7px 10px", color: "#38bdf8", fontWeight: 500 }}>{row.cp}</td>
                      <td style={{ padding: "7px 10px", color: "#94a3b8", maxWidth: 160, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{row.materi}</td>
                      <td style={{ padding: "7px 10px", color: "#475569", fontWeight: 600 }}>{row.jp || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Theme info bar */}
      <div style={{ height: 48, background: "#0a0f1e", display: "flex", alignItems: "center", padding: "0 20px", gap: 20, flexShrink: 0, borderTop: "1px solid #1e293b" }}>
        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
          {["#0a0f1e", "#1e293b", "#334155", "#0ea5e9", "#38bdf8"].map(c => (
            <div key={c} style={{ width: 18, height: 18, borderRadius: 4, background: c, border: "1.5px solid rgba(255,255,255,0.1)" }} />
          ))}
        </div>
        <div style={{ color: "#f8fafc", fontWeight: 600, fontSize: 12 }}>🌑 Gelap</div>
        <div style={{ color: "#475569", fontSize: 11, marginLeft: "auto" }}>Font: DM Sans — sleek & minimal</div>
      </div>
    </div>
  );
}
