"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LeadController = void 0;
const Lead_js_1 = require("../models/Lead.js");
exports.LeadController = {
    async getAll(req, res) {
        const orgId = req.user.organizationId;
        const { status, temperature, search } = req.query;
        const query = { organizationId: orgId };
        if (status && status !== 'ALL')
            query.status = status;
        if (temperature && temperature !== 'ALL')
            query.temperature = temperature;
        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { phone: { $regex: search, $options: 'i' } },
            ];
        }
        const leads = await Lead_js_1.Lead.find(query).sort({ updatedAt: -1 });
        res.json({
            success: true,
            data: {
                items: leads.map((l) => ({
                    id: l._id,
                    organizationId: l.organizationId,
                    name: l.name,
                    phone: l.phone,
                    email: l.email,
                    source: l.source,
                    status: l.status,
                    temperature: l.temperature,
                    budget: l.budget,
                    notes: l.notes,
                    qualificationScore: l.qualificationScore,
                    lastContactAt: l.lastContactAt,
                    nextFollowUpAt: l.nextFollowUpAt,
                    createdAt: l.createdAt,
                    updatedAt: l.updatedAt,
                })),
                total: leads.length,
            },
        });
    },
    async getById(req, res) {
        const orgId = req.user.organizationId;
        const lead = await Lead_js_1.Lead.findOne({ _id: req.params.id, organizationId: orgId });
        if (!lead) {
            res.status(404).json({ success: false, message: 'Lead not found' });
            return;
        }
        res.json({ success: true, data: lead });
    },
    async create(req, res) {
        const orgId = req.user.organizationId;
        const lead = await Lead_js_1.Lead.create({
            ...req.body,
            organizationId: orgId,
        });
        res.status(201).json({ success: true, data: lead });
    },
    async update(req, res) {
        const orgId = req.user.organizationId;
        const lead = await Lead_js_1.Lead.findOneAndUpdate({ _id: req.params.id, organizationId: orgId }, { $set: req.body }, { new: true });
        if (!lead) {
            res.status(404).json({ success: false, message: 'Lead not found' });
            return;
        }
        res.json({ success: true, data: lead });
    },
    async delete(req, res) {
        const orgId = req.user.organizationId;
        const lead = await Lead_js_1.Lead.findOneAndDelete({ _id: req.params.id, organizationId: orgId });
        if (!lead) {
            res.status(404).json({ success: false, message: 'Lead not found' });
            return;
        }
        res.json({ success: true, message: 'Lead deleted successfully' });
    },
};
