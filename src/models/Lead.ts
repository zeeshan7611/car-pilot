import mongoose, { Schema, Document } from 'mongoose';
import { LeadStatus, LeadTemperature, LeadSource } from '../types/index.js';

export interface ILead extends Document {
  organizationId: mongoose.Types.ObjectId;
  name: string;
  phone?: string;
  email?: string;
  source: LeadSource;
  inventoryItemId?: mongoose.Types.ObjectId;
  status: LeadStatus;
  temperature: LeadTemperature;
  assignedTo?: mongoose.Types.ObjectId;
  budget?: number;
  notes?: string;
  qualificationScore?: number;
  lastContactAt?: Date;
  nextFollowUpAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const LeadSchema = new Schema<ILead>(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
    name: { type: String, required: true, trim: true },
    phone: { type: String, trim: true },
    email: { type: String, trim: true, lowercase: true },
    source: {
      type: String,
      enum: ['INSTAGRAM', 'FACEBOOK', 'WHATSAPP', 'WEBSITE', 'MANUAL', 'ADVERTISEMENT', 'MARKETPLACE', 'REFERRAL'],
      default: 'WHATSAPP',
    },
    inventoryItemId: { type: Schema.Types.ObjectId, ref: 'InventoryItem' },
    status: {
      type: String,
      enum: ['NEW', 'CONTACTED', 'QUALIFIED', 'APPOINTMENT_BOOKED', 'NEGOTIATION', 'WON', 'LOST'],
      default: 'NEW',
      index: true,
    },
    temperature: {
      type: String,
      enum: ['HOT', 'WARM', 'COLD'],
      default: 'WARM',
      index: true,
    },
    assignedTo: { type: Schema.Types.ObjectId, ref: 'User' },
    budget: { type: Number },
    notes: { type: String },
    qualificationScore: { type: Number, default: 50 },
    lastContactAt: { type: Date },
    nextFollowUpAt: { type: Date },
  },
  { timestamps: true },
);

LeadSchema.index({ organizationId: 1, phone: 1 });
LeadSchema.index({ organizationId: 1, status: 1 });
LeadSchema.index({ organizationId: 1, temperature: 1 });

export const Lead = mongoose.model<ILead>('Lead', LeadSchema);
