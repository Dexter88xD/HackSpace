export interface UploadFile {
  originalname: string;
  mimetype: string;
  buffer: Buffer;
  bucket?: string;
}

export abstract class FileManager {
  abstract upload(file: UploadFile): Promise<string>;
}
