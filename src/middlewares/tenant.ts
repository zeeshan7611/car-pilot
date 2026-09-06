import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from './auth.js';

export const requireTenant = (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
  if (!req.user?.organizationId) {
    res.status(403).json({ success: false, message: 'Tenant context missing' });
    return;
  }
  next();
};
