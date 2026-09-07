"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CryptoUtil = void 0;
const crypto_1 = __importDefault(require("crypto"));
const ALGORITHM = 'aes-256-gcm';
const ENCRYPTION_KEY = process.env.TOKEN_ENCRYPTION_KEY || 'carpilot_secure_token_encryption_key_32bytes!'; // 32 chars
const KEY = crypto_1.default.scryptSync(ENCRYPTION_KEY, 'salt', 32);
class CryptoUtil {
    static encrypt(plainText) {
        const iv = crypto_1.default.randomBytes(16);
        const cipher = crypto_1.default.createCipheriv(ALGORITHM, KEY, iv);
        let encrypted = cipher.update(plainText, 'utf8', 'hex');
        encrypted += cipher.final('hex');
        const tag = cipher.getAuthTag().toString('hex');
        return `${iv.toString('hex')}:${tag}:${encrypted}`;
    }
    static decrypt(encryptedText) {
        const parts = encryptedText.split(':');
        if (parts.length !== 3) {
            throw new Error('Invalid encrypted payload structure');
        }
        const [ivHex, tagHex, contentHex] = parts;
        const iv = Buffer.from(ivHex, 'hex');
        const tag = Buffer.from(tagHex, 'hex');
        const decipher = crypto_1.default.createDecipheriv(ALGORITHM, KEY, iv);
        decipher.setAuthTag(tag);
        let decrypted = decipher.update(contentHex, 'hex', 'utf8');
        decrypted += decipher.final('utf8');
        return decrypted;
    }
}
exports.CryptoUtil = CryptoUtil;
