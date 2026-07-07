import { logger } from '@/lib/logger';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

export interface UploadResult {
  url: string;
  fileName: string;
  storage: 'blob' | 'local';
}

function safeExtension(fileName: string): string {
  const extension = fileName.split('.').pop()?.toLowerCase() || 'png';
  return ['jpeg', 'jpg', 'png', 'gif', 'webp'].includes(extension)
    ? extension === 'jpg'
      ? 'jpeg'
      : extension
    : 'png';
}

async function uploadToLocal(
  buffer: Buffer,
  fileName: string
): Promise<UploadResult> {
  const uploadsDir = path.join(process.cwd(), 'public', 'assets', 'logos');
  await mkdir(uploadsDir, { recursive: true }).catch(() => undefined);
  await writeFile(path.join(uploadsDir, fileName), buffer);

  return {
    url: `/assets/logos/${fileName}`,
    fileName,
    storage: 'local',
  };
}

async function uploadToVercelBlob(
  buffer: Buffer,
  fileName: string,
  contentType: string
): Promise<UploadResult> {
  const { put } = await import('@vercel/blob');
  const blob = await put(`logos/${fileName}`, buffer, {
    access: 'public',
    contentType,
    addRandomSuffix: false,
  });

  return {
    url: blob.url,
    fileName,
    storage: 'blob',
  };
}

/** Sube logo de parroquia: Vercel Blob en prod, filesystem local en dev. */
export async function uploadParishLogo(
  file: File,
  parishId: number
): Promise<UploadResult> {
  const ext = safeExtension(file.name);
  const fileName = `parroquia_${parishId}_${Date.now()}.${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  if (process.env.BLOB_READ_WRITE_TOKEN) {
    try {
      return await uploadToVercelBlob(buffer, fileName, file.type);
    } catch (error) {
      logger.error('Vercel Blob upload failed, falling back to local:', error);
    }
  }

  return uploadToLocal(buffer, fileName);
}
