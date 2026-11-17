import { createClient } from '@supabase/supabase-js';

let client = null;

export const storageBucket = () => process.env.SUPABASE_STORAGE_BUCKET || 'media';

export function isStorageConfigured() {
  return Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
}

function supabase() {
  if (!isStorageConfigured()) return null;
  if (!client) {
    client = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  return client;
}

export async function createSignedUpload(path) {
  const db = supabase();
  if (!db) throw new Error('Object storage is not configured. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.');
  const { data, error } = await db.storage.from(storageBucket()).createSignedUploadUrl(path);
  if (error) throw new Error(error.message);
  const { data: publicData } = db.storage.from(storageBucket()).getPublicUrl(path);
  return {
    path,
    token: data.token,
    signedUrl: data.signedUrl,
    publicUrl: publicData.publicUrl,
  };
}

export function getPublicUrl(path) {
  const db = supabase();
  if (!db) return null;
  const { data } = db.storage.from(storageBucket()).getPublicUrl(path);
  return data.publicUrl;
}

export async function removeObject(path) {
  const db = supabase();
  if (!db || !path) return;
  await db.storage.from(storageBucket()).remove([path]);
}