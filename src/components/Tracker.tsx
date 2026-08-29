"use client";

import { useState, useEffect, useCallback } from "react";
import { Roadmap } from "@/data/roadmaps";

function addDays(base: Date, n: number) {
  const d = new Date(base);
  d.setDate(d.getDate() + n);
  return d;
}

function fmt(d: Date) {
  return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "2-digit" });
}

export default function Tracker({ roadmap }: { roadmap: Roadmap }) {
  const [checks, setChecks] = useState<Record<string, boolean>>({});
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [loaded, setLoaded] = useState(false);
  const [filter, setFilter] = useState("all");
  const [activeDay, setActiveDay] = useState<number | null>(null);
  const [searchQ, setSearchQ] = useState("");
  const [serverStartDate, setServerStartDate] = useState<Date | null>(null);
  const [isStarting, setIsStarting] = useState(false);
  const [selectedStartDate, setSelectedStartDate] = useState<string>(new Date().toISOString().split("T")[0]);
  const [isLinkingPush, setIsLinkingPush] = useState(false);

  // Helper for iOS Web Push
  const urlBase64ToUint8Array = (base64String: string) => {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding).replace(/\-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  };
  
  const getTodayDay = useCallback(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const start = new Date(serverStartDate || roadmap.startDate);
    start.setHours(0, 0, 0, 0);
    const diff = Math.floor((today.getTime() - start.getTime()) / 86400000) + 1;
    return Math.max(1, Math.min(roadmap.daysData.length, diff));
  }, [roadmap, serverStartDate]);

  const todayDay = getTodayDay();

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`/api/tracker?roadmapId=${roadmap.id}`);
        if (res.ok) {
          const data = await res.json();
          setChecks(data.checks || {});
          setNotes(data.notes || {});
          if (data.startDate) {
            setServerStartDate(new Date(data.startDate));
          }
        }
      } catch (err) {
        console.error("Failed to load tracker data", err);
      }
      setLoaded(true);
    })();
  }, [roadmap.id]);

  const saveChecks = useCallback(async (newChecks: Record<string, boolean>) => {
    setChecks(newChecks);
    try { 
      await fetch('/api/tracker', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ checks: newChecks, notes, roadmapId: roadmap.id })
      });
    } catch {}
  }, [notes, roadmap.id]);

  const saveNotes = useCallback(async (newNotes: Record<string, string>) => {
    setNotes(newNotes);
    try { 
      await fetch('/api/tracker', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ checks, notes: newNotes, roadmapId: roadmap.id })
      });
    } catch {}
  }, [checks, roadmap.id]);

  const toggle = (dayNum: number, key: string) => {
    if (dayNum !== todayDay) {
      alert(`Strict Mode: You can only edit tasks for Day ${todayDay} (Today).`);
      return;
    }
    const k = `${dayNum}_${key}`;
    const newChecks = { ...checks, [k]: !checks[k] };
    saveChecks(newChecks);
  };

  useEffect(() => {
    if (typeof window !== "undefined" && "Notification" in window) {
      Notification.requestPermission();
    }
    const checkReminder = () => {
      const todayChecksCount = roadmap.checkboxKeys.filter(k => checks[`${todayDay}_${k}`]).length;
      const pct = Math.round((todayChecksCount / roadmap.checkboxKeys.length) * 100);
      if (pct < 100 && typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted") {
        new Notification("Incomplete Tasks Remaining!", {
          body: `You still have tasks to complete for Day ${todayDay}. Keep going!`,
        });
      }
    };
    // 3 hours = 10,800,000 ms
    const interval = setInterval(checkReminder, 10800000); 
    return () => clearInterval(interval);
  }, [checks, todayDay, roadmap.checkboxKeys]);

  const isChecked = (dayNum: number, key: string) => !!checks[`${dayNum}_${key}`];

  const dayProgress = (dayNum: number) => {
    const done = roadmap.checkboxKeys.filter(k => isChecked(dayNum, k)).length;
    return Math.round((done / roadmap.checkboxKeys.length) * 100);
  };

  const overallDone = roadmap.checkboxKeys.reduce((acc, k) => {
    return acc + roadmap.daysData.filter(d => isChecked(d.day, k)).length;
  }, 0);
  const overallTotal = roadmap.daysData.length * roadmap.checkboxKeys.length;
  const overallPct = overallTotal === 0 ? 0 : Math.round((overallDone / overallTotal) * 100);

  const completedDays = roadmap.daysData.filter(d => dayProgress(d.day) === 100).length;
  const key1 = roadmap.checkboxKeys[0];
  const key2 = roadmap.checkboxKeys[1];
  const key1Done = key1 ? roadmap.daysData.filter(d => isChecked(d.day, key1)).length : 0;
  const key2Done = key2 ? roadmap.daysData.filter(d => isChecked(d.day, key2)).length : 0;

  const filteredDays = roadmap.daysData.filter(d => {
    if (filter === "month1" && d.month !== "Month 1") return false;
    if (filter === "month2" && d.month !== "Month 2") return false;
    if (filter === "month3" && d.month !== "Month 3") return false;
    if (filter === "today" && d.day !== todayDay) return false;
    if (filter === "incomplete" && dayProgress(d.day) === 100) return false;
    if (filter === "complete" && dayProgress(d.day) !== 100) return false;
    if (filter === "checkpoint" && d.type !== "Checkpoint" && d.type !== "Final Simulation") return false;
    if (searchQ) {
      const q = searchQ.toLowerCase();
      // Only search string values
      return Object.values(d).some(val => 
        typeof val === 'string' && val.toLowerCase().includes(q)
      );
    }
    return true;
  });

  if (!loaded) return (
    <div style={{ minHeight: "100vh", background: "#0f1117", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ color: "#6366f1", fontFamily: "monospace", fontSize: 18 }}>Loading tracker…</div>
    </div>
  );

  const handleStartRoadmap = async () => {
    setIsStarting(true);
    try {
      await fetch('/api/tracker', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roadmapId: roadmap.id, startDate: selectedStartDate })
      });
      setServerStartDate(new Date(selectedStartDate));
    } catch (err) {
      console.error(err);
    }
    setIsStarting(false);
  };

  const enablePushNotifications = async () => {
    setIsLinkingPush(true);
    try {
      if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
        throw new Error("Push notifications are not supported in this browser. Are you on iOS 16.4+ with the app added to your Home Screen?");
      }

      const registration = await navigator.serviceWorker.register('/sw.js');
      
      // We need the VAPID key to subscribe
      const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!vapidPublicKey) {
        throw new Error("VAPID Public Key is missing from environment variables.");
      }

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey)
      });

      const res = await fetch('/api/push/subscribe', { 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(subscription)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      alert("✅ Push Notifications Enabled Successfully!");
    } catch (err: any) {
      alert(`⚠️ ${err.message}`);
    }
    setIsLinkingPush(false);
  };

  if (!serverStartDate) {
    return (
      <div style={{ minHeight: "100vh", background: "#0f1117", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
        <div style={{ background: "#111827", padding: 40, borderRadius: 16, border: "1px solid #1e293b", maxWidth: 400, width: "100%", textAlign: "center" }}>
          <div style={{ fontSize: 40, marginBottom: 16 }}>🚀</div>
          <h2 style={{ color: "#fff", margin: "0 0 8px 0", fontSize: 24, fontWeight: 800 }}>Start Your Journey</h2>
          <p style={{ color: "#94a3b8", fontSize: 14, marginBottom: 24, lineHeight: 1.5 }}>
            Choose the day you want to begin this roadmap. 
            <strong> Once started, this date cannot be changed!</strong>
          </p>
          <input 
            type="date" 
            value={selectedStartDate}
            onChange={e => setSelectedStartDate(e.target.value)}
            style={{ width: "100%", background: "#0d1117", border: "1px solid #334155", color: "#e2e8f0", padding: "12px", borderRadius: 8, fontSize: 16, marginBottom: 24, outline: "none", boxSizing: "border-box" }}
          />
          <button 
            onClick={handleStartRoadmap}
            disabled={isStarting || !selectedStartDate}
            style={{ width: "100%", background: "linear-gradient(90deg, #6366f1, #8b5cf6)", color: "#fff", border: "none", padding: "14px", borderRadius: 8, fontSize: 16, fontWeight: 700, cursor: isStarting ? "wait" : "pointer", opacity: isStarting || !selectedStartDate ? 0.7 : 1 }}
          >
            {isStarting ? "Locking in..." : "Start Roadmap"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "#0f1117", color: "#e2e8f0", fontFamily: "'Inter', system-ui, sans-serif" }}>
      {/* Header */}
      <div className="tracker-header" style={{ background: "linear-gradient(135deg, #1e1b4b 0%, #0f172a 50%, #064e3b 100%)", borderBottom: "1px solid #1e293b" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div className="header-flex">
            <div>
              <div style={{ fontSize: 11, letterSpacing: 3, color: "#6366f1", textTransform: "uppercase", marginBottom: 6 }}>{roadmap.title}</div>
              <h1 style={{ margin: 0, fontSize: 28, fontWeight: 800, background: "linear-gradient(90deg, #818cf8, #38bdf8, #34d399)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", lineHeight: 1.2 }}>
                {roadmap.id.toUpperCase()} Tracker
              </h1>
              <div style={{ marginTop: 8, color: "#94a3b8", fontSize: 13 }}>
                {roadmap.description}
              </div>
            </div>
            <div className="stats-text" style={{ textAlign: "right" }}>
              <div style={{ fontSize: 36, fontWeight: 900, color: "#818cf8" }}>{overallPct}%</div>
              <div style={{ fontSize: 12, color: "#64748b", marginBottom: 8 }}>overall complete</div>
              <button 
                onClick={enablePushNotifications}
                disabled={isLinkingPush}
                style={{ background: "#38bdf820", color: "#38bdf8", border: "1px solid #38bdf850", padding: "4px 10px", borderRadius: 6, fontSize: 10, fontWeight: 700, cursor: "pointer", transition: "all 0.2s" }}
              >
                {isLinkingPush ? "Enabling..." : "🔔 Enable Push Notifications"}
              </button>
            </div>
          </div>

          {/* Stats row */}
          <div className="stats-grid">
            {[
              { label: "Today", value: `Day ${todayDay}`, sub: fmt(addDays(serverStartDate || roadmap.startDate, todayDay - 1)), color: "#6366f1" },
              { label: "Days Complete", value: `${completedDays}/${roadmap.daysData.length}`, sub: "all tasks done", color: "#10b981" },
              ...(key1 ? [{ label: roadmap.sectionMeta[key1]?.label || key1, value: `${key1Done}/${roadmap.daysData.length}`, sub: "completed", color: roadmap.sectionMeta[key1]?.color || "#f59e0b" }] : []),
              ...(key2 ? [{ label: roadmap.sectionMeta[key2]?.label || key2, value: `${key2Done}/${roadmap.daysData.length}`, sub: "completed", color: roadmap.sectionMeta[key2]?.color || "#0ea5e9" }] : []),
              { label: "Overall Tasks", value: `${overallDone}/${overallTotal}`, sub: "checkboxes ticked", color: "#ec4899" },
            ].map(s => (
              <div key={s.label} style={{ background: "rgba(255,255,255,0.04)", border: `1px solid rgba(255,255,255,0.08)`, borderRadius: 10, padding: "12px 16px" }}>
                <div style={{ fontSize: 10, color: "#64748b", textTransform: "uppercase", letterSpacing: 1 }}>{s.label}</div>
                <div style={{ fontSize: 22, fontWeight: 800, color: s.color, marginTop: 2 }}>{s.value}</div>
                <div style={{ fontSize: 11, color: "#475569" }}>{s.sub}</div>
              </div>
            ))}
          </div>

          {/* Progress bar */}
          <div style={{ marginTop: 20 }}>
            <div style={{ height: 6, background: "#1e293b", borderRadius: 99, overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${overallPct}%`, background: "linear-gradient(90deg, #6366f1, #0ea5e9, #10b981)", borderRadius: 99, transition: "width 0.4s" }} />
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div style={{ background: "#0d1117", borderBottom: "1px solid #1e293b", padding: "12px 24px", position: "sticky", top: 0, zIndex: 50 }}>
        <div className="filter-container">
          {[
            ["all", `All ${roadmap.daysData.length} Days`],
            ["today", `Day ${todayDay} (Today)`],
            ["month1", "Month 1"],
            ["month2", "Month 2"],
            ["month3", "Month 3"],
            ["checkpoint", "Checkpoints"],
            ["incomplete", "Incomplete"],
            ["complete", "Complete ✓"],
          ].map(([val, lbl]) => (
            <button key={val} onClick={() => { setFilter(val); setSearchQ(""); }}
              style={{ padding: "6px 14px", borderRadius: 20, border: "1px solid", fontSize: 12, cursor: "pointer", fontWeight: 600, transition: "all 0.15s",
                background: filter === val ? "#6366f1" : "transparent",
                borderColor: filter === val ? "#6366f1" : "#334155",
                color: filter === val ? "#fff" : "#94a3b8",
              }}>
              {lbl}
            </button>
          ))}
          <input placeholder="Search topic…" value={searchQ} onChange={e => { setSearchQ(e.target.value); setFilter("all"); }}
            className="search-input"
            style={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 8, color: "#e2e8f0", padding: "6px 12px", fontSize: 12, outline: "none" }} />
        </div>
      </div>

      {/* Days grid */}
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "24px 16px" }}>
        {filteredDays.length === 0 && (
          <div style={{ textAlign: "center", color: "#475569", padding: 60, fontSize: 16 }}>No days match this filter.</div>
        )}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {filteredDays.map(d => {
            const colors = roadmap.monthColors[d.month] || roadmap.monthColors["Month 1"];
            const pct = dayProgress(d.day);
            const isToday = d.day === todayDay;
            const isOpen = activeDay === d.day;
            const isComplete = pct === 100;
            const date = addDays(serverStartDate || roadmap.startDate, d.day - 1);

            return (
              <div key={d.day}
                style={{
                  border: `1px solid ${isToday ? colors.accent : isComplete ? colors.border + "80" : "#1e293b"}`,
                  borderRadius: 12,
                  overflow: "hidden",
                  boxShadow: isToday ? `0 0 0 2px ${colors.accent}40` : "none",
                  transition: "all 0.2s",
                }}>
                {/* Day header row */}
                <div
                  onClick={() => setActiveDay(isOpen ? null : d.day)}
                  style={{
                    display: "flex", alignItems: "center", gap: 12, padding: "14px 18px",
                    background: isOpen ? `${colors.accent}18` : isComplete ? "rgba(255,255,255,0.02)" : "#111827",
                    cursor: "pointer", userSelect: "none",
                  }}>
                  {/* Day number */}
                  <div style={{
                    width: 44, height: 44, borderRadius: 10, flexShrink: 0,
                    background: isComplete ? colors.accent : `${colors.accent}22`,
                    border: `1px solid ${colors.accent}40`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    flexDirection: "column",
                  }}>
                    <div style={{ fontSize: 16, fontWeight: 900, color: isComplete ? "#fff" : colors.accentLight, lineHeight: 1 }}>{d.day}</div>
                    {isComplete && <div style={{ fontSize: 8, color: "rgba(255,255,255,0.7)" }}>✓</div>}
                  </div>

                  {/* Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="day-header-info">
                      {isToday && <span style={{ background: colors.accent, color: "#fff", fontSize: 9, fontWeight: 700, padding: "2px 7px", borderRadius: 99, letterSpacing: 1 }}>TODAY</span>}
                      <span style={{ fontSize: 10, background: colors.pill, color: colors.pillText, padding: "2px 8px", borderRadius: 99, fontWeight: 600 }}>{d.month}</span>
                      <span style={{ fontSize: 10, color: "#475569" }}>{d.week}</span>
                      <span style={{ fontSize: 12 }}>{roadmap.typeIcons[d.type] || "📅"}</span>
                      <span style={{ fontSize: 11, color: "#64748b" }}>{d.type}</span>
                      <span style={{ fontSize: 11, color: "#334155", marginLeft: 4 }}>{fmt(date)}</span>
                    </div>
                    <div style={{ marginTop: 4, fontSize: 12, color: "#94a3b8", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {key1 && (
                        <>
                          <span style={{ color: roadmap.sectionMeta[key1]?.color || "#6366f1", fontWeight: 600 }}>{roadmap.sectionMeta[key1]?.label || key1}:</span> {d[key1]?.toString().substring(0, 60)}{(d[key1]?.toString().length || 0) > 60 ? "…" : ""}
                        </>
                      )}
                    </div>
                  </div>

                  {/* Mini progress */}
                  <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: 16, fontWeight: 800, color: pct === 100 ? colors.accent : "#475569" }}>{pct}%</div>
                      <div style={{ fontSize: 10, color: "#334155" }}>{roadmap.checkboxKeys.filter(k => isChecked(d.day, k)).length}/{roadmap.checkboxKeys.length}</div>
                    </div>
                    {/* Mini checkboxes preview */}
                    <div className="day-mini-progress" style={{ display: "flex", gap: 3 }}>
                      {roadmap.checkboxKeys.map(k => (
                        <div key={k} style={{ width: 8, height: 8, borderRadius: 2, background: isChecked(d.day, k) ? roadmap.sectionMeta[k].color : "#1e293b", border: `1px solid ${isChecked(d.day, k) ? roadmap.sectionMeta[k].color : "#334155"}` }} />
                      ))}
                    </div>
                    <div style={{ color: "#334155", fontSize: 18, transition: "transform 0.2s", transform: isOpen ? "rotate(180deg)" : "none" }}>⌄</div>
                  </div>
                </div>

                {/* Expanded content */}
                {isOpen && (
                  <div className="expanded-grid" style={{ background: "#0d1117", borderTop: `1px solid #1e293b`, padding: "20px 18px" }}>
                    {roadmap.checkboxKeys.map(k => {
                      const meta = roadmap.sectionMeta[k];
                      const checked = isChecked(d.day, k);
                      return (
                        <div key={k}
                          onClick={() => toggle(d.day, k)}
                          style={{
                            padding: "14px 16px", borderRadius: 10, cursor: "pointer",
                            border: `1px solid ${checked ? meta.color + "60" : "#1e293b"}`,
                            background: checked ? `${meta.color}12` : "rgba(255,255,255,0.02)",
                            transition: "all 0.15s", userSelect: "none",
                            display: "flex", gap: 12, alignItems: "flex-start",
                          }}>
                          {/* Custom checkbox */}
                          <div style={{
                            width: 20, height: 20, borderRadius: 5, flexShrink: 0, marginTop: 1,
                            border: `2px solid ${checked ? meta.color : "#334155"}`,
                            background: checked ? meta.color : "transparent",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            transition: "all 0.15s",
                          }}>
                            {checked && <span style={{ color: "#fff", fontSize: 12, fontWeight: 900, lineHeight: 1 }}>✓</span>}
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                              <span style={{ fontSize: 14 }}>{meta.icon}</span>
                              <span style={{ fontSize: 11, fontWeight: 700, color: checked ? meta.color : "#64748b", textTransform: "uppercase", letterSpacing: 0.5 }}>{meta.label}</span>
                            </div>
                            <div style={{ fontSize: 12, color: checked ? "#cbd5e1" : "#94a3b8", lineHeight: 1.5 }}>
                              {d[k]}
                            </div>
                          </div>
                        </div>
                      );
                    })}

                    {/* Notes area */}
                    <div style={{ gridColumn: "1 / -1", marginTop: 4 }}>
                      <div style={{ fontSize: 11, color: "#475569", marginBottom: 6, textTransform: "uppercase", letterSpacing: 1 }}>📝 Day Notes</div>
                      <textarea
                        value={notes[d.day] || ""}
                        onChange={e => {
                          if (d.day !== todayDay) {
                            alert(`Strict Mode: You can only edit notes for Day ${todayDay} (Today).`);
                            return;
                          }
                          saveNotes({ ...notes, [d.day]: e.target.value });
                        }}
                        onClick={e => e.stopPropagation()}
                        placeholder="Add notes, problems solved, links, observations…"
                        rows={3}
                        style={{
                          width: "100%", background: "#111827", border: "1px solid #1e293b", borderRadius: 8,
                          color: "#cbd5e1", fontSize: 12, padding: "10px 12px", resize: "vertical",
                          outline: "none", fontFamily: "inherit", lineHeight: 1.6, boxSizing: "border-box",
                        }}
                      />
                    </div>

                    {/* Progress bar for this day */}
                    <div style={{ gridColumn: "1 / -1" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6, fontSize: 11, color: "#475569" }}>
                        <span>Day {d.day} progress</span>
                        <span style={{ color: colors.accent, fontWeight: 700 }}>{pct}%</span>
                      </div>
                      <div style={{ height: 4, background: "#1e293b", borderRadius: 99 }}>
                        <div style={{ height: "100%", width: `${pct}%`, background: colors.accent, borderRadius: 99, transition: "width 0.3s" }} />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div style={{ marginTop: 48, textAlign: "center", color: "#1e293b", fontSize: 12, paddingBottom: 32 }}>
          Keep going! Execution is the ultimate differentiator.
        </div>
      </div>
    </div>
  );
}
