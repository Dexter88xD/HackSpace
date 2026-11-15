export enum FileType {
  PDF = 'PDF',
  DOCX = 'DOCX',
  PPTX = 'PPTX',
  TXT = 'TXT',
  CSV = 'CSV',
  JPG = 'JPG',
  PNG = 'PNG',
}

export const ALLOWED_FILE_TYPES: Record<
  string,
  { type: FileType; mimeTypes: string[] }
> = {
  '.pdf': { type: FileType.PDF, mimeTypes: ['application/pdf'] },
  '.docx': {
    type: FileType.DOCX,
    mimeTypes: [
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ],
  },
  '.pptx': {
    type: FileType.PPTX,
    mimeTypes: [
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    ],
  },
  '.txt': { type: FileType.TXT, mimeTypes: ['text/plain'] },
  '.csv': { type: FileType.CSV, mimeTypes: ['text/csv', 'application/csv'] },
  '.jpg': { type: FileType.JPG, mimeTypes: ['image/jpeg'] },
  '.jpeg': { type: FileType.JPG, mimeTypes: ['image/jpeg'] },
  '.png': { type: FileType.PNG, mimeTypes: ['image/png'] },
};
