"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LocalStorageService = exports.uploadMiddleware = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const multer_1 = __importDefault(require("multer"));
const uploadsDir = path_1.default.join(process.cwd(), 'uploads');
if (!fs_1.default.existsSync(uploadsDir)) {
    fs_1.default.mkdirSync(uploadsDir, { recursive: true });
}
const storage = multer_1.default.diskStorage({
    destination: (_req, _file, cb) => {
        cb(null, uploadsDir);
    },
    filename: (_req, file, cb) => {
        const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
        const ext = path_1.default.extname(file.originalname);
        cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
    },
});
exports.uploadMiddleware = (0, multer_1.default)({
    storage,
    limits: {
        fileSize: 100 * 1024 * 1024, // 100MB to support Reels and car walkaround videos
    },
    fileFilter: (_req, file, cb) => {
        const allowedMime = [
            'image/jpeg',
            'image/png',
            'image/webp',
            'video/mp4',
            'video/quicktime',
            'video/x-msvideo',
        ];
        if (allowedMime.includes(file.mimetype)) {
            cb(null, true);
        }
        else {
            cb(new Error(`Unsupported file type: ${file.mimetype}. Allowed: Images (JPEG, PNG, WebP) & Videos (MP4, MOV)`));
        }
    },
});
class LocalStorageService {
    static getMediaUrl(req, filename) {
        const protocol = req.protocol;
        const host = req.get('host');
        return `${protocol}://${host}/uploads/${filename}`;
    }
    static determineMediaType(mimetype) {
        return mimetype.startsWith('video/') ? 'VIDEO' : 'IMAGE';
    }
}
exports.LocalStorageService = LocalStorageService;
