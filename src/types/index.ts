export type UserRole =
  | 'OWNER'
  | 'ADMIN'
  | 'SALES_MANAGER'
  | 'SALES_EXECUTIVE'
  | 'MARKETING_MANAGER';

export interface UserPayload {
  userId: string;
  organizationId: string;
  role: UserRole;
  email: string;
}

export type InventoryStatus = 'DRAFT' | 'AVAILABLE' | 'RESERVED' | 'SOLD' | 'ARCHIVED';

export type LeadStatus =
  | 'NEW'
  | 'CONTACTED'
  | 'QUALIFIED'
  | 'APPOINTMENT_BOOKED'
  | 'NEGOTIATION'
  | 'WON'
  | 'LOST';

export type LeadTemperature = 'HOT' | 'WARM' | 'COLD';

export type LeadSource =
  | 'INSTAGRAM'
  | 'FACEBOOK'
  | 'WHATSAPP'
  | 'WEBSITE'
  | 'MANUAL'
  | 'ADVERTISEMENT'
  | 'MARKETPLACE'
  | 'REFERRAL';

export type AppointmentType = 'TEST_DRIVE' | 'MEETING' | 'CALL' | 'DEMO';
export type AppointmentStatus = 'SCHEDULED' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW';

export type ConversationChannel = 'WHATSAPP' | 'INSTAGRAM' | 'FACEBOOK' | 'WEB';
export type SenderType = 'CUSTOMER' | 'AI' | 'HUMAN' | 'SYSTEM';
