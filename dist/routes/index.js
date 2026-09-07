"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.router = void 0;
const express_1 = require("express");
const auth_controller_js_1 = require("../controllers/auth.controller.js");
const inventory_controller_js_1 = require("../controllers/inventory.controller.js");
const lead_controller_js_1 = require("../controllers/lead.controller.js");
const conversation_controller_js_1 = require("../controllers/conversation.controller.js");
const analytics_controller_js_1 = require("../controllers/analytics.controller.js");
const meta_controller_js_1 = require("../controllers/meta.controller.js");
const webhook_controller_js_1 = require("../controllers/webhook.controller.js");
const auth_js_1 = require("../middlewares/auth.js");
const tenant_js_1 = require("../middlewares/tenant.js");
const localStorage_js_1 = require("../storage/localStorage.js");
exports.router = (0, express_1.Router)();
// ── Auth ──────────────────────────────────
exports.router.post('/auth/register', auth_controller_js_1.AuthController.register);
exports.router.post('/auth/login', auth_controller_js_1.AuthController.login);
exports.router.get('/auth/me', auth_js_1.authenticate, auth_controller_js_1.AuthController.me);
exports.router.post('/auth/refresh', auth_controller_js_1.AuthController.refreshToken);
exports.router.post('/auth/logout', auth_controller_js_1.AuthController.logout);
// ── Inventory ─────────────────────────────
exports.router.get('/inventory/catalog', auth_js_1.authenticate, tenant_js_1.requireTenant, inventory_controller_js_1.InventoryController.getCatalog);
exports.router.post('/inventory/draft-ai-content', auth_js_1.authenticate, tenant_js_1.requireTenant, inventory_controller_js_1.InventoryController.generateDraftAiContent);
exports.router.get('/inventory', auth_js_1.authenticate, tenant_js_1.requireTenant, inventory_controller_js_1.InventoryController.getAll);
exports.router.post('/inventory', auth_js_1.authenticate, tenant_js_1.requireTenant, localStorage_js_1.uploadMiddleware.none(), inventory_controller_js_1.InventoryController.create);
exports.router.get('/inventory/:id', auth_js_1.authenticate, tenant_js_1.requireTenant, inventory_controller_js_1.InventoryController.getById);
exports.router.patch('/inventory/:id', auth_js_1.authenticate, tenant_js_1.requireTenant, inventory_controller_js_1.InventoryController.update);
exports.router.delete('/inventory/:id', auth_js_1.authenticate, tenant_js_1.requireTenant, inventory_controller_js_1.InventoryController.delete);
exports.router.post('/inventory/:id/ai-content', auth_js_1.authenticate, tenant_js_1.requireTenant, inventory_controller_js_1.InventoryController.generateAiContent);
exports.router.post('/inventory/:id/media', auth_js_1.authenticate, tenant_js_1.requireTenant, localStorage_js_1.uploadMiddleware.array('files', 10), inventory_controller_js_1.InventoryController.uploadMedia);
// ── Meta Social Publishing & Ad Engine ───
exports.router.post('/inventory/:inventoryId/publish', auth_js_1.authenticate, tenant_js_1.requireTenant, meta_controller_js_1.MetaController.publishReel);
exports.router.post('/inventory/:inventoryId/promote', auth_js_1.authenticate, tenant_js_1.requireTenant, meta_controller_js_1.MetaController.promoteReel);
exports.router.get('/integrations/meta/connect', auth_js_1.authenticate, tenant_js_1.requireTenant, meta_controller_js_1.MetaController.getConnectUrl);
exports.router.get('/integrations/meta/callback', meta_controller_js_1.MetaController.handleCallback);
exports.router.get('/integrations/meta/accounts', auth_js_1.authenticate, tenant_js_1.requireTenant, meta_controller_js_1.MetaController.getConnectedAccounts);
// ── Webhooks (Meta Incoming Messages/Leads)
exports.router.get('/webhooks/meta', webhook_controller_js_1.WebhookController.verify);
exports.router.post('/webhooks/meta', webhook_controller_js_1.WebhookController.handleIncoming);
// ── Leads ─────────────────────────────────
exports.router.get('/leads', auth_js_1.authenticate, tenant_js_1.requireTenant, lead_controller_js_1.LeadController.getAll);
exports.router.post('/leads', auth_js_1.authenticate, tenant_js_1.requireTenant, lead_controller_js_1.LeadController.create);
exports.router.get('/leads/:id', auth_js_1.authenticate, tenant_js_1.requireTenant, lead_controller_js_1.LeadController.getById);
exports.router.patch('/leads/:id', auth_js_1.authenticate, tenant_js_1.requireTenant, lead_controller_js_1.LeadController.update);
exports.router.delete('/leads/:id', auth_js_1.authenticate, tenant_js_1.requireTenant, lead_controller_js_1.LeadController.delete);
// ── Conversations & Messages ──────────────
exports.router.get('/conversations', auth_js_1.authenticate, tenant_js_1.requireTenant, conversation_controller_js_1.ConversationController.getAll);
exports.router.get('/conversations/:id/messages', auth_js_1.authenticate, tenant_js_1.requireTenant, conversation_controller_js_1.ConversationController.getMessages);
exports.router.post('/conversations/:id/messages', auth_js_1.authenticate, tenant_js_1.requireTenant, conversation_controller_js_1.ConversationController.sendMessage);
exports.router.post('/conversations/:id/ai-reply', auth_js_1.authenticate, tenant_js_1.requireTenant, conversation_controller_js_1.ConversationController.generateAiReply);
// ── Analytics ─────────────────────────────
exports.router.get('/analytics/dashboard', auth_js_1.authenticate, tenant_js_1.requireTenant, analytics_controller_js_1.AnalyticsController.getDashboard);
