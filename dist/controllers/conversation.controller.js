"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConversationController = void 0;
const Conversation_js_1 = require("../models/Conversation.js");
const ai_service_js_1 = require("../integrations/ai/ai.service.js");
const aiService = new ai_service_js_1.MockAIService();
exports.ConversationController = {
    async getAll(req, res) {
        const orgId = req.user.organizationId;
        const conversations = await Conversation_js_1.Conversation.find({ organizationId: orgId })
            .populate('leadId', 'name phone temperature status')
            .sort({ lastMessageAt: -1 });
        res.json({ success: true, data: conversations });
    },
    async getMessages(req, res) {
        const messages = await Conversation_js_1.Message.find({ conversationId: req.params.id }).sort({ createdAt: 1 });
        res.json({ success: true, data: messages });
    },
    async sendMessage(req, res) {
        const { id } = req.params;
        const { content, senderType } = req.body;
        const message = await Conversation_js_1.Message.create({
            conversationId: id,
            senderType: senderType || 'HUMAN',
            senderId: req.user.userId,
            content,
        });
        await Conversation_js_1.Conversation.findByIdAndUpdate(id, {
            lastMessage: content,
            lastMessageAt: new Date(),
        });
        res.status(201).json({ success: true, data: message });
    },
    async generateAiReply(req, res) {
        const { id } = req.params;
        const { customerMessage, leadName } = req.body;
        const result = await aiService.respondToLead({
            customerMessage: customerMessage || 'Is this available?',
            leadName: leadName || 'Customer',
        });
        const aiMessage = await Conversation_js_1.Message.create({
            conversationId: id,
            senderType: 'AI',
            content: result.reply,
            metadata: { action: result.action, intent: result.intent },
        });
        await Conversation_js_1.Conversation.findByIdAndUpdate(id, {
            lastMessage: result.reply,
            lastMessageAt: new Date(),
            status: result.action === 'ESCALATE_TO_HUMAN' ? 'HUMAN_TAKEOVER' : 'AI_ACTIVE',
        });
        res.json({ success: true, data: { message: aiMessage, action: result.action } });
    },
};
