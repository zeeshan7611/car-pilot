import fs from 'fs';
import path from 'path';
import multer from 'multer';
import { Request } from 'express';

export interface UploadedMediaResult {
  url: string;
  key: string;
  type: 'IMAGE' | 'VIDEO';
  originalName: string;
  size: number;
}

const uploadsDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req: Request, _file: Express.Multer.File, cb) => {
    cb(null, uploadsDir);
  },
  filename: (_req: Request, file: Express.Multer.File, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const ext = path.extname(file.originalname);
    cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
  },
});

export const uploadMiddleware = multer({
  storage,
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB to support Reels and car walkaround videos
  },
  fileFilter: (_req: Request, file: Express.Multer.File, cb) => {
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
    } else {
      cb(new Error(`Unsupported file type: ${file.mimetype}. Allowed: Images (JPEG, PNG, WebP) & Videos (MP4, MOV)`));
    }
  },
});

export class LocalStorageService {
  static getMediaUrl(req: Request, filename: string): string {
    const forwardedProto = req.headers['x-forwarded-proto'] as string | undefined;
    const protocol = forwardedProto ? forwardedProto.split(',')[0].trim() : req.protocol;
    const host = req.get('host');
    return `${protocol}://${host}/uploads/${filename}`;
  }

  static determineMediaType(mimetype: string): 'IMAGE' | 'VIDEO' {
    return mimetype.startsWith('video/') ? 'VIDEO' : 'IMAGE';
  }
}
