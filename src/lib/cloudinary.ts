import imageCompression from 'browser-image-compression';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

export async function compressImage(file: File): Promise<File> {
  const options = {
    maxSizeMB: 2,
    maxWidthOrHeight: 2048,
    useWebWorker: true,
    preserveExif: true,
    fileType: file.type as string,
    initialQuality: 0.92,
  };

  const originalSizeMB = file.size / (1024 * 1024);

  // Only compress if > 1MB
  if (originalSizeMB <= 1) {
    return file;
  }

  const compressed = await imageCompression(file, options);
  console.log(
    `Compressed ${file.name}: ${originalSizeMB.toFixed(2)}MB → ${(compressed.size / (1024 * 1024)).toFixed(2)}MB`
  );
  return compressed;
}

export async function uploadToCloudinary(file: File, folder = 'products'): Promise<string> {
  // Compress before upload
  const compressed = await compressImage(file);

  const formData = new FormData();
  formData.append('file', compressed);
  formData.append('folder', folder);

  const response = await fetch(`${SUPABASE_URL}/functions/v1/cloudinary-upload`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${SUPABASE_KEY}`,
    },
    body: formData,
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.error || 'Upload failed');
  }

  return result.url;
}

export interface CloudinaryUsage {
  storage_used_bytes: number;
  storage_limit_bytes: number;
  bandwidth_used_bytes: number;
  bandwidth_limit_bytes: number;
  transformations_used: number;
  transformations_limit: number;
  resources: number;
  plan: string;
  limited?: boolean;
}

export interface CloudinaryUsage {
  storage_used_bytes: number;
  storage_limit_bytes: number;
  bandwidth_used_bytes: number;
  bandwidth_limit_bytes: number;
  transformations_used: number;
  transformations_limit: number;
  resources: number;
  plan: string;
  limited?: boolean;
}

export async function getCloudinaryUsage(): Promise<CloudinaryUsage> {
  const response = await fetch(`${SUPABASE_URL}/functions/v1/cloudinary-usage`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${SUPABASE_KEY}`,
      'Content-Type': 'application/json',
    },
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.error || 'Failed to fetch usage');
  }

  return result;
}

export interface CloudinaryImage {
  public_id: string;
  secure_url: string;
  format: string;
  width: number;
  height: number;
  bytes: number;
  created_at: string;
  folder: string;
}

export interface CloudinaryListResponse {
  resources: CloudinaryImage[];
  next_cursor: string | null;
  total_count: number;
}

export async function listCloudinaryImages(folder?: string, nextCursor?: string): Promise<CloudinaryListResponse> {
  const params = new URLSearchParams();
  if (folder) params.append('folder', folder);
  if (nextCursor) params.append('next_cursor', nextCursor);
  params.append('max_results', '50');

  const response = await fetch(`${SUPABASE_URL}/functions/v1/cloudinary-list?${params}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${SUPABASE_KEY}`,
      'Content-Type': 'application/json',
    },
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.error || 'Failed to list images');
  }

  return result;
}

export interface MigrationResult {
  success: boolean;
  results: { table: string; field: string; migrated: number; errors: string[] }[];
  summary: { total_migrated: number; total_errors: number };
}

export async function migrateToCloudinary(): Promise<MigrationResult> {
  const response = await fetch(`${SUPABASE_URL}/functions/v1/cloudinary-migrate`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${SUPABASE_KEY}`,
      'Content-Type': 'application/json',
    },
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.error || 'Migration failed');
  }

  return result;
}
