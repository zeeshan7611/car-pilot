import { Response } from 'express';
import { InventoryItem } from '../models/InventoryItem.js';
import { AuthenticatedRequest } from '../middlewares/auth.js';
import { MockAIService } from '../integrations/ai/ai.service.js';

const aiService = new MockAIService();

export const InventoryController = {
  async getAll(req: AuthenticatedRequest, res: Response): Promise<void> {
    const orgId = req.user!.organizationId;
    const { status, search } = req.query;

    const query: Record<string, unknown> = { organizationId: orgId };
    if (status && status !== 'ALL') query.status = status;
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { brand: { $regex: search, $options: 'i' } },
      ];
    }

    const items = await InventoryItem.find(query).sort({ createdAt: -1 });
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

  async getById(req: AuthenticatedRequest, res: Response): Promise<void> {
    const orgId = req.user!.organizationId;
    const item = await InventoryItem.findOne({ _id: req.params.id, organizationId: orgId });

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

  async create(req: AuthenticatedRequest, res: Response): Promise<void> {
    const orgId = req.user!.organizationId;
    const body = req.body;

    let specs = {};
    if (typeof body.specifications === 'string') {
      try {
        specs = JSON.parse(body.specifications);
      } catch {
        specs = {};
      }
    } else if (typeof body.specifications === 'object' && body.specifications !== null) {
      specs = body.specifications;
    }

    const item = await InventoryItem.create({
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
      createdBy: req.user!.userId,
    });

    res.status(201).json({
      success: true,
      data: item,
    });
  },

  async update(req: AuthenticatedRequest, res: Response): Promise<void> {
    const orgId = req.user!.organizationId;
    const item = await InventoryItem.findOneAndUpdate(
      { _id: req.params.id, organizationId: orgId },
      { $set: req.body },
      { new: true },
    );

    if (!item) {
      res.status(404).json({ success: false, message: 'Vehicle not found' });
      return;
    }

    res.json({ success: true, data: item });
  },

  async delete(req: AuthenticatedRequest, res: Response): Promise<void> {
    const orgId = req.user!.organizationId;
    const item = await InventoryItem.findOneAndDelete({ _id: req.params.id, organizationId: orgId });
    if (!item) {
      res.status(404).json({ success: false, message: 'Vehicle not found' });
      return;
    }
    res.json({ success: true, message: 'Vehicle deleted successfully' });
  },

  async generateAiContent(req: AuthenticatedRequest, res: Response): Promise<void> {
    const orgId = req.user!.organizationId;
    const item = await InventoryItem.findOne({ _id: req.params.id, organizationId: orgId });
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
