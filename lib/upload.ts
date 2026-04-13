import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

const UPLOAD_DIR = join(process.cwd(), 'public', 'uploads', 'temuan');

// Ensure upload directory exists
export async function ensureUploadDir() {
  if (!existsSync(UPLOAD_DIR)) {
    await mkdir(UPLOAD_DIR, { recursive: true });
  }
}

export async function uploadPhotos(files: File[] | FileList): Promise<string[]> {
  await ensureUploadDir();

  const uploadPromises = Array.from(files).slice(0, 3).map(async (file) => {
    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      throw new Error(`Invalid file type: ${file.type}. Only JPG, PNG, and WEBP allowed.`);
    }

    // Validate file size (5MB max)
    const maxSize = 5 * 1024 * 1024; // 5MB in bytes
    if (file.size > maxSize) {
      throw new Error(`File too large: ${file.name}. Max size is 5MB.`);
    }

    // Generate unique filename
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(2, 8);
    const ext = file.name.split('.').pop();
    const filename = `temuan-${timestamp}-${randomStr}.${ext}`;

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Write file to disk
    const filepath = join(UPLOAD_DIR, filename);
    await writeFile(filepath, buffer);

    // Return public URL path
    return `/uploads/temuan/${filename}`;
  });

  return Promise.all(uploadPromises);
}

export function isAutoUpdateKeyword(jenisTemuan: string): boolean {
  const keywords = ['berat', 'rusak parah', 'bahaya', 'bocor', 'patah'];
  const lowerJenis = jenisTemuan.toLowerCase();
  return keywords.some(keyword => lowerJenis.includes(keyword));
}
