import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
  timeout: 15000,
});

const extractApiErrorMessage = (error) => {
  const status = error?.response?.status;
  const backendMessage = error?.response?.data?.message;
  const backendError = error?.response?.data?.error;

  if (backendMessage || backendError) {
    const detail = [backendMessage, backendError].filter(Boolean).join(' - ');
    return status ? `HTTP ${status}: ${detail}` : detail;
  }

  if (error?.code === 'ECONNABORTED') {
    return 'Tiempo de espera agotado al conectar con el backend';
  }

  if (error?.message === 'Network Error') {
    return `No se pudo conectar al backend en ${API_URL}`;
  }

  return error?.message || 'Error desconocido';
};

api.interceptors.request.use((config) => {
  const token = sessionStorage.getItem('authToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const authAPI = {
  login: (username, password) =>
    api.post('/auth/login', { username, password }),
  me: () => api.get('/auth/me'),
  visitorToken: () => api.post('/auth/visitor-token'),
  createLeagueAdmin: (data) => api.post('/auth/league-admin', data),
  createUser: (data) => api.post('/auth/users', data),
};

export const ligasAPI = {
  getAll: () => api.get('/ligas'),
  getById: (id) => api.get(`/ligas/${id}`),
  create: (data) => api.post('/ligas', data),
  update: (id, data) => api.put(`/ligas/${id}`, data),
  remove: (id) => api.delete(`/ligas/${id}`),
};

export const temporadasAPI = {
  getByLiga: (ligaId) => api.get('/temporadas', { params: { ligaId } }),
  create: (data) => api.post('/temporadas', data),
  update: (id, data) => api.put(`/temporadas/${id}`, data),
  remove: (id) => api.delete(`/temporadas/${id}`),
};

export const equiposAPI = {
  getByTemporada: (temporadaId) =>
    api.get('/equipos', { params: { temporadaId } }),
  getById: (id) => api.get(`/equipos/${id}`),
  create: (data) => api.post('/equipos', data),
  update: (id, data) => api.put(`/equipos/${id}`, data),
  remove: (id) => api.delete(`/equipos/${id}`),
};

export const jugadorasAPI = {
  getAll: ({ equipoId, temporadaId } = {}) =>
    api.get('/jugadoras', { params: { equipoId, temporadaId } }),
  create: (data) => api.post('/jugadoras', data),
  update: (id, data) => api.put(`/jugadoras/${id}`, data),
  remove: (id) => api.delete(`/jugadoras/${id}`),
};

export const partidosAPI = {
  getByTemporada: (temporadaId, jornada) =>
    api.get('/partidos', { params: { temporadaId, jornada } }),
  create: (data) => api.post('/partidos', data),
  update: (id, data) => api.put(`/partidos/${id}`, data),
  registrarResultado: (id, data) => api.post(`/partidos/${id}/resultado`, data),
  delete: (id) => api.delete(`/partidos/${id}`),
};

export const estadisticasAPI = {
  tabla: (temporadaId) =>
    api.get('/estadisticas/tabla', { params: { temporadaId } }),
  goleo: (temporadaId) =>
    api.get('/estadisticas/goleo', { params: { temporadaId } }),
};

export { API_URL, extractApiErrorMessage };
export default api;
