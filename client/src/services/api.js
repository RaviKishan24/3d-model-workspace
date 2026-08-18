import axios from 'axios';

const baseURL = `${(import.meta.env.VITE_API_URL || 'http://localhost:5000').replace(/\/$/, '')}/api`;

const api = axios.create({
  baseURL,
  // Sends and receives the HTTP-only auth cookie.
  withCredentials: true,
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
});

/** Maps any axios failure onto a friendly, user-facing message. */
export function toFriendlyError(error) {
  if (axios.isCancel(error)) return { status: 0, message: 'Request cancelled', details: [] };

  if (!error.response) {
    return {
      status: 0,
      message: 'Network error. Check your connection and try again.',
      details: [],
    };
  }

  const { status, data } = error.response;
  const serverMessage = data && data.message;
  const details = (data && data.details) || [];

  const fallbacks = {
    400: 'Some of the information provided is invalid.',
    401: 'Your session has expired. Please sign in again.',
    403: "You don't have permission to do that.",
    404: 'We could not find what you were looking for.',
    409: 'That record already exists.',
    413: 'That file is too large.',
    429: 'Too many requests. Please wait a moment.',
    500: 'Something went wrong on our end. Please try again.',
  };

  return { status, message: serverMessage || fallbacks[status] || 'Unexpected error', details };
}

let onUnauthorized = null;
export function setUnauthorizedHandler(handler) {
  onUnauthorized = handler;
}

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const url = (error.config && error.config.url) || '';
    const isAuthProbe = url.includes('/auth/me') || url.includes('/auth/login');

    if (error.response && error.response.status === 401 && !isAuthProbe && onUnauthorized) {
      onUnauthorized();
    }

    return Promise.reject(error);
  }
);

export default api;
