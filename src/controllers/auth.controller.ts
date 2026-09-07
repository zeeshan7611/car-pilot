import { Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { User } from '../models/User.js';
import { Organization } from '../models/Organization.js';
import { config } from '../config/index.js';
import { AuthenticatedRequest } from '../middlewares/auth.js';

const registerSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
  organizationName: z.string().min(2),
  businessType: z.string().optional(),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export const AuthController = {
  async register(req: AuthenticatedRequest, res: Response): Promise<void> {
    const parse = registerSchema.safeParse(req.body);
    if (!parse.success) {
      res.status(400).json({ success: false, errors: parse.error.errors });
      return;
    }

    const { name, email, password, organizationName, businessType } = parse.data;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      res.status(400).json({ success: false, message: 'Email is already registered' });
      return;
    }

    const slug = organizationName.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + Date.now();
    const org = await Organization.create({
      name: organizationName,
      slug,
      businessType: businessType || 'USED_CARS',
    });

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({
      organizationId: org._id,
      name,
      email,
      passwordHash,
      role: 'OWNER',
    });

    const accessToken = jwt.sign(
      { userId: user._id, organizationId: org._id, role: user.role, email: user.email },
      config.jwt.secret,
      { expiresIn: '1d' },
    );

    const refreshToken = jwt.sign(
      { userId: user._id, organizationId: org._id },
      config.jwt.refreshSecret,
      { expiresIn: '7d' },
    );

    res.status(201).json({
      success: true,
      data: {
        user: { id: user._id, name: user.name, email: user.email, role: user.role, organizationId: org._id },
        organization: { id: org._id, name: org.name, slug: org.slug, businessType: org.businessType },
        accessToken,
        refreshToken,
      },
    });
  },

  async login(req: AuthenticatedRequest, res: Response): Promise<void> {
    const parse = loginSchema.safeParse(req.body);
    if (!parse.success) {
      res.status(400).json({ success: false, errors: parse.error.errors });
      return;
    }

    const { email, password } = parse.data;
    const user = await User.findOne({ email });
    if (!user || !(await user.comparePassword(password))) {
      res.status(401).json({ success: false, message: 'Invalid email or password' });
      return;
    }

    const org = await Organization.findById(user.organizationId);

    const accessToken = jwt.sign(
      { userId: user._id, organizationId: user.organizationId, role: user.role, email: user.email },
      config.jwt.secret,
      { expiresIn: '1d' },
    );

    const refreshToken = jwt.sign(
      { userId: user._id, organizationId: user.organizationId },
      config.jwt.refreshSecret,
      { expiresIn: '7d' },
    );

    res.json({
      success: true,
      data: {
        user: { id: user._id, name: user.name, email: user.email, role: user.role, organizationId: user.organizationId },
        organization: org ? { id: org._id, name: org.name, slug: org.slug, businessType: org.businessType } : null,
        accessToken,
        refreshToken,
      },
    });
  },

  async me(req: AuthenticatedRequest, res: Response): Promise<void> {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    const user = await User.findById(req.user.userId).select('-passwordHash');
    const org = await Organization.findById(req.user.organizationId);

    res.json({
      success: true,
      data: { user, organization: org },
    });
  },

  async refreshToken(req: AuthenticatedRequest, res: Response): Promise<void> {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      res.status(400).json({ success: false, message: 'Refresh token required' });
      return;
    }

    try {
      const decoded = jwt.verify(refreshToken, config.jwt.refreshSecret) as { userId: string; organizationId: string };
      const user = await User.findById(decoded.userId);
      if (!user) {
        res.status(401).json({ success: false, message: 'User no longer exists' });
        return;
      }

      const newAccessToken = jwt.sign(
        { userId: user._id, organizationId: user.organizationId, role: user.role, email: user.email },
        config.jwt.secret,
        { expiresIn: '1d' },
      );

      const newRefreshToken = jwt.sign(
        { userId: user._id, organizationId: user.organizationId },
        config.jwt.refreshSecret,
        { expiresIn: '7d' },
      );

      res.json({
        success: true,
        data: {
          accessToken: newAccessToken,
          refreshToken: newRefreshToken,
        },
      });
    } catch {
      res.status(401).json({ success: false, message: 'Invalid or expired refresh token' });
    }
  },

  async logout(_req: AuthenticatedRequest, res: Response): Promise<void> {
    res.json({ success: true, message: 'Logged out successfully' });
  },
};
