import { Response } from 'express';
import { Lead } from '../models/Lead.js';
import { AuthenticatedRequest } from '../middlewares/auth.js';

export const LeadController = {
  async getAll(req: AuthenticatedRequest, res: Response): Promise<void> {
    const orgId = req.user!.organizationId;
    const { status, temperature, search } = req.query;

    const query: Record<string, unknown> = { organizationId: orgId };
    if (status && status !== 'ALL') query.status = status;
    if (temperature && temperature !== 'ALL') query.temperature = temperature;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
      ];
    }

    const leads = await Lead.find(query).sort({ updatedAt: -1 });
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

  async getById(req: AuthenticatedRequest, res: Response): Promise<void> {
    const orgId = req.user!.organizationId;
    const lead = await Lead.findOne({ _id: req.params.id, organizationId: orgId });
    if (!lead) {
      res.status(404).json({ success: false, message: 'Lead not found' });
      return;
    }
    res.json({ success: true, data: lead });
  },

  async create(req: AuthenticatedRequest, res: Response): Promise<void> {
    const orgId = req.user!.organizationId;
    const lead = await Lead.create({
      ...req.body,
      organizationId: orgId,
    });
    res.status(201).json({ success: true, data: lead });
  },

  async update(req: AuthenticatedRequest, res: Response): Promise<void> {
    const orgId = req.user!.organizationId;
    const lead = await Lead.findOneAndUpdate(
      { _id: req.params.id, organizationId: orgId },
      { $set: req.body },
      { new: true },
    );
    if (!lead) {
      res.status(404).json({ success: false, message: 'Lead not found' });
      return;
    }
    res.json({ success: true, data: lead });
  },

  async delete(req: AuthenticatedRequest, res: Response): Promise<void> {
    const orgId = req.user!.organizationId;
    const lead = await Lead.findOneAndDelete({ _id: req.params.id, organizationId: orgId });
    if (!lead) {
      res.status(404).json({ success: false, message: 'Lead not found' });
      return;
    }
    res.json({ success: true, message: 'Lead deleted successfully' });
  },
};
