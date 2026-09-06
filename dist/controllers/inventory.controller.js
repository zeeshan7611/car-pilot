"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InventoryController = void 0;
const InventoryItem_js_1 = require("../models/InventoryItem.js");
const ai_service_js_1 = require("../integrations/ai/ai.service.js");
const aiService = new ai_service_js_1.MockAIService();
exports.InventoryController = {
    async getAll(req, res) {
        const orgId = req.user.organizationId;
        const { status, search } = req.query;
        const query = { organizationId: orgId };
        if (status && status !== 'ALL')
            query.status = status;
        if (search) {
            query.$or = [
                { title: { $regex: search, $options: 'i' } },
                { brand: { $regex: search, $options: 'i' } },
            ];
        }
        const items = await InventoryItem_js_1.InventoryItem.find(query).sort({ createdAt: -1 });
        res.json({
            success: true,
            data: {
                items: items.map((item) => ({
                    id: item._id,
                    organizationId: item.organizationId,
                    title: item.title,
                    description: item.description,
                    category: item.category,
                    brand: item.brand,
                    model: item.model,
                    price: item.price,
                    sellingPrice: item.sellingPrice,
                    purchasePrice: item.purchasePrice,
                    status: item.status,
                    media: item.media,
                    location: item.location,
                    specifications: item.specifications,
                    tags: item.tags,
                    createdAt: item.createdAt,
                    updatedAt: item.updatedAt,
                })),
                total: items.length,
            },
        });
    },
    async getById(req, res) {
        const orgId = req.user.organizationId;
        const item = await InventoryItem_js_1.InventoryItem.findOne({ _id: req.params.id, organizationId: orgId });
        if (!item) {
            res.status(404).json({ success: false, message: 'Vehicle not found' });
            return;
        }
        res.json({
            success: true,
            data: {
                id: item._id,
                organizationId: item.organizationId,
                title: item.title,
                description: item.description,
                category: item.category,
                brand: item.brand,
                model: item.model,
                price: item.price,
                sellingPrice: item.sellingPrice,
                purchasePrice: item.purchasePrice,
                status: item.status,
                media: item.media,
                location: item.location,
                specifications: item.specifications,
                tags: item.tags,
                createdAt: item.createdAt,
                updatedAt: item.updatedAt,
            },
        });
    },
    async create(req, res) {
        const orgId = req.user.organizationId;
        const body = req.body;
        let specs = {};
        if (typeof body.specifications === 'string') {
            try {
                specs = JSON.parse(body.specifications);
            }
            catch {
                specs = {};
            }
        }
        else if (typeof body.specifications === 'object' && body.specifications !== null) {
            specs = body.specifications;
        }
        const item = await InventoryItem_js_1.InventoryItem.create({
            organizationId: orgId,
            title: body.title,
            description: body.description,
            category: body.category || 'CAR',
            brand: body.brand,
            model: body.model,
            price: Number(body.sellingPrice || body.price || 0),
            sellingPrice: Number(body.sellingPrice || 0),
            purchasePrice: body.purchasePrice ? Number(body.purchasePrice) : undefined,
            status: body.status || 'AVAILABLE',
            location: body.location || '',
            specifications: specs,
            tags: body.tags ? (Array.isArray(body.tags) ? body.tags : [body.tags]) : [],
            media: body.media || [],
            createdBy: req.user.userId,
        });
        res.status(201).json({
            success: true,
            data: item,
        });
    },
    async update(req, res) {
        const orgId = req.user.organizationId;
        const item = await InventoryItem_js_1.InventoryItem.findOneAndUpdate({ _id: req.params.id, organizationId: orgId }, { $set: req.body }, { new: true });
        if (!item) {
            res.status(404).json({ success: false, message: 'Vehicle not found' });
            return;
        }
        res.json({ success: true, data: item });
    },
    async delete(req, res) {
        const orgId = req.user.organizationId;
        const item = await InventoryItem_js_1.InventoryItem.findOneAndDelete({ _id: req.params.id, organizationId: orgId });
        if (!item) {
            res.status(404).json({ success: false, message: 'Vehicle not found' });
            return;
        }
        res.json({ success: true, message: 'Vehicle deleted successfully' });
    },
    async generateAiContent(req, res) {
        const orgId = req.user.organizationId;
        const item = await InventoryItem_js_1.InventoryItem.findOne({ _id: req.params.id, organizationId: orgId });
        if (!item) {
            res.status(404).json({ success: false, message: 'Vehicle not found' });
            return;
        }
        const aiContent = await aiService.generateProductCopy({
            title: item.title,
            brand: item.brand,
            model: item.model,
            price: item.sellingPrice,
            specifications: item.specifications,
        });
        res.json({ success: true, data: aiContent });
    },
};
