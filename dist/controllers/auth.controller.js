"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthController = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const zod_1 = require("zod");
const User_js_1 = require("../models/User.js");
const Organization_js_1 = require("../models/Organization.js");
const index_js_1 = require("../config/index.js");
const registerSchema = zod_1.z.object({
    name: zod_1.z.string().min(2),
    email: zod_1.z.string().email(),
    password: zod_1.z.string().min(6),
    organizationName: zod_1.z.string().min(2),
    businessType: zod_1.z.string().optional(),
});
const loginSchema = zod_1.z.object({
    email: zod_1.z.string().email(),
    password: zod_1.z.string().min(6),
});
exports.AuthController = {
    async register(req, res) {
        const parse = registerSchema.safeParse(req.body);
        if (!parse.success) {
            res.status(400).json({ success: false, errors: parse.error.errors });
            return;
        }
        const { name, email, password, organizationName, businessType } = parse.data;
        const existingUser = await User_js_1.User.findOne({ email });
        if (existingUser) {
            res.status(400).json({ success: false, message: 'Email is already registered' });
            return;
        }
        const slug = organizationName.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + Date.now();
        const org = await Organization_js_1.Organization.create({
            name: organizationName,
            slug,
            businessType: businessType || 'USED_CARS',
        });
        const passwordHash = await bcryptjs_1.default.hash(password, 10);
        const user = await User_js_1.User.create({
            organizationId: org._id,
            name,
            email,
            passwordHash,
            role: 'OWNER',
        });
        const accessToken = jsonwebtoken_1.default.sign({ userId: user._id, organizationId: org._id, role: user.role, email: user.email }, index_js_1.config.jwt.secret, { expiresIn: '1d' });
        const refreshToken = jsonwebtoken_1.default.sign({ userId: user._id, organizationId: org._id }, index_js_1.config.jwt.refreshSecret, { expiresIn: '7d' });
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
    async login(req, res) {
        const parse = loginSchema.safeParse(req.body);
        if (!parse.success) {
            res.status(400).json({ success: false, errors: parse.error.errors });
            return;
        }
        const { email, password } = parse.data;
        const user = await User_js_1.User.findOne({ email });
        if (!user || !(await user.comparePassword(password))) {
            res.status(401).json({ success: false, message: 'Invalid email or password' });
            return;
        }
        const org = await Organization_js_1.Organization.findById(user.organizationId);
        const accessToken = jsonwebtoken_1.default.sign({ userId: user._id, organizationId: user.organizationId, role: user.role, email: user.email }, index_js_1.config.jwt.secret, { expiresIn: '1d' });
        const refreshToken = jsonwebtoken_1.default.sign({ userId: user._id, organizationId: user.organizationId }, index_js_1.config.jwt.refreshSecret, { expiresIn: '7d' });
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
    async me(req, res) {
        if (!req.user) {
            res.status(401).json({ success: false, message: 'Unauthorized' });
            return;
        }
        const user = await User_js_1.User.findById(req.user.userId).select('-passwordHash');
        const org = await Organization_js_1.Organization.findById(req.user.organizationId);
        res.json({
            success: true,
            data: { user, organization: org },
        });
    },
    async refreshToken(req, res) {
        const { refreshToken } = req.body;
        if (!refreshToken) {
            res.status(400).json({ success: false, message: 'Refresh token required' });
            return;
        }
        try {
            const decoded = jsonwebtoken_1.default.verify(refreshToken, index_js_1.config.jwt.refreshSecret);
            const user = await User_js_1.User.findById(decoded.userId);
            if (!user) {
                res.status(401).json({ success: false, message: 'User no longer exists' });
                return;
            }
            const newAccessToken = jsonwebtoken_1.default.sign({ userId: user._id, organizationId: user.organizationId, role: user.role, email: user.email }, index_js_1.config.jwt.secret, { expiresIn: '1d' });
            const newRefreshToken = jsonwebtoken_1.default.sign({ userId: user._id, organizationId: user.organizationId }, index_js_1.config.jwt.refreshSecret, { expiresIn: '7d' });
            res.json({
                success: true,
                data: {
                    accessToken: newAccessToken,
                    refreshToken: newRefreshToken,
                },
            });
        }
        catch {
            res.status(401).json({ success: false, message: 'Invalid or expired refresh token' });
        }
    },
    async logout(_req, res) {
        res.json({ success: true, message: 'Logged out successfully' });
    },
};
