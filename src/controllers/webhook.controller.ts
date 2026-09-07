import { Request, Response } from 'express';
import crypto from 'crypto';
import { Conversation } from '../models/Conversation.js';
import { Message } from '../models/Conversation.js';
import { Lead } from '../models/Lead.js';
import { SocialAccount } from '../models/SocialAccount.js';
import { MockAIService } from '../integrations/ai/ai.service.js';

const aiService = new MockAIService();

export const WebhookController = {
  /**
   * Meta Hub Challenge Verification (GET /api/webhooks/meta)
   */
  verify(req: Request, res: Response): void {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    const expectedToken = process.env.META_WEBHOOK_VERIFY_TOKEN || 'carpilot_webhook_verify_token_secure';

    if (mode === 'subscribe' && token === expectedToken) {
      console.log('[Meta Webhook] Successfully verified webhook subscription challenge');
      res.status(200).send(challenge);
    } else {
      console.warn('[Meta Webhook] Verification token mismatch');
      res.sendStatus(403);
    }
  },

  /**
   * Handle incoming Meta webhook events (POST /api/webhooks/meta)
   */
  async handleIncoming(req: Request, res: Response): Promise<void> {
    // 1. Signature validation if secret is configured
    const appSecret = process.env.META_APP_SECRET;
    const signature = req.headers['x-hub-signature-256'] as string;

    if (appSecret && signature) {
      const hmac = crypto.createHmac('sha256', appSecret);
      const digest = `sha256=${hmac.update(JSON.stringify(req.body)).digest('hex')}`;
      if (signature !== digest) {
        console.error('[Meta Webhook] Invalid webhook signature detected');
        res.status(401).json({ success: false, message: 'Invalid signature' });
        return;
      }
    }

    // Acknowledge Meta immediately to prevent retry flooding
    res.status(200).json({ received: true });

    const body = req.body;
    if (body.object !== 'page' && body.object !== 'instagram') {
      return;
    }

    // Process event entries
    try {
      const entries = body.entry || [];
      for (const entry of entries) {
        const pageOrIgId = entry.id;

        // Find which dealer organization owns this social account
        const account = await SocialAccount.findOne({ accountId: pageOrIgId, status: 'ACTIVE' });
        if (!account) {
          console.warn(`[Meta Webhook] Received event for unregistered account ID: ${pageOrIgId}`);
          continue;
        }

        const messagingEvents = entry.messaging || [];
        for (const event of messagingEvents) {
          const senderId = event.sender?.id;
          const messageText = event.message?.text;

          if (!senderId || !messageText) continue;

          // Check or create Lead
          let lead = await Lead.findOne({
            organizationId: account.organizationId,
            notes: { $regex: senderId },
          });

          if (!lead) {
            lead = await Lead.create({
              organizationId: account.organizationId,
              name: `Meta Lead (${senderId.substring(0, 6)})`,
              source: account.platform === 'INSTAGRAM' ? 'INSTAGRAM' : 'FACEBOOK',
              status: 'NEW',
              temperature: 'WARM',
              notes: `Meta Sender ID: ${senderId}`,
              qualificationScore: 60,
            });
          }

          // Check or create Conversation
          let conversation = await Conversation.findOne({
            organizationId: account.organizationId,
            leadId: lead._id,
          });

          if (!conversation) {
            conversation = await Conversation.create({
              organizationId: account.organizationId,
              leadId: lead._id,
              channel: account.platform === 'INSTAGRAM' ? 'INSTAGRAM' : 'FACEBOOK',
              status: 'AI_ACTIVE',
              lastMessage: messageText,
              lastMessageAt: new Date(),
              unreadCount: 1,
            });
          } else {
            conversation.lastMessage = messageText;
            conversation.lastMessageAt = new Date();
            conversation.unreadCount += 1;
            await conversation.save();
          }

          // Record incoming Customer Message
          await Message.create({
            conversationId: conversation._id,
            senderType: 'CUSTOMER',
            content: messageText,
            messageType: 'TEXT',
            metadata: { metaEventId: event.message?.mid, senderId },
          });

          // If conversation is in AI_ACTIVE mode, generate automated qualification reply
          if (conversation.status === 'AI_ACTIVE') {
            const aiReply = await aiService.generateSalesReply(messageText);
            await Message.create({
              conversationId: conversation._id,
              senderType: 'AI',
              content: aiReply,
              messageType: 'TEXT',
            });
          }
        }
      }
    } catch (err: any) {
      console.error('[Meta Webhook] Error processing event in background:', err.message);
    }
  },
};
