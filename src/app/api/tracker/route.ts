import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import TrackerData from "@/models/TrackerData";

export async function GET(request: Request) {
  try {
    await connectToDatabase();
    
    // In a real app, you would use auth to get the user ID
    // For now, we'll use a hardcoded default user
    const userId = "default-user";
    const { searchParams } = new URL(request.url);
    const roadmapId = searchParams.get('roadmapId') || 'mern-90-day';

    let data = await TrackerData.findOne({ userId, activeRoadmapId: roadmapId });

    if (!data) {
      data = await TrackerData.create({
        userId,
        activeRoadmapId: roadmapId,
        checks: {},
        notes: {},
        holidays: []
      });
    }

    return NextResponse.json({
      checks: Object.fromEntries(data.checks || new Map()),
      notes: Object.fromEntries(data.notes || new Map()),
      holidays: data.holidays || [],
      startDate: data.startDate ? data.startDate.toISOString() : null
    });
  } catch (error) {
    console.error("Error fetching tracker data:", error);
    return NextResponse.json({ error: "Failed to fetch tracker data" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await connectToDatabase();
    
    const userId = "default-user";
    const body = await request.json();
    const { roadmapId, checks, notes, holidays, startDate } = body;

    const updateData: any = {};
    if (checks) updateData.checks = checks;
    if (notes) updateData.notes = notes;
    if (holidays) updateData.holidays = holidays;
    if (startDate) updateData.startDate = new Date(startDate);

    const data = await TrackerData.findOneAndUpdate(
      { userId, activeRoadmapId: roadmapId || 'mern-90-day' },
      { $set: updateData },
      { returnDocument: 'after', upsert: true }
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating tracker data:", error);
    return NextResponse.json({ error: "Failed to update tracker data" }, { status: 500 });
  }
}
