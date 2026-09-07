import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller.js';
import { InventoryController } from '../controllers/inventory.controller.js';
import { LeadController } from '../controllers/lead.controller.js';
import { ConversationController } from '../controllers/conversation.controller.js';
import { AnalyticsController } from '../controllers/analytics.controller.js';
import { MetaController } from '../controllers/meta.controller.js';
import { WebhookController } from '../controllers/webhook.controller.js';
import { authenticate } from '../middlewares/auth.js';
import { requireTenant } from '../middlewares/tenant.js';
import { uploadMiddleware } from '../storage/localStorage.js';

export const router = Router();

// ── Auth ──────────────────────────────────
router.post('/auth/register', AuthController.register);
router.post('/auth/login', AuthController.login);
router.get('/auth/me', authenticate, AuthController.me);
router.post('/auth/refresh', AuthController.refreshToken);
router.post('/auth/logout', AuthController.logout);

// ── Inventory ─────────────────────────────
router.get('/inventory/catalog', authenticate, requireTenant, InventoryController.getCatalog);
router.post('/inventory/draft-ai-content', authenticate, requireTenant, InventoryController.generateDraftAiContent);
router.get('/inventory', authenticate, requireTenant, InventoryController.getAll);
router.post('/inventory', authenticate, requireTenant, uploadMiddleware.none(), InventoryController.create);
router.get('/inventory/:id', authenticate, requireTenant, InventoryController.getById);
router.patch('/inventory/:id', authenticate, requireTenant, InventoryController.update);
router.delete('/inventory/:id', authenticate, requireTenant, InventoryController.delete);
router.post('/inventory/:id/ai-content', authenticate, requireTenant, InventoryController.generateAiContent);
router.post('/inventory/:id/media', authenticate, requireTenant, uploadMiddleware.array('files', 10), InventoryController.uploadMedia);

// ── Meta Social Publishing & Ad Engine ───
router.post('/inventory/:inventoryId/publish', authenticate, requireTenant, MetaController.publishReel);
router.post('/inventory/:inventoryId/promote', authenticate, requireTenant, MetaController.promoteReel);
router.get('/integrations/meta/connect', authenticate, requireTenant, MetaController.getConnectUrl);
router.get('/integrations/meta/callback', MetaController.handleCallback);
router.get('/integrations/meta/accounts', authenticate, requireTenant, MetaController.getConnectedAccounts);

// ── Webhooks (Meta Incoming Messages/Leads)
router.get('/webhooks/meta', WebhookController.verify);
router.post('/webhooks/meta', WebhookController.handleIncoming);

// ── Leads ─────────────────────────────────
router.get('/leads', authenticate, requireTenant, LeadController.getAll);
router.post('/leads', authenticate, requireTenant, LeadController.create);
router.get('/leads/:id', authenticate, requireTenant, LeadController.getById);
router.patch('/leads/:id', authenticate, requireTenant, LeadController.update);
router.delete('/leads/:id', authenticate, requireTenant, LeadController.delete);

// ── Conversations & Messages ──────────────
router.get('/conversations', authenticate, requireTenant, ConversationController.getAll);
router.get('/conversations/:id/messages', authenticate, requireTenant, ConversationController.getMessages);
router.post('/conversations/:id/messages', authenticate, requireTenant, ConversationController.sendMessage);
router.post('/conversations/:id/ai-reply', authenticate, requireTenant, ConversationController.generateAiReply);

// ── Analytics ─────────────────────────────
router.get('/analytics/dashboard', authenticate, requireTenant, AnalyticsController.getDashboard);
