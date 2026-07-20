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

export function Indigo() {
  return (
    <div style={{ width: 920, height: 660, display: "flex", flexDirection: "column", fontFamily: "'Plus Jakarta Sans', sans-serif", overflow: "hidden" }}>
      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
        {/* Sidebar */}
        <div style={{ width: 210, background: "linear-gradient(180deg, #1e1b4b 0%, #312e81 100%)", display: "flex", flexDirection: "column", flexShrink: 0 }}>
          {/* Logo */}
          <div style={{ padding: "20px 16px 16px", borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 34, height: 34, borderRadius: 8, background: "linear-gradient(135deg, #6366f1, #8b5cf6)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, boxShadow: "0 2px 8px rgba(99,102,241,0.4)" }}>🎓</div>
              <div>
                <div style={{ color: "white", fontWeight: 700, fontSize: 13, lineHeight: 1.2 }}>GuruPintar</div>
                <div style={{ color: "#c7d2fe", fontSize: 10 }}>Semester Ganjil 25/26</div>
              </div>
            </div>
          </div>

          {/* User */}
          <div style={{ padding: "12px 16px", borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ width: 28, height: 28, borderRadius: "50%", background: "linear-gradient(135deg, #6366f1, #8b5cf6)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, color: "white", fontWeight: 700 }}>AW</div>
              <div>
                <div style={{ color: "white", fontSize: 11, fontWeight: 600 }}>Ani Widyastuti</div>
                <div style={{ color: "#c7d2fe", fontSize: 9 }}>Guru Matematika</div>
              </div>
            </div>
          </div>

          {/* Nav */}
          <nav style={{ flex: 1, padding: "8px 0" }}>
            {NAV.map((item) => (
              <div key={item.label} style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 16px", margin: "1px 8px", borderRadius: 6, background: item.active ? "linear-gradient(135deg, #4f46e5, #7c3aed)" : "transparent", cursor: "pointer", boxShadow: item.active ? "0 2px 8px rgba(79,70,229,0.3)" : "none" }}>
                <span style={{ fontSize: 13 }}>{item.icon}</span>
                <span style={{ color: item.active ? "white" : "#c7d2fe", fontSize: 12, fontWeight: item.active ? 600 : 400 }}>{item.label}</span>
              </div>
            ))}
          </nav>
        </div>

        {/* Main */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", background: "#f5f3ff", overflow: "hidden" }}>
          {/* Header */}
          <div style={{ height: 56, background: "white", borderBottom: "1px solid #e0e7ff", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 24px", flexShrink: 0, boxShadow: "0 1px 3px rgba(79,70,229,0.06)" }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#1e1b4b" }}>Program Semester</div>
              <div style={{ fontSize: 10, color: "#818cf8" }}>Matematika · Kelas 7A</div>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button style={{ padding: "6px 12px", background: "white", border: "1px solid #c7d2fe", borderRadius: 6, fontSize: 11, color: "#4f46e5", fontWeight: 500, cursor: "pointer" }}>✨ Impor AI</button>
              <button style={{ padding: "6px 14px", background: "linear-gradient(135deg, #4f46e5, #7c3aed)", border: "none", borderRadius: 6, fontSize: 11, color: "white", fontWeight: 600, cursor: "pointer", boxShadow: "0 2px 6px rgba(79,70,229,0.3)" }}>+ Tambah Materi</button>
            </div>
          </div>

          {/* Content */}
          <div style={{ flex: 1, padding: "16px 20px", overflow: "hidden" }}>
            {/* Stats row */}
            <div style={{ display: "flex", gap: 10, marginBottom: 14 }}>
              {[["24", "Total Pekan", "#4f46e5"], ["18", "KBM", "#7c3aed"], ["4", "Libur", "#a78bfa"]].map(([val, label, color]) => (
                <div key={label} style={{ flex: 1, background: "white", borderRadius: 8, padding: "10px 14px", border: "1px solid #e0e7ff", boxShadow: "0 1px 3px rgba(79,70,229,0.06)" }}>
                  <div style={{ fontSize: 18, fontWeight: 700, color }}>{val}</div>
                  <div style={{ fontSize: 10, color: "#818cf8", marginTop: 1 }}>{label}</div>
                </div>
              ))}
            </div>

            {/* Table */}
            <div style={{ background: "white", borderRadius: 10, border: "1px solid #e0e7ff", overflow: "hidden", boxShadow: "0 1px 3px rgba(79,70,229,0.06)" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11 }}>
                <thead>
                  <tr style={{ background: "#f5f3ff", borderBottom: "1px solid #e0e7ff" }}>
                    {["Pekan", "Tanggal", "Jenis", "CP", "Materi", "JP"].map(h => (
                      <th key={h} style={{ padding: "8px 10px", textAlign: "left", fontWeight: 700, color: "#4f46e5", fontSize: 10 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {ROWS.map((row, i) => (
                    <tr key={row.pekan} style={{ borderBottom: "1px solid #f5f3ff", background: i % 2 === 0 ? "white" : "#fafafe" }}>
                      <td style={{ padding: "7px 10px", fontWeight: 600, color: "#1e1b4b" }}>{row.pekan}</td>
                      <td style={{ padding: "7px 10px", color: "#818cf8" }}>{row.tanggal}</td>
                      <td style={{ padding: "7px 10px" }}>
                        <span style={{ padding: "2px 7px", borderRadius: 4, fontSize: 9, fontWeight: 600, background: row.jenis === "KBM" ? "#ede9fe" : "#fef9c3", color: row.jenis === "KBM" ? "#5b21b6" : "#854d0e" }}>{row.jenis}</span>
                      </td>
                      <td style={{ padding: "7px 10px", color: "#4f46e5", fontWeight: 600 }}>{row.cp}</td>
                      <td style={{ padding: "7px 10px", color: "#1e1b4b", maxWidth: 160, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{row.materi}</td>
                      <td style={{ padding: "7px 10px", color: "#818cf8", fontWeight: 600 }}>{row.jp || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Theme info bar */}
      <div style={{ height: 48, background: "#1e1b4b", display: "flex", alignItems: "center", padding: "0 20px", gap: 20, flexShrink: 0 }}>
        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
          {["#1e1b4b", "#4f46e5", "#818cf8", "#e0e7ff", "#8b5cf6"].map(c => (
            <div key={c} style={{ width: 18, height: 18, borderRadius: 4, background: c, border: "1.5px solid rgba(255,255,255,0.15)" }} />
          ))}
        </div>
        <div style={{ color: "white", fontWeight: 700, fontSize: 12 }}>💜 Indigo</div>
        <div style={{ color: "#c7d2fe", fontSize: 11, marginLeft: "auto" }}>Font: Plus Jakarta Sans — elegan</div>
      </div>
    </div>
  );
}
