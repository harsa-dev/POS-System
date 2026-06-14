declare module "multer" {
  type Request = import("express").Request;
  type RequestHandler = import("express").RequestHandler;
  type DestinationCallback = (error: Error | null, destination: string) => void;
  type FileNameCallback = (error: Error | null, filename: string) => void;

  export interface File {
    fieldname: string;
    originalname: string;
    encoding: string;
    mimetype: string;
    size: number;
    destination: string;
    filename: string;
    path: string;
    buffer?: Buffer;
  }

  export interface StorageEngine {
    _handleFile(
      req: Request,
      file: File,
      callback: (error?: Error | null, info?: Partial<File>) => void,
    ): void;
    _removeFile(
      req: Request,
      file: File,
      callback: (error: Error | null) => void,
    ): void;
  }

  export interface DiskStorageOptions {
    destination?:
      | string
      | ((req: Request, file: File, callback: DestinationCallback) => void);
    filename?: (req: Request, file: File, callback: FileNameCallback) => void;
  }

  export interface Field {
    name: string;
    maxCount?: number;
  }

  export interface Options {
    storage?: StorageEngine;
    limits?: {
      fileSize?: number;
    };
    fileFilter?: (
      req: Request,
      file: File,
      callback: (error: Error | null, acceptFile?: boolean) => void,
    ) => void;
  }

  export interface Multer {
    single(fieldName: string): RequestHandler;
    array(fieldName: string, maxCount?: number): RequestHandler;
    fields(fields: readonly Field[]): RequestHandler;
    none(): RequestHandler;
  }

  export class MulterError extends Error {
    code: string;
    field?: string;
  }

  export function diskStorage(options: DiskStorageOptions): StorageEngine;

  export default function multer(options?: Options): Multer;
}
