"use client";

import { useState, useEffect } from "react";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import { Roadmap } from "@/data/roadmaps";

export default function CalendarView({
  roadmap,
}: {
  roadmap: Roadmap;
}) {
  const [date, setDate] = useState<Date>(new Date());
  const [holidays, setHolidays] = useState<string[]>([]);
  const [serverStartDate, setServerStartDate] = useState<Date | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`/api/tracker?roadmapId=${roadmap.id}`);
        if (res.ok) {
          const data = await res.json();
          setHolidays(data.holidays || []);
          if (data.startDate) {
            setServerStartDate(new Date(data.startDate));
          }
        }
      } catch (err) {
        console.error("Failed to load holidays", err);
      }
      setLoaded(true);
    })();
  }, [roadmap.id]);

  const toggleHoliday = async (d: Date) => {
    const dateStr = d.toLocaleDateString("en-CA"); // YYYY-MM-DD
    let newHolidays = [...holidays];
    if (holidays.includes(dateStr)) {
      newHolidays = holidays.filter((h) => h !== dateStr);
    } else {
      newHolidays.push(dateStr);
    }
    
    setHolidays(newHolidays);

    try {
      await fetch('/api/tracker', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ holidays: newHolidays, roadmapId: roadmap.id })
      });
    } catch (err) {
      console.error("Failed to save holiday", err);
    }
  };

  const getTileClassName = ({ date, view }: { date: Date; view: string }) => {
    if (view !== "month") return "";
    
    const dateStr = date.toLocaleDateString("en-CA");
    
    if (holidays.includes(dateStr)) {
      return "tile-holiday";
    }

    const dayOfWeek = date.getDay();
    if (dayOfWeek === 1 || dayOfWeek === 3 || dayOfWeek === 5) {
      return "tile-internship";
    }

    return "";
  };

  const getTileContent = ({ date, view }: { date: Date; view: string }) => {
    if (view !== "month" || !serverStartDate) return null;

    const start = new Date(serverStartDate);
    start.setHours(0, 0, 0, 0);
    const curr = new Date(date);
    curr.setHours(0, 0, 0, 0);

    const diff = Math.floor((curr.getTime() - start.getTime()) / 86400000) + 1;
    
    if (diff > 0 && diff <= roadmap.daysData.length) {
      return (
        <div style={{ fontSize: 10, color: "#6366f1", marginTop: 2, fontWeight: 700 }}>
          Day {diff}
        </div>
      );
    }
    return null;
  };

  if (!loaded) return (
    <div style={{ minHeight: "100vh", background: "#0f1117", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ color: "#6366f1", fontFamily: "monospace", fontSize: 18 }}>Loading calendar…</div>
    </div>
  );

  if (!serverStartDate) {
    return (
      <div style={{ minHeight: "100vh", background: "#0f1117", display: "flex", alignItems: "center", justifyContent: "center", padding: 24, textAlign: "center", color: "#94a3b8" }}>
        <div>
          <div style={{ fontSize: 40, marginBottom: 16 }}>🗓️</div>
          <h2 style={{ color: "#fff", marginBottom: 8 }}>Roadmap Not Started</h2>
          <p>Please switch back to the Tracker view to pick your Start Date first.</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: "80px 24px", maxWidth: 900, margin: "0 auto", color: "#e2e8f0" }}>
      <h2 style={{ fontSize: 24, fontWeight: 800, marginBottom: 24 }}>
        Calendar & Schedule
      </h2>

      <div className="calendar-layout">
        <div className="calendar-main">
          <style>{`
            .react-calendar {
              background: #111827;
              border: 1px solid #1e293b;
              border-radius: 12px;
              color: #e2e8f0;
              font-family: inherit;
              padding: 16px;
              width: 100%;
            }
            .react-calendar__navigation button {
              color: #e2e8f0;
              min-width: 44px;
              background: none;
            }
            .react-calendar__navigation button:enabled:hover,
            .react-calendar__navigation button:enabled:focus {
              background-color: #1e293b;
            }
            .react-calendar__month-view__days__day--weekend {
              color: #f87171;
            }
            .react-calendar__tile {
              color: #cbd5e1;
              padding: 12px 8px;
              display: flex;
              flex-direction: column;
              align-items: center;
              border-radius: 6px;
            }
            .react-calendar__tile:enabled:hover,
            .react-calendar__tile:enabled:focus {
              background: #1e293b;
            }
            .react-calendar__tile--now {
              background: rgba(99, 102, 241, 0.2);
            }
            .react-calendar__tile--now:enabled:hover,
            .react-calendar__tile--now:enabled:focus {
              background: rgba(99, 102, 241, 0.4);
            }
            .react-calendar__tile--active {
              background: #6366f1 !important;
              color: white;
            }
            .tile-internship {
              background: rgba(168, 85, 247, 0.15);
              border: 1px solid rgba(168, 85, 247, 0.3);
            }
            .tile-holiday {
              background: rgba(239, 68, 68, 0.15) !important;
              border: 1px solid rgba(239, 68, 68, 0.4) !important;
            }
          `}</style>
          
          <Calendar
            onChange={(val) => setDate(val as Date)}
            value={date}
            onClickDay={toggleHoliday}
            tileClassName={getTileClassName}
            tileContent={getTileContent}
          />
          <p style={{ marginTop: 12, fontSize: 13, color: "#94a3b8", textAlign: "center" }}>
            Click on any day to toggle it as a Holiday.
          </p>
        </div>

        {/* Legend */}
        <div className="calendar-legend" style={{ background: "#111827", padding: 24, borderRadius: 12, border: "1px solid #1e293b" }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16, color: "#fff" }}>Legend</h3>
          
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
            <div style={{ width: 16, height: 16, borderRadius: 4, background: "rgba(168, 85, 247, 0.3)", border: "1px solid rgba(168, 85, 247, 0.6)" }} />
            <span style={{ fontSize: 14, color: "#cbd5e1" }}>Internship Day (M/W/F)</span>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
            <div style={{ width: 16, height: 16, borderRadius: 4, background: "rgba(239, 68, 68, 0.3)", border: "1px solid rgba(239, 68, 68, 0.6)" }} />
            <span style={{ fontSize: 14, color: "#cbd5e1" }}>Holiday</span>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
            <div style={{ width: 16, height: 16, borderRadius: 4, background: "rgba(99, 102, 241, 0.3)" }} />
            <span style={{ fontSize: 14, color: "#cbd5e1" }}>Current Date</span>
          </div>
          
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ fontSize: 10, color: "#6366f1", fontWeight: 700 }}>Day X</div>
            <span style={{ fontSize: 14, color: "#cbd5e1" }}>Roadmap Tracker Day</span>
          </div>
        </div>
      </div>
    </div>
  );
}
