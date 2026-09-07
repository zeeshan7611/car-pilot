import mongoose, { Schema, Document } from 'mongoose';

export interface ICampaign extends Document {
  organizationId: mongoose.Types.ObjectId;
  inventoryItemId?: mongoose.Types.ObjectId;
  name: string;
  objective: 'MESSAGES' | 'LEADS' | 'TRAFFIC' | 'ENGAGEMENT';
  dailyBudget: number;
  durationDays: number;
  totalBudget: number;
  location: string;
  platforms: string[];
  status: 'ACTIVE' | 'PAUSED' | 'COMPLETED' | 'DRAFT';
  metaCampaignId?: string;
  metaAdSetId?: string;
  metaAdId?: string;
  inventoryTitle?: string;
  reelThumbnail?: string;
  metrics: {
    spend: number;
    reach: number;
    impressions: number;
    clicks: number;
    messages: number;
    leads: number;
    costPerLead: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

const CampaignSchema = new Schema<ICampaign>(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
    inventoryItemId: { type: Schema.Types.ObjectId, ref: 'InventoryItem' },
    name: { type: String, required: true },
    objective: { type: String, enum: ['MESSAGES', 'LEADS', 'TRAFFIC', 'ENGAGEMENT'], default: 'MESSAGES' },
    dailyBudget: { type: Number, required: true },
    durationDays: { type: Number, required: true, default: 7 },
    totalBudget: { type: Number, required: true },
    location: { type: String, required: true },
    platforms: { type: [String], default: ['FACEBOOK', 'INSTAGRAM'] },
    status: { type: String, enum: ['ACTIVE', 'PAUSED', 'COMPLETED', 'DRAFT'], default: 'ACTIVE', index: true },
    metaCampaignId: { type: String },
    metaAdSetId: { type: String },
    metaAdId: { type: String },
    inventoryTitle: { type: String },
    reelThumbnail: { type: String },
    metrics: {
      spend: { type: Number, default: 0 },
      reach: { type: Number, default: 0 },
      impressions: { type: Number, default: 0 },
      clicks: { type: Number, default: 0 },
      messages: { type: Number, default: 0 },
      leads: { type: Number, default: 0 },
      costPerLead: { type: Number, default: 0 },
    },
  },
  { timestamps: true },
);

CampaignSchema.index({ organizationId: 1, createdAt: -1 });

export const Campaign = mongoose.model<ICampaign>('Campaign', CampaignSchema);
