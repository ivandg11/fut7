import axios from 'axios';

const API_URL = 'https://fut7-production.up.railway.app';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
  timeout: 10000,
});

// Interceptor para logs de request
api.interceptors.request.use(
  (config) => {
    console.log(
      `📤 ${config.method.toUpperCase()} ${config.url}`,
      config.data || '',
    );

    const rol = sessionStorage.getItem('userRol');
    const clave = sessionStorage.getItem('userClave');

    if (rol && clave) {
      config.headers[`x-clave-${rol}`] = clave;
      console.log(`🔑 Usando rol: ${rol}`);
    }
    return config;
  },
  (error) => {
    console.error('❌ Error en request:', error);
    return Promise.reject(error);
  },
);

// Interceptor para logs de response
api.interceptors.response.use(
  (response) => {
    console.log(`📥 ${response.status} ${response.config.url}`, response.data);
    return response;
  },
  (error) => {
    if (error.response) {
      console.error(
        '❌ Error en response:',
        error.response.status,
        error.response.data,
      );
    } else if (error.request) {
      console.error('❌ No se recibió respuesta del servidor');
    } else {
      console.error('❌ Error:', error.message);
    }
    return Promise.reject(error);
  },
);

export const ligasAPI = {
  getAll: () => api.get('/ligas'),
  getByDia: (dia) => api.get(`/ligas/${dia}`),
  create: (data) => api.post('/ligas', data),
  update: (id, data) => api.put(`/ligas/${id}`, data),
};

export const equiposAPI = {
  getAll: (ligaId) => {
    const params = ligaId ? { params: { ligaId } } : {};
    return api.get('/equipos', params);
  },
  getByLiga: (dia) => {
    console.log('Obteniendo equipos para día:', dia);
    return api.get(`/equipos/liga/${dia}`);
  },
  create: (data) => {
    console.log('Creando equipo con data:', data);
    return api.post('/equipos', data);
  },
  update: (id, data) => api.put(`/equipos/${id}`, data),
  delete: (id) => api.delete(`/equipos/${id}`),
};

export const partidosAPI = {
  getAll: (ligaId, jornada) => {
    const params = {};
    if (ligaId) params.ligaId = ligaId;
    if (jornada) params.jornada = jornada;
    return api.get('/partidos', { params });
  },
  getByLiga: (dia, jornada) => {
    const params = jornada ? { params: { jornada } } : {};
    return api.get(`/partidos/liga/${dia}`, params);
  },
  getJornadas: (ligaId) =>
    api.get('/partidos/jornadas', { params: { ligaId } }),
  create: (data) => api.post('/partidos', data),
  registrarResultado: (id, data) => api.put(`/partidos/${id}/resultado`, data),
};

export const configAPI = {
  get: () => api.get('/config'),
  updateClaves: (data) => api.put('/config/claves', data),
};

export const authAPI = {
  verificarClave: (tipo, clave) =>
    api.post('/auth/verificar-clave', { tipo, clave }),
};

export default api;
