"use client";

import { useState, useEffect } from "react";
import RoadmapList from "@/components/RoadmapList";
import Tracker from "@/components/Tracker";
import CalendarView from "@/components/CalendarView";
import RoadmapBuilder from "@/components/RoadmapBuilder";
import { roadmaps as defaultRoadmaps, Roadmap } from "@/data/roadmaps";

export default function Home() {
  const [activeRoadmapId, setActiveRoadmapId] = useState<string | null>(null);
  const [view, setView] = useState<"tracker" | "calendar">("tracker");
  const [isBuilding, setIsBuilding] = useState(false);
  const [customRoadmaps, setCustomRoadmaps] = useState<Roadmap[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCustomRoadmaps = async () => {
    try {
      const res = await fetch('/api/roadmaps');
      if (res.ok) {
        const data = await res.json();
        setCustomRoadmaps(data.roadmaps || []);
      }
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchCustomRoadmaps();
  }, []);

  const allRoadmaps = [...defaultRoadmaps, ...customRoadmaps];

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", background: "#0f1117", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ color: "#6366f1", fontFamily: "monospace", fontSize: 18 }}>Loading roadmaps…</div>
      </div>
    );
  }

  if (isBuilding) {
    return <RoadmapBuilder onSaved={() => { setIsBuilding(false); fetchCustomRoadmaps(); }} onCancel={() => setIsBuilding(false)} />;
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this roadmap?")) return;
    try {
      await fetch(`/api/roadmaps?id=${id}`, { method: 'DELETE' });
      fetchCustomRoadmaps();
    } catch (err) {
      console.error(err);
    }
  };

  const handleEdit = async (id: string, currentTitle: string, currentDesc: string) => {
    const newTitle = prompt("Enter new title:", currentTitle);
    if (newTitle === null || !newTitle.trim()) return;
    const newDesc = prompt("Enter new description:", currentDesc);
    if (newDesc === null) return;

    try {
      await fetch(`/api/roadmaps?id=${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: newTitle, description: newDesc })
      });
      fetchCustomRoadmaps();
    } catch (err) {
      console.error(err);
    }
  };

  if (!activeRoadmapId) {
    return <RoadmapList 
      roadmaps={allRoadmaps} 
      onSelect={setActiveRoadmapId} 
      onCreateCustom={() => setIsBuilding(true)} 
      onDelete={handleDelete}
      onEdit={handleEdit}
    />;
  }

  const activeRoadmap = allRoadmaps.find(r => r.id === activeRoadmapId);

  if (!activeRoadmap) {
    return (
      <div style={{ padding: 24, color: 'white' }}>
        Roadmap not found. 
        <button onClick={() => setActiveRoadmapId(null)}>Go back</button>
      </div>
    );
  }

  return (
    <>
      <div style={{ position: "fixed", top: 12, right: 24, zIndex: 100, display: "flex", gap: 8 }}>
        <button 
          onClick={() => setView(view === "tracker" ? "calendar" : "tracker")}
          style={{
            background: "#6366f1",
            color: "#fff",
            border: "none",
            padding: "8px 16px",
            borderRadius: 8,
            cursor: "pointer",
            fontSize: 12,
            fontWeight: 600,
            boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)"
          }}
        >
          {view === "tracker" ? "📅 Calendar" : "📝 Tracker"}
        </button>
        <button 
          onClick={() => setActiveRoadmapId(null)}
          style={{
            background: "#1e293b",
            color: "#e2e8f0",
            border: "1px solid #334155",
            padding: "8px 16px",
            borderRadius: 8,
            cursor: "pointer",
            fontSize: 12,
            fontWeight: 600,
            boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)"
          }}
        >
          ← All Roadmaps
        </button>
      </div>
      
      {view === "tracker" ? (
        <Tracker roadmap={activeRoadmap} />
      ) : (
        <div style={{ minHeight: "100vh", background: "#0f1117" }}>
          <CalendarView roadmap={activeRoadmap} />
        </div>
      )}
    </>
  );
}
