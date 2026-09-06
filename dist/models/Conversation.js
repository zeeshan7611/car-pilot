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
exports.Conversation = exports.Message = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const MessageSchema = new mongoose_1.Schema({
    conversationId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Conversation', required: true, index: true },
    senderType: { type: String, enum: ['CUSTOMER', 'AI', 'HUMAN', 'SYSTEM'], required: true },
    senderId: { type: mongoose_1.Schema.Types.ObjectId },
    content: { type: String, required: true },
    messageType: { type: String, default: 'TEXT' },
    metadata: { type: mongoose_1.Schema.Types.Mixed },
}, { timestamps: true });
exports.Message = mongoose_1.default.model('Message', MessageSchema);
const ConversationSchema = new mongoose_1.Schema({
    organizationId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
    leadId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Lead', required: true, index: true },
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
}, { timestamps: true });
exports.Conversation = mongoose_1.default.model('Conversation', ConversationSchema);
