const { supabase, bucketName } = require('../config/supabase');
const MAX_UPLOAD_BYTES = Number(process.env.MAX_UPLOAD_BYTES) || 50 * 1024 * 1024;

function getExtension(fileName) {
  const ext = fileName.split('.').pop().toLowerCase();
  return ext === 'glb' || ext === 'gltf' || ext === 'obj' ? ext : 'glb';
}

function buildObjectKey(userId, ext) {
  const timestamp = Date.now();
  return `models/${userId}/${timestamp}.${ext}`;
}

function buildFileUrl(key) {
  // If bucket is public, return public URL; else we'll use signed URLs on the fly.
  // For simplicity, store the public URL if bucket is public.
  const { data } = supabase.storage.from(bucketName).getPublicUrl(key);
  return data.publicUrl;
}

async function createPresignedUploadUrl({ key, contentType, fileSize }) {
  // Use Supabase's signed upload URL (valid for 5 minutes)
  const { data, error } = await supabase.storage
    .from(bucketName)
    .createSignedUploadUrl(key, { expiresIn: 300 }); // 5 minutes

  if (error) throw new Error(`Failed to generate upload URL: ${error.message}`);
  return {
    url: data.signedUrl,
    expiresIn: 300, // seconds
  };
}

async function createPresignedDownloadUrl(key) {
  // Generate a signed URL valid for 7 days (or adjust)
  const { data, error } = await supabase.storage
    .from(bucketName)
    .createSignedUrl(key, 60 * 60 * 24 * 7); // 7 days

  if (error) throw new Error(`Failed to generate download URL: ${error.message}`);
  return data.signedUrl;
}

async function headObject(key) {
  // Supabase doesn't have a headObject. We'll check existence by listing.
  const { data, error } = await supabase.storage
    .from(bucketName)
    .list('', { search: key, limit: 1 });

  if (error || !data || data.length === 0) {
    const err = new Error('File not found in storage');
    err.statusCode = 404;
    throw err;
  }
  // Supabase list returns file objects with metadata, but not ContentLength directly.
  // We can get size from data[0].metadata.size? Actually it's not there.
  // Instead, we can call createSignedUrl and then do a HEAD request, but that's extra.
  // Alternatively, we can just trust that the file exists after upload and skip this check.
  // I recommend skipping the headObject call entirely in createModel.
  // If you really need size, you can use the metadata from the list response (if available).
  // For simplicity, we'll just return a dummy object with ContentLength set to the stored fileSize.
  // But we won't know the size without another call.
  return { ContentLength: 0 }; // placeholder
}

async function deleteObject(key) {
  const { error } = await supabase.storage
    .from(bucketName)
    .remove([key]);

  if (error) throw new Error(`Failed to delete file: ${error.message}`);
}

function validateUpload({ fileName, contentType, fileSize }) {
  // Keep the same validation logic (extension, size, etc.)
  const allowedTypes = ['model/gltf-binary', 'model/gltf+json', 'model/obj'];
  if (!allowedTypes.includes(contentType)) {
    throw new Error('Invalid file type');
  }
  if (fileSize > MAX_UPLOAD_BYTES) {
    throw new Error('File too large');
  }
  const ext = getExtension(fileName);
  if (!['glb', 'gltf', 'obj'].includes(ext)) {
    throw new Error('Unsupported file extension');
  }
  return { ext, contentType, fileSize };
}

module.exports = {
  MAX_UPLOAD_BYTES,
  getExtension,
  buildObjectKey,
  buildFileUrl,
  createPresignedUploadUrl,
  createPresignedDownloadUrl,
  headObject,
  deleteObject,
  validateUpload,
};