import mongoose, { Schema, Document } from 'mongoose';
import { AppointmentType, AppointmentStatus } from '../types/index.js';

export interface IAppointment extends Document {
  organizationId: mongoose.Types.ObjectId;
  leadId: mongoose.Types.ObjectId;
  inventoryItemId?: mongoose.Types.ObjectId;
  assignedTo?: mongoose.Types.ObjectId;
  type: AppointmentType;
  scheduledAt: Date;
  status: AppointmentStatus;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const AppointmentSchema = new Schema<IAppointment>(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
    leadId: { type: Schema.Types.ObjectId, ref: 'Lead', required: true, index: true },
    inventoryItemId: { type: Schema.Types.ObjectId, ref: 'InventoryItem' },
    assignedTo: { type: Schema.Types.ObjectId, ref: 'User' },
    type: { type: String, enum: ['TEST_DRIVE', 'MEETING', 'CALL', 'DEMO'], default: 'TEST_DRIVE' },
    scheduledAt: { type: Date, required: true },
    status: {
      type: String,
      enum: ['SCHEDULED', 'CONFIRMED', 'COMPLETED', 'CANCELLED', 'NO_SHOW'],
      default: 'SCHEDULED',
    },
    notes: { type: String },
  },
  { timestamps: true },
);

export const Appointment = mongoose.model<IAppointment>('Appointment', AppointmentSchema);
