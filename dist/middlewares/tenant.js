"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireTenant = void 0;
const requireTenant = (req, res, next) => {
    if (!req.user?.organizationId) {
        res.status(403).json({ success: false, message: 'Tenant context missing' });
        return;
    }
    next();
};
exports.requireTenant = requireTenant;
