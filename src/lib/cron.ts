import connectToDatabase from "./mongodb";
import TrackerData from "@/models/TrackerData";
import User from "@/models/User";
import { roadmaps } from "@/data/roadmaps";
import CustomRoadmap from "@/models/CustomRoadmap";

import webpush from 'web-push';

// Configure Web Push with VAPID keys
if (process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(
    'mailto:test@example.com',
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  );
}

export async function startCron() {
  console.log("🚀 Starting background cron for Web Push Reminders...");
  
  // Every 3 hours (10800000 ms)
  setInterval(async () => {
    try {
      await connectToDatabase();
      
      const user = await User.findOne({ userId: "default-user" });
      if (!user || !user.pushSubscription) return;

      // Find active trackers
      const trackers = await TrackerData.find({ userId: "default-user" });

      for (const tracker of trackers) {
        if (!tracker.startDate) continue;

        // Fetch roadmap details (static or custom)
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

        // Check completion
        const checks = tracker.checks || new Map();
        const totalTasks = rm.checkboxKeys.length;
        const completedTasks = rm.checkboxKeys.filter((k: string) => checks.get(`${todayDay}_${k}`)).length;

        if (completedTasks < totalTasks) {
          // Send Web Push Reminder
          const msg = `You still have incomplete tasks for Day ${todayDay}! Get back to work! You've done ${completedTasks}/${totalTasks} tasks.`;
          
          try {
            await webpush.sendNotification(user.pushSubscription, JSON.stringify({
              title: `🔔 Reminder: ${rm.title}`,
              body: msg
            }));
            console.log("Push sent successfully!");
          } catch (e) {
            console.error("Failed to send push:", e);
          }
        }
      }
    } catch (err) {
      console.error("Cron Error:", err);
    }
  }, 10800000); // 3 hours
}
