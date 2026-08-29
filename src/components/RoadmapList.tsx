"use client";

import { Roadmap } from "@/data/roadmaps";

export default function RoadmapList({ 
  roadmaps, 
  onSelect,
  onCreateCustom,
  onDelete,
  onEdit
}: { 
  roadmaps: Roadmap[]; 
  onSelect: (id: string) => void;
  onCreateCustom: () => void;
  onDelete?: (id: string) => void;
  onEdit?: (id: string, title: string, desc: string) => void;
}) {
  return (
    <div style={{ minHeight: "100vh", background: "#0f1117", padding: "48px 24px", color: "#e2e8f0", fontFamily: "inherit" }}>
      <div style={{ maxWidth: 800, margin: "0 auto" }}>
        
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 40, flexWrap: "wrap", gap: 16 }}>
          <div>
            <h1 style={{ fontSize: 32, fontWeight: 900, margin: 0, background: "linear-gradient(90deg, #818cf8, #38bdf8)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              Select a Roadmap
            </h1>
            <p style={{ color: "#94a3b8", marginTop: 8 }}>Choose a pre-made journey or build your own to start tracking.</p>
          </div>
          
          <button 
            onClick={onCreateCustom}
            style={{
              background: "#10b981",
              color: "#fff",
              border: "none",
              padding: "12px 24px",
              borderRadius: 8,
              cursor: "pointer",
              fontWeight: 700,
              boxShadow: "0 4px 12px rgba(16, 185, 129, 0.3)",
              transition: "transform 0.2s"
            }}
          >
            + Create Custom Roadmap
          </button>
        </div>

        <div style={{ display: "grid", gap: 16 }}>
          {roadmaps.map(rm => (
            <div 
              key={rm.id}
              onClick={() => onSelect(rm.id)}
              style={{
                background: "#111827",
                border: "1px solid #1e293b",
                borderRadius: 12,
                padding: 24,
                cursor: "pointer",
                display: "flex",
                flexDirection: "column",
                gap: 8,
                transition: "all 0.2s ease"
              }}
              onMouseEnter={e => e.currentTarget.style.borderColor = "#6366f1"}
              onMouseLeave={e => e.currentTarget.style.borderColor = "#1e293b"}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <h2 style={{ margin: 0, fontSize: 20, color: "#fff" }}>{rm.title}</h2>
                <span style={{ background: "rgba(99, 102, 241, 0.1)", color: "#818cf8", padding: "4px 12px", borderRadius: 99, fontSize: 12, fontWeight: 700 }}>
                  {rm.daysData.length} Days
                </span>
              </div>
              
              <p style={{ margin: 0, color: "#94a3b8", fontSize: 14 }}>{rm.description || "Custom Roadmap"}</p>
              
              <div style={{ display: "flex", gap: 6, marginTop: 8, flexWrap: "wrap" }}>
                {rm.checkboxKeys.map(k => (
                  <span key={k} style={{ fontSize: 11, background: "#1e293b", color: "#cbd5e1", padding: "2px 8px", borderRadius: 4 }}>
                    {rm.sectionMeta[k]?.label || k}
                  </span>
                ))}
              </div>

              {rm.id !== "mern-90-day" && onDelete && onEdit && (
                <div style={{ display: "flex", gap: 8, marginTop: 12 }} onClick={e => e.stopPropagation()}>
                  <button onClick={() => onEdit(rm.id, rm.title, rm.description)} style={{ background: "transparent", border: "1px solid #334155", color: "#94a3b8", padding: "4px 12px", borderRadius: 6, fontSize: 12, cursor: "pointer", transition: "all 0.2s" }} onMouseEnter={e => e.currentTarget.style.color = "#fff"} onMouseLeave={e => e.currentTarget.style.color = "#94a3b8"}>
                    ✏️ Edit
                  </button>
                  <button onClick={() => onDelete(rm.id)} style={{ background: "transparent", border: "1px solid #334155", color: "#94a3b8", padding: "4px 12px", borderRadius: 6, fontSize: 12, cursor: "pointer", transition: "all 0.2s" }} onMouseEnter={e => { e.currentTarget.style.color = "#ef4444"; e.currentTarget.style.borderColor = "#ef4444"; }} onMouseLeave={e => { e.currentTarget.style.color = "#94a3b8"; e.currentTarget.style.borderColor = "#334155"; }}>
                    🗑️ Delete
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}
