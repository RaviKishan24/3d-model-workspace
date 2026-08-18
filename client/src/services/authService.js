import api from './api';

export const authService = {
  register: (payload) => api.post('/auth/register', payload).then((r) => r.data.data.user),
  login: (payload) => api.post('/auth/login', payload).then((r) => r.data.data.user),
  logout: () => api.post('/auth/logout').then((r) => r.data),
  me: (config) => api.get('/auth/me', config).then((r) => r.data.data.user),
};

export default authService;
