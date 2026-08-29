import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import CustomRoadmap from "@/models/CustomRoadmap";

export async function GET() {
  try {
    await connectToDatabase();
    // Assuming single-user for now. In reality, get userId from session.
    const userId = "default-user";
    const customRoadmaps = await CustomRoadmap.find({ userId });
    
    // Mongoose documents to plain JS objects
    const roadmaps = customRoadmaps.map(r => {
      const obj = r.toObject();
      return {
        ...obj,
        monthColors: Object.fromEntries(obj.monthColors || new Map()),
        typeIcons: Object.fromEntries(obj.typeIcons || new Map()),
        sectionMeta: Object.fromEntries(obj.sectionMeta || new Map())
      };
    });

    return NextResponse.json({ roadmaps });
  } catch (error) {
    console.error("Error fetching custom roadmaps:", error);
    return NextResponse.json({ error: "Failed to fetch roadmaps" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await connectToDatabase();
    const userId = "default-user";
    const body = await request.json();

    const { id, title, description, startDate, checkboxKeys, monthColors, typeIcons, sectionMeta, daysData } = body;

    const newRoadmap = await CustomRoadmap.create({
      userId,
      id,
      title,
      description,
      startDate: new Date(startDate),
      checkboxKeys,
      monthColors,
      typeIcons,
      sectionMeta,
      daysData
    });

    return NextResponse.json({ success: true, id: newRoadmap.id });
  } catch (error) {
    console.error("Error saving custom roadmap:", error);
    return NextResponse.json({ error: "Failed to save roadmap" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    await connectToDatabase();
    const userId = "default-user";
    const url = new URL(request.url);
    const id = url.searchParams.get("id");
    const { title, description } = await request.json();

    if (!id) return NextResponse.json({ error: "ID is required" }, { status: 400 });

    const updated = await CustomRoadmap.findOneAndUpdate(
      { id, userId },
      { title, description },
      { returnDocument: 'after' }
    );

    if (!updated) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating roadmap:", error);
    return NextResponse.json({ error: "Failed to update" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    await connectToDatabase();
    const userId = "default-user";
    const url = new URL(request.url);
    const id = url.searchParams.get("id");

    if (!id) return NextResponse.json({ error: "ID is required" }, { status: 400 });

    const deleted = await CustomRoadmap.findOneAndDelete({ id, userId });
    if (!deleted) return NextResponse.json({ error: "Not found" }, { status: 404 });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting roadmap:", error);
    return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
  }
}
