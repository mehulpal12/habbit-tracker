import mongoose, { Schema, Document, Model } from "mongoose";

export interface ITrackerData extends Document {
  userId: string;
  activeRoadmapId: string;
  checks: Map<string, boolean>;
  notes: Map<string, string>;
  holidays: string[];
  startDate?: Date;
}

const TrackerDataSchema = new Schema<ITrackerData>({
  userId: { type: String, required: true, default: "default-user" },
  activeRoadmapId: { type: String, required: true, default: "mern-90-day" },
  checks: { type: Map, of: Boolean, default: {} },
  notes: { type: Map, of: String, default: {} },
  holidays: { type: [String], default: [] },
  startDate: { type: Date },
}, { timestamps: true });

const TrackerData: Model<ITrackerData> = mongoose.models.TrackerData || mongoose.model<ITrackerData>("TrackerData", TrackerDataSchema);

export default TrackerData;
