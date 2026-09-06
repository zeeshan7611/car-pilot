import mongoose, { Schema, Document } from 'mongoose';

export interface IDeal extends Document {
  organizationId: mongoose.Types.ObjectId;
  leadId: mongoose.Types.ObjectId;
  inventoryItemId: mongoose.Types.ObjectId;
  salesperson?: mongoose.Types.ObjectId;
  purchasePrice: number;
  sellingPrice: number;
  discount: number;
  expenses: number;
  grossProfit: number;
  netProfit: number;
  status: 'PENDING' | 'COMPLETED' | 'CANCELLED';
  soldAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const DealSchema = new Schema<IDeal>(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
    leadId: { type: Schema.Types.ObjectId, ref: 'Lead', required: true },
    inventoryItemId: { type: Schema.Types.ObjectId, ref: 'InventoryItem', required: true },
    salesperson: { type: Schema.Types.ObjectId, ref: 'User' },
    purchasePrice: { type: Number, required: true },
    sellingPrice: { type: Number, required: true },
    discount: { type: Number, default: 0 },
    expenses: { type: Number, default: 0 },
    grossProfit: { type: Number, required: true },
    netProfit: { type: Number, required: true },
    status: { type: String, enum: ['PENDING', 'COMPLETED', 'CANCELLED'], default: 'COMPLETED' },
    soldAt: { type: Date, default: Date.now },
  },
  { timestamps: true },
);

export const Deal = mongoose.model<IDeal>('Deal', DealSchema);
