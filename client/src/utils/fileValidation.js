export const ALLOWED_EXTENSIONS = ['glb', 'gltf', 'obj'];
export const MAX_UPLOAD_BYTES = 50 * 1024 * 1024; // keep in sync with MAX_UPLOAD_BYTES on the server

export function getExtension(fileName) {
  const match = /\.([a-z0-9]+)$/i.exec(String(fileName || '').trim());
  return match ? match[1].toLowerCase() : '';
}

export function formatBytes(bytes) {
  const value = Number(bytes) || 0;
  if (value < 1024) return `${value} B`;
  if (value < 1024 * 1024) return `${(value / 1024).toFixed(1)} KB`;
  return `${(value / (1024 * 1024)).toFixed(1)} MB`;
}

export function formatDate(value) {
  if (!value) return '—';
  return new Date(value).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

/** Client-side pre-check. The server validates again — this is UX, not security. */
export function validateModelFile(file) {
  if (!file) return 'Choose a 3D model file';

  const ext = getExtension(file.name);
  if (!ALLOWED_EXTENSIONS.includes(ext)) {
    return `Unsupported format ".${ext || '?'}". Use .glb, .gltf or .obj`;
  }

  if (file.size <= 0) return 'That file appears to be empty';
  if (file.size > MAX_UPLOAD_BYTES) {
    return `File is ${formatBytes(file.size)}. The limit is ${formatBytes(MAX_UPLOAD_BYTES)}`;
  }

  return null;
}

const MIME_BY_EXT = {
  glb: 'model/gltf-binary',
  gltf: 'model/gltf+json',
  obj: 'model/obj',
};

/** Browsers often report an empty type for 3D files, so derive it from the extension. */
export function resolveContentType(file) {
  return MIME_BY_EXT[getExtension(file.name)] || 'application/octet-stream';
}
