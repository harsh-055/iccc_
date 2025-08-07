import { Injectable } from '@nestjs/common';
import { IFileStorage } from './interface/IFileStorage';
import * as AWS from 'aws-sdk';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AwsS3Service implements IFileStorage {
  private s3: AWS.S3;
  private bucketName: string;

  constructor(private configService: ConfigService) {
    this.s3 = new AWS.S3({
      accessKeyId: this.configService.get('AWS_ACCESS_KEY_ID'),
      secretAccessKey: this.configService.get('AWS_SECRET_ACCESS_KEY'),
      region: this.configService.get('AWS_REGION'),
    });

    this.bucketName = this.configService.get('AWS_BUCKET_NAME') || 'NO_BUCKET';
    if (!this.bucketName) {
      throw new Error('AWS_BUCKET_NAME is not set in environment variables.');
    }
  }

  async uploadFile(file: any): Promise<string> {
    const params: AWS.S3.PutObjectRequest = {
      Bucket: this.bucketName,
      Key: `${Date.now()}-${file.originalname}`, // Unique file name
      Body: file.buffer,
      ACL: 'public-read',
      ContentType: file.mimetype,
    };

    const uploadResult = await this.s3.upload(params).promise();
    return uploadResult.Location; // Return public URL of the file
  }

  async deleteFile(fileUrl: string): Promise<boolean> {
    try {
      const key = new URL(fileUrl).pathname.split('/').slice(-1)[0]; // Extract file name from URL
      await this.s3
        .deleteObject({ Bucket: this.bucketName, Key: key })
        .promise();
      return true;
    } catch (error) {
      console.error('Error deleting file:', error);
      return false;
    }
  }
}
