export interface IFileStorage {
  uploadFile(file: any): Promise<string>;
  deleteFile(fileUrl: string): Promise<boolean>;
}
