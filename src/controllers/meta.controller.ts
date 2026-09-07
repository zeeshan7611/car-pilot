import { Response } from 'express';
import { AuthenticatedRequest } from '../middlewares/auth.js';
import { MetaIntegrationService } from '../integrations/meta/meta.service.js';
import { SocialAccount } from '../models/SocialAccount.js';
import { InventoryItem } from '../models/InventoryItem.js';
import mongoose from 'mongoose';

const metaService = new MetaIntegrationService();

export const MetaController = {
  /**
   * Get OAuth connect URL
   */
  async getConnectUrl(req: AuthenticatedRequest, res: Response): Promise<void> {
    const orgId = req.user!.organizationId;
    const state = Buffer.from(JSON.stringify({ orgId, timestamp: Date.now() })).toString('base64');
    const authUrl = metaService.getAuthorizationUrl(state);
    res.json({ success: true, data: { authUrl } });
  },

  /**
   * OAuth Callback handler
   */
  async handleCallback(req: AuthenticatedRequest, res: Response): Promise<void> {
    const { code, state } = req.query;
    let orgId: mongoose.Types.ObjectId | undefined = req.user?.organizationId
      ? new mongoose.Types.ObjectId(req.user.organizationId)
      : undefined;

    if (!orgId && state) {
      try {
        const decoded = JSON.parse(Buffer.from(state as string, 'base64').toString('utf8'));
        orgId = new mongoose.Types.ObjectId(decoded.orgId);
      } catch (err) {
        // ignore
      }
    }

    if (!orgId) {
      res.status(400).json({ success: false, message: 'Organization ID not found in OAuth state' });
      return;
    }

    const authCode = (code as string) || 'mock_auth_code';
    const result = await metaService.handleOAuthCallback(authCode, orgId);
    res.json({
      success: true,
      message: 'Meta accounts connected successfully',
      data: result,
    });
  },

  /**
   * List connected social accounts for the organization
   */
  async getConnectedAccounts(req: AuthenticatedRequest, res: Response): Promise<void> {
    const orgId = new mongoose.Types.ObjectId(req.user!.organizationId);
    const accounts = await SocialAccount.find({ organizationId: orgId }).select('-accessTokenEncrypted -refreshTokenEncrypted');
    res.json({ success: true, data: accounts });
  },

  /**
   * Publish an inventory Reel to Instagram/Facebook
   */
  async publishReel(req: AuthenticatedRequest, res: Response): Promise<void> {
    const orgId = new mongoose.Types.ObjectId(req.user!.organizationId);
    const { inventoryId } = req.params;
    const { caption, videoUrl } = req.body;

    const item = await InventoryItem.findOne({ _id: inventoryId, organizationId: orgId });
    if (!item) {
      res.status(404).json({ success: false, message: 'Inventory vehicle not found' });
      return;
    }

    // Pick specified video URL or the first video found in item media
    const targetVideoUrl = videoUrl || item.media?.find((m) => m.type === 'VIDEO')?.url;
    if (!targetVideoUrl) {
      res.status(400).json({ success: false, message: 'No video / Reel found for this vehicle. Please upload a Reel first.' });
      return;
    }

    const reelCaption = caption || `🔥 Fresh Arrival! ${item.brand} ${item.model} - ₹${item.sellingPrice.toLocaleString('en-IN')}. DM us for test drive!`;

    const result = await metaService.publishReel({
      organizationId: orgId,
      videoUrl: targetVideoUrl,
      caption: reelCaption,
    });

    res.json({
      success: true,
      message: 'Reel published to Instagram successfully',
      data: result,
    });
  },

  /**
   * Promote an existing inventory Reel using Meta Ad Engine
   */
  async promoteReel(req: AuthenticatedRequest, res: Response): Promise<void> {
    const orgId = new mongoose.Types.ObjectId(req.user!.organizationId);
    const { inventoryId } = req.params;
    const { dailyBudget, durationDays, locationName, targetRadiusKm, goal, caption, videoUrl } = req.body;

    const item = await InventoryItem.findOne({ _id: inventoryId, organizationId: orgId });
    if (!item) {
      res.status(404).json({ success: false, message: 'Inventory vehicle not found' });
      return;
    }

    // Safety checks against runaway ad spend as mandated by product.md
    const budgetNum = Number(dailyBudget);
    if (!budgetNum || budgetNum < 100 || budgetNum > 100000) {
      res.status(400).json({ success: false, message: 'Daily budget must be between ₹100 and ₹100,000' });
      return;
    }

    const targetVideoUrl = videoUrl || item.media?.find((m) => m.type === 'VIDEO')?.url;
    if (!targetVideoUrl) {
      res.status(400).json({ success: false, message: 'No video / Reel found for this vehicle to promote.' });
      return;
    }

    const campaignResult = await metaService.promoteReel({
      organizationId: orgId,
      reelVideoUrl: targetVideoUrl,
      caption: caption || `Drive home this ${item.brand} ${item.model}! Test drives available now in ${locationName || 'your city'}. Click to enquire!`,
      dailyBudget: budgetNum,
      durationDays: Number(durationDays) || 7,
      locationName: locationName || item.location || 'Local Area',
      targetRadiusKm: Number(targetRadiusKm) || 25,
      goal: goal === 'LEADS' ? 'LEADS' : 'MESSAGES',
    });

    res.json({
      success: true,
      message: 'Meta campaign launched successfully for vehicle Reel',
      data: {
        inventoryId: item._id,
        vehicle: `${item.brand} ${item.model}`,
        ...campaignResult,
      },
    });
  },
};
