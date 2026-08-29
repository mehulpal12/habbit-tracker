import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const SYSTEM_PROMPT = `You are an expert curriculum designer and roadmap creator with 10 years of experience designing structured learning paths for software engineers. 
You will receive a request from a user describing what they want to learn or achieve, and how many days they want the roadmap to be. 
Your job is to generate a comprehensive, day-by-day JSON roadmap strictly adhering to the following schema.
The JSON must be perfectly valid and match this structure:

{
  "title": "A catchy title for the roadmap",
  "description": "A short, motivating description",
  "startDate": "YYYY-MM-DD",
  "checkboxKeys": ["category1", "category2", ...], // e.g. ["dsa", "backend"]
  "sectionMeta": {
    "category1": { "label": "DSA", "icon": "💻", "color": "#6366f1" },
    "category2": { "label": "Backend", "icon": "⚙️", "color": "#0ea5e9" }
  },
  "monthColors": {
    "Month 1": { "bg": "#0f1117", "accent": "#6366f1", "accentLight": "#818cf8", "pill": "#1e1b4b", "pillText": "#a5b4fc", "border": "#312e81" }
  },
  "typeIcons": {
    "Weekday": "📅", "Saturday": "🗓️", "Sunday": "🔄"
  },
  "daysData": [
    {
      "day": 1,
      "week": "Week 1",
      "month": "Month 1",
      "type": "Weekday",
      "category1": "What to do on day 1 for category 1",
      "category2": "What to do on day 1 for category 2"
    },
    ...
  ]
}

CRITICAL INSTRUCTIONS:
1. "checkboxKeys" must be lowercase strings without spaces (e.g. "dsa", "frontend").
2. "daysData" must contain exactly one object per day requested by the user. If they don't specify, generate a 14-day roadmap by default.
3. For every key in "checkboxKeys", there MUST be a corresponding key in "sectionMeta".
4. For every day in "daysData", it MUST contain a string value for EVERY category defined in "checkboxKeys", explaining the specific task for that day.
5. "month" must be formatted as "Month X" based on blocks of 30 days. "week" must be "Week X" based on blocks of 7 days.
6. RETURN ONLY RAW JSON. Do not include markdown formatting like \`\`\`json.`;

export async function POST(request: Request) {
  try {
    const { prompt } = await request.json();

    if (!prompt) {
      return NextResponse.json({ error: "Prompt is required" }, { status: 400 });
    }

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        systemInstruction: SYSTEM_PROMPT,
        responseMimeType: "application/json",
      }
    });

    if (!response.text) {
      throw new Error("No response from Gemini");
    }

    const jsonText = response.text;
    const roadmapData = JSON.parse(jsonText);

    // Give it a unique ID
    roadmapData.id = roadmapData.title.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + Date.now();

    // The frontend will take this payload and save it to the DB via /api/roadmaps
    return NextResponse.json({ roadmap: roadmapData });
  } catch (error: any) {
    console.error("AI Generation Error:", error);
    return NextResponse.json({ error: error.message || "Failed to generate roadmap" }, { status: 500 });
  }
}
