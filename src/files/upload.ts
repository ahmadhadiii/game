import multer from 'multer';
import path from 'path';
import fs from 'fs';

const flagsDir = path.join(process.cwd(), 'uploads', 'flags');
const dataDir = path.join(process.cwd(), 'uploads', 'data');

fs.mkdirSync(flagsDir, { recursive: true });
fs.mkdirSync(dataDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (req.path.includes('flags')) return cb(null, flagsDir);
    return cb(null, dataDir);
  },
  filename: (_req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

export const upload = multer({ storage });
