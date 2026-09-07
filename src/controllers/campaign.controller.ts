import { Response } from 'express';
import { AuthenticatedRequest } from '../middlewares/auth.js';
import { Campaign } from '../models/Campaign.js';
import { InventoryItem } from '../models/InventoryItem.js';
import { MetaIntegrationService } from '../integrations/meta/meta.service.js';
import mongoose from 'mongoose';

const metaService = new MetaIntegrationService();

export const CampaignController = {
  /**
   * List all campaigns for the organization
   */
  async list(req: AuthenticatedRequest, res: Response): Promise<void> {
    const orgId = new mongoose.Types.ObjectId(req.user!.organizationId);
    const campaigns = await Campaign.find({ organizationId: orgId }).sort({ createdAt: -1 });
    res.json({
      success: true,
      data: campaigns.map((c) => ({
        id: c._id,
        organizationId: c.organizationId,
        inventoryItemId: c.inventoryItemId,
        name: c.name,
        objective: c.objective,
        dailyBudget: c.dailyBudget,
        durationDays: c.durationDays,
        totalBudget: c.totalBudget,
        location: c.location,
        platforms: c.platforms,
        status: c.status,
        metrics: c.metrics,
        inventoryTitle: c.inventoryTitle,
        reelThumbnail: c.reelThumbnail,
        createdAt: c.createdAt,
      })),
    });
  },

  /**
   * Get single campaign by ID
   */
  async getById(req: AuthenticatedRequest, res: Response): Promise<void> {
    const orgId = new mongoose.Types.ObjectId(req.user!.organizationId);
    const campaign = await Campaign.findOne({ _id: req.params.id, organizationId: orgId });
    if (!campaign) {
      res.status(404).json({ success: false, message: 'Campaign not found' });
      return;
    }
    res.json({ success: true, data: campaign });
  },

  /**
   * Create & launch new Meta Campaign for Inventory Reel
   */
  async create(req: AuthenticatedRequest, res: Response): Promise<void> {
    const orgId = new mongoose.Types.ObjectId(req.user!.organizationId);
    const {
      inventoryItemId,
      inventoryTitle,
      name,
      dailyBudget,
      durationDays,
      location,
      objective,
      platforms,
      reelThumbnail,
    } = req.body;

    const budget = Number(dailyBudget) || 300;
    const duration = Number(durationDays) || 7;

    // Safety checks against runaway ad spend as mandated by product.md
    if (budget < 100 || budget > 100000) {
      res.status(400).json({ success: false, message: 'Daily budget must be between ?100 and ?100,000' });
      return;
    }

    let resolvedVideoUrl = reelThumbnail;
    let vehicleTitle = inventoryTitle;

    if (inventoryItemId) {
      const vehicle = await InventoryItem.findOne({ _id: inventoryItemId, organizationId: orgId });
      if (vehicle) {
        vehicleTitle = vehicle.title;
        resolvedVideoUrl = vehicle.media?.find((m) => m.type === 'VIDEO')?.url || vehicle.media?.[0]?.url || resolvedVideoUrl;
      }
    }

    // Call Meta Ad Engine
    const metaResult = await metaService.promoteReel({
      organizationId: orgId,
      reelVideoUrl: resolvedVideoUrl || 'https://images.unsplash.com/photo-1590362891991-f776e747a588',
      caption: `Looking for a great pre-owned car? Explore ${vehicleTitle || 'our collection'} in ${location || 'your area'}!`,
      dailyBudget: budget,
      durationDays: duration,
      locationName: location || 'Local Area',
      goal: objective === 'LEADS' ? 'LEADS' : 'MESSAGES',
    });

    // Persist campaign
    const campaign = await Campaign.create({
      organizationId: orgId,
      inventoryItemId: inventoryItemId ? new mongoose.Types.ObjectId(inventoryItemId) : undefined,
      name: name || `Promo - ${vehicleTitle || 'Inventory Reel'}`,
      objective: objective || 'MESSAGES',
      dailyBudget: budget,
      durationDays: duration,
      totalBudget: budget * duration,
      location: location || 'Nagpur + 30 km',
      platforms: platforms || ['FACEBOOK', 'INSTAGRAM'],
      status: 'ACTIVE',
      metaCampaignId: metaResult.campaignId,
      metaAdSetId: metaResult.adSetId,
      metaAdId: metaResult.adId,
      inventoryTitle: vehicleTitle,
      reelThumbnail: resolvedVideoUrl,
      metrics: {
        spend: 0,
        reach: 0,
        impressions: 0,
        clicks: 0,
        messages: 0,
        leads: 0,
        costPerLead: 0,
      },
    });

    res.status(201).json({
      success: true,
      message: 'Meta campaign created and launched successfully',
      data: {
        id: campaign._id,
        organizationId: campaign.organizationId,
        name: campaign.name,
        objective: campaign.objective,
        dailyBudget: campaign.dailyBudget,
        durationDays: campaign.durationDays,
        totalBudget: campaign.totalBudget,
        location: campaign.location,
        platforms: campaign.platforms,
        status: campaign.status,
        metrics: campaign.metrics,
        inventoryTitle: campaign.inventoryTitle,
        reelThumbnail: campaign.reelThumbnail,
        createdAt: campaign.createdAt,
      },
    });
  },

  /**
   * Pause or Resume campaign
   */
  async updateStatus(req: AuthenticatedRequest, res: Response): Promise<void> {
    const orgId = new mongoose.Types.ObjectId(req.user!.organizationId);
    const { status } = req.body;

    const campaign = await Campaign.findOneAndUpdate(
      { _id: req.params.id, organizationId: orgId },
      { $set: { status } },
      { new: true },
    );

    if (!campaign) {
      res.status(404).json({ success: false, message: 'Campaign not found' });
      return;
    }

    res.json({ success: true, data: campaign });
  },
};
