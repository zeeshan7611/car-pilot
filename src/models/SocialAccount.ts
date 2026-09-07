import mongoose, { Schema, Document } from 'mongoose';

export type SocialPlatform = 'FACEBOOK' | 'INSTAGRAM' | 'META_ADS';
export type SocialAccountStatus = 'ACTIVE' | 'EXPIRED' | 'DISCONNECTED' | 'ERROR';

export interface ISocialAccount extends Document {
  organizationId: mongoose.Types.ObjectId;
  platform: SocialPlatform;
  accountId: string; // Page ID, IG User ID, or Ad Account ID (act_xxx)
  accountName: string;
  accessTokenEncrypted: string;
  refreshTokenEncrypted?: string;
  tokenExpiresAt?: Date;
  status: SocialAccountStatus;
  metadata: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

const SocialAccountSchema = new Schema<ISocialAccount>(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
    platform: {
      type: String,
      enum: ['FACEBOOK', 'INSTAGRAM', 'META_ADS'],
      required: true,
    },
    accountId: { type: String, required: true },
    accountName: { type: String, required: true },
    accessTokenEncrypted: { type: String, required: true },
    refreshTokenEncrypted: { type: String },
    tokenExpiresAt: { type: Date },
    status: {
      type: String,
      enum: ['ACTIVE', 'EXPIRED', 'DISCONNECTED', 'ERROR'],
      default: 'ACTIVE',
      index: true,
    },
    metadata: { type: Schema.Types.Mixed, default: {} },
  },
  { timestamps: true },
);

SocialAccountSchema.index({ organizationId: 1, platform: 1, accountId: 1 }, { unique: true });

export const SocialAccount = mongoose.model<ISocialAccount>('SocialAccount', SocialAccountSchema);
