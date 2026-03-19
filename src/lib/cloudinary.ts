import imageCompression from 'browser-image-compression';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

export async function compressImage(file: File): Promise<File> {
  const options = {
    maxSizeMB: 2,
    maxWidthOrHeight: 2048,
    useWebWorker: true,
    preserveExif: false,
    fileType: 'image/webp' as string,
    initialQuality: 0.88,
  };

  const originalSizeMB = file.size / (1024 * 1024);

  const compressed = await imageCompression(file, options);
  
  // Rename to .webp extension
  const webpName = file.name.replace(/\.[^.]+$/, '.webp');
  const webpFile = new File([compressed], webpName, { type: 'image/webp' });
  
  console.log(
    `Optimized ${file.name} → WebP: ${originalSizeMB.toFixed(2)}MB → ${(webpFile.size / (1024 * 1024)).toFixed(2)}MB`
  );
  return webpFile;
}

export async function uploadToCloudinary(file: File, folder = 'products'): Promise<string> {
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
  usage_api_status?: number | null;
  usage_api_error?: string | null;
  api_key_hint?: string;
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
  results: { table: string; field: string; migrated: number; skipped: number; total: number; errors: string[] }[];
  summary: { total_items: number; total_migrated: number; total_skipped: number; total_errors: number; deduplicated_uploads: number };
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

export interface DeleteResult {
  success: boolean;
  deleted: string[];
  failed: { public_id: string; error: string }[];
  summary: { total_requested: number; total_deleted: number; total_failed: number };
}

export async function deleteCloudinaryImages(publicIds: string[]): Promise<DeleteResult> {
  const response = await fetch(`${SUPABASE_URL}/functions/v1/cloudinary-delete`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${SUPABASE_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ public_ids: publicIds }),
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.error || 'Delete failed');
  }

  return result;
}
