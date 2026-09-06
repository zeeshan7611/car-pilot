import mongoose, { Schema, Document } from 'mongoose';
import bcrypt from 'bcryptjs';
import { UserRole } from '../types/index.js';

export interface IUser extends Document {
  organizationId: mongoose.Types.ObjectId;
  name: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  phone?: string;
  avatar?: string;
  comparePassword(candidate: string): Promise<boolean>;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    role: {
      type: String,
      enum: ['OWNER', 'ADMIN', 'SALES_MANAGER', 'SALES_EXECUTIVE', 'MARKETING_MANAGER'],
      default: 'SALES_EXECUTIVE',
    },
    phone: { type: String },
    avatar: { type: String },
  },
  { timestamps: true },
);

UserSchema.methods.comparePassword = async function (candidate: string): Promise<boolean> {
  return bcrypt.compare(candidate, this.passwordHash);
};

export const User = mongoose.model<IUser>('User', UserSchema);
