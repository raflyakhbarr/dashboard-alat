import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';

const UPLOAD_DIR = join(process.cwd(), 'public', 'uploads', 'temuan');

// Extension whitelist
const ALLOWED_EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp'] as const;

export async function ensureUploadDir() {
  await mkdir(UPLOAD_DIR, { recursive: true });
}

export async function uploadPhotos(files: File[] | FileList): Promise<string[]> {
  // Input validation
  if (!files || files.length === 0) {
    throw new Error('No files provided');
  }

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

    // Extract and validate extension
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (!ext || !ALLOWED_EXTENSIONS.includes(ext as any)) {
      throw new Error(`Invalid file extension: ${ext}. Only jpg, jpeg, png, webp allowed.`);
    }

    // Generate unique filename
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(2, 8);
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
