"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.config = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
exports.config = {
    port: process.env.PORT ? parseInt(process.env.PORT, 10) : 5000,
    nodeEnv: process.env.NODE_ENV || 'development',
    mongodbUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/carpilot',
    redis: {
        host: process.env.REDIS_HOST || 'localhost',
        port: process.env.REDIS_PORT ? parseInt(process.env.REDIS_PORT, 10) : 6379,
        password: process.env.REDIS_PASSWORD || undefined,
    },
    jwt: {
        secret: process.env.JWT_SECRET || 'carpilot_default_secret_dev',
        refreshSecret: process.env.JWT_REFRESH_SECRET || 'carpilot_default_refresh_secret_dev',
        expiresIn: process.env.JWT_EXPIRES_IN || '1d',
        refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
    },
    corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    ai: {
        provider: process.env.AI_PROVIDER || 'mock',
        openaiApiKey: process.env.OPENAI_API_KEY || '',
        anthropicApiKey: process.env.ANTHROPIC_API_KEY || '',
    },
    storage: {
        driver: process.env.STORAGE_DRIVER || 'local',
    },
};
