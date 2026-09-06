"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.Lead = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const LeadSchema = new mongoose_1.Schema({
    organizationId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
    name: { type: String, required: true, trim: true },
    phone: { type: String, trim: true },
    email: { type: String, trim: true, lowercase: true },
    source: {
        type: String,
        enum: ['INSTAGRAM', 'FACEBOOK', 'WHATSAPP', 'WEBSITE', 'MANUAL', 'ADVERTISEMENT', 'MARKETPLACE', 'REFERRAL'],
        default: 'WHATSAPP',
    },
    inventoryItemId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'InventoryItem' },
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
    assignedTo: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User' },
    budget: { type: Number },
    notes: { type: String },
    qualificationScore: { type: Number, default: 50 },
    lastContactAt: { type: Date },
    nextFollowUpAt: { type: Date },
}, { timestamps: true });
LeadSchema.index({ organizationId: 1, phone: 1 });
LeadSchema.index({ organizationId: 1, status: 1 });
LeadSchema.index({ organizationId: 1, temperature: 1 });
exports.Lead = mongoose_1.default.model('Lead', LeadSchema);
