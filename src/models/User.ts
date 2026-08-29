import mongoose, { Schema, Document, Model } from "mongoose";

export interface IUser extends Document {
  userId: string;
  telegramChatId?: number;
  pushSubscription?: any; // To store the Web Push subscription object
}

const UserSchema = new Schema<IUser>({
  userId: { type: String, required: true, unique: true },
  telegramChatId: { type: Number },
  pushSubscription: { type: Schema.Types.Mixed },
}, { timestamps: true });

const User: Model<IUser> = mongoose.models.User || mongoose.model<IUser>("User", UserSchema);

export default User;
