import mongoose, { Schema, Document } from 'mongoose';

export interface IOrganization extends Document {
  name: string;
  slug: string;
  businessType: string;
  plan: string;
  phone?: string;
  email?: string;
  address?: string;
  settings: {
    aiTone: string;
    maxDiscountPercent: number;
    escalateAngry: boolean;
  };
  createdAt: Date;
  updatedAt: Date;
}

const OrganizationSchema = new Schema<IOrganization>(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    businessType: { type: String, default: 'USED_CARS' },
    plan: { type: String, enum: ['FREE', 'STARTER', 'GROWTH', 'PRO'], default: 'STARTER' },
    phone: { type: String },
    email: { type: String },
    address: { type: String },
    settings: {
      aiTone: { type: String, default: 'PROFESSIONAL_FRIENDLY' },
      maxDiscountPercent: { type: Number, default: 5 },
      escalateAngry: { type: Boolean, default: true },
    },
  },
  { timestamps: true },
);

export const Organization = mongoose.model<IOrganization>('Organization', OrganizationSchema);
