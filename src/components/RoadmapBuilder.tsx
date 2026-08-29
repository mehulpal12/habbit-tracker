"use client";

import { useState } from "react";

const PLACEHOLDER_TEXT = `I want to learn full-stack development with Next.js, Node, and MongoDB. Make it a 14-day roadmap where I focus on Frontend, Backend, and a daily mini-project.`;

export default function RoadmapBuilder({ onSaved, onCancel }: { onSaved: () => void, onCancel: () => void }) {
  const [inputText, setInputText] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState("");

  const handleGenerateAndSave = async () => {
    setError("");
    if (!inputText.trim()) {
      setError("Please describe what you want to learn.");
      return;
    }

    setIsGenerating(true);
    try {
      // 1. Call our Gemini AI Endpoint
      const aiRes = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: inputText })
      });

      const aiData = await aiRes.json();
      
      if (!aiRes.ok) {
        throw new Error(aiData.error || "Failed to generate AI roadmap");
      }

      const generatedRoadmap = aiData.roadmap;

      // 2. Save it to our Database
      const dbRes = await fetch('/api/roadmaps', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(generatedRoadmap)
      });
      
      if (!dbRes.ok) {
        throw new Error("AI successfully generated the roadmap, but failed to save to database.");
      }

      onSaved();
    } catch (err: any) {
      console.error(err);
      setError(err.message || "An unexpected error occurred.");
    }
    setIsGenerating(false);
  };

  return (
    <div style={{ minHeight: "100vh", background: "#0f1117", color: "#e2e8f0", padding: "40px 24px", fontFamily: "inherit" }}>
      <div style={{ maxWidth: 800, margin: "0 auto" }}>
        
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 32 }}>
          <h1 style={{ fontSize: 24, fontWeight: 800, margin: 0 }}>
            <span style={{ fontSize: 28, marginRight: 8 }}>✨</span>
            AI Roadmap Generator
          </h1>
          <button onClick={onCancel} style={{ background: "transparent", border: "1px solid #334155", color: "#94a3b8", padding: "8px 16px", borderRadius: 8, cursor: "pointer" }}>Cancel</button>
        </div>

        <div style={{ background: "#111827", padding: 32, borderRadius: 12, border: "1px solid #1e293b" }}>
          
          <p style={{ color: "#94a3b8", fontSize: 14, marginBottom: 16 }}>
            Just describe what you want to learn, how many days you want the roadmap to be, and any specific areas of focus. Our AI expert will generate a comprehensive, day-by-day habit tracker for you!
          </p>
          
          {error && <div style={{ background: "rgba(239, 68, 68, 0.1)", border: "1px solid #ef4444", color: "#ef4444", padding: 12, borderRadius: 8, marginBottom: 16, fontSize: 14 }}>{error}</div>}

          <textarea 
            value={inputText}
            onChange={e => setInputText(e.target.value)}
            placeholder={PLACEHOLDER_TEXT}
            rows={6}
            style={{ 
              width: "100%", 
              background: "#0d1117", 
              border: "1px solid #334155", 
              padding: "16px", 
              borderRadius: 8, 
              color: "#e2e8f0", 
              outline: "none", 
              resize: "vertical",
              fontSize: 16,
              lineHeight: 1.6
            }} 
          />

          <div style={{ display: "flex", gap: 16, marginTop: 24 }}>
            <button onClick={onCancel} style={{ background: "#1e293b", color: "white", border: "none", padding: "12px 24px", borderRadius: 8, cursor: "pointer", flex: 1 }}>Cancel</button>
            <button 
              onClick={handleGenerateAndSave} 
              disabled={isGenerating} 
              style={{ 
                background: "linear-gradient(90deg, #6366f1, #8b5cf6)", 
                color: "white", 
                border: "none", 
                padding: "12px 24px", 
                borderRadius: 8, 
                fontWeight: 700, 
                cursor: isGenerating ? "wait" : "pointer", 
                flex: 2,
                opacity: isGenerating ? 0.8 : 1
              }}>
              {isGenerating ? "🤖 Generating Roadmap (Takes ~10 seconds)..." : "✨ Generate My Journey"}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
