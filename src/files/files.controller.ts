import {
  Controller,
  Post,
  UploadedFile,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import multer from 'multer';
import * as path from 'path';
import * as fs from 'fs';

const flagsDir = path.join(process.cwd(), 'uploads', 'flags');
const dataDir = path.join(process.cwd(), 'uploads', 'data');

console.log('flagsDir:', flagsDir);
console.log('dataDir:', dataDir);

fs.mkdirSync(flagsDir, { recursive: true });
fs.mkdirSync(dataDir, { recursive: true });

const flagsStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, flagsDir),
  filename: (_req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`),
});

const dataStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, dataDir),
  filename: (_req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`),
});

@Controller()
export class FilesController {
  @Post('flags')
  @UseInterceptors(
    FilesInterceptor('files', undefined, { storage: flagsStorage }),
  )
  uploadFlags(@UploadedFiles() files: Express.Multer.File[]) {
    return {
      uploaded: files?.length ?? 0,
      paths: (files ?? []).map((f) => `/uploads/flags/${f.filename}`),
    };
  }

  @Post('countries-json')
  @UseInterceptors(FileInterceptor('file', { storage: dataStorage }))
  uploadCountriesJson(@UploadedFile() file: Express.Multer.File) {
    return {
      path: `/uploads/data/${file.filename}`,
    };
  }
}
