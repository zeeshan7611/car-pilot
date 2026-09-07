import mongoose, { Schema, Document } from 'mongoose';
import { InventoryStatus } from '../types/index.js';

export interface IInventoryItem {
  organizationId: mongoose.Types.ObjectId;
  title: string;
  description?: string;
  category: string;
  brand: string;
  model: string;
  price: number;
  sellingPrice: number;
  purchasePrice?: number;
  status: InventoryStatus;
  media: Array<{
    url: string;
    key?: string;
    type: string;
    isPrimary?: boolean;
  }>;
  location?: string;
  specifications: Record<string, unknown>;
  tags: string[];
  createdBy: mongoose.Types.ObjectId;
  createdAt?: Date;
  updatedAt?: Date;
}

const InventoryItemSchema = new Schema<IInventoryItem>(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
    title: { type: String, required: true, trim: true },
    description: { type: String },
    category: { type: String, default: 'CAR' },
    brand: { type: String, required: true, trim: true, index: true },
    model: { type: String, required: true, trim: true },
    price: {
      type: Number,
      required: true,
      default: function (this: any) {
        return this.sellingPrice || 0;
      },
    },
    sellingPrice: { type: Number, required: true, index: true },
    purchasePrice: { type: Number },
    status: {
      type: String,
      enum: ['DRAFT', 'AVAILABLE', 'RESERVED', 'SOLD', 'ARCHIVED'],
      default: 'AVAILABLE',
      index: true,
    },
    media: [
      {
        url: { type: String, required: true },
        key: { type: String },
        type: { type: String, default: 'IMAGE' },
        isPrimary: { type: Boolean, default: false },
      },
    ],
    location: { type: String },
    specifications: { type: Schema.Types.Mixed, default: {} },
    tags: [{ type: String }],
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true },
);

InventoryItemSchema.index({ organizationId: 1, status: 1 });
InventoryItemSchema.index({ organizationId: 1, createdAt: -1 });

export const InventoryItem = mongoose.model<IInventoryItem>('InventoryItem', InventoryItemSchema);
