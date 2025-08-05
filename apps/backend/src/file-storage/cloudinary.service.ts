import { Injectable } from "@nestjs/common";
import { IFileStorage } from "./interface/IFileStorage";
import { v2 as cloudinary } from "cloudinary";
import { ConfigService } from "@nestjs/config";
import * as streamifier from "streamifier";
import { Multer } from "multer";

@Injectable()
export class CloudinaryService implements IFileStorage {
  constructor(private configService: ConfigService) {
    cloudinary.config({
      cloud_name: this.configService.get<string>("CLOUDINARY_CLOUD_NAME"),
      api_key: this.configService.get<string>("CLOUDINARY_API_KEY"),
      api_secret: this.configService.get<string>("CLOUDINARY_API_SECRET"),
    });
  }

  async uploadFile(file: any): Promise<string> {
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        (error, result) => {
          if (error) {
            console.error("Cloudinary Upload Error:", error);
            return reject(error);
          }
          if (!result || !result.secure_url) {
            return reject(new Error("Cloudinary upload failed: No URL returned"));
          }
          resolve(result.secure_url);
        }
      );

      streamifier.createReadStream(file.buffer).pipe(uploadStream);
    });
  }

  async deleteFile(fileUrl: string): Promise<boolean> {
    try {
      const urlObj = new URL(fileUrl);
      const publicIdWithExt = urlObj.pathname.split("/").pop(); // Extract filename
      if (!publicIdWithExt) {
        console.error("Invalid Cloudinary URL:", fileUrl);
        return false;
      }

      const publicId = publicIdWithExt.split(".")[0]; // Remove file extension
      const response = await cloudinary.uploader.destroy(publicId);

      if (response.result !== "ok") {
        console.error("Cloudinary Delete Failed:", response);
        return false;
      }

      return true;
    } catch (error) {
      console.error("Error deleting file from Cloudinary:", error);
      return false;
    }
  }
}
