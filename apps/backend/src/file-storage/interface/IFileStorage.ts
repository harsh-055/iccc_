import { Multer } from 'multer';
export interface IFileStorage {
    uploadFile(file: Multer.File): Promise<string>;
    deleteFile(fileUrl: string): Promise<boolean>;
}
  