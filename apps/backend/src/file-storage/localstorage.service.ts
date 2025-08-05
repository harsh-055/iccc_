import { Injectable } from "@nestjs/common";
import { IFileStorage } from "./interface/IFileStorage";
import { promises as fs } from "fs";
import * as path from "path";
import { ConfigService } from "@nestjs/config";
import {Multer} from 'multer'

@Injectable()
export class LocalStorageService implements IFileStorage {
  private storagePath = path.join(__dirname, "../../../uploads");
  private baseUrl: string;

  constructor(private configService: ConfigService) {
    this.baseUrl = this.configService.get("BASE_URL") || "http://localhost:3000";
  }

  async uploadFile(file: any): Promise<string> {
    const filePath = path.join(this.storagePath, file.filename);
    await fs.writeFile(filePath, file.buffer);
    
    // Return complete URL
    return `${this.baseUrl}/uploads/${file.filename}`;
  }

  async deleteFile(fileUrl: string): Promise<boolean> {
    try {
      const fileName = fileUrl.split("/").pop()||'random';
      const filePath = path.join(this.storagePath, fileName);
      await fs.unlink(filePath);
      return true;
    } catch {
      return false;
    }
  }
}
