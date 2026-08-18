import axios from 'axios';
import api from './api';

export const modelService = {
  list: ({ page = 1, limit = 12 } = {}, config = {}) =>
    api.get('/models', { params: { page, limit }, ...config }).then((r) => r.data.data),

  get: (id, config = {}) => api.get(`/models/${id}`, config).then((r) => r.data.data.model),

  remove: (id) => api.delete(`/models/${id}`).then((r) => r.data),
  
  requestPresignedUrl: ({ fileName, contentType, fileSize }) =>
    api
      .post('/uploads/presigned-url', { fileName, contentType, fileSize })
      .then((r) => r.data.data), // now returns { uploadUrl, storagePath, fileSize, ... }

    /** Uploads the binary straight to the presigned URL (Supabase). */
  uploadToStorage: ({ uploadUrl, file, contentType, onProgress }) =>
    axios.put(uploadUrl, file, {
      headers: { 'Content-Type': contentType },
      // Presigned URL carries its own auth; cookies would break the signature.
      withCredentials: false,
      onUploadProgress: (event) => {
        if (onProgress && event.total) {
          onProgress(Math.round((event.loaded / event.total) * 100));
        }
      },
    }),

 register: ({ name, fileName, storagePath, fileSize }) =>
    api.post('/models', { name, fileName, storagePath, fileSize }).then((r) => r.data.data.model),
};

export const viewService = {
  list: (modelId, config = {}) =>
    api.get(`/models/${modelId}/views`, config).then((r) => r.data.data.views),

  create: (modelId, payload) =>
    api.post(`/models/${modelId}/views`, payload).then((r) => r.data.data.view),

  update: (modelId, viewId, payload) =>
    api.put(`/models/${modelId}/views/${viewId}`, payload).then((r) => r.data.data.view),

  remove: (modelId, viewId) =>
    api.delete(`/models/${modelId}/views/${viewId}`).then((r) => r.data),
};

export default modelService;
