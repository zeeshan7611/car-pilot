import mongoose, { Schema, Document } from 'mongoose';
import { ConversationChannel, SenderType } from '../types/index.js';

export interface IMessage extends Document {
  conversationId: mongoose.Types.ObjectId;
  senderType: SenderType;
  senderId?: mongoose.Types.ObjectId;
  content: string;
  messageType: string;
  metadata?: Record<string, unknown>;
  createdAt: Date;
}

const MessageSchema = new Schema<IMessage>(
  {
    conversationId: { type: Schema.Types.ObjectId, ref: 'Conversation', required: true, index: true },
    senderType: { type: String, enum: ['CUSTOMER', 'AI', 'HUMAN', 'SYSTEM'], required: true },
    senderId: { type: Schema.Types.ObjectId },
    content: { type: String, required: true },
    messageType: { type: String, default: 'TEXT' },
    metadata: { type: Schema.Types.Mixed },
  },
  { timestamps: true },
);

export const Message = mongoose.model<IMessage>('Message', MessageSchema);

export interface IConversation extends Document {
  organizationId: mongoose.Types.ObjectId;
  leadId: mongoose.Types.ObjectId;
  channel: ConversationChannel;
  status: 'OPEN' | 'AI_ACTIVE' | 'HUMAN_TAKEOVER' | 'CLOSED';
  lastMessageAt: Date;
  lastMessage?: string;
  unreadCount: number;
  createdAt: Date;
  updatedAt: Date;
}

const ConversationSchema = new Schema<IConversation>(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
    leadId: { type: Schema.Types.ObjectId, ref: 'Lead', required: true, index: true },
    channel: { type: String, enum: ['WHATSAPP', 'INSTAGRAM', 'FACEBOOK', 'WEB'], default: 'WHATSAPP' },
    status: {
      type: String,
      enum: ['OPEN', 'AI_ACTIVE', 'HUMAN_TAKEOVER', 'CLOSED'],
      default: 'AI_ACTIVE',
      index: true,
    },
    lastMessageAt: { type: Date, default: Date.now },
    lastMessage: { type: String },
    unreadCount: { type: Number, default: 0 },
  },
  { timestamps: true },
);

export const Conversation = mongoose.model<IConversation>('Conversation', ConversationSchema);
