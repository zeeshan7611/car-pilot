import { Response } from 'express';
import { Conversation, Message } from '../models/Conversation.js';
import { AuthenticatedRequest } from '../middlewares/auth.js';
import { MockAIService } from '../integrations/ai/ai.service.js';

const aiService = new MockAIService();

export const ConversationController = {
  async getAll(req: AuthenticatedRequest, res: Response): Promise<void> {
    const orgId = req.user!.organizationId;
    const conversations = await Conversation.find({ organizationId: orgId })
      .populate('leadId', 'name phone temperature status')
      .sort({ lastMessageAt: -1 });

    res.json({ success: true, data: conversations });
  },

  async getMessages(req: AuthenticatedRequest, res: Response): Promise<void> {
    const messages = await Message.find({ conversationId: req.params.id }).sort({ createdAt: 1 });
    res.json({ success: true, data: messages });
  },

  async sendMessage(req: AuthenticatedRequest, res: Response): Promise<void> {
    const { id } = req.params;
    const { content, senderType } = req.body;

    const message = await Message.create({
      conversationId: id,
      senderType: senderType || 'HUMAN',
      senderId: req.user!.userId,
      content,
    });

    await Conversation.findByIdAndUpdate(id, {
      lastMessage: content,
      lastMessageAt: new Date(),
    });

    res.status(201).json({ success: true, data: message });
  },

  async generateAiReply(req: AuthenticatedRequest, res: Response): Promise<void> {
    const { id } = req.params;
    const { customerMessage, leadName } = req.body;

    const result = await aiService.respondToLead({
      customerMessage: customerMessage || 'Is this available?',
      leadName: leadName || 'Customer',
    });

    const aiMessage = await Message.create({
      conversationId: id,
      senderType: 'AI',
      content: result.reply,
      metadata: { action: result.action, intent: result.intent },
    });

    await Conversation.findByIdAndUpdate(id, {
      lastMessage: result.reply,
      lastMessageAt: new Date(),
      status: result.action === 'ESCALATE_TO_HUMAN' ? 'HUMAN_TAKEOVER' : 'AI_ACTIVE',
    });

    res.json({ success: true, data: { message: aiMessage, action: result.action } });
  },
};
