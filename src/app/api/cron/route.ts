import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import TrackerData from "@/models/TrackerData";
import User from "@/models/User";
import { roadmaps } from "@/data/roadmaps";
import CustomRoadmap from "@/models/CustomRoadmap";
import webpush from "web-push";

// Configure Web Push with VAPID keys
if (process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(
    'mailto:test@example.com',
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  );
}

export async function GET(request: Request) {
  try {
    // Vercel Cron Security: Ensure only Vercel can trigger this
    const authHeader = request.headers.get('authorization');
    if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();
    
    const user = await User.findOne({ userId: "default-user" });
    if (!user || !user.pushSubscription) {
      return NextResponse.json({ success: true, message: "No user or push subscription found" });
    }

    // Find active trackers
    const trackers = await TrackerData.find({ userId: "default-user" });
    let notificationsSent = 0;

    for (const tracker of trackers) {
      if (!tracker.startDate) continue;

      let rm = roadmaps.find(r => r.id === tracker.activeRoadmapId);
      if (!rm) {
        rm = await CustomRoadmap.findOne({ id: tracker.activeRoadmapId }) as any;
      }
      if (!rm) continue;

      // Calculate todayDay
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const start = new Date(tracker.startDate);
      start.setHours(0, 0, 0, 0);
      const diff = Math.floor((today.getTime() - start.getTime()) / 86400000) + 1;
      const todayDay = Math.max(1, Math.min(rm.daysData.length, diff));

      const checks = tracker.checks || new Map();
      const totalTasks = rm.checkboxKeys.length;
      const completedTasks = rm.checkboxKeys.filter((k: string) => checks.get(`${todayDay}_${k}`)).length;

      if (completedTasks < totalTasks) {
        const msg = `You still have incomplete tasks for Day ${todayDay}! Get back to work! You've done ${completedTasks}/${totalTasks} tasks.`;
        
        try {
          await webpush.sendNotification(user.pushSubscription, JSON.stringify({
            title: `🔔 Reminder: ${rm.title}`,
            body: msg
          }));
          notificationsSent++;
        } catch (e) {
          console.error("Failed to send push:", e);
        }
      }
    }

    return NextResponse.json({ success: true, notificationsSent });
  } catch (error: any) {
    console.error("Vercel Cron Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
