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
exports.InventoryItem = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const InventoryItemSchema = new mongoose_1.Schema({
    organizationId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
    title: { type: String, required: true, trim: true },
    description: { type: String },
    category: { type: String, default: 'CAR' },
    brand: { type: String, required: true, trim: true, index: true },
    model: { type: String, required: true, trim: true },
    price: { type: Number, required: true },
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
    specifications: { type: mongoose_1.Schema.Types.Mixed, default: {} },
    tags: [{ type: String }],
    createdBy: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });
InventoryItemSchema.index({ organizationId: 1, status: 1 });
InventoryItemSchema.index({ organizationId: 1, createdAt: -1 });
exports.InventoryItem = mongoose_1.default.model('InventoryItem', InventoryItemSchema);
