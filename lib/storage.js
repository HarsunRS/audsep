import { createServerClient } from './supabase';

const INPUTS_BUCKET = 'inputs';
const OUTPUTS_BUCKET = 'outputs';

/**
 * Upload a file buffer to Supabase Storage (inputs bucket)
 */
export async function uploadInput(userId, jobId, buffer, filename) {
  const db = createServerClient();
  const path = `${userId}/${jobId}/${filename}`;
  const { error } = await db.storage
    .from(INPUTS_BUCKET)
    .upload(path, buffer, { contentType: 'audio/*', upsert: true });
  if (error) throw new Error(`Storage upload failed: ${error.message}`);
  return path;
}

/**
 * Upload an output stem file to Supabase Storage (outputs bucket)
 */
export async function uploadOutput(userId, jobId, filename, buffer, contentType = 'audio/wav') {
  const db = createServerClient();
  const path = `${userId}/${jobId}/${filename}`;
  const { error } = await db.storage
    .from(OUTPUTS_BUCKET)
    .upload(path, buffer, { contentType, upsert: true });
  if (error) throw new Error(`Storage output upload failed: ${error.message}`);
  return path;
}

/**
 * Get a short-lived signed URL for downloading a file (48h default)
 */
export async function getDownloadUrl(bucket, path, expiresIn = 172800) {
  const db = createServerClient();
  const { data, error } = await db.storage
    .from(bucket)
    .createSignedUrl(path, expiresIn);
  if (error) throw new Error(`Signed URL failed: ${error.message}`);
  return data.signedUrl;
}

/**
 * Download a file from Supabase Storage as a Buffer
 */
export async function downloadFile(bucket, path) {
  const db = createServerClient();
  const { data, error } = await db.storage.from(bucket).download(path);
  if (error) throw new Error(`Download failed: ${error.message}`);
  const arrayBuffer = await data.arrayBuffer();
  return Buffer.from(arrayBuffer);
}
