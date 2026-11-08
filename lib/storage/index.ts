import { MinIOStorageAdapter } from "./minio";

export interface StorageFile {
  name: string;
  buffer: Buffer | Uint8Array;
  contentType: string;
}

export interface StorageAdapter {
  upload(file: StorageFile): Promise<{ key: string; url: string }>;
  delete(key: string): Promise<void>;
  getUrl(key: string): string;
}

let storageInstance: StorageAdapter | null = null;

export class MemoryStorageAdapter implements StorageAdapter {
  private files = new Map<string, { buffer: Buffer | Uint8Array; contentType: string }>();

  async upload(file: StorageFile): Promise<{ key: string; url: string }> {
    const timestamp = Date.now();
    const cleanName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
    const key = `${timestamp}-${cleanName}`;
    this.files.set(key, { buffer: file.buffer, contentType: file.contentType });
    return {
      key,
      url: this.getUrl(key),
    };
  }

  async delete(key: string): Promise<void> {
    this.files.delete(key);
  }

  getUrl(key: string): string {
    const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
    return `${baseUrl}/api/media/file/${key}`;
  }

  getFile(key: string) {
    return this.files.get(key);
  }
}

export function getStorage(): StorageAdapter {
  if (storageInstance) return storageInstance;

  if (process.env.NODE_ENV === "test" || process.env.STORAGE_ADAPTER === "memory") {
    storageInstance = new MemoryStorageAdapter();
  } else {
    storageInstance = new MinIOStorageAdapter();
  }
  return storageInstance;
}

export function setStorage(adapter: StorageAdapter) {
  storageInstance = adapter;
}
