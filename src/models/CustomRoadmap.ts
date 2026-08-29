import mongoose, { Schema, Document, Model } from "mongoose";

export interface ICustomRoadmap extends Document {
  userId: string;
  id: string; // The roadmap string ID
  title: string;
  description: string;
  startDate: Date;
  checkboxKeys: string[];
  monthColors: Map<string, { bg: string, accent: string, accentLight: string, pill: string, pillText: string, border: string }>;
  typeIcons: Map<string, string>;
  sectionMeta: Map<string, { label: string, icon: string, color: string }>;
  daysData: any[]; // Since it's dynamic
}

const CustomRoadmapSchema = new Schema<ICustomRoadmap>({
  userId: { type: String, required: true },
  id: { type: String, required: true, unique: true },
  title: { type: String, required: true },
  description: { type: String, default: "" },
  startDate: { type: Date, required: true },
  checkboxKeys: { type: [String], required: true },
  monthColors: { type: Map, of: Object, required: true },
  typeIcons: { type: Map, of: String, required: true },
  sectionMeta: { type: Map, of: Object, required: true },
  daysData: { type: [Object], required: true },
}, { timestamps: true });

const CustomRoadmap: Model<ICustomRoadmap> = mongoose.models.CustomRoadmap || mongoose.model<ICustomRoadmap>("CustomRoadmap", CustomRoadmapSchema);

export default CustomRoadmap;
